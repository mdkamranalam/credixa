import { useState, useEffect, useContext } from "react";
import {
  LogOut,
  Building,
  X,
  CheckCircle,
  XCircle,
  CreditCard,
  Landmark,
  ArrowRightLeft,
  FileText,
  User,
  Download,
  RefreshCw,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import ChecklistModal from "../components/dashboard/ChecklistModal.jsx";

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [globalTransactions, setGlobalTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [instDetails, setInstDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Loans Table Filters & Pagination
  const [loanSearch, setLoanSearch] = useState("");
  const [loanStatusFilter, setLoanStatusFilter] = useState("ALL");
  const [loanPage, setLoanPage] = useState(1);
  const LOANS_PER_PAGE = 5;

  // Transactions Table Filters & Pagination
  const [txnSearch, setTxnSearch] = useState("");
  const [txnTypeFilter, setTxnTypeFilter] = useState("ALL");
  const [txnPage, setTxnPage] = useState(1);
  const TXNS_PER_PAGE = 5;

  // Modal State
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  // Dossier State
  const [studentDossier, setStudentDossier] = useState(null);
  const [isDossierLoading, setIsDossierLoading] = useState(false);

  const fetchStudentDossier = async (userId) => {
    setIsDossierLoading(true);
    try {
      // Find the student ID from the API
      const res = await api.get(`/admin/students/${userId}`);
      setStudentDossier(res.data);
    } catch (err) {
      alert("Failed to load comprehensive student dossier");
    } finally {
      setIsDossierLoading(false);
    }
  };

  // Checklist State
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [checklistData, setChecklistData] = useState([]);

  const handleSaveChecklist = async () => {
    setIsProcessing(true);
    setActionError("");
    try {
      await api.put("/admin/checklist", checklistData);
      setIsChecklistModalOpen(false);
    } catch (err) {
      setActionError("Failed to save checklist to server.");
    } finally {
      setIsProcessing(false);
    }
  };

  // useEffect(() => {
  //   const fetchDashboardData = async () => {
  //     try {
  //       const [loansRes, profileRes, txnRes] = await Promise.all([
  //         api.get("/admin/loans"),
  //         api.get("/admin/institution-profile"),
  //         api.get("/admin/transactions"),
  //       ]);
  //       setLoans(loansRes.data);
  //       setInstDetails(profileRes.data);
  //       setGlobalTransactions(txnRes.data);

  //       try {
  //         const profileRes = await api.get("/admin/institution-profile");
  //         setInstDetails(profileRes.data);
  //       } catch (err) {
  //         console.warn(
  //           "Bank details could not be loaded, but loans will still show.",
  //         );
  //       }
  //     } catch (error) {
  //       console.error("Failed to fetch loans:", error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  //   fetchDashboardData();
  // }, []);

  const fetchDashboardData = async () => {
    try {
      const [loansRes, profileRes, txnRes] = await Promise.all([
        api.get("/admin/loans").catch((err) => {
          console.error("Loans failed", err);
          return { data: [] };
        }),
        api.get("/admin/institution-profile").catch((err) => {
          console.error("Profile failed", err);
          return { data: null };
        }),
        api.get("/admin/transactions").catch((err) => {
          console.error("Txns failed", err);
          return { data: [] };
        }),
      ]);
      setLoans(loansRes.data || []);
      setInstDetails(profileRes.data || null);
      setGlobalTransactions(txnRes.data || []);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Smart Polling: Poll every 30 seconds only if the tab is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchDashboardData();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
  };

  const handleLoanAction = async (status) => {
    setIsProcessing(true);
    setActionError("");

    try {
      await api.put(`/admin/loans/${selectedLoan.loan_id}/status`, {
        status,
        approved_amount: selectedLoan.requested_amount,
      });

      const [loansRes, txnRes] = await Promise.all([
        api.get("/admin/loans"),
        api.get("/admin/transactions"),
      ]);

      setLoans(loansRes.data);
      setGlobalTransactions(txnRes.data);
      setConfirmAction(null);
      setSelectedLoan(null);
    } catch (error) {
      setActionError(
        error.response?.data?.error || "Failed to update loan status.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // 1. Total Disbursed: Sum everything that moved past 'APPLIED'
  const totalDisbursed = loans
    .filter((l) => ["APPROVED", "ACTIVE", "CLOSED"].includes(l.status))
    .reduce((acc, curr) => acc + (parseFloat(curr.requested_amount) || 0), 0);

  // 2. Active Collections: Only count students currently in the repayment cycle
  const activeCollectionsCount = loans.filter(
    (l) => l.status === "APPROVED" || l.status === "ACTIVE",
  ).length;

  // 3. Dynamic Recovery Rate: Collected / Disbursed
  const totalPaidTxns = globalTransactions
    .filter((t) => t.txn_type === "REPAYMENT" && t.status === "SUCCESS")
    .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);

  const dynamicRecoveryRate =
    totalDisbursed > 0
      ? Math.min(100, (totalPaidTxns / totalDisbursed) * 100).toFixed(1)
      : "0.0";

  // Filter & Paginate Loans
  const filteredLoans = loans.filter((l) => {
    const matchesSearch = (l.full_name || "").toLowerCase().includes(loanSearch.toLowerCase()) || 
                          (l.college_roll_number || "").toLowerCase().includes(loanSearch.toLowerCase());
    const matchesStatus = loanStatusFilter === "ALL" || l.status === loanStatusFilter;
    return matchesSearch && matchesStatus;
  });
  const totalLoanPages = Math.ceil(filteredLoans.length / LOANS_PER_PAGE) || 1;
  const currentLoans = filteredLoans.slice((loanPage - 1) * LOANS_PER_PAGE, loanPage * LOANS_PER_PAGE);

  // Filter & Paginate Transactions
  const filteredTxns = globalTransactions.filter((t) => {
    const matchesSearch = (t.student_name || "").toLowerCase().includes(txnSearch.toLowerCase());
    const matchesType = txnTypeFilter === "ALL" || t.txn_type === txnTypeFilter;
    return matchesSearch && matchesType;
  });
  const totalTxnPages = Math.ceil(filteredTxns.length / TXNS_PER_PAGE) || 1;
  const currentTxns = filteredTxns.slice((txnPage - 1) * TXNS_PER_PAGE, txnPage * TXNS_PER_PAGE);

  const handleExportCSV = () => {
    if (filteredTxns.length === 0) return;
    
    const headers = ["Date", "Student Name", "Transaction Type", "Amount (INR)", "Status"];
    const rows = filteredTxns.map(txn => [
      new Date(txn.date).toLocaleDateString(),
      `"${txn.student_name || ''}"`,
      txn.txn_type,
      txn.amount,
      txn.status
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `credixa_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 relative pb-10">
      {/* Top Navigation */}
      <nav className="bg-gray-900 shadow-sm px-8 py-4 flex justify-between items-center text-white">
        <div className="flex items-center space-x-2">
          <img src="/credixa-favicon.png" alt="Credixa Logo" className="h-8 w-8 rounded-lg object-contain bg-white p-1" />
          <h1 className="text-xl font-bold">Credixa Admin Console</h1>
        </div>
        <div className="flex items-center space-x-6">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center text-sm font-bold bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} /> 
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </button>
          <span className="text-gray-300 text-sm border-l border-gray-700 pl-6 hidden md:block">
            Welcome, {user?.full_name}
          </span>
          <button
            onClick={logout}
            className="flex items-center text-gray-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-5 w-5 mr-1" /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
        {/* --- NEW: INSTITUTIONAL BANK DETAILS SECTION --- */}
        {instDetails && (
          <div className="bg-white rounded-xl shadow-sm border border-[#A7F3D0] p-6 mb-8 flex flex-col md:flex-row items-center justify-between border-l-4 border-l-emerald-500">
            <div className="flex items-center space-x-4">
              <div className="bg-[#F0FDF4] p-3 rounded-lg">
                <Landmark className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                  Disbursement Account
                </h3>
                <p className="text-xl font-black text-gray-900">
                  {instDetails.bank_name}
                </p>
                <p className="text-sm text-gray-500 font-medium">
                  Account: ****{instDetails.bank_account_number.slice(-4)} |
                  IFSC: {instDetails.ifsc_code}
                </p>
              </div>
            </div>
            <div className="mt-4 md:mt-0 px-6 py-2 bg-green-50 rounded-full border border-green-100 flex items-center">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-xs font-bold text-green-700 uppercase">
                Settlement Channel Active
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm font-bold text-gray-400 uppercase">
              Total Disbursed
            </p>
            <p className="text-2xl font-black text-gray-900">
              ₹{totalDisbursed.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm font-bold text-gray-400 uppercase">
              Active Collections
            </p>
            <p className="text-2xl font-black text-emerald-500">
              {activeCollectionsCount} Students
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm font-bold text-gray-400 uppercase">
              Recovery Rate
            </p>
            <p className="text-2xl font-black text-green-600">
              {dynamicRecoveryRate}%
            </p>
          </div>

        </div>

        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between space-y-4 md:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Student Loan Applications
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Review AI risk scores and manage BNPL disbursements.
            </p>
          </div>
          <div className="flex space-x-3">
            <input
              type="text"
              placeholder="Search by name or roll..."
              value={loanSearch}
              onChange={(e) => { setLoanSearch(e.target.value); setLoanPage(1); }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
            <select
              value={loanStatusFilter}
              onChange={(e) => { setLoanStatusFilter(e.target.value); setLoanPage(1); }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPLIED">Applied</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="ACTIVE">Active</option>
              <option value="REJECTED">Rejected</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center text-gray-500">
              Loading applications...
            </div>
          ) : loans.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              No loan applications found yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    AI OmniScore
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Repayment Progress
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentLoans.map((loan) => (
                  <tr
                    key={loan.loan_id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {loan.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Roll: {loan.college_roll_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹
                      {parseFloat(loan.requested_amount).toLocaleString(
                        "en-IN",
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-bold">
                        {loan.omniscore || "Pending AI"}
                      </div>
                      <span
                        className={`text-xs font-medium ${loan.risk_tier === "LOW_RISK" ? "text-green-600" : loan.risk_tier === "MEDIUM_RISK" ? "text-yellow-600" : "text-red-600"}`}
                      >
                        {loan.risk_tier || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${loan.status === "APPROVED" ? "bg-green-100 text-green-800" : loan.status === "REJECTED" ? "bg-red-100 text-red-800" : "bg-[#D1FAE5] text-slate-800"}`}
                      >
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex space-x-2 items-center justify-end">
                      <button
                        onClick={() => fetchStudentDossier(loan.user_id)}
                        disabled={isDossierLoading}
                        className="text-indigo-600 hover:text-indigo-900 font-bold bg-indigo-50 px-3 py-1 rounded-md transition-colors"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => setSelectedLoan(loan)}
                        className="text-emerald-500 hover:text-slate-900 font-bold bg-[#F0FDF4] px-3 py-1 rounded-md"
                      >
                        Review
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${(parseInt(loan.installments_paid || 0) / (parseInt(loan.total_installments) || 12)) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 mt-1">
                          {loan.installments_paid || 0} /{" "}
                          {loan.total_installments || 12} Paid
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
          
          {/* Loans Pagination */}
          {!isLoading && filteredLoans.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <span className="text-sm text-gray-700">
                Showing <span className="font-bold">{((loanPage - 1) * LOANS_PER_PAGE) + 1}</span> to <span className="font-bold">{Math.min(loanPage * LOANS_PER_PAGE, filteredLoans.length)}</span> of <span className="font-bold">{filteredLoans.length}</span> entries
              </span>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setLoanPage(p => Math.max(1, p - 1))}
                  disabled={loanPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button 
                  onClick={() => setLoanPage(p => Math.min(totalLoanPages, p + 1))}
                  disabled={loanPage === totalLoanPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <ArrowRightLeft className="mr-2 h-5 w-5 text-emerald-500" />
            Recent Repayments & Disbursements
          </h3>
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="Search student..."
              value={txnSearch}
              onChange={(e) => { setTxnSearch(e.target.value); setTxnPage(1); }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
            <select
              value={txnTypeFilter}
              onChange={(e) => { setTxnTypeFilter(e.target.value); setTxnPage(1); }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
            >
              <option value="ALL">All Types</option>
              <option value="DISBURSAL">Disbursal</option>
              <option value="REPAYMENT">Repayment</option>
            </select>
            <button
              onClick={handleExportCSV}
              disabled={filteredTxns.length === 0}
              className="text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-1.5 rounded-lg font-bold flex items-center transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-2 text-gray-500" /> Export CSV
            </button>
            <button
              onClick={async () => {
                setIsChecklistModalOpen(true);
                try {
                  const res = await api.get("/admin/checklist");
                  setChecklistData(res.data);
                } catch (e) {
                  setActionError("Could not load checklist data.");
                }
              }}
              className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg font-bold flex items-center transition-colors"
            >
              Manage Checklist
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold">
            <tr>
              <th className="px-6 py-3 text-left">Date</th>
              <th className="px-6 py-3 text-left">Student</th>
              <th className="px-6 py-3 text-left">Type</th>
              <th className="px-6 py-3 text-left">Amount</th>
              <th className="px-6 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentTxns.length === 0 ? (
               <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No transactions found matching your criteria.</td></tr>
            ) : currentTxns.map((txn) => (
              <tr key={txn.id} className="text-sm">
                <td className="px-6 py-4">
                  {new Date(txn.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  {txn.student_name}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${txn.txn_type === "REPAYMENT"
                      ? "bg-[#D1FAE5] text-slate-800"
                      : "bg-purple-100 text-purple-700"
                      }`}
                  >
                    {txn.txn_type}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-gray-900">
                  ₹{parseFloat(txn.amount).toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-green-600 font-bold text-xs">
                    ● {txn.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        
        {/* Transactions Pagination */}
        {filteredTxns.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <span className="text-sm text-gray-700">
              Showing <span className="font-bold">{((txnPage - 1) * TXNS_PER_PAGE) + 1}</span> to <span className="font-bold">{Math.min(txnPage * TXNS_PER_PAGE, filteredTxns.length)}</span> of <span className="font-bold">{filteredTxns.length}</span> entries
            </span>
            <div className="flex space-x-2">
              <button 
                onClick={() => setTxnPage(p => Math.max(1, p - 1))}
                disabled={txnPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button 
                onClick={() => setTxnPage(p => Math.min(totalTxnPages, p + 1))}
                disabled={txnPage === totalTxnPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- NEW CHECKLIST MODAL --- */}
      <ChecklistModal
        isOpen={isChecklistModalOpen}
        onClose={() => setIsChecklistModalOpen(false)}
        checklistData={checklistData}
        setChecklistData={setChecklistData}
        onSave={handleSaveChecklist}
        isProcessing={isProcessing}
        actionError={actionError}
      />

      {/* --- DOSSIER VIEWER MODAL --- */}
      {studentDossier && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-gray-900 to-indigo-900 px-6 py-5 border-b flex justify-between items-center text-white">
              <div>
                <h3 className="text-xl font-bold flex items-center">
                  <User className="mr-2 h-6 w-6 text-indigo-400" />
                  {studentDossier.user.full_name}
                </h3>
                <p className="text-indigo-200 text-sm mt-1">Roll Number: {studentDossier.user.college_roll_number}</p>
              </div>
              <button
                onClick={() => setStudentDossier(null)}
                className="text-gray-400 hover:text-white transition-colors bg-white/10 p-2 rounded-full"
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
                    <p><span className="text-gray-500 w-24 inline-block">Email:</span> <span className="font-medium text-gray-900">{studentDossier.user.email}</span></p>
                    <p><span className="text-gray-500 w-24 inline-block">Mobile:</span> <span className="font-medium text-gray-900">{studentDossier.user.mobile_number}</span></p>
                    <p><span className="text-gray-500 w-24 inline-block">PAN:</span> <span className="font-medium text-gray-900">{studentDossier.user.pan_number || 'N/A'}</span></p>
                    <p><span className="text-gray-500 w-24 inline-block">Status:</span> <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800">{studentDossier.user.kyc_status}</span></p>
                  </div>
                </div>

                {/* CoApplicant Info */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <h4 className="font-bold text-gray-800 border-b pb-2 mb-4">Co-Applicant Profile</h4>
                  {studentDossier.co_applicant ? (
                    <div className="space-y-3 text-sm">
                      <p><span className="text-gray-500 w-24 inline-block">Name:</span> <span className="font-medium text-gray-900">{studentDossier.co_applicant.full_name}</span></p>
                      <p><span className="text-gray-500 w-24 inline-block">Relation:</span> <span className="font-medium text-gray-900">{studentDossier.co_applicant.relationship}</span></p>
                      <p><span className="text-gray-500 w-24 inline-block">PAN:</span> <span className="font-medium text-gray-900">{studentDossier.co_applicant.pan_number}</span></p>
                      <p><span className="text-gray-500 w-24 inline-block">Income (₹):</span> <span className="font-medium text-gray-900">{parseFloat(studentDossier.co_applicant.monthly_income).toLocaleString()}</span></p>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic">No co-applicant provided.</p>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <h4 className="font-bold text-gray-800 border-b pb-2 mb-4">Verification Documents</h4>
                {studentDossier.documents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {studentDossier.documents.map(doc => (
                      <a
                        key={doc.doc_id}
                        href={'http://localhost:3000/' + doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block p-4 border rounded-xl bg-white hover:border-indigo-300 hover:shadow-md transition-all group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <FileText className="h-6 w-6 text-indigo-500 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">{doc.category}</span>
                        </div>
                        <p className="font-medium text-sm text-gray-900 truncate mt-2">{doc.doc_type}</p>
                        <p className="text-xs text-green-600 font-bold mt-1 flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" /> Profile Attached
                        </p>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-white rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500">No documents found for this profile.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- APPROVAL MODAL --- */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full flex flex-col max-h-[90vh]">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900">
                Review Application
              </h3>
              <button
                onClick={() => { setSelectedLoan(null); setConfirmAction(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {actionError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
                  {actionError}
                </div>
              )}

              <div className="bg-[#F0FDF4] p-4 rounded-lg border border-[#A7F3D0]">
                <p className="text-sm text-slate-800 font-medium">
                  Requested Amount
                </p>
                <p className="text-3xl font-extrabold text-slate-900">
                  ₹
                  {parseFloat(selectedLoan.requested_amount).toLocaleString(
                    "en-IN",
                  )}
                </p>
              </div>

              {/* NEW: DISBURSEMENT FLOW PREVIEW */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                <div className="text-center flex-1">
                  <p className="text-[10px] uppercase font-bold text-gray-400">
                    LSP Pool
                  </p>
                  <CreditCard className="h-5 w-5 mx-auto text-gray-600" />
                </div>
                <ArrowRightLeft className="h-4 w-4 text-emerald-500 animate-pulse" />
                <div className="text-center flex-1">
                  <p className="text-[10px] uppercase font-bold text-gray-400">
                    Inst. Account
                  </p>
                  <Landmark className="h-5 w-5 mx-auto text-emerald-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Student Name
                  </p>
                  <p className="font-medium text-gray-900">
                    {selectedLoan.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Roll Number
                  </p>
                  <p className="font-medium text-gray-900">
                    {selectedLoan.college_roll_number}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  AI Risk Assessment
                </p>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedLoan.omniscore || "N/A"}{" "}
                    <span className="text-sm font-normal text-gray-500">
                      / 900
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${selectedLoan.risk_tier === "LOW_RISK" ? "bg-green-100 text-green-800" : selectedLoan.risk_tier === "MEDIUM_RISK" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}
                  >
                    {selectedLoan.risk_tier || "Pending"}
                  </span>
                </div>
                     {selectedLoan.analysis_reasoning && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm">
                    <p className="text-gray-800 italic mb-3">"{selectedLoan.analysis_reasoning}"</p>
                    
                    {(() => {
                      try {
                        const highlights = typeof selectedLoan.analysis_highlights === 'string' 
                          ? JSON.parse(selectedLoan.analysis_highlights) 
                          : selectedLoan.analysis_highlights;
                          
                        if (!highlights) return null;
                        
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            {highlights.pros && highlights.pros.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-green-700 mb-1 flex items-center">
                                  <CheckCircle className="w-3 h-3 mr-1" /> Positive Indicators
                                </p>
                                <ul className="list-disc pl-4 space-y-1">
                                  {highlights.pros.map((pro, i) => (
                                    <li key={i} className="text-xs text-green-600">{pro}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {highlights.cons && highlights.cons.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-red-700 mb-1 flex items-center">
                                  <XCircle className="w-3 h-3 mr-1" /> Risk Factors
                                </p>
                                <ul className="list-disc pl-4 space-y-1">
                                  {highlights.cons.map((con, i) => (
                                    <li key={i} className="text-xs text-red-600">{con}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      } catch (e) {
                        return null;
                      }
                    })()}
                  </div>
                )}
              </div>
            </div>

            {confirmAction ? (
              <div className="bg-orange-50 px-6 py-4 border-t border-orange-200 flex-shrink-0">
                <p className="text-sm font-bold text-orange-800 mb-4 text-center">
                  {confirmAction === "APPROVED" 
                    ? `Are you sure you want to approve this application and disburse ₹${parseFloat(selectedLoan.requested_amount).toLocaleString("en-IN")}?` 
                    : "Are you sure you want to reject this application? This action cannot be undone."}
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setConfirmAction(null)}
                    disabled={isProcessing}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleLoanAction(confirmAction)}
                    disabled={isProcessing}
                    className={`flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white disabled:opacity-50 ${confirmAction === "APPROVED" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                  >
                    {isProcessing ? "Processing..." : confirmAction === "APPROVED" ? "Yes, Disburse Funds" : "Yes, Reject"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex space-x-3 flex-shrink-0">
                <button
                  onClick={() => setConfirmAction("REJECTED")}
                  disabled={isProcessing}
                  className="flex-1 flex justify-center items-center py-2 px-4 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4 mr-2" /> Reject
                </button>
                <button
                  onClick={() => setConfirmAction("APPROVED")}
                  disabled={isProcessing}
                  className="flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Approve & Disburse
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
