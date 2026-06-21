import { Gift } from "lucide-react";

/**
 * Shows the referral / rewards widget on the student dashboard.
 * Kept deliberately simple — no props needed yet, but easy to wire up later.
 */
const DocumentVault = () => (
  <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 shadow-sm text-white">
    <div className="flex justify-between items-start mb-6">
      <div>
        <h3 className="font-bold mb-1">Rewards &amp; Referral</h3>
        <p className="text-indigo-200 text-xs">Invite friends, earn cashback.</p>
      </div>
      <Gift className="w-6 h-6 text-indigo-300" />
    </div>
    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
      <p className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider mb-1">
        Total Earned
      </p>
      <p className="text-2xl font-black">₹1,250</p>
    </div>
    <button className="w-full mt-4 bg-indigo-500 hover:bg-indigo-600 py-3 rounded-xl font-bold text-sm transition-colors">
      Share Link
    </button>
  </div>
);

export default DocumentVault;
