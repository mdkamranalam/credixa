import React from "react";
import { User, X } from "lucide-react";

const ProfileModal = ({ profile, onClose }) => {
  if (!profile) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-4 sm:px-8 py-4 sm:py-6 border-b flex justify-between items-center bg-white">
          <h3 className="text-2xl font-black text-slate-900 flex items-center">
            <User className="mr-3 h-7 w-7 text-emerald-500" />
            Digital Profile
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 sm:p-8 flex-1 overflow-y-auto bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h4 className="font-black text-slate-900 mb-4 tracking-tight">
                Identity Details
              </h4>
              <div className="space-y-4 text-sm">
                <p className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500 font-medium">Name:</span>{" "}
                  <span className="font-bold text-slate-900">
                    {profile.full_name}
                  </span>
                </p>
                <p className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500 font-medium">Email:</span>{" "}
                  <span className="font-bold text-slate-900">
                    {profile.email}
                  </span>
                </p>
                <p className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500 font-medium">Mobile:</span>{" "}
                  <span className="font-bold text-slate-900">
                    {profile.mobile_number}
                  </span>
                </p>
                <p className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500 font-medium">PAN:</span>{" "}
                  <span className="font-bold text-slate-900">
                    {profile.pan_number || "N/A"}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-500 font-medium">Status:</span>{" "}
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md">
                    {profile.kyc_status}
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h4 className="font-black text-slate-900 mb-4 tracking-tight">
                Permanent Co-Applicant
              </h4>
              {profile.co_applicant ? (
                <div className="space-y-4 text-sm">
                  <p className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-500 font-medium">Name:</span>{" "}
                    <span className="font-bold text-slate-900">
                      {profile.co_applicant.full_name}
                    </span>
                  </p>
                  <p className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-500 font-medium">
                      Relation:
                    </span>{" "}
                    <span className="font-bold text-slate-900">
                      {profile.co_applicant.relationship}
                    </span>
                  </p>
                  <p className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-500 font-medium">PAN:</span>{" "}
                    <span className="font-bold text-slate-900">
                      {profile.co_applicant.pan_number}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500 font-medium">Income:</span>{" "}
                    <span className="font-bold text-slate-900">
                      ₹{parseFloat(
                        profile.co_applicant.monthly_income
                      ).toLocaleString()}
                    </span>
                  </p>
                </div>
              ) : (
                <p className="text-slate-500 text-sm italic">
                  No co-applicant registered.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
