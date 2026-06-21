import { History } from "lucide-react";

/**
 * Displays the student's recent repayment transactions.
 * Props:
 *  - payments: array of { date, amount } objects
 */
const RepaymentSchedule = ({ payments }) => (
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
);

export default RepaymentSchedule;
