import { CheckCircle, Clock, XCircle, Zap } from "lucide-react";
import LoanProgress from "../LoanProgress.jsx";

/**
 * Renders the correct view for an active/pending/rejected/closed loan.
 * Props:
 *  - activeLoan: loan object
 *  - onStartNew: callback to reset state so user can apply again
 *  - onPayEMI: callback to pay the next EMI
 *  - isPaying: boolean loading state
 *  - calculateEMI: (principal, rate, months) => number
 */
const LoanStatusCard = ({
  activeLoan,
  onStartNew,
  onPayEMI,
  isPaying,
  calculateEMI,
}) => {
  if (!activeLoan) return null;

  const STATUSES = ["APPROVED", "ACTIVE", "CLOSED", "APPLIED", "UNDER_REVIEW", "REJECTED"];
  if (!STATUSES.includes(activeLoan.status)) return null;

  return (
    <div className="bg-white rounded-[20px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
      {activeLoan.status === "CLOSED" ? (
        <div className="p-10 text-center">
          <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-emerald-900">Loan Fully Repaid!</h2>
          <p className="text-emerald-700 mb-6">
            Congratulations! You have successfully cleared all dues. Your credit score has been positively updated.
          </p>
          <button
            onClick={onStartNew}
            className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-colors"
          >
            Apply for Next Semester
          </button>
        </div>
      ) : ["APPLIED", "UNDER_REVIEW"].includes(activeLoan.status) ? (
        <div className="p-10 text-center">
          <div className="inline-block p-4 bg-yellow-50 rounded-full mb-4">
            <Clock className="h-10 w-10 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Application Under Review</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Our AI Engine and your Institution Admin are reviewing your profile. You'll be notified shortly.
          </p>
          <div className="flex justify-center gap-4">
            <div className="bg-slate-50 px-6 py-4 rounded-xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase">Requested</p>
              <p className="text-lg font-black text-slate-800">
                ₹{parseFloat(activeLoan.requested_amount).toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-50 px-6 py-4 rounded-xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase">Status</p>
              <p className="text-lg font-black text-yellow-600">
                {activeLoan.status.replace("_", " ")}
              </p>
            </div>
          </div>
        </div>
      ) : activeLoan.status === "REJECTED" ? (
        <div className="p-10 text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-900">Application Not Approved</h2>
          <p className="text-slate-500 mb-6">
            Based on the recent risk profile assessment, this application was declined.
          </p>
          <button
            onClick={onStartNew}
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800"
          >
            Start New Application
          </button>
        </div>
      ) : (
        <>
          <LoanProgress loanData={activeLoan} />
          <div className="p-8 bg-slate-50 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 mb-4">Active Loan Details</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-400 font-bold uppercase">Principal</p>
                <p className="text-lg font-black text-slate-800">
                  ₹{(activeLoan.approved_amount || activeLoan.requested_amount).toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-400 font-bold uppercase">Rate</p>
                <p className="text-lg font-black text-slate-800">{activeLoan.interest_rate}%</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
                <p className="text-xs text-slate-400 font-bold uppercase">Monthly EMI</p>
                <p className="text-lg font-black text-emerald-600">
                  ₹{calculateEMI(
                    activeLoan.approved_amount || activeLoan.requested_amount,
                    activeLoan.interest_rate,
                    activeLoan.tenure_months
                  ).toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={onPayEMI}
              disabled={isPaying}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-800 transition-colors flex justify-center items-center disabled:opacity-50"
            >
              {isPaying ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              ) : (
                <Zap className="h-5 w-5 mr-2" />
              )}
              {isPaying ? "Processing..." : "Pay Next EMI Now"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default LoanStatusCard;
