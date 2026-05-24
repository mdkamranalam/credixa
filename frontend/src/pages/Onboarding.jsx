import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, ShieldCheck, User, UploadCloud, ArrowRight, BookOpen, AlertCircle, XCircle } from "lucide-react";
import api from "../services/api";
import CoApplicantForm from "../components/CoApplicantForm";
import DocumentUpload from "../components/DocumentUpload";

const Onboarding = () => {
  const [step, setStep] = useState(2);
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [fraudConsent, setFraudConsent] = useState(false);
  const [useOcr, setUseOcr] = useState(true);
  
  // KYC State
  const [panNumber, setPanNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycError, setKycError] = useState("");

  // Academic State
  const [currentSemesterMarks, setCurrentSemesterMarks] = useState("");
  const [academicLoading, setAcademicLoading] = useState(false);
  const [academicError, setAcademicError] = useState("");

  // Upload State
  const [uploadedAcademicDocs, setUploadedAcademicDocs] = useState([]);
  const [uploadedFinancialDocs, setUploadedFinancialDocs] = useState([]);
  const [financialError, setFinancialError] = useState("");

  const requiredAcademicDocs = ["10TH_MARKSHEET", "12TH_MARKSHEET", "ADMISSION_LETTER", "FEE_STRUCTURE"];
  const requiredFinancialDocs = ["STUDENT_STATEMENT", "CO_APPLICANT_STATEMENT"];

  // Check Profile Status on Mount
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const response = await api.get("/users/profile");
        const profile = response.data;
        setProfileData(profile);
        
        if (profile.kyc_status === "VERIFIED") {
          if (!profile.co_applicant) {
            setStep(3);
          } else {
            const academicDocs = profile.documents?.filter(d => d.category === "ACADEMIC").map(d => d.doc_type) || [];
            const financialDocs = profile.documents?.filter(d => d.category === "FINANCIAL").map(d => d.doc_type) || [];
            
            setUploadedAcademicDocs(academicDocs);
            setUploadedFinancialDocs(financialDocs);

            const hasAllAcademic = requiredAcademicDocs.every(doc => academicDocs.includes(doc));
            const hasAllFinancial = requiredFinancialDocs.every(doc => financialDocs.includes(doc));
            
            if (!hasAllAcademic) {
              setStep(4);
            } else if (!hasAllFinancial) {
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
    const missingDocs = requiredAcademicDocs.filter(doc => !uploadedAcademicDocs.includes(doc));
    if (missingDocs.length > 0) {
      const missingNames = missingDocs.map(d => d.replace(/_/g, ' ').toLowerCase());
      setAcademicError(`Please upload all required documents. Missing: ${missingNames.join(', ')}`);
      return;
    }
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

  const finishOnboarding = async () => {
    const missingDocs = requiredFinancialDocs.filter(doc => !uploadedFinancialDocs.includes(doc));
    if (missingDocs.length > 0) {
      const missingNames = missingDocs.map(d => d.replace(/_/g, ' ').toLowerCase());
      setFinancialError(`Please upload all required documents. Missing: ${missingNames.join(', ')}`);
      return;
    }
    setFinancialError("");
    
    // Fetch latest profile to show in confirmation step
    try {
      const response = await api.get("/users/profile");
      setProfileData(response.data);
      setStep(6);
    } catch (error) {
      console.error("Failed to load profile for confirmation");
      setStep(6);
    }
  };

  const confirmAndProceed = async () => {
    setStep(7);
    setIsAnalyzing(true);
    try {
      const response = await api.post("/users/run-analysis", { use_ocr: useOcr });
      setAnalysisResult(response.data);
    } catch (error) {
      console.error("Analysis failed:", error.message);
    } finally {
      setIsAnalyzing(false);
    }
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
          <div className="flex justify-between mt-2 text-[10px] sm:text-xs font-semibold text-gray-500">
            <span>Auth</span>
            <span>Identity</span>
            <span className="hidden sm:inline">Guarantor</span>
            <span className="sm:hidden">Gua</span>
            <span className="hidden sm:inline">Academic</span>
            <span className="sm:hidden">Acad</span>
            <span className="hidden sm:inline">Financials</span>
            <span className="sm:hidden">Fin</span>
            <span>Review</span>
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
            
            <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm font-bold text-blue-900 mb-3">Select Document Extraction Method:</p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="extractionMethodAcademic" 
                    checked={useOcr === true} 
                    onChange={() => setUseOcr(true)} 
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300" 
                  />
                  <span className="text-sm font-medium text-blue-800">OCR Extraction (Recommended)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="extractionMethodAcademic" 
                    checked={useOcr === false} 
                    onChange={() => setUseOcr(false)} 
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300" 
                  />
                  <span className="text-sm font-medium text-blue-800">Standard Text Extraction</span>
                </label>
              </div>
            </div>
            
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
                  title="10th Marksheet (Required)" 
                  description="Upload PDF or image" 
                  useOcr={useOcr}
                  onUploadSuccess={() => setUploadedAcademicDocs(prev => [...prev, "10TH_MARKSHEET"])}
                />
                <DocumentUpload 
                  category="ACADEMIC" 
                  docType="12TH_MARKSHEET" 
                  ownerType="STUDENT" 
                  title="12th Marksheet (Required)" 
                  description="Upload PDF or image" 
                  useOcr={useOcr}
                  onUploadSuccess={() => setUploadedAcademicDocs(prev => [...prev, "12TH_MARKSHEET"])}
                />
                <DocumentUpload 
                  category="ACADEMIC" 
                  docType="ADMISSION_LETTER" 
                  ownerType="STUDENT" 
                  title="Admission Letter (Required)" 
                  description="Upload your college admission letter" 
                  useOcr={useOcr}
                  onUploadSuccess={() => setUploadedAcademicDocs(prev => [...prev, "ADMISSION_LETTER"])}
                />
                <DocumentUpload 
                  category="ACADEMIC" 
                  docType="FEE_STRUCTURE" 
                  ownerType="STUDENT" 
                  title="Fee Structure (Year-wise) (Required)" 
                  description="Upload official fee structure" 
                  useOcr={useOcr}
                  onUploadSuccess={() => setUploadedAcademicDocs(prev => [...prev, "FEE_STRUCTURE"])}
                />
                <DocumentUpload 
                  category="ACADEMIC" 
                  docType="PROSPECTUS" 
                  ownerType="STUDENT" 
                  title="Prospectus/Course Details (Optional)" 
                  description="Upload the prospectus" 
                  useOcr={useOcr}
                  onUploadSuccess={() => setUploadedAcademicDocs(prev => [...prev, "PROSPECTUS"])}
                />
                <DocumentUpload 
                  category="ACADEMIC" 
                  docType="BONAFIDE_CERTIFICATE" 
                  ownerType="STUDENT" 
                  title="Bonafide Certificate (Optional)" 
                  description="Upload if available" 
                  useOcr={useOcr}
                  onUploadSuccess={() => setUploadedAcademicDocs(prev => [...prev, "BONAFIDE_CERTIFICATE"])}
                />
                <DocumentUpload 
                  category="ACADEMIC" 
                  docType="SCHOLARSHIP_LETTER" 
                  ownerType="STUDENT" 
                  title="Scholarship Letter (Optional)" 
                  description="Upload if applicable" 
                  useOcr={useOcr}
                  onUploadSuccess={() => setUploadedAcademicDocs(prev => [...prev, "SCHOLARSHIP_LETTER"])}
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
            
            <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm font-bold text-blue-900 mb-3">Select Document Extraction Method:</p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="extractionMethodFinancial" 
                    checked={useOcr === true} 
                    onChange={() => setUseOcr(true)} 
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300" 
                  />
                  <span className="text-sm font-medium text-blue-800">OCR Extraction (Recommended)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="extractionMethodFinancial" 
                    checked={useOcr === false} 
                    onChange={() => setUseOcr(false)} 
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300" 
                  />
                  <span className="text-sm font-medium text-blue-800">Standard Text Extraction</span>
                </label>
              </div>
            </div>

            {financialError && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded">{financialError}</div>}
            
            <div className="space-y-6">
              <DocumentUpload 
                category="FINANCIAL" 
                docType="STUDENT_STATEMENT" 
                ownerType="STUDENT" 
                title="Student Bank Statement (6 Months) (Required)" 
                description="Upload a PDF statement." 
                useOcr={useOcr}
                onUploadSuccess={() => setUploadedFinancialDocs(prev => [...prev, "STUDENT_STATEMENT"])}
              />
              <DocumentUpload 
                category="FINANCIAL" 
                docType="CO_APPLICANT_STATEMENT" 
                ownerType="CO_APPLICANT" 
                title="Guarantor Bank Statement (6 Months) (Required)" 
                description="Upload a PDF statement." 
                useOcr={useOcr}
                onUploadSuccess={() => setUploadedFinancialDocs(prev => [...prev, "CO_APPLICANT_STATEMENT"])}
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

        {/* Step 6: Review & Confirmation */}
        {step === 6 && profileData && (
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <div className="flex items-center mb-6">
              <ShieldCheck className="h-8 w-8 text-emerald-500 mr-3" />
              <h3 className="text-xl font-bold">Step 6: Final Review & Confirmation</h3>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800 font-medium">
                <strong>Important:</strong> These details and documents will be directly processed by our AI Risk Engine. Please ensure all uploaded documents are authentic, correct, and match the requirements to prevent fraud detection flags and application rejection.
              </p>
            </div>

            <div className="space-y-6">
              <div className="border border-gray-100 rounded-lg p-5 bg-gray-50">
                <h4 className="font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">Personal & KYC Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <p className="text-sm text-gray-600"><span className="font-bold text-gray-800">Name:</span> {profileData.full_name}</p>
                  <p className="text-sm text-gray-600 break-words"><span className="font-bold text-gray-800">Email:</span> {profileData.email}</p>
                  <p className="text-sm text-gray-600"><span className="font-bold text-gray-800">Phone:</span> {profileData.mobile_number}</p>
                  <p className="text-sm text-gray-600"><span className="font-bold text-gray-800">PAN:</span> {profileData.pan_number}</p>
                  <p className="text-sm text-gray-600"><span className="font-bold text-gray-800">Aadhaar:</span> {profileData.aadhaar_number}</p>
                  <p className="text-sm text-gray-600"><span className="font-bold text-gray-800">KYC Status:</span> <span className="text-green-600 font-bold">{profileData.kyc_status}</span></p>
                </div>
              </div>

              {profileData.co_applicant && (
                <div className="border border-gray-100 rounded-lg p-5 bg-gray-50">
                  <h4 className="font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">Guarantor Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <p className="text-sm text-gray-600"><span className="font-bold text-gray-800">Name:</span> {profileData.co_applicant.full_name}</p>
                    <p className="text-sm text-gray-600"><span className="font-bold text-gray-800">Relation:</span> {profileData.co_applicant.relationship}</p>
                    <p className="text-sm text-gray-600"><span className="font-bold text-gray-800">PAN:</span> {profileData.co_applicant.pan_number}</p>
                    <p className="text-sm text-gray-600"><span className="font-bold text-gray-800">Aadhaar:</span> {profileData.co_applicant.aadhaar_number}</p>
                    <p className="text-sm text-gray-600"><span className="font-bold text-gray-800">Income:</span> ₹{parseFloat(profileData.co_applicant.monthly_income).toLocaleString()}</p>
                  </div>
                </div>
              )}

              <div className="border border-gray-200/80 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white shadow-sm">
                <h4 className="font-bold text-gray-800 mb-4 border-b border-gray-200 pb-3 flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-2 text-emerald-500" /> Uploaded Documents Tracker
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profileData.documents?.map(doc => (
                    <div key={doc.doc_id} className="flex flex-col text-sm text-green-700 font-medium bg-green-50 p-3 rounded-lg border border-green-100 shadow-sm">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0 text-green-600" />
                        <span className="font-bold text-green-900">{doc.doc_type.replace(/_/g, ' ')}</span>
                      </div>
                      {doc.structured_details && Object.keys(doc.structured_details).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-green-200">
                          <div className="grid grid-cols-1 gap-1">
                            {Object.entries(doc.structured_details).map(([key, value]) => (
                              <div key={key} className="flex justify-between text-[11px]">
                                <span className="text-green-600 font-bold">{key}:</span>
                                <span className="text-green-900 font-medium">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {doc.extracted_text && !doc.structured_details && (
                        <div className="mt-2 pt-2 border-t border-green-200">
                          <p className="text-xs text-green-800 line-clamp-2 italic font-normal whitespace-pre-wrap">
                            "{doc.extracted_text.trim()}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  {(!profileData.documents || profileData.documents.length === 0) && (
                    <p className="text-sm text-gray-500 italic">No documents found.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start">
              <input 
                type="checkbox" 
                id="fraudConsent" 
                className="mt-1 mr-3 h-5 w-5 text-emerald-500 focus:ring-emerald-500 rounded border-gray-300" 
                required 
                checked={fraudConsent}
                onChange={(e) => setFraudConsent(e.target.checked)} 
              />
              <label htmlFor="fraudConsent" className="text-sm text-blue-900 font-medium cursor-pointer">
                I hereby declare that all the details furnished and documents uploaded are true and correct to the best of my knowledge. I understand that submitting fraudulent documents will lead to immediate rejection by the AI Risk Engine and potential action.
              </label>
            </div>

            <button
              onClick={confirmAndProceed}
              disabled={!fraudConsent}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl mt-6 flex items-center justify-center disabled:opacity-50 hover:bg-slate-800 transition-colors shadow-lg"
            >
              Confirm Accuracy & Access Dashboard <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 7: Finished */}
        {step === 7 && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center max-w-2xl mx-auto">
            {isAnalyzing ? (
              <>
                <div className="animate-spin h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-6"></div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Generating Profile Readiness Score...</h3>
                <p className="text-gray-600">Please wait while our system analyzes your uploaded documents for data accuracy.</p>
              </>
            ) : analysisResult ? (
              <div className="text-left">
                <div className="flex items-center justify-center mb-8">
                   <div className={`w-36 h-36 rounded-full border-8 flex items-center justify-center shadow-xl transition-all duration-700 ease-out transform hover:scale-105 relative ${analysisResult.score >= 70 ? 'border-emerald-400 bg-emerald-50' : analysisResult.score >= 40 ? 'border-amber-400 bg-amber-50' : 'border-rose-400 bg-rose-50'}`}>
                      <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${analysisResult.score >= 70 ? 'bg-emerald-400' : analysisResult.score >= 40 ? 'bg-amber-400' : 'bg-rose-400'}`}></div>
                      <div className="text-center relative z-10">
                        <span className={`text-4xl font-black block leading-none tracking-tight ${analysisResult.score >= 70 ? 'text-emerald-700' : analysisResult.score >= 40 ? 'text-amber-700' : 'text-rose-700'}`}>{Math.round(analysisResult.score)}</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2 block">Pre-Approval</span>
                      </div>
                   </div>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">Profile Readiness Analysis</h3>
                <p className="text-slate-700 bg-slate-50 p-4 rounded-xl italic border-l-4 border-emerald-500 mb-8 text-sm">
                  "{analysisResult.reasoning}"
                </p>                
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 rounded-xl border border-emerald-200/60 shadow-sm transition-all hover:shadow-md">
                    <h4 className="text-sm font-bold text-emerald-900 mb-4 flex items-center bg-white/60 w-fit px-3 py-1 rounded-full border border-emerald-100">
                      <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" /> Positive Indicators
                    </h4>
                    <ul className="space-y-3">
                      {analysisResult.highlights.pros.map((pro, idx) => (
                        <li key={idx} className="text-sm text-emerald-800 flex items-start font-medium leading-relaxed">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 mr-3 flex-shrink-0"></div> {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 p-5 rounded-xl border border-rose-200/60 shadow-sm transition-all hover:shadow-md">
                    <h4 className="text-sm font-bold text-rose-900 mb-4 flex items-center bg-white/60 w-fit px-3 py-1 rounded-full border border-rose-100">
                      <AlertCircle className="w-4 h-4 mr-2 text-rose-600" /> Action Recommended
                    </h4>
                    <ul className="space-y-3">
                      {analysisResult.highlights.cons.length > 0 ? (
                        analysisResult.highlights.cons.map((con, idx) => (
                          <li key={idx} className="text-sm text-rose-800 flex items-start font-medium leading-relaxed">
                             <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 mr-3 flex-shrink-0"></div> {con}
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-emerald-700 italic font-medium flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" /> No significant concerns detected.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/student-dashboard")}
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl flex items-center justify-center hover:bg-slate-800 transition-colors shadow-lg"
                >
                  Access My Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                </button>
              </div>
            ) : (
               <>
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-900 mb-2">Analysis Failed</h3>
                <p className="text-red-700 mb-6">We couldn't generate your risk score at this time. Our engine might be under high load.</p>
                <button onClick={() => navigate("/student-dashboard")} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold">Continue to Dashboard</button>
               </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Onboarding;
