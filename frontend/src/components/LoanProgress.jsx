import React, { useState, useEffect } from "react";
import api from "../services/api";

const LoanProgress = ({ loanData }) => {

  if (!loanData) return <p>Loading your loan status...</p>;
  if (loanData.message === "No active loan found.")
    return <p>No active loans. Apply now!</p>;

  const status = loanData.status || loanData.loan_status || "PENDING";
  const monthsPaid = parseInt(loanData.months_paid) || 0;
  const totalMonths = parseInt(loanData.total_months) || parseInt(loanData.tenure_months) || 12;
  const remainingBalance = parseFloat(loanData.remaining_balance) || 0;

  // Calculate progress percentage
  const progress = totalMonths > 0 ? (monthsPaid / totalMonths) * 100 : 0;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Loan Progress</h2>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
        <div
          className="bg-emerald-500 h-4 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        {monthsPaid} of {totalMonths} installments paid (
        {Math.round(progress)}%)
      </p>

      {/* Financial Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-[#F0FDF4] rounded">
          <p className="text-xs text-emerald-500 uppercase font-bold">
            Remaining Balance
          </p>
          <p className="text-2xl font-bold">
            ₹{remainingBalance.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded">
          <p className="text-xs text-green-600 uppercase font-bold">Status</p>
          <p className="text-2xl font-bold">{status.replace("_", " ")}</p>
        </div>
      </div>

      {/* Show 'Apply' button only if loan is CLOSED */}
      {status === "CLOSED" && (
        <button className="mt-6 w-full py-3 bg-green-600 text-white rounded font-bold">
          Apply for Next Semester
        </button>
      )}
    </div>
  );
};

export default LoanProgress;
