import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  FileText,
  GraduationCap,
  UserPlus,
  TrendingUp,
  AlertCircle,
  FileBadge2,
  Globe2,
  Landmark,
  Home,
  Loader2
} from "lucide-react";
import api from "../services/api";

const IconMap = {
  UserPlus: <UserPlus className="h-6 w-6 text-indigo-600" />,
  GraduationCap: <GraduationCap className="h-6 w-6 text-blue-600" />,
  FileBadge2: <FileBadge2 className="h-6 w-6 text-emerald-600" />,
  Home: <Home className="h-6 w-6 text-amber-600" />,
  Landmark: <Landmark className="h-6 w-6 text-purple-600" />
};

const LoanChecklist = () => {
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchChecklist = async () => {
      try {
        const response = await api.get('/admin/checklist');
        setSections(response.data);
      } catch (err) {
        console.error("Failed to load checklist:", err);
        setError("Could not load the document checklist at this time.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchChecklist();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading document checklist...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-600 text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 flex items-center justify-center gap-3">
            <FileText className="h-10 w-10 text-blue-600" />
            Education Loan Document Checklist
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            To get an education loan in India, banks usually ask for documents from three sides: Student, Co-applicant, and Institution.
          </p>
        </div>

        {/* Minimum Required Quick Checklist Alert */}
        <div className="bg-blue-600 rounded-2xl shadow-xl overflow-hidden mb-12 transform transition-all hover:scale-[1.01]">
          <div className="px-6 py-8 sm:p-10">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
              <CheckCircle className="h-7 w-7 text-green-300" />
              Quick Checklist (Minimum Required to Start)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[
                "Admission letter",
                "Academic mark sheets",
                "Aadhaar + PAN (student & parent)",
                "Income proof of parent",
                "Fee structure",
                "Passport (for abroad)"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center text-blue-100 bg-blue-700/50 rounded-lg p-4 font-medium">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-400 text-blue-900 flex items-center justify-center text-sm font-bold mr-3">
                    ✓
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Government Schemes / Special Case */}
        <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-lg shadow-sm mb-12">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-orange-500" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-bold text-orange-800">⭐ Special Case: Government Schemes</h3>
              <div className="mt-2 text-orange-700">
                <p className="mb-2">If applying under schemes like <strong>Vidya Lakshmi Portal</strong>, <strong>PM-Vidyalaxmi Scheme</strong>, or State education loan schemes, additional documents may include:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 font-medium">
                  <li>Income certificate</li>
                  <li>Caste certificate (if applicable)</li>
                  <li>Domicile certificate</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Sections Grid */}
        <div className="space-y-8">
          {sections.map((section, idx) => (
            <div key={idx} className={`bg-white rounded-2xl shadow-sm border overflow-hidden`}>
              {/* Section Header */}
              <div className={`px-6 py-5 border-b flex items-center gap-4 ${section.color}`}>
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  {IconMap[section.icon] || <FileText className="h-6 w-6 text-gray-400" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                  <p className="text-sm text-gray-600 mt-1 font-medium">{section.description}</p>
                </div>
              </div>

              {/* Section Body */}
              <div className="p-6">
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <CheckCircle className={`h-5 w-5 ${item.required ? 'text-green-500' : 'text-gray-400'}`} />
                      </div>
                      <div className="ml-3">
                        <p className="text-gray-900 font-medium">{item.name}</p>
                        {item.note && (
                          <p className="text-sm text-gray-500 italic">{item.note}</p>
                        )}
                        {!item.required && !item.note && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                            Optional
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Conditional Foreign Education Needs */}
                {section.foreignNote && (
                  <div className="mt-6 bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                    <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-3">
                      <Globe2 className="h-5 w-5 text-blue-600" />
                      {section.foreignNote.title}
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {section.foreignNote.items.map((noteItem, nIdx) => (
                        <li key={nIdx} className="flex items-center text-sm text-gray-700">
                          <span className="text-blue-500 mr-2">•</span> {noteItem}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Conditional Income Proof Layout for Co-Applicant */}
                {section.incomeProof && (
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <h4 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-gray-400" />
                      {section.incomeProof.title}
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-xl p-5">
                        <h5 className="font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">If Salaried</h5>
                        <ul className="space-y-2">
                          {section.incomeProof.salaried.map((sItem, sIdx) => (
                            <li key={sIdx} className="flex items-start text-sm text-gray-700">
                              <CheckCircle className="h-4 w-4 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" />
                              {sItem}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-5">
                        <h5 className="font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">If Self-Employed / Business Owner</h5>
                        <ul className="space-y-2">
                          {section.incomeProof.selfEmployed.map((seItem, seIdx) => (
                            <li key={seIdx} className="flex items-start text-sm text-gray-700">
                              <CheckCircle className="h-4 w-4 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" />
                              {seItem}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoanChecklist;
