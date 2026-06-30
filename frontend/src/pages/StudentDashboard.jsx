import { useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut, X, FileText, XCircle, ShieldCheck, GraduationCap,
  Landmark, Zap, TrendingUp, MessageCircle, ChevronRight, Check,
  CheckSquare, CheckCircle,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext.jsx";
import api from "../services/api";

// Extracted hook
import useStudentData from "../hooks/useStudentData.js";

// Extracted components
import LoanStatusCard from "../components/dashboard/LoanStatusCard.jsx";
import RepaymentSchedule from "../components/dashboard/RepaymentSchedule.jsx";
import DocumentVault from "../components/dashboard/DocumentVault.jsx";
import ProfileModal from "../components/dashboard/ProfileModal.jsx";
import SupportChatWidget from "../components/dashboard/SupportChatWidget.jsx";

// ─────────────────────────────────────────────────────────────────────────────
// Pure EMI calculator (kept here because loan application steps need it too)
// ─────────────────────────────────────────────────────────────────────────────
const calcEMI = (principal, annualRate, months) => {
  if (!principal || !annualRate || !months) return 0;
  const p = parseFloat(principal);
  const r = parseFloat(annualRate) / 12 / 100;
  const n = parseInt(months);
  if (r === 0) return p / n;
  return Math.round((p * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1));
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const APPROVED_LIMIT = 100000;
const HEALTH_SCORE = 785;
const SYSTEM_INTEREST_RATE = 12.5;
const SAVED_BANKS = [
  { id: 1, name: "HDFC Bank", account: "HDFC ****4532", verified: true },
  { id: 2, name: "ICICI Bank", account: "ICICI ****8721", verified: true },
];
const LOAN_PURPOSES = [
  "Semester Fees", "Hostel Fees", "Laptop Purchase",
  "Books", "Certification Courses", "Exam Fees", "Other",
];
const TENURES = [3, 6, 12, 18];
const RECOMMENDED_PLANS = [
  { amount: 20000, tenure: 6 },
  { amount: 35000, tenure: 12 },
  { amount: 50000, tenure: 18 },
];

// ─────────────────────────────────────────────────────────────────────────────
// StudentDashboard
// ─────────────────────────────────────────────────────────────────────────────
const StudentDashboard = () => {
  const { logout } = useContext(AuthContext);

  // Step ref is shared with the hook so it skips loan state updates
  // while the user is in the middle of the application flow.
  const stepRef = useRef(1);
  const { profile, activeLoan, setActiveLoan, payments, isLoading, reload } =
    useStudentData(stepRef);

  // ── Application Flow State ───────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [tempLoanId, setTempLoanId] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  // ── Loan Form State ──────────────────────────────────────────────────────
  const [loanAmount, setLoanAmount] = useState(20000);
  const [loanTenure, setLoanTenure] = useState(6);
  const [loanPurpose, setLoanPurpose] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC ****4532");

  // ── Document State ───────────────────────────────────────────────────────
  const [studentFile, setStudentFile] = useState(null);
  const [parentFile, setParentFile] = useState(null);
  const [latestMarksheetFile, setLatestMarksheetFile] = useState(null);
  const [isFirstSemester, setIsFirstSemester] = useState(false);

  const isProfileComplete =
    profile && profile.kyc_status !== "PENDING" && profile.co_applicant;

  // Keep the step ref in sync so the hook can read it without a re-render dep
  const setStepSync = (v) => {
    stepRef.current = v;
    setStep(v);
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleInitializeLoan = async () => {
    if (step === 2 && !loanPurpose) {
      setApplyError("Please select a loan purpose.");
      return;
    }
    setApplyError("");

    if (step === 3) {
      setStepSync(4);
    } else {
      setStepSync(step + 1);
    }
  };

  const handleFinalSubmit = async () => {
    setApplyError("");
    const missingDocs = [];
    if (!isFirstSemester && !latestMarksheetFile) missingDocs.push("Latest Semester Marksheet");
    if (!studentFile) missingDocs.push("Student Bank Statement");
    if (!parentFile) missingDocs.push("Parent Bank Statement");
    if (missingDocs.length > 0) {
      setApplyError(`Please upload: ${missingDocs.join(", ")}`);
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
      setStepSync(1);
      reload();
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
      const emiAmount = calcEMI(
        activeLoan.approved_amount || activeLoan.requested_amount,
        activeLoan.interest_rate,
        activeLoan.tenure_months
      );
      await api.post("/loans/repay", { loan_id: activeLoan.loan_id, amount: emiAmount });
      await reload();
    } catch (err) {
      console.error("Payment failed", err);
      alert(err.response?.data?.error || "Payment failed");
    } finally {
      setIsPaying(false);
    }
  };

  // ── Derived values for the right-column Plan Summary card ────────────────
  const emi = calcEMI(loanAmount, SYSTEM_INTEREST_RATE, loanTenure);
  const totalRepayment = emi * loanTenure;
  const processingFee = Math.round(loanAmount * 0.02);

  // ── Loading guard ─────────────────────────────────────────────────────────
  if (isLoading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-800">
      {/* HEADER */}
      <nav className="bg-white px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <img src="/credixa-favicon.png" alt="Credixa" className="w-8 h-8" />
          <span className="text-2xl font-black tracking-tight text-slate-900">Credixa</span>
        </div>
        <button
          onClick={logout}
          className="text-slate-400 hover:text-red-500 flex items-center font-bold text-sm transition-colors"
        >
          <LogOut className="h-4 w-4 mr-1" /> Logout
        </button>
      </nav>

      <div className="max-w-6xl mx-auto mt-8 px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── LEFT COLUMN ── */}
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
                    <GraduationCap className="h-4 w-4 mr-1" />
                    {profile.college_name || "Institution Pending"}
                  </p>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end space-y-2">
                <div className="flex space-x-2">
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-1 uppercase rounded-md tracking-wider">
                    ID: {profile.college_roll_number}
                  </span>
                  <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-1 uppercase rounded-md tracking-wider flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" /> Verified
                  </span>
                </div>
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="text-emerald-600 font-bold text-sm hover:text-emerald-700 transition-colors"
                >
                  View Full Profile &rarr;
                </button>
              </div>
            </div>
          )}

          {/* CREDIT OVERVIEW — shown only when no active loan and not mid-application */}
          {(!activeLoan || ["CLOSED", "REJECTED"].includes(activeLoan.status)) && step === 1 && (
            <div className="bg-slate-900 rounded-[24px] shadow-xl p-8 relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[80px] opacity-20 -mr-20 -mt-20 pointer-events-none" />
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

          {/* ACTIVE LOAN STATUS CARD */}
          {activeLoan && (
            <LoanStatusCard
              activeLoan={activeLoan}
              onStartNew={() => setActiveLoan(null)}
              onPayEMI={handlePayEMI}
              isPaying={isPaying}
              calculateEMI={calcEMI}
            />
          )}

          {/* APPLICATION STEPPER — shown only when there's no active loan */}
          {!activeLoan && isProfileComplete && (
            <div className="bg-white rounded-[24px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 p-8 relative">

              {/* Stepper Header */}
              <div className="flex items-center justify-between mb-8 relative">
                <div className="absolute left-0 top-1/2 w-full h-1 bg-slate-100 -z-10 -translate-y-1/2 rounded" />
                <div
                  className="absolute left-0 top-1/2 h-1 bg-emerald-500 -z-10 -translate-y-1/2 rounded transition-all duration-500"
                  style={{ width: `${((step - 1) / 4) * 100}%` }}
                />
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors duration-300 ${
                      step > s
                        ? "bg-emerald-500 text-white"
                        : step === s
                        ? "bg-slate-900 text-white ring-4 ring-slate-100"
                        : "bg-white text-slate-400 border-2 border-slate-200"
                    }`}
                  >
                    {step > s ? <Check className="w-5 h-5" /> : s}
                  </div>
                ))}
              </div>

              {applyError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-center mb-6 font-medium">
                  <XCircle className="w-5 h-5 mr-2 flex-shrink-0" /> {applyError}
                </div>
              )}

              {/* STEP 1: Amount */}
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Personalize your credit</h2>
                  <p className="text-slate-500 mb-8">
                    Choose the exact amount you need. You're pre-approved up to ₹{APPROVED_LIMIT.toLocaleString()}.
                  </p>
                  <div className="bg-slate-50 rounded-2xl p-8 mb-8 border border-slate-100">
                    <div className="text-center mb-8">
                      <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-2">Requested Amount</p>
                      <h1 className="text-5xl font-black text-emerald-600">₹{loanAmount.toLocaleString()}</h1>
                    </div>
                    <input
                      type="range" min="5000" max={APPROVED_LIMIT} step="1000"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="flex justify-between mt-3 text-xs font-bold text-slate-400">
                      <span>₹5,000</span><span>₹{APPROVED_LIMIT.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mb-8">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                      <Zap className="w-4 h-4 mr-2 text-yellow-500" /> AI Recommended Plans
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {RECOMMENDED_PLANS.map((plan, idx) => (
                        <div
                          key={idx}
                          onClick={() => { setLoanAmount(plan.amount); setLoanTenure(plan.tenure); }}
                          className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                            loanAmount === plan.amount && loanTenure === plan.tenure
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-slate-100 bg-white hover:border-slate-300"
                          }`}
                        >
                          <p className="text-lg font-black text-slate-900">₹{plan.amount.toLocaleString()}</p>
                          <p className="text-sm text-slate-500 font-medium">{plan.tenure} Months</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Purpose & Tenure */}
              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="text-2xl font-black text-slate-900 mb-6">Structuring your plan</h2>
                  <div className="mb-8">
                    <label className="block text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Select Tenure</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {TENURES.map((t) => (
                        <div
                          key={t}
                          onClick={() => setLoanTenure(t)}
                          className={`cursor-pointer text-center rounded-xl border-2 p-4 transition-all ${
                            loanTenure === t ? "border-emerald-500 bg-emerald-50 shadow-sm" : "border-slate-100 bg-white hover:border-slate-300"
                          }`}
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
                      {LOAN_PURPOSES.map((p) => (
                        <button
                          key={p}
                          onClick={() => setLoanPurpose(p)}
                          className={`px-4 py-2 rounded-full border text-sm font-bold transition-colors ${
                            loanPurpose === p
                              ? "bg-slate-900 border-slate-900 text-white"
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Bank */}
              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Where should we send the money?</h2>
                  <p className="text-slate-500 mb-8">Select a verified bank account for instant disbursal upon approval.</p>
                  <div className="space-y-4 mb-6">
                    {SAVED_BANKS.map((bank) => (
                      <div
                        key={bank.id}
                        onClick={() => setSelectedBank(bank.account)}
                        className={`cursor-pointer p-5 rounded-2xl border-2 flex items-center justify-between transition-all ${
                          selectedBank === bank.account ? "border-emerald-500 bg-emerald-50" : "border-slate-100 bg-white hover:border-slate-300"
                        }`}
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

              {/* STEP 4: AI Verification (Documents) */}
              {step === 4 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Final Step: AI Verification</h2>
                  <p className="text-slate-500 mb-6">
                    Upload verifiable 6-month statements to trigger our instant AI Risk Assessment engine.
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                      <label className="text-sm font-bold text-slate-900">Latest Semester Marksheet</label>
                      <label className="flex items-center text-sm font-bold text-emerald-600 cursor-pointer">
                        <input
                          type="checkbox" className="mr-2 h-4 w-4 accent-emerald-500"
                          checked={isFirstSemester}
                          onChange={(e) => { setIsFirstSemester(e.target.checked); if (e.target.checked) setLatestMarksheetFile(null); }}
                        />
                        I am in my First Semester
                      </label>
                    </div>
                    {!isFirstSemester ? (
                      <input
                        type="file" accept=".pdf"
                        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                        onChange={(e) => setLatestMarksheetFile(e.target.files[0])}
                      />
                    ) : (
                      <p className="text-sm text-slate-500 italic">🎓 Admission Letter will be used instead.</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <label className="block text-sm font-bold text-slate-900 mb-3">Student Statement (6M PDF)</label>
                      <input
                        type="file" accept=".pdf"
                        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                        onChange={(e) => setStudentFile(e.target.files[0])}
                      />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <label className="block text-sm font-bold text-slate-900 mb-3">Parent Statement (6M PDF)</label>
                      <input
                        type="file" accept=".pdf"
                        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                        onChange={(e) => setParentFile(e.target.files[0])}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: eSign */}
              {step === 5 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 text-center py-8">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">eSign Loan Agreement</h2>
                  <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                    By signing below, you agree to the terms and conditions of the Credixa BNPL facility for ₹{loanAmount.toLocaleString()}.
                  </p>
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-8 max-w-md mx-auto text-left">
                    <div className="flex items-center text-sm font-medium text-slate-700 mb-3">
                      <CheckSquare className="w-4 h-4 mr-2 text-emerald-500" /> I confirm the bank details are accurate.
                    </div>
                    <div className="flex items-center text-sm font-medium text-slate-700 mb-3">
                      <CheckSquare className="w-4 h-4 mr-2 text-emerald-500" /> I authorize AI analysis of statements.
                    </div>
                    <div className="flex items-center text-sm font-medium text-slate-700">
                      <CheckSquare className="w-4 h-4 mr-2 text-emerald-500" /> I agree to the repayment schedule.
                    </div>
                  </div>
                </div>
              )}

              {/* Stepper Navigation */}
              <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between">
                {step > 1 ? (
                  <button onClick={() => setStepSync(step - 1)} disabled={isApplying} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                    Back
                  </button>
                ) : <div />}
                {step < 4 && (
                  <button onClick={handleInitializeLoan} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center">
                    Continue <ChevronRight className="w-5 h-5 ml-1" />
                  </button>
                )}
                {step === 4 && (
                  <button onClick={() => setStepSync(5)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center">
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

          {/* BOTTOM WIDGETS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RepaymentSchedule payments={payments} />
            <DocumentVault />
          </div>
        </div>

        {/* ── RIGHT COLUMN: Plan Summary & Trust ── */}
        <div className="lg:col-span-4 relative">
          <div className="sticky top-24 space-y-6">

            {/* Live Plan Summary */}
            <div className="bg-slate-900 text-white rounded-[24px] p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500 rounded-full blur-[50px] opacity-30" />
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

            {/* Verification Status */}
            <div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-100">
              <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Verification Status</h4>
              <ul className="space-y-3">
                {[
                  { label: "Student Verification", done: true },
                  { label: "PAN Verified", done: true },
                  { label: "Bank Active", done: true },
                  { label: "AI Assessment", done: step > 4 },
                ].map(({ label, done }) => (
                  <li key={label} className={`flex items-center text-sm font-bold ${done ? "text-slate-700" : "text-slate-400"}`}>
                    {done
                      ? <CheckCircle className="w-4 h-4 mr-3 text-emerald-500" />
                      : <X className="w-4 h-4 mr-3 text-slate-300" />
                    }
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <button 
              onClick={() => setSupportOpen(true)}
              className="w-full bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group"
            >
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

      <ProfileModal
        profile={showProfileModal ? profile : null}
        onClose={() => setShowProfileModal(false)}
      />

      <SupportChatWidget
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
        studentProfile={profile}
      />
    </div>
  );
};

export default StudentDashboard;
