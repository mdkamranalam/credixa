import { useState, useContext, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LogOut, X, FileText, UploadCloud, CheckCircle, Clock, XCircle, CreditCard,
  User, GraduationCap, Smartphone, History, Landmark, ShieldCheck, Zap,
  TrendingUp, Award, Gift, MessageCircle, ChevronRight, Check, CheckSquare
} from "lucide-react";
import { AuthContext } from "../context/AuthContext.jsx";
import api from "../services/api";
import LoanProgress from "../components/LoanProgress.jsx";

const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Core Data States
  const [profile, setProfile] = useState(null);
  const [activeLoan, setActiveLoan] = useState(null);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Application Flow States
  const [step, setStep] = useState(1);
  const [tempLoanId, setTempLoanId] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // Form States (New Smart UI)
  const [loanAmount, setLoanAmount] = useState(20000);
  const [loanTenure, setLoanTenure] = useState(6);
  const [loanPurpose, setLoanPurpose] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC ****4532");
  const SYSTEM_INTEREST_RATE = 12.5;

  // Documents
  const [studentFile, setStudentFile] = useState(null);
  const [parentFile, setParentFile] = useState(null);
  const [latestMarksheetFile, setLatestMarksheetFile] = useState(null);
  const [isFirstSemester, setIsFirstSemester] = useState(false);

  const isProfileComplete = profile && profile.kyc_status !== 'PENDING' && profile.co_applicant;

  // Mock Data
  const APPROVED_LIMIT = 100000;
  const HEALTH_SCORE = 785;
  const SAVED_BANKS = [
    { id: 1, name: "HDFC Bank", account: "HDFC ****4532", verified: true },
    { id: 2, name: "ICICI Bank", account: "ICICI ****8721", verified: true }
  ];
  const LOAN_PURPOSES = ["Semester Fees", "Hostel Fees", "Laptop Purchase", "Books", "Certification Courses", "Exam Fees", "Other"];
  const TENURES = [3, 6, 12, 18];
  const RECOMMENDED_PLANS = [
    { amount: 20000, tenure: 6 },
    { amount: 35000, tenure: 12 },
    { amount: 50000, tenure: 18 },
  ];

  const appStateRef = useRef({ step });
  useEffect(() => {
    appStateRef.current = { step };
  }, [step]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [profileRes, historyRes, myLoanRes] = await Promise.all([
        api.get("/users/profile"),
        api.get("/loans/repayments"),
        api.get("/loans/my-loan").catch(() => ({ data: null })),
      ]);

      setProfile(profileRes.data);
      setPayments(historyRes.data || []);

      if (profileRes.data) {
        if (profileRes.data.kyc_status === 'PENDING' || !profileRes.data.co_applicant) {
          navigate('/onboarding');
          return;
        }
      }

      const myLoan = myLoanRes.data;
      if (myLoan) {
        let nextPaymentData = null;
        if (["APPROVED", "ACTIVE", "CLOSED"].includes(myLoan.status)) {
          const nextRes = await api.get("/loans/next-payment").catch(() => ({ data: null }));
          if (nextRes.data && !nextRes.data.message) {
            nextPaymentData = nextRes.data;
          }
        }

        const newActiveLoan = {
          ...myLoan,
          ...(nextPaymentData || {}),
          status: myLoan.status,
          approved_amount: parseFloat(myLoan.approved_amount) || parseFloat(myLoan.requested_amount) || 0,
          interest_rate: parseFloat(myLoan.interest_rate) || 12.5,
          tenure_months: nextPaymentData?.total_months || myLoan.tenure_months || 12,
          loan_id: myLoan.loan_id,
        };

        if (appStateRef.current.step === 1) {
          setActiveLoan(newActiveLoan);
        }
      } else {
        if (appStateRef.current.step === 1) {
          setActiveLoan(null);
        }
      }
    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const intervalId = setInterval(loadDashboardData, 15000);
    return () => clearInterval(intervalId);
  }, []);

  const calculateEMI = (principal, annualRate, months) => {
    if (!principal || !annualRate || !months) return 0;
    const p = parseFloat(principal);
    const r = parseFloat(annualRate) / 12 / 100;
    const n = parseInt(months);
    if (r === 0) return p / n;
    const emi = (p * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi);
  };

  const handleInitializeLoan = async () => {
    if (step === 2 && !loanPurpose) {
      setApplyError("Please select a loan purpose.");
      return;
    }
    setApplyError("");

    if (step === 3) {
      setIsApplying(true);
      try {
        const payload = {
          requested_amount: loanAmount,
          interest_rate: SYSTEM_INTEREST_RATE,
          tenure_months: loanTenure,
          student_account_number: selectedBank.split(" ")[1].replace(/\*/g, "0"), // Mock extracting account
          ifsc_code: selectedBank.split(" ")[0] + "0001234" // Mock extracting IFSC
        };
        const response = await api.post("/loans/initialize", payload);
        setTempLoanId(response.data.loan_id);
        setStep(4);
      } catch (error) {
        setApplyError(error.response?.data?.error || "Initial application failed.");
      } finally {
        setIsApplying(false);
      }
    } else {
      setStep(step + 1);
    }
  };

  const handleFinalSubmit = async () => {
    setApplyError("");

    const missingDocs = [];
    if (!isFirstSemester && !latestMarksheetFile) missingDocs.push("Latest Semester Marksheet");
    if (!studentFile) missingDocs.push("Student Bank Statement");
    if (!parentFile) missingDocs.push("Parent Bank Statement");

    if (missingDocs.length > 0) {
      setApplyError(`Please upload: ${missingDocs.join(', ')}`);
      return;
    }

    setIsApplying(true);
    const data = new FormData();
    data.append("requested_amount", loanAmount);
    data.append("interest_rate", SYSTEM_INTEREST_RATE);
    data.append("tenure_months", loanTenure);
    data.append("student_account_number", selectedBank.split(" ")[1].replace(/\*/g, "0"));
    data.append("ifsc_code", selectedBank.split(" ")[0] + "0001234");
    data.append("student_statement", studentFile);
    data.append("parent_statement", parentFile);
    if (!isFirstSemester && latestMarksheetFile) {
      data.append("latest_marksheet", latestMarksheetFile);
    }
    data.append("existing_loan_id", tempLoanId);

    try {
      const response = await api.post("/loans/apply", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setActiveLoan({
        requested_amount: loanAmount,
        interest_rate: SYSTEM_INTEREST_RATE,
        tenure_months: loanTenure,
        status: response.data.status || "UNDER_REVIEW",
      });
      setStep(1);
      loadDashboardData();
    } catch (error) {
      setApplyError(error.response?.data?.error || "Failed to process AI Analysis.");
    } finally {
      setIsApplying(false);
    }
  };

  const handlePayEMI = async () => {
    if (!activeLoan) return;
    setIsPaying(true);
    try {
      const emiAmount = calculateEMI(activeLoan.approved_amount || activeLoan.requested_amount, activeLoan.interest_rate, activeLoan.tenure_months);
      await api.post("/loans/repay", {
        loan_id: activeLoan.loan_id,
        amount: emiAmount
      });
      await loadDashboardData();
    } catch (err) {
      console.error("Payment failed", err);
      alert(err.response?.data?.error || "Payment failed");
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading && !profile)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );

  const emi = calculateEMI(loanAmount, SYSTEM_INTEREST_RATE, loanTenure);
  const totalRepayment = emi * loanTenure;
  const processingFee = Math.round(loanAmount * 0.02);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-800">
      {/* HEADER */}
      <nav className="bg-white px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <img src="/credixa-favicon.png" alt="Credixa" className="w-8 h-8" />
          <span className="text-2xl font-black tracking-tight text-slate-900">
            Credixa
          </span>
        </div>
        <button onClick={logout} className="text-slate-400 hover:text-red-500 flex items-center font-bold text-sm transition-colors">
          <LogOut className="h-4 w-4 mr-1" /> Logout
        </button>
      </nav>

      <div className="max-w-6xl mx-auto mt-8 px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Main Content */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* PROFILE CARD */}
          {profile && (
            <div className="bg-white rounded-[20px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 flex flex-col md:flex-row justify-between items-start md:items-center border border-slate-100">
              <div className="flex items-center space-x-4">
                <div className="bg-emerald-100 p-1 rounded-full border-4 border-emerald-50">
                  <div className="bg-emerald-500 h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {profile.full_name.charAt(0)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-black text-slate-900">{profile.full_name}</h2>
                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-500 flex items-center mt-0.5">
                    <GraduationCap className="h-4 w-4 mr-1" /> {profile.college_name || "Institution Pending"}
                  </p>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end space-y-2">
                <div className="flex space-x-2">
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-1 uppercase rounded-md tracking-wider">ID: {profile.college_roll_number}</span>
                  <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-1 uppercase rounded-md tracking-wider flex items-center"><CheckCircle className="h-3 w-3 mr-1"/> Verified</span>
                </div>
                <button onClick={() => setShowProfileModal(true)} className="text-emerald-600 font-bold text-sm hover:text-emerald-700 transition-colors">
                  View Full Profile &rarr;
                </button>
              </div>
            </div>
          )}

          {/* CREDIT OVERVIEW (Mock Data) */}
          {(!activeLoan || ["CLOSED", "REJECTED"].includes(activeLoan.status)) && step === 1 && (
            <div className="bg-slate-900 rounded-[24px] shadow-xl p-8 relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[80px] opacity-20 -mr-20 -mt-20 pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-1">Approved Credit Limit</p>
                  <h1 className="text-4xl md:text-5xl font-black">₹{APPROVED_LIMIT.toLocaleString()}</h1>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 backdrop-blur-md rounded-2xl p-3 text-center min-w-[100px]">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Health Score</p>
                  <div className="flex items-center justify-center text-emerald-400 font-black text-2xl">
                    <TrendingUp className="h-5 w-5 mr-1" /> {HEALTH_SCORE}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-slate-800 pt-6 relative z-10">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">Available</p>
                  <p className="text-xl font-bold">₹{APPROVED_LIMIT.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">Active Loans</p>
                  <p className="text-xl font-bold">0</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">Due This Month</p>
                  <p className="text-xl font-bold">₹0</p>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE LOAN VIEW */}
          {activeLoan && ["APPROVED", "ACTIVE", "CLOSED", "APPLIED", "UNDER_REVIEW", "REJECTED"].includes(activeLoan.status) && (
            <div className="bg-white rounded-[20px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
               {activeLoan.status === "CLOSED" ? (
                  <div className="p-10 text-center">
                    <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-black text-emerald-900">Loan Fully Repaid!</h2>
                    <p className="text-emerald-700 mb-6">Congratulations! You have successfully cleared all dues. Your credit score has been positively updated.</p>
                    <button onClick={() => setActiveLoan(null)} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-colors">Apply for Next Semester</button>
                  </div>
               ) : ["APPLIED", "UNDER_REVIEW"].includes(activeLoan.status) ? (
                  <div className="p-10 text-center">
                    <div className="inline-block p-4 bg-yellow-50 rounded-full mb-4">
                      <Clock className="h-10 w-10 text-yellow-500" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">Application Under Review</h2>
                    <p className="text-slate-500 mb-8 max-w-md mx-auto">Our AI Engine and your Institution Admin are reviewing your profile. You'll be notified shortly.</p>
                    <div className="flex justify-center gap-4">
                      <div className="bg-slate-50 px-6 py-4 rounded-xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase">Requested</p>
                        <p className="text-lg font-black text-slate-800">₹{parseFloat(activeLoan.requested_amount).toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-50 px-6 py-4 rounded-xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase">Status</p>
                        <p className="text-lg font-black text-yellow-600">{activeLoan.status.replace("_", " ")}</p>
                      </div>
                    </div>
                  </div>
               ) : activeLoan.status === "REJECTED" ? (
                  <div className="p-10 text-center">
                    <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-black text-slate-900">Application Not Approved</h2>
                    <p className="text-slate-500 mb-6">Based on the recent risk profile assessment, this application was declined.</p>
                    <button onClick={() => setActiveLoan(null)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800">Start New Application</button>
                  </div>
               ) : (
                  <>
                    <LoanProgress loanData={activeLoan} />
                    <div className="p-8 bg-slate-50 border-t border-slate-100">
                      <h3 className="font-bold text-slate-900 mb-4">Active Loan Details</h3>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <p className="text-xs text-slate-400 font-bold uppercase">Principal</p>
                          <p className="text-lg font-black text-slate-800">₹{(activeLoan.approved_amount || activeLoan.requested_amount).toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <p className="text-xs text-slate-400 font-bold uppercase">Rate</p>
                          <p className="text-lg font-black text-slate-800">{activeLoan.interest_rate}%</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
                          <p className="text-xs text-slate-400 font-bold uppercase">Monthly EMI</p>
                          <p className="text-lg font-black text-emerald-600">₹{calculateEMI(activeLoan.approved_amount || activeLoan.requested_amount, activeLoan.interest_rate, activeLoan.tenure_months).toLocaleString()}</p>
                        </div>
                      </div>
                      <button 
                        onClick={handlePayEMI}
                        disabled={isPaying}
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-800 transition-colors flex justify-center items-center disabled:opacity-50">
                        {isPaying ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Zap className="h-5 w-5 mr-2" /> 
                        )}
                        {isPaying ? "Processing..." : "Pay Next EMI Now"}
                      </button>
                    </div>
                  </>
               )}
            </div>
          )}

          {/* APPLICATION STEPPER JOURNEY */}
          {!activeLoan && isProfileComplete && (
            <div className="bg-white rounded-[24px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 p-8 relative">
              
              {/* Stepper Header */}
              <div className="flex items-center justify-between mb-8 relative">
                <div className="absolute left-0 top-1/2 w-full h-1 bg-slate-100 -z-10 -translate-y-1/2 rounded"></div>
                <div className="absolute left-0 top-1/2 h-1 bg-emerald-500 -z-10 -translate-y-1/2 rounded transition-all duration-500" style={{ width: `${((step - 1) / 4) * 100}%` }}></div>
                
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors duration-300 ${step > s ? 'bg-emerald-500 text-white' : step === s ? 'bg-slate-900 text-white ring-4 ring-slate-100' : 'bg-white text-slate-400 border-2 border-slate-200'}`}>
                    {step > s ? <Check className="w-5 h-5" /> : s}
                  </div>
                ))}
              </div>

              {applyError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-center mb-6 font-medium">
                  <XCircle className="w-5 h-5 mr-2 flex-shrink-0" /> {applyError}
                </div>
              )}

              {/* STEP 1: AMOUNT */}
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Personalize your credit</h2>
                  <p className="text-slate-500 mb-8">Choose the exact amount you need. You're pre-approved up to ₹{APPROVED_LIMIT.toLocaleString()}.</p>

                  {/* Slider UI */}
                  <div className="bg-slate-50 rounded-2xl p-8 mb-8 border border-slate-100">
                    <div className="text-center mb-8">
                      <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-2">Requested Amount</p>
                      <h1 className="text-5xl font-black text-emerald-600">₹{loanAmount.toLocaleString()}</h1>
                    </div>
                    <input 
                      type="range" 
                      min="5000" 
                      max={APPROVED_LIMIT} 
                      step="1000"
                      value={loanAmount} 
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="flex justify-between mt-3 text-xs font-bold text-slate-400">
                      <span>₹5,000</span>
                      <span>₹{APPROVED_LIMIT.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* AI Recommendations */}
                  <div className="mb-8">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center"><Zap className="w-4 h-4 mr-2 text-yellow-500" /> AI Recommended Plans</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {RECOMMENDED_PLANS.map((plan, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => { setLoanAmount(plan.amount); setLoanTenure(plan.tenure); }}
                          className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${loanAmount === plan.amount && loanTenure === plan.tenure ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-white hover:border-slate-300'}`}
                        >
                          <p className="text-lg font-black text-slate-900">₹{plan.amount.toLocaleString()}</p>
                          <p className="text-sm text-slate-500 font-medium">{plan.tenure} Months</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: PURPOSE & TENURE */}
              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="text-2xl font-black text-slate-900 mb-6">Structuring your plan</h2>
                  
                  <div className="mb-8">
                    <label className="block text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Select Tenure</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {TENURES.map(t => (
                        <div 
                          key={t}
                          onClick={() => setLoanTenure(t)}
                          className={`cursor-pointer text-center rounded-xl border-2 p-4 transition-all ${loanTenure === t ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-300'}`}
                        >
                          <p className="text-2xl font-black text-slate-900">{t}</p>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Months</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Purpose of Loan</label>
                    <div className="flex flex-wrap gap-3">
                      {LOAN_PURPOSES.map(p => (
                        <button
                          key={p}
                          onClick={() => setLoanPurpose(p)}
                          className={`px-4 py-2 rounded-full border text-sm font-bold transition-colors ${loanPurpose === p ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: BANK VERIFICATION */}
              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Where should we send the money?</h2>
                  <p className="text-slate-500 mb-8">Select a verified bank account for instant disbursal upon approval.</p>

                  <div className="space-y-4 mb-6">
                    {SAVED_BANKS.map(bank => (
                      <div 
                        key={bank.id}
                        onClick={() => setSelectedBank(bank.account)}
                        className={`cursor-pointer p-5 rounded-2xl border-2 flex items-center justify-between transition-all ${selectedBank === bank.account ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-white hover:border-slate-300'}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-white rounded-full shadow-sm border flex items-center justify-center">
                            <Landmark className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{bank.name}</p>
                            <p className="text-sm font-mono text-slate-500 mt-0.5">{bank.account}</p>
                          </div>
                        </div>
                        {bank.verified && (
                          <div className="flex items-center text-emerald-600 text-xs font-bold bg-emerald-100 px-3 py-1 rounded-full">
                            <ShieldCheck className="w-4 h-4 mr-1" /> Verified
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <button className="w-full py-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 font-bold hover:bg-slate-50 transition-colors flex items-center justify-center">
                    + Add New Bank Account
                  </button>
                </div>
              )}

              {/* STEP 4: AI VERIFICATION (Documents) */}
              {step === 4 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Final Step: AI Verification</h2>
                  <p className="text-slate-500 mb-6">Upload verifiable 6-month statements to trigger our instant AI Risk Assessment engine.</p>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                      <label className="text-sm font-bold text-slate-900">Latest Semester Marksheet</label>
                      <label className="flex items-center text-sm font-bold text-emerald-600 cursor-pointer">
                        <input type="checkbox" className="mr-2 h-4 w-4 accent-emerald-500" checked={isFirstSemester} onChange={(e) => { setIsFirstSemester(e.target.checked); if (e.target.checked) setLatestMarksheetFile(null); }} />
                        I am in my First Semester
                      </label>
                    </div>
                    {!isFirstSemester ? (
                      <input type="file" accept=".pdf" className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" onChange={(e) => setLatestMarksheetFile(e.target.files[0])} />
                    ) : (
                      <p className="text-sm text-slate-500 italic">🎓 Admission Letter will be used instead.</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <label className="block text-sm font-bold text-slate-900 mb-3">Student Statement (6M PDF)</label>
                      <input type="file" accept=".pdf" className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" onChange={(e) => setStudentFile(e.target.files[0])} />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <label className="block text-sm font-bold text-slate-900 mb-3">Parent Statement (6M PDF)</label>
                      <input type="file" accept=".pdf" className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" onChange={(e) => setParentFile(e.target.files[0])} />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: ESIGN */}
              {step === 5 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 text-center py-8">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">eSign Loan Agreement</h2>
                  <p className="text-slate-500 mb-8 max-w-sm mx-auto">By signing below, you agree to the terms and conditions of the Credixa BNPL facility for ₹{loanAmount.toLocaleString()}.</p>
                  
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-8 max-w-md mx-auto text-left">
                    <div className="flex items-center text-sm font-medium text-slate-700 mb-3"><CheckSquare className="w-4 h-4 mr-2 text-emerald-500" /> I confirm the bank details are accurate.</div>
                    <div className="flex items-center text-sm font-medium text-slate-700 mb-3"><CheckSquare className="w-4 h-4 mr-2 text-emerald-500" /> I authorize AI analysis of statements.</div>
                    <div className="flex items-center text-sm font-medium text-slate-700"><CheckSquare className="w-4 h-4 mr-2 text-emerald-500" /> I agree to the repayment schedule.</div>
                  </div>
                </div>
              )}

              {/* Stepper Navigation */}
              <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between">
                {step > 1 ? (
                  <button onClick={() => setStep(step - 1)} disabled={isApplying} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Back</button>
                ) : <div></div>}
                
                {step < 4 && (
                  <button onClick={handleInitializeLoan} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center">
                    Continue <ChevronRight className="w-5 h-5 ml-1" />
                  </button>
                )}
                {step === 4 && (
                  <button onClick={() => setStep(5)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center">
                    Generate Agreement
                  </button>
                )}
                {step === 5 && (
                  <button onClick={handleFinalSubmit} disabled={isApplying} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-all flex items-center">
                    {isApplying ? "Running AI Engine..." : "Agree & Submit"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ADDITIONAL WIDGETS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-900">Recent Transactions</h3>
                <History className="w-5 h-5 text-slate-400" />
              </div>
              {payments.length > 0 ? (
                <div className="space-y-4">
                  {payments.slice(0, 3).map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm text-slate-900">EMI Payment</p>
                        <p className="text-xs text-slate-500">{p.date}</p>
                      </div>
                      <p className="font-black text-emerald-600">₹{p.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No recent transactions</p>
              )}
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 shadow-sm text-white">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold mb-1">Rewards & Referral</h3>
                  <p className="text-indigo-200 text-xs">Invite friends, earn cashback.</p>
                </div>
                <Gift className="w-6 h-6 text-indigo-300" />
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                <p className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider mb-1">Total Earned</p>
                <p className="text-2xl font-black">₹1,250</p>
              </div>
              <button className="w-full mt-4 bg-indigo-500 hover:bg-indigo-600 py-3 rounded-xl font-bold text-sm transition-colors">
                Share Link
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky EMI Calculator & Trust */}
        <div className="lg:col-span-4 relative">
          <div className="sticky top-24 space-y-6">
            
            {/* Live EMI Calculator Card */}
            <div className="bg-slate-900 text-white rounded-[24px] p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500 rounded-full blur-[50px] opacity-30"></div>
              
              <h3 className="font-black text-lg mb-6 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-indigo-400" /> Plan Summary
              </h3>

              <div className="space-y-4 mb-6 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm font-medium">Principal</span>
                  <span className="font-bold">₹{loanAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm font-medium">Interest Rate (Fixed)</span>
                  <span className="font-bold">{SYSTEM_INTEREST_RATE}% p.a.</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm font-medium">Tenure</span>
                  <span className="font-bold">{loanTenure} Months</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-slate-700">
                  <span className="text-slate-400 text-sm font-medium">Processing Fee</span>
                  <span className="font-bold text-slate-300">₹{processingFee.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <span className="text-indigo-300 font-bold uppercase tracking-wider text-xs">Monthly EMI</span>
                  <span className="text-3xl font-black text-white">₹{emi.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Total Repayment Amount</p>
                <p className="font-bold text-emerald-400">₹{totalRepayment.toLocaleString()}</p>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-100">
              <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Verification Status</h4>
              <ul className="space-y-3">
                <li className="flex items-center text-sm font-bold text-slate-700">
                  <CheckCircle className="w-4 h-4 mr-3 text-emerald-500" /> Student Verification
                </li>
                <li className="flex items-center text-sm font-bold text-slate-700">
                  <CheckCircle className="w-4 h-4 mr-3 text-emerald-500" /> PAN Verified
                </li>
                <li className="flex items-center text-sm font-bold text-slate-700">
                  <CheckCircle className="w-4 h-4 mr-3 text-emerald-500" /> Bank Active
                </li>
                <li className={`flex items-center text-sm font-bold ${step > 4 ? 'text-slate-700' : 'text-slate-400'}`}>
                  {step > 4 ? <CheckCircle className="w-4 h-4 mr-3 text-emerald-500" /> : <Clock className="w-4 h-4 mr-3 text-slate-300" />} AI Assessment
                </li>
              </ul>
            </div>

            {/* Support Widget */}
            <button className="w-full bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center mr-3 group-hover:bg-indigo-100 transition-colors">
                  <MessageCircle className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900 text-sm">Need Help?</p>
                  <p className="text-xs text-slate-500 font-medium">Chat with support</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>

          </div>
        </div>
      </div>
      
      {/* Existing Profile Modal unchanged except styling tweaks */}
      {showProfileModal && profile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b flex justify-between items-center bg-white">
              <h3 className="text-2xl font-black text-slate-900 flex items-center">
                <User className="mr-3 h-7 w-7 text-emerald-500" />
                Digital Profile
              </h3>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-8 flex-1 overflow-y-auto bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Identity */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h4 className="font-black text-slate-900 mb-4 tracking-tight">Identity Details</h4>
                  <div className="space-y-4 text-sm">
                    <p className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500 font-medium">Name:</span> <span className="font-bold text-slate-900">{profile.full_name}</span></p>
                    <p className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500 font-medium">Email:</span> <span className="font-bold text-slate-900">{profile.email}</span></p>
                    <p className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500 font-medium">Mobile:</span> <span className="font-bold text-slate-900">{profile.mobile_number}</span></p>
                    <p className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500 font-medium">PAN:</span> <span className="font-bold text-slate-900">{profile.pan_number || 'N/A'}</span></p>
                    <p className="flex justify-between"><span className="text-slate-500 font-medium">Status:</span> <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md">{profile.kyc_status}</span></p>
                  </div>
                </div>

                {/* CoApplicant Info */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h4 className="font-black text-slate-900 mb-4 tracking-tight">Permanent Co-Applicant</h4>
                  {profile.co_applicant ? (
                    <div className="space-y-4 text-sm">
                      <p className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500 font-medium">Name:</span> <span className="font-bold text-slate-900">{profile.co_applicant.full_name}</span></p>
                      <p className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500 font-medium">Relation:</span> <span className="font-bold text-slate-900">{profile.co_applicant.relationship}</span></p>
                      <p className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500 font-medium">PAN:</span> <span className="font-bold text-slate-900">{profile.co_applicant.pan_number}</span></p>
                      <p className="flex justify-between"><span className="text-slate-500 font-medium">Income:</span> <span className="font-bold text-slate-900">₹{parseFloat(profile.co_applicant.monthly_income).toLocaleString()}</span></p>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm italic">No co-applicant registered.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
