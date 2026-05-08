import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, ShieldCheck, User, UploadCloud, ArrowRight, BookOpen } from "lucide-react";
import api from "../services/api";
import CoApplicantForm from "../components/CoApplicantForm";
import DocumentUpload from "../components/DocumentUpload";

const Onboarding = () => {
  const [step, setStep] = useState(2); // Step 1 is Basic Auth, which is already done
  const navigate = useNavigate();
  
  // KYC State
  const [panNumber, setPanNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [kycLoading, setKycLoading] = useState(false);
  const [kycError, setKycError] = useState("");

  // Academic State
  const [currentSemesterMarks, setCurrentSemesterMarks] = useState("");
  const [academicLoading, setAcademicLoading] = useState(false);
  const [academicError, setAcademicError] = useState("");

  // Check Profile Status on Mount
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const response = await api.get("/users/profile");
        const profile = response.data;
        
        if (profile.kyc_status === "VERIFIED") {
          if (!profile.co_applicant) {
            setStep(3);
          } else {
            const hasAcademicDocs = profile.documents?.some(d => d.category === "ACADEMIC");
            const hasStatements = profile.documents?.some(d => d.doc_type.includes("STATEMENT"));
            
            if (!hasAcademicDocs) {
              setStep(4);
            } else if (!hasStatements) {
              setStep(5);
            } else {
              setStep(6);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      }
    };
    checkProfile();
  }, []);

  const handleAcademicSubmit = async (e) => {
    e.preventDefault();
    setAcademicLoading(true);
    setAcademicError("");
    try {
      if (currentSemesterMarks) {
        await api.post("/users/academic-details", { current_semester_marks: currentSemesterMarks });
      }
      setStep(5);
    } catch (error) {
      setAcademicError(error.response?.data?.error || "Failed to update academic details.");
    } finally {
      setAcademicLoading(false);
    }
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    setKycLoading(true);
    setKycError("");
    try {
      await api.post("/users/kyc", {
        pan_number: panNumber.toUpperCase(),
        aadhaar_number: aadhaarNumber
      });
      setStep(3);
    } catch (error) {
      setKycError(error.response?.data?.error || "Identity Verification failed.");
    } finally {
      setKycLoading(false);
    }
  };

  const finishOnboarding = () => {
    setStep(6);
    setTimeout(() => {
      navigate("/student-dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <img src="/credixa-favicon.png" alt="Credixa" className="mx-auto h-12 w-12 rounded-xl mb-4" />
          <h2 className="text-3xl font-extrabold text-gray-900">Account Setup</h2>
          <p className="mt-2 text-gray-600">Complete your profile to unlock the AI Risk Engine.</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative px-2">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
            <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-emerald-500 -z-10 transition-all duration-500`} style={{ width: `${((step - 1) / 5) * 100}%` }}></div>
            
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step >= s ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs font-semibold text-gray-500">
            <span>Auth</span>
            <span>Identity</span>
            <span>Guarantor</span>
            <span>Academic</span>
            <span>Financials</span>
            <span>Dashboard</span>
          </div>
        </div>

        {/* Step 2: KYC */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <div className="flex items-center mb-6">
              <ShieldCheck className="h-8 w-8 text-emerald-500 mr-3" />
              <h3 className="text-xl font-bold">Step 2: Identity Verification</h3>
            </div>
            <p className="text-gray-600 mb-6">We use IndiaStack to securely verify your identity. Your Aadhaar is encrypted and masked.</p>
            
            {kycError && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded">{kycError}</div>}
            
            <form onSubmit={handleKycSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">PAN Number</label>
                <input
                  type="text"
                  required
                  maxLength="10"
                  pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                  className="w-full border p-3 rounded-lg uppercase focus:ring-emerald-500"
                  placeholder="ABCDE1234F"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Aadhaar Number</label>
                <input
                  type="text"
                  required
                  maxLength="12"
                  pattern="[0-9]{12}"
                  className="w-full border p-3 rounded-lg focus:ring-emerald-500"
                  placeholder="1234 5678 9012"
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <button
                type="submit"
                disabled={kycLoading}
                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg mt-4 disabled:opacity-50"
              >
                {kycLoading ? "Verifying with IndiaStack..." : "Verify Identity"}
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Co-Applicant */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <div className="flex items-center mb-6">
              <User className="h-8 w-8 text-emerald-500 mr-3" />
              <h3 className="text-xl font-bold">Step 3: Co-Applicant Linking</h3>
            </div>
            <p className="text-gray-600 mb-6">Because students often have thin credit files, a guarantor (like a parent) is required.</p>
            <CoApplicantForm onSuccess={() => setStep(4)} />
          </div>
        )}

        {/* Step 4: Academic Details */}
        {step === 4 && (
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <div className="flex items-center mb-6">
              <BookOpen className="h-8 w-8 text-emerald-500 mr-3" />
              <h3 className="text-xl font-bold">Step 4: Academic Details</h3>
            </div>
            <p className="text-gray-600 mb-6">Upload your academic documents to strengthen your profile.</p>
            
            {academicError && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded">{academicError}</div>}
            
            <form onSubmit={handleAcademicSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Current Semester Marks (Optional)</label>
                <input
                  type="text"
                  className="w-full border p-3 rounded-lg focus:ring-emerald-500"
                  placeholder="e.g. 8.5 CGPA or 85%"
                  value={currentSemesterMarks}
                  onChange={(e) => setCurrentSemesterMarks(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DocumentUpload 
                  category="ACADEMIC" 
                  docType="10TH_MARKSHEET" 
                  ownerType="STUDENT" 
                  title="10th Marksheet" 
                  description="Upload PDF or image" 
                />
                <DocumentUpload 
                  category="ACADEMIC" 
                  docType="12TH_MARKSHEET" 
                  ownerType="STUDENT" 
                  title="12th Marksheet" 
                  description="Upload PDF or image" 
                />
                <DocumentUpload 
                  category="ACADEMIC" 
                  docType="ADMISSION_LETTER" 
                  ownerType="STUDENT" 
                  title="Admission Letter" 
                  description="Upload your college admission letter" 
                />
                <DocumentUpload 
                  category="ACADEMIC" 
                  docType="FEE_STRUCTURE" 
                  ownerType="STUDENT" 
                  title="Fee Structure (Year-wise)" 
                  description="Upload official fee structure" 
                />
                <DocumentUpload 
                  category="ACADEMIC" 
                  docType="PROSPECTUS" 
                  ownerType="STUDENT" 
                  title="Prospectus/Course Details" 
                  description="Upload the prospectus" 
                />
                <DocumentUpload 
                  category="ACADEMIC" 
                  docType="BONAFIDE_CERTIFICATE" 
                  ownerType="STUDENT" 
                  title="Bonafide Certificate (Optional)" 
                  description="Upload if available" 
                />
                <DocumentUpload 
                  category="ACADEMIC" 
                  docType="SCHOLARSHIP_LETTER" 
                  ownerType="STUDENT" 
                  title="Scholarship Letter (Optional)" 
                  description="Upload if applicable" 
                />
              </div>
              
              <button
                type="submit"
                disabled={academicLoading}
                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg mt-8 flex items-center justify-center disabled:opacity-50"
              >
                {academicLoading ? "Saving..." : "Continue to Financials"} <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </form>
          </div>
        )}

        {/* Step 5: Financial Data */}
        {step === 5 && (
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <div className="flex items-center mb-6">
              <UploadCloud className="h-8 w-8 text-emerald-500 mr-3" />
              <h3 className="text-xl font-bold">Step 5: Financial Data Ingestion</h3>
            </div>
            <p className="text-gray-600 mb-6">To accurately calculate your AI Omniscore, we need historical cash-flow data.</p>
            
            <div className="space-y-6">
              <DocumentUpload 
                category="FINANCIAL" 
                docType="STUDENT_STATEMENT" 
                ownerType="STUDENT" 
                title="Student Bank Statement (6 Months)" 
                description="Upload a PDF statement." 
              />
              <DocumentUpload 
                category="FINANCIAL" 
                docType="CO_APPLICANT_STATEMENT" 
                ownerType="CO_APPLICANT" 
                title="Guarantor Bank Statement (6 Months)" 
                description="Upload a PDF statement." 
              />
            </div>
            
            <button
              onClick={finishOnboarding}
              className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg mt-8 flex items-center justify-center"
            >
              Complete Onboarding <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 6: Finished */}
        {step === 6 && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <div className="animate-spin h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Generating AI Omniscore...</h3>
            <p className="text-gray-600">Please wait while we initialize your personalized dashboard.</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Onboarding;
