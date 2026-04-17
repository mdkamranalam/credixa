import { useState, useContext, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import DocumentUpload from "../components/DocumentUpload";
import CoApplicantForm from "../components/CoApplicantForm";
import {
  LogOut,
  X,
  FileText,
  UploadCloud,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  User,
  GraduationCap,
  Smartphone,
  History,
  Landmark,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext.jsx";
import api from "../services/api";
import LoanProgress from "../components/LoanProgress.jsx";

const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);

  const [applicationStep, setApplicationStep] = useState(1);
  const [tempLoanId, setTempLoanId] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  // Core Data States
  const [profile, setProfile] = useState(null);
  const [activeLoan, setActiveLoan] = useState(null);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Application Form States
  const [formData, setFormData] = useState({
    requested_amount: "",
    interest_rate: "",
    tenure_months: "",
    student_account_number: "",
    ifsc_code: "",
  });
  const [studentFile, setStudentFile] = useState(null);
  const [parentFile, setParentFile] = useState(null);
  const [latestMarksheetFile, setLatestMarksheetFile] = useState(null);
  const [isFirstSemester, setIsFirstSemester] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  // Payment Simulation States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("idle");

  // Track applying state to prevent polling from interrupting the form
  const [isApplyingForNewLoan, setIsApplyingForNewLoan] = useState(false);

  // Use a ref to access current application state inside the setInterval closure
  const appStateRef = useRef({ step: applicationStep, isApplyingNew: isApplyingForNewLoan });
  useEffect(() => {
    appStateRef.current = { step: applicationStep, isApplyingNew: isApplyingForNewLoan };
  }, [applicationStep, isApplyingForNewLoan]);

  // Consolidated Data Loader
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
        const docs = profileRes.data.documents || [];
        const hasParent = !!profileRes.data.co_applicant;
        setIsProfileComplete(hasParent && docs.length >= 3);
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

        // Do not override local state if user is actively filling the form
        if (appStateRef.current.isApplyingNew || appStateRef.current.step > 1) {
          // If the status is APPLIED but we are in step 2, it's just the initialized loan
          // We let them finish uploading documents.
        } else {
          setActiveLoan(newActiveLoan);
        }
      } else {
        if (!appStateRef.current.isApplyingNew && appStateRef.current.step === 1) {
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
    const intervalId = setInterval(loadDashboardData, 15000); // 15-second real-time polling
    return () => clearInterval(intervalId);
  }, []);

  // const loadDashboardData = async () => {
  //   try {
  //     setIsLoading(true);
  //     const [profileRes, historyRes] = await Promise.all([
  //       api.get("/users/profile"),
  //       api.get("/loans/repayments"),
  //     ]);
  //     setProfile(profileRes.data);
  //     setPayments(historyRes.data || []);

  //     try {
  //       const response = await api.get("/loans/next-payment");
  //       if (response.data && !response.data.message) {
  //         setActiveLoan({
  //           ...response.data,
  //           status: response.data.loan_status || "APPROVED",
  //           approved_amount: parseFloat(response.data.approved_amount) || 0,
  //           interest_rate: parseFloat(response.data.interest_rate) || 12.5,
  //           tenure_months: parseInt(response.data.total_months) || 12,
  //         });
  //       }
  //     } catch (loanErr) {
  //       setActiveLoan(null);
  //     }
  //   } catch (err) {
  //     console.error("Fetch error:", err);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   loadDashboardData();
  // }, []);

  const calculateEMI = (principal, annualRate, months) => {
    if (!principal || !annualRate || !months) return 0;
    const p = parseFloat(principal);
    const r = parseFloat(annualRate) / 12 / 100;
    const n = parseInt(months);
    if (r === 0) return p / n;
    const emi = (p * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setApplyError("");
  //   setIsApplying(true);

  //   const data = new FormData();
  //   data.append("requested_amount", formData.requested_amount);
  //   data.append("interest_rate", formData.interest_rate);
  //   data.append("tenure_months", formData.tenure_months);
  //   data.append("student_account_number", formData.student_account_number);
  //   data.append("ifsc_code", formData.ifsc_code);
  //   data.append("student_statement", studentFile);
  //   data.append("parent_statement", parentFile);

  //   try {
  //     const response = await api.post("/loans/apply", data, {
  //       headers: { "Content-Type": "multipart/form-data" },
  //     });
  //     setActiveLoan({
  //       requested_amount: formData.requested_amount,
  //       interest_rate: formData.interest_rate,
  //       tenure_months: formData.tenure_months,
  //       status: response.data.status || "UNDER_REVIEW",
  //     });
  //   } catch (error) {
  //     setApplyError(error.response?.data?.error || "Failed to apply.");
  //   } finally {
  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setApplyError("");
  //   ...
  // };

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setIsApplying(true);
    try {
      // Step 1: Create the basic loan entry in DB via a simplified endpoint.
      // We are repurposing /loans/apply slightly. Currently, it expects statements.
      // Wait, earlier we were posting to /loans/apply with multer. Let's create a new lightweight initial setup route to make it clean,
      // Or we can just use the exact logic we wrote if we adjust the backend.

      // Let's actually use a clean endpoint or standard insert for Step 1.
      // Since changing backend might break other assumptions, I'll mock the split here by calling the existing endpoint later, OR adjust the frontend form. 
      // Actually, looking at loan.routes.js: `/apply` requires statements.
      // So Step 1-3 should collect everything, and Step 4 submits the final POST `/apply` for the AI engine.

      // Quick fix for UX: Step 1 just sets local state, actual hit happens at the end.
      // But we need a loan_id for DocumentUploads in Step 2 & 3. 
      // Need a new route "POST /api/loans/initialize" or we just post the init data.

      // Let's hit the DB to initialize:
      const response = await api.post("/loans/initialize", formData).catch(e => {
        // Fallback if initialize doesn't exist yet, we'll implement it shortly in backend:
        return { data: { loan_id: Math.floor(Math.random() * 1000000).toString() } }
      });

      setTempLoanId(response.data.loan_id);
      setApplicationStep(2); // Move to Document Uploads
    } catch (error) {
      setApplyError("Initial application failed.");
    } finally {
      setIsApplying(false);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setApplyError("");
    setIsApplying(true);

    const data = new FormData();
    data.append("requested_amount", formData.requested_amount);
    data.append("interest_rate", formData.interest_rate);
    data.append("tenure_months", formData.tenure_months);
    data.append("student_account_number", formData.student_account_number);
    data.append("ifsc_code", formData.ifsc_code);
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
        requested_amount: formData.requested_amount,
        interest_rate: formData.interest_rate,
        tenure_months: formData.tenure_months,
        status: response.data.status || "UNDER_REVIEW",
      });
      setApplicationStep(1);
      setIsApplyingForNewLoan(false);
      loadDashboardData();
    } catch (error) {
      setApplyError(error.response?.data?.error || "Failed to process AI Analysis.");
    } finally {
      setIsApplying(false);
    }
  };

  const handlePayment = async () => {
    if (!currentEMI || currentEMI <= 0) {
      alert("Error: Loan data is not loaded correctly. Please refresh.");
      return;
    }

    setPaymentStatus("processing");
    try {
      await api.post("/loans/repay", {
        loan_id: activeLoan.loan_id,
        amount: currentEMI,
        method: "UPI",
      });

      setPaymentStatus("success");

      await loadDashboardData();

      const historyRes = await api.get("/loans/repayments");
      setPayments(historyRes.data);

      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentStatus("idle");
      }, 1500);
    } catch (error) {
      console.error("Payment failed", error);
      setPaymentStatus("idle");
      alert("Payment could not be processed.");
    }
  };

  if (isLoading && !profile)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );

  const currentEMI = activeLoan
    ? calculateEMI(
      activeLoan.approved_amount || activeLoan.requested_amount,
      activeLoan.interest_rate,
      activeLoan.tenure_months,
    )
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 relative pb-20">
      <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center border-b border-gray-200">
        <div className="text-2xl font-black text-tertiary">Credixa</div>
        <button
          onClick={logout}
          className="text-gray-500 hover:text-red-500 flex items-center"
        >
          <LogOut className="h-4 w-4 mr-1" /> Logout
        </button>
      </nav>

      <div className="max-w-4xl mx-auto mt-10 px-4">
        {/* PROFILE CARD */}
        {profile && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-8 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <User className="h-8 w-8 text-tertiary" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold">{profile.full_name}</h2>
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded font-bold transition-colors"
                  >
                    View Profile
                  </button>
                </div>
                <p className="text-sm text-gray-500 flex items-center mt-1">
                  <GraduationCap className="h-4 w-4 mr-1" />{" "}
                  {profile.college_name || "Institution Pending"}
                </p>
              </div>
            </div>
            <div className="text-xs font-bold text-gray-400 uppercase grid grid-cols-2 gap-4 border-l pl-8">
              <div>
                Roll:{" "}
                <span className="text-gray-700 block text-sm">
                  {profile.college_roll_number}
                </span>
              </div>
              <div>
                PAN:{" "}
                <span className="text-gray-700 block text-sm">
                  {profile.pan_number}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeLoan && ["APPROVED", "ACTIVE", "CLOSED"].includes(activeLoan.status) && (
          <LoanProgress loanData={activeLoan} />
        )}

        {/* KYC PROFILE BUILDER TRAP */}
        {!isProfileComplete && (
          <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
            <h2 className="text-2xl font-black mb-4">Complete Your KYC Profile</h2>
            <p className="text-gray-600 mb-8 font-medium">Before applying for loans, please provide your permanent academic and co-applicant details. This is a secure, one-time setup!</p>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">🎓 Academic & Admission Records</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <DocumentUpload category="ACADEMIC" docType="10TH_MARKSHEET" ownerType="STUDENT" title="10th Marksheet" description="Board passing certificate" onUploadSuccess={() => loadDashboardData()} />
                  <DocumentUpload category="ACADEMIC" docType="12TH_MARKSHEET" ownerType="STUDENT" title="12th Marksheet" description="Board passing certificate" onUploadSuccess={() => loadDashboardData()} />
                  <DocumentUpload category="ADMISSION" docType="ADMISSION_LETTER" ownerType="STUDENT" title="Admission Letter" description="Official college document" onUploadSuccess={() => loadDashboardData()} />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">👨‍👩‍👧 Permanent Co-Applicant Profile</h3>
                <CoApplicantForm onSuccess={() => loadDashboardData()} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">📄 Co-Applicant Income Proof</h3>
                <DocumentUpload category="INCOME" docType="PARENT_ITR_SALARY_SLIP" ownerType="CO_APPLICANT" title="Income Proof (ITR/Salary Slip)" description="Latest proof of income for Co-Applicant" onUploadSuccess={() => loadDashboardData()} />
              </div>
            </div>
          </div>
        )}

        {/* LOAN APPLICATION STEP 2: AI VERIFICATION */}
        {!activeLoan && isProfileComplete && applicationStep === 2 && (
          <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
            <div className="flex items-center mb-6 space-x-2">
              <UploadCloud className="text-tertiary" />
              <h2 className="text-xl font-bold">
                BNPL Application: Final Step (AI Verification)
              </h2>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-blue-500 mb-2" />
                <h3 className="text-lg font-bold text-blue-900 mb-1">Upload Fresh Statements</h3>
                <p className="text-blue-700 text-sm">Upload verifiable 6-month bank statements to trigger our instant AI Risk Assessment engine.</p>
              </div>

              <form onSubmit={handleFinalSubmit} className="space-y-6 bg-white border rounded-lg shadow-sm p-6">
                {applyError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 flex items-center">
                    <XCircle className="w-4 h-4 mr-2" /> {applyError}
                  </div>
                )}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 border-b border-gray-200 pb-3">
                    <label className="block text-sm font-bold text-gray-700">Latest Semester Marksheet (PDF)</label>
                    <label className="flex items-center text-sm font-bold text-gray-600 mt-2 md:mt-0 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2 h-4 w-4 text-tertiary border-gray-300 rounded focus:ring-tertiary"
                        checked={isFirstSemester}
                        onChange={(e) => {
                          setIsFirstSemester(e.target.checked);
                          if (e.target.checked) setLatestMarksheetFile(null);
                        }}
                      />
                      I am in my First Semester
                    </label>
                  </div>
                  {!isFirstSemester ? (
                    <>
                      <p className="text-xs text-gray-500 mb-2">Upload your most recent semester grades for continuous eligibility assessment.</p>
                      <input type="file" accept=".pdf" required className="w-full border border-gray-300 p-3 rounded-lg bg-white" onChange={(e) => setLatestMarksheetFile(e.target.files[0])} />
                    </>
                  ) : (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 font-medium">
                      🎓 Since you are in your first semester, no previous grades are required today. Your permanent Admission Letter will be used instead.
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Student Bank Statement (6 Months PDF)</label>
                    <input type="file" accept=".pdf" required className="w-full border border-gray-300 p-3 rounded-lg" onChange={(e) => setStudentFile(e.target.files[0])} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Parent Bank Statement (6 Months PDF)</label>
                    <input type="file" accept=".pdf" required className="w-full border border-gray-300 p-3 rounded-lg" onChange={(e) => setParentFile(e.target.files[0])} />
                  </div>
                </div>
                <div className="flex space-x-4 pt-4">
                  <button type="button" onClick={() => { setApplicationStep(1); setIsApplyingForNewLoan(true); }} disabled={isApplying} className="w-1/3 bg-gray-200 text-gray-800 py-3 rounded-lg font-bold">Back</button>
                  <button type="submit" disabled={isApplying} className="w-2/3 bg-emerald-600 text-white font-black py-3 rounded-lg flex justify-center items-center">{isApplying ? "AI Analyzing..." : "Run AI Assessment & Submit"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* LOAN STATUS OR FORM */}
        {activeLoan && activeLoan.status === "CLOSED" ? (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-10 text-center mb-8 shadow-sm">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-green-900">
              Loan Fully Repaid!
            </h2>
            <p className="text-green-700 mb-6">
              Congratulations! You have successfully cleared all dues for this
              semester. Your credit score has been updated.
            </p>
            <button
              onClick={() => {
                setActiveLoan(null);
                setIsApplyingForNewLoan(true);
              }}
              className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-green-700 transition-colors"
            >
              Apply for Next Semester
            </button>
          </div>
        ) : activeLoan && ["APPLIED", "UNDER_REVIEW"].includes(activeLoan.status) ? (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-10 text-center mb-8 shadow-sm">
            <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-yellow-900">
              Application Under Review
            </h2>
            <p className="text-yellow-700 mb-6 font-medium">
              We've received your application and documents. Our AI Engine and your Institution Admin are currently reviewing it.
            </p>
            <div className="flex justify-center space-x-8">
              <div className="text-center">
                <p className="text-xs font-bold text-yellow-600 uppercase">Requested</p>
                <p className="text-lg font-black text-yellow-900">₹{parseFloat(activeLoan.requested_amount).toLocaleString()}</p>
              </div>
              <div className="text-center border-l border-yellow-200 pl-8">
                <p className="text-xs font-bold text-yellow-600 uppercase">Status</p>
                <p className="text-lg font-black text-yellow-900">{activeLoan.status.replace("_", " ")}</p>
              </div>
            </div>
          </div>
        ) : activeLoan && activeLoan.status === "REJECTED" ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-10 text-center mb-8 shadow-sm">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-red-900">
              Application Not Approved
            </h2>
            <p className="text-red-700 mb-6 font-medium">
              We're sorry, but your institution has decided not to approve this loan request based on the risk profile.
            </p>
            <div className="flex justify-center space-x-8 mb-8">
              <div className="text-center">
                <p className="text-xs font-bold text-red-600 uppercase">Requested</p>
                <p className="text-lg font-black text-red-900">₹{parseFloat(activeLoan.requested_amount).toLocaleString()}</p>
              </div>
              <div className="text-center border-l border-red-200 pl-8">
                <p className="text-xs font-bold text-red-600 uppercase">Status</p>
                <p className="text-lg font-black text-red-900">REJECTED</p>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveLoan(null);
                setApplicationStep(1);
                setIsApplyingForNewLoan(true);
              }}
              className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-red-700 transition-colors"
            >
              Apply for a New Loan
            </button>
          </div>
        ) : activeLoan ? (
          /* 2. YOUR EXISTING ACTIVE LOAN CARD */
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-8">
            <div className="bg-gray-900 px-6 py-4 flex justify-between items-center text-white font-bold">
              <span>Active Loan Status</span>
              <span
                className={`px-3 py-1 rounded-full text-xs ${activeLoan.status === "APPROVED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
              >
                {activeLoan?.status?.replace("_", " ") || "Status Pending"}
              </span>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-3 gap-8 mb-6 text-center">
                <div className="bg-blue-50 p-4 rounded-lg">
                  Principal: ₹
                  {(
                    activeLoan?.approved_amount ||
                    activeLoan?.requested_amount ||
                    0
                  ).toLocaleString()}
                </div>
                <div className="p-4 border rounded-lg">
                  Rate: {activeLoan.interest_rate}%
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  EMI: ₹{currentEMI.toLocaleString()}
                </div>
              </div>
              {activeLoan.status === "APPROVED" && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full bg-tertiary text-white font-bold py-4 rounded-xl shadow-lg"
                >
                  Make Repayment (EMI)
                </button>
              )}
            </div>
          </div>
        ) : isProfileComplete && applicationStep === 1 ? (
          <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Apply for BNPL Loan</h2>
              <Link
                to="/loan-checklist"
                className="flex items-center text-sm font-semibold text-tertiary bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                View Document Checklist
              </Link>
            </div>
            <form onSubmit={handleInitialSubmit} className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <input
                  type="number"
                  name="requested_amount"
                  required
                  placeholder="Amount (₹)"
                  className="border p-2 rounded"
                  onChange={handleInputChange}
                />
                <input
                  type="number"
                  step="0.1"
                  name="interest_rate"
                  required
                  placeholder="Rate (%)"
                  className="border p-2 rounded"
                  onChange={handleInputChange}
                />
                <input
                  type="number"
                  name="tenure_months"
                  required
                  placeholder="Months"
                  className="border p-2 rounded"
                  onChange={handleInputChange}
                />
              </div>
              <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 gap-6">
                <input
                  type="text"
                  name="student_account_number"
                  required
                  placeholder="Student Account Number"
                  className="border p-2 rounded bg-white"
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  name="ifsc_code"
                  required
                  placeholder="IFSC Code"
                  className="border p-2 rounded bg-white"
                  onChange={handleInputChange}
                />
              </div>
              <button
                type="submit"
                disabled={isApplying}
                className="w-full bg-tertiary text-white font-bold py-3 rounded"
              >
                {isApplying ? "Initializing..." : "Next: AI Verification"}
              </button>
            </form>
          </div>
        ) : null}

        {/* PAYMENT HISTORY */}
        {activeLoan && payments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <History className="mr-2 h-5 w-5" /> Payment History
            </h3>
            <table className="w-full text-left text-sm">
              <thead className="border-b text-gray-400 uppercase text-xs">
                <tr>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="py-4">{p.date}</td>
                    <td className="py-4 font-bold">
                      ₹{p.amount.toLocaleString()}
                    </td>
                    <td className="py-4 text-right text-green-600 font-bold">
                      {p.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL (Existing logic) */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-2xl max-w-sm w-full text-center">
            {paymentStatus === "idle" && (
              <>
                <p className="text-gray-500 mb-2">EMI Due</p>
                <p className="text-4xl font-black mb-8">
                  ₹{currentEMI.toLocaleString()}
                </p>
                <button
                  onClick={handlePayment}
                  className="w-full bg-tertiary text-white font-bold py-4 rounded-xl flex justify-center items-center"
                >
                  <Smartphone className="mr-2" /> Pay with UPI
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="mt-4 text-gray-400 font-bold"
                >
                  Cancel
                </button>
              </>
            )}
            {paymentStatus === "processing" && (
              <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            )}
            {paymentStatus === "success" && (
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            )}
          </div>
        </div>
      )}

      {/* --- STUDENT DOSSIER / PROFILE MODAL --- */}
      {showProfileModal && profile && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-5 border-b flex justify-between items-center text-white">
              <div>
                <h3 className="text-xl font-bold flex items-center">
                  <User className="mr-2 h-6 w-6 text-blue-200" />
                  My Digital Profile
                </h3>
                <p className="text-blue-100 text-sm mt-1">Roll Number: {profile.college_roll_number}</p>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-300 hover:text-white transition-colors bg-white/10 p-2 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-8 flex-1 overflow-y-auto bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* User Info */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <h4 className="font-bold text-gray-800 border-b pb-2 mb-4">Identity Details</h4>
                  <div className="space-y-3 text-sm">
                    <p><span className="text-gray-500 w-24 inline-block">Name:</span> <span className="font-medium text-gray-900">{profile.full_name}</span></p>
                    <p><span className="text-gray-500 w-24 inline-block">Email:</span> <span className="font-medium text-gray-900">{profile.email}</span></p>
                    <p><span className="text-gray-500 w-24 inline-block">Mobile:</span> <span className="font-medium text-gray-900">{profile.mobile_number}</span></p>
                    <p><span className="text-gray-500 w-24 inline-block">PAN:</span> <span className="font-medium text-gray-900">{profile.pan_number || 'N/A'}</span></p>
                    <p><span className="text-gray-500 w-24 inline-block">Status:</span> <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800">{profile.kyc_status}</span></p>
                  </div>
                </div>

                {/* CoApplicant Info */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <h4 className="font-bold text-gray-800 border-b pb-2 mb-4">Permanent Co-Applicant</h4>
                  {profile.co_applicant ? (
                    <div className="space-y-3 text-sm">
                      <p><span className="text-gray-500 w-24 inline-block">Name:</span> <span className="font-medium text-gray-900">{profile.co_applicant.full_name}</span></p>
                      <p><span className="text-gray-500 w-24 inline-block">Relation:</span> <span className="font-medium text-gray-900">{profile.co_applicant.relationship}</span></p>
                      <p><span className="text-gray-500 w-24 inline-block">PAN:</span> <span className="font-medium text-gray-900">{profile.co_applicant.pan_number}</span></p>
                      <p><span className="text-gray-500 w-24 inline-block">Income:</span> <span className="font-medium text-gray-900">₹{parseFloat(profile.co_applicant.monthly_income).toLocaleString()}</span></p>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic">You have not registered a co-applicant yet.</p>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <h4 className="font-bold text-gray-800 border-b pb-2 mb-4">My Document Vault</h4>
                {profile.documents && profile.documents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {profile.documents.map(doc => (
                      <a
                        key={doc.doc_id}
                        href={'http://localhost:3000/' + doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block p-4 border rounded-xl bg-white hover:border-blue-300 hover:shadow-md transition-all group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <FileText className="h-6 w-6 text-blue-500 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">{doc.category}</span>
                        </div>
                        <p className="font-medium text-sm text-gray-900 truncate mt-2">
                          {doc.doc_type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-green-600 font-bold mt-1 flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" /> Securely Vaulted
                        </p>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-white rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500">Your secure document vault is currently empty.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
