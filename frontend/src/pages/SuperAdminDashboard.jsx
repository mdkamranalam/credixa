import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  Shield,
  Activity,
  TrendingUp,
  Users,
  Building2,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  LogOut,
  Cpu,
  FileText,
  Sliders,
  ChevronRight,
  Clock,
  RefreshCw,
  Lock,
  Unlock,
  Settings,
  Plus,
  AlertCircle
} from "lucide-react";

const SuperAdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("OVERVIEW");
  const [loading, setLoading] = useState(true);

  // Data States
  const [kpis, setKpis] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [settings, setSettings] = useState(null);
  const [userDirectory, setUserDirectory] = useState([]);

  // Filters & Search
  const [loanFilter, setLoanFilter] = useState("ALL"); // ALL, HIGH_RISK, FRAUD
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [overrideStatus, setOverrideStatus] = useState("");
  const [overrideAmount, setOverrideAmount] = useState("");
  const [overrideNotes, setOverrideNotes] = useState("");

  // AI Health Check State
  const [aiHealth, setAiHealth] = useState({ status: "Checking...", models_ready: false });

  // Onboard Institution Modal State
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [newInstForm, setNewInstForm] = useState({
    name: "",
    code: "",
    contact_email: "",
    password: "",
    address: "",
    bank_name: "State Bank of India",
    bank_account_number: "",
    ifsc_code: "SBIN0000001"
  });

  const handleCreateInstitution = async (e) => {
    e.preventDefault();
    if (!newInstForm.name || !newInstForm.code || !newInstForm.contact_email || !newInstForm.password) {
      toast.error("Please fill in all required institution fields.");
      return;
    }
    try {
      await api.post("/superadmin/institutions", newInstForm);
      toast.success("New institution onboarded successfully!");
      setShowOnboardModal(false);
      setNewInstForm({
        name: "",
        code: "",
        contact_email: "",
        password: "",
        address: "",
        bank_name: "State Bank of India",
        bank_account_number: "",
        ifsc_code: "SBIN0000001"
      });
      fetchInstitutions();
      fetchOverview();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to onboard institution.");
    }
  };

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await api.get("/superadmin/analytics");
      setKpis(res.data.kpis);
      setLeaderboard(res.data.leaderboard || []);
    } catch (err) {
      toast.error("Failed to load global analytics.");
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const res = await api.get("/superadmin/institutions");
      setInstitutions(res.data.institutions || []);
    } catch (err) {
      toast.error("Failed to load partner institutions.");
    }
  };

  const fetchLoans = async (filterType = loanFilter) => {
    try {
      let query = `/superadmin/loans?search=${encodeURIComponent(searchQuery)}`;
      if (filterType === "FRAUD") {
        query += `&fraud_only=true`;
      } else if (filterType !== "ALL") {
        query += `&status=${filterType}`;
      }
      const res = await api.get(query);
      setLoans(res.data.loans || []);
    } catch (err) {
      toast.error("Failed to fetch loans.");
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get("/superadmin/audit-logs?limit=60");
      setAuditLogs(res.data.logs || []);
    } catch (err) {
      toast.error("Failed to load audit trail.");
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get("/superadmin/settings");
      setSettings(res.data.settings?.risk_engine_thresholds || {
        low_risk_min: 700,
        medium_risk_min: 500,
        default_interest_rate: 12.5,
        late_fee_flat: 500
      });
    } catch (err) {
      toast.error("Failed to load platform settings.");
    }
  };

  const fetchUserDirectory = async () => {
    try {
      const res = await api.get(`/superadmin/users?search=${encodeURIComponent(searchQuery)}`);
      setUserDirectory(res.data.users || []);
    } catch (err) {
      toast.error("Failed to load users directory.");
    }
  };

  const checkAiHealth = async () => {
    try {
      const res = await api.get("/health");
      setAiHealth({ status: "Risk Engine Connected", models_ready: true });
    } catch (err) {
      setAiHealth({ status: "Risk Engine Standby", models_ready: false });
    }
  };

  useEffect(() => {
    fetchOverview();
    checkAiHealth();
  }, []);

  useEffect(() => {
    if (activeTab === "INSTITUTIONS") fetchInstitutions();
    if (activeTab === "UNDERWRITING") fetchLoans();
    if (activeTab === "AUDIT_LOGS") fetchAuditLogs();
    if (activeTab === "AI_ENGINE") fetchSettings();
    if (activeTab === "USERS") fetchUserDirectory();
  }, [activeTab]);

  const toggleInstStatus = async (instId, currentStatus) => {
    try {
      const res = await api.put(`/superadmin/institutions/${instId}/status`, {
        is_active: !currentStatus
      });
      toast.success(res.data.message || "Institution status updated.");
      fetchInstitutions();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update institution status.");
    }
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLoan) return;

    try {
      await api.put(`/superadmin/loans/${selectedLoan.loan_id}/override`, {
        status: overrideStatus || selectedLoan.status,
        approved_amount: overrideAmount ? parseFloat(overrideAmount) : selectedLoan.approved_amount,
        admin_notes: overrideNotes
      });
      toast.success("Loan decision successfully overridden!");
      setSelectedLoan(null);
      fetchLoans();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to override loan decision.");
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.put("/superadmin/settings", {
        setting_key: "risk_engine_thresholds",
        setting_value: settings,
        description: "Updated by Superadmin via Command Center"
      });
      toast.success("Platform settings calibrated successfully!");
    } catch (err) {
      toast.error("Failed to save settings.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Shield className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent">
              CREDIXA HQ COMMAND CENTER
            </h1>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Global Ecosystem Governance & AI Risk Matrix
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Universal Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchLoans()}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/60 transition"
            />
          </div>

          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
            <Cpu className={`w-3.5 h-3.5 ${aiHealth.models_ready ? "text-emerald-400" : "text-amber-400"}`} />
            <span>AI Status: <strong className={aiHealth.models_ready ? "text-emerald-400" : "text-amber-400"}>{aiHealth.status}</strong></span>
          </div>

          <button
            onClick={logout}
            className="flex items-center space-x-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>HQ Logout</span>
          </button>
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <nav className="border-b border-slate-800 bg-slate-900/40 px-6 flex space-x-1 overflow-x-auto">
        {[
          { id: "OVERVIEW", label: "Ecosystem Analytics", icon: Activity },
          { id: "INSTITUTIONS", label: "Partner Institutions", icon: Building2 },
          { id: "UNDERWRITING", label: "Central Underwriting & Vault", icon: Sliders },
          { id: "AI_ENGINE", label: "AI Engine & Calibration", icon: Cpu },
          { id: "AUDIT_LOGS", label: "Platform Audit Trail", icon: FileText },
          { id: "USERS", label: "Universal User Directory", icon: Users }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-3.5 px-4 text-xs font-semibold tracking-wide border-b-2 transition ${
                isActive
                  ? "border-emerald-400 text-emerald-400 bg-emerald-500/5"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Tab Content */}
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {loading && activeTab === "OVERVIEW" ? (
          <div className="flex items-center justify-center h-64 text-slate-400 gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
            <span>Loading central ecosystem metrics...</span>
          </div>
        ) : (
          <>
            {/* TAB 1: OVERVIEW */}
            {activeTab === "OVERVIEW" && kpis && (
              <div className="space-y-6">
                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition"></div>
                    <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                      <span>Total Disbursed Volume</span>
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-bold text-slate-100">
                      ₹{kpis.totalDisbursed.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="mt-2 flex items-center text-xs text-emerald-400 font-medium">
                      <TrendingUp className="w-3.5 h-3.5 mr-1" />
                      <span>{kpis.totalLoans} active / paid loans</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition"></div>
                    <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                      <span>Repayment Recovery Rate</span>
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-2xl font-bold text-cyan-300">
                      {kpis.recoveryRate}%
                    </div>
                    <div className="mt-2 text-xs text-slate-400 font-medium">
                      System-wide EMI recovery
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition"></div>
                    <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                      <span>Non-Performing Assets (NPA)</span>
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="text-2xl font-bold text-red-400">
                      {kpis.npaRatio}%
                    </div>
                    <div className="mt-2 text-xs text-red-400/80 font-medium">
                      ₹{kpis.defaultedVolume.toLocaleString("en-IN")} in default
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition"></div>
                    <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                      <span>Partner Colleges & Students</span>
                      <Building2 className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-purple-300">
                      {kpis.totalInstitutions} <span className="text-sm font-normal text-slate-400">Colleges</span>
                    </div>
                    <div className="mt-2 text-xs text-purple-400 font-medium">
                      {kpis.totalStudents} verified student borrowers
                    </div>
                  </div>
                </div>

                {/* Leaderboard Table */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 shadow-xl">
                  <h3 className="text-sm font-bold tracking-wider text-slate-200 uppercase mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    Partner College Portfolio Leaderboard
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-3 px-4">College Name</th>
                          <th className="py-3 px-4">Code</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Students</th>
                          <th className="py-3 px-4">Active Volume (₹)</th>
                          <th className="py-3 px-4">Defaulted Volume (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {leaderboard.map((lb) => (
                          <tr key={lb.institution_id} className="hover:bg-slate-800/30 transition">
                            <td className="py-3 px-4 font-semibold text-slate-200">{lb.name}</td>
                            <td className="py-3 px-4 font-mono text-emerald-400">{lb.code}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                lb.is_active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-red-500/10 text-red-400 border border-red-500/30"
                              }`}>
                                {lb.is_active ? "ACTIVE" : "SUSPENDED"}
                              </span>
                            </td>
                            <td className="py-3 px-4">{lb.student_count || 0}</td>
                            <td className="py-3 px-4 font-mono text-slate-200">₹{parseFloat(lb.active_volume || 0).toLocaleString("en-IN")}</td>
                            <td className="py-3 px-4 font-mono text-red-400">₹{parseFloat(lb.defaulted_volume || 0).toLocaleString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: INSTITUTIONS */}
            {activeTab === "INSTITUTIONS" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Partner Educational Institutions</h3>
                    <p className="text-xs text-slate-400">Suspend or enable lending lines across partner colleges.</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowOnboardModal(true)}
                      className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-md shadow-emerald-500/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Onboard Institution</span>
                    </button>
                    <button
                      onClick={fetchInstitutions}
                      className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh List</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {institutions.map((inst) => (
                    <div key={inst.institution_id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-slate-700 transition">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{inst.code}</span>
                            <h4 className="text-sm font-bold text-slate-100 mt-1.5">{inst.name}</h4>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inst.is_active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-red-500/10 text-red-400 border border-red-500/30"
                          }`}>
                            {inst.is_active ? "ACTIVE" : "SUSPENDED"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">{inst.address || "No address provided"}</p>
                      </div>

                      <div className="border-t border-slate-800/80 pt-3 grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <div className="text-slate-500 text-[10px]">Students</div>
                          <div className="font-bold text-slate-300">{inst.student_count || 0}</div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-[10px]">Admins</div>
                          <div className="font-bold text-slate-300">{inst.admin_count || 0}</div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-[10px]">Volume</div>
                          <div className="font-bold text-emerald-400">₹{parseFloat(inst.total_disbursed || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleInstStatus(inst.institution_id, inst.is_active)}
                        className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                          inst.is_active 
                            ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {inst.is_active ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        <span>{inst.is_active ? "Suspend Lending Line" : "Activate Lending Line"}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: UNDERWRITING */}
            {activeTab === "UNDERWRITING" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "ALL", label: "All Loans" },
                      { id: "PENDING", label: "Pending" },
                      { id: "UNDER_REVIEW", label: "Under Review" },
                      { id: "ACTIVE", label: "Active" },
                      { id: "DEFAULTED", label: "Defaulted" },
                      { id: "FRAUD", label: "🚨 AI Fraud Locks", special: true }
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => { setLoanFilter(f.id); fetchLoans(f.id); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          loanFilter === f.id
                            ? f.special
                              ? "bg-red-500 text-slate-950 font-bold"
                              : "bg-emerald-500 text-slate-950 font-bold"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search roll #, name, email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && fetchLoans()}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={() => fetchLoans()}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                    >
                      Search
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-3 px-4">Applicant</th>
                          <th className="py-3 px-4">College</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Omniscore</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Created</th>
                          <th className="py-3 px-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {loans.map((loan) => (
                          <tr key={loan.loan_id} className="hover:bg-slate-800/30 transition">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-200">{loan.student_name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{loan.college_roll_number}</div>
                            </td>
                            <td className="py-3 px-4 font-mono text-emerald-400">{loan.institution_code}</td>
                            <td className="py-3 px-4 font-mono">₹{parseFloat(loan.requested_amount || 0).toLocaleString("en-IN")}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                                loan.pre_approval_score >= 70 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" :
                                loan.pre_approval_score >= 50 ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" :
                                "bg-red-500/10 text-red-400 border border-red-500/30"
                              }`}>
                                {loan.pre_approval_score || "N/A"}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                loan.status === "ACTIVE" || loan.status === "PAID" ? "bg-emerald-500/10 text-emerald-400" :
                                loan.status === "DEFAULTED" || loan.status === "REJECTED" ? "bg-red-500/10 text-red-400" :
                                "bg-amber-500/10 text-amber-400"
                              }`}>
                                {loan.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-400">{new Date(loan.created_at).toLocaleDateString()}</td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => {
                                  setSelectedLoan(loan);
                                  setOverrideStatus(loan.status);
                                  setOverrideAmount(loan.approved_amount || loan.requested_amount);
                                  setOverrideNotes(loan.admin_notes || "");
                                }}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded text-xs transition border border-slate-700"
                              >
                                Override
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: AI_ENGINE */}
            {activeTab === "AI_ENGINE" && settings && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-bold tracking-wider text-slate-200 uppercase flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    AI Microservice Matrix
                  </h3>
                  <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">FastAPI Engine URL</span>
                      <span className="font-mono text-emerald-400">cre-ai:8000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Inference Model</span>
                      <span className="font-mono text-slate-300">XGBoost v2.0 + SHAP</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">LLM Provider</span>
                      <span className="font-mono text-cyan-300">HuggingFace Llama-3</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-800 pt-2">
                      <span className="text-slate-400">PII Redactor</span>
                      <span className="text-emerald-400 font-bold">ACTIVE (PAN/Aadhaar)</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-sm font-bold tracking-wider text-slate-200 uppercase mb-4 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    Global Risk Tier & Interest Calibration
                  </h3>
                  <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 mb-1">Low Risk Minimum Score Cutoff (0-900 equivalent)</label>
                        <input
                          type="number"
                          value={settings.low_risk_min || 700}
                          onChange={(e) => setSettings({ ...settings, low_risk_min: parseFloat(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Medium Risk Minimum Score Cutoff</label>
                        <input
                          type="number"
                          value={settings.medium_risk_min || 500}
                          onChange={(e) => setSettings({ ...settings, medium_risk_min: parseFloat(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Default Base Interest Rate (% p.a.)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={settings.default_interest_rate || 12.5}
                          onChange={(e) => setSettings({ ...settings, default_interest_rate: parseFloat(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Flat Overdue Late Fee (₹)</label>
                        <input
                          type="number"
                          value={settings.late_fee_flat || 500}
                          onChange={(e) => setSettings({ ...settings, late_fee_flat: parseFloat(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-emerald-500"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-lg transition"
                    >
                      Save & Calibrate AI Matrix
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 5: AUDIT_LOGS */}
            {activeTab === "AUDIT_LOGS" && (
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-200 uppercase flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    Immutable Platform Audit Ledger
                  </h3>
                  <button
                    onClick={fetchAuditLogs}
                    className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded text-xs transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Ledger</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Actor</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Loan ID</th>
                        <th className="py-3 px-4">Transition</th>
                        <th className="py-3 px-4">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                      {auditLogs.map((log) => (
                        <tr key={log.log_id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 text-slate-400">{new Date(log.timestamp || log.created_at).toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-200">{log.actor_name || "System Cron"}</span>
                            <span className="block text-[10px] text-slate-500">{log.actor_role || "AUTOMATED"}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-slate-800 text-cyan-300 px-2 py-0.5 rounded border border-slate-700 font-bold">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400">{log.loan_id ? log.loan_id.slice(0, 8) + "..." : "N/A"}</td>
                          <td className="py-3 px-4">
                            {log.old_status} &rarr; <strong className="text-emerald-400">{log.new_status}</strong>
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-sans">{log.notes || "No notes"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 6: USERS */}
            {activeTab === "USERS" && (
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-200 uppercase flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    Universal User Directory
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Filter users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && fetchUserDirectory()}
                      className="bg-slate-950 border border-slate-800 rounded px-3 py-1 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-3 px-4">Name / Email</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">College Roll #</th>
                        <th className="py-3 px-4">Institution</th>
                        <th className="py-3 px-4">KYC Status</th>
                        <th className="py-3 px-4">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {userDirectory.map((u) => (
                        <tr key={u.user_id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-200">{u.full_name}</div>
                            <div className="text-[10px] text-slate-400">{u.email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.role === "SUPER_ADMIN" ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" :
                              u.role === "INSTITUTION_ADMIN" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" :
                              "bg-slate-800 text-slate-300"
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">{u.college_roll_number || "N/A"}</td>
                          <td className="py-3 px-4 text-emerald-400 font-mono">{u.institution_code || "HQ / Central"}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.kyc_status === "VERIFIED" ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"
                            }`}>
                              {u.kyc_status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Underwriter Override Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-emerald-400" />
                  Central Underwriter Override
                </h3>
                <p className="text-xs text-slate-400">UUID: {selectedLoan.loan_id}</p>
              </div>
              <button
                onClick={() => setSelectedLoan(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOverrideSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">New Loan Status Decision</label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-emerald-500"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="ACTIVE">ACTIVE (Disburse & Generate EMIs)</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="DEFAULTED">DEFAULTED</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Approved Disbursal Amount (₹)</label>
                <input
                  type="number"
                  value={overrideAmount}
                  onChange={(e) => setOverrideAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Central Underwriter Audit Notes</label>
                <textarea
                  rows={3}
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  placeholder="Explain why this decision was overridden centrally..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLoan(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition shadow-lg shadow-emerald-500/20"
                >
                  Confirm Central Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ONBOARD NEW PARTNER INSTITUTION */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">Onboard Partner Institution</h3>
              </div>
              <button
                onClick={() => setShowOnboardModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInstitution} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Institution Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BITS Pilani"
                    value={newInstForm.name}
                    onChange={(e) => setNewInstForm({ ...newInstForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Unique Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BITS_PILANI"
                    value={newInstForm.code}
                    onChange={(e) => setNewInstForm({ ...newInstForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Admin Contact Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@college.edu"
                    value={newInstForm.contact_email}
                    onChange={(e) => setNewInstForm({ ...newInstForm, contact_email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Admin Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Set admin login password"
                    value={newInstForm.password}
                    onChange={(e) => setNewInstForm({ ...newInstForm, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Campus Address</label>
                <input
                  type="text"
                  placeholder="Street, City, State, PIN"
                  value={newInstForm.address}
                  onChange={(e) => setNewInstForm({ ...newInstForm, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={newInstForm.bank_name}
                    onChange={(e) => setNewInstForm({ ...newInstForm, bank_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Disbursal A/C No.</label>
                  <input
                    type="text"
                    value={newInstForm.bank_account_number}
                    onChange={(e) => setNewInstForm({ ...newInstForm, bank_account_number: e.target.value })}
                    placeholder="Account Number"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={newInstForm.ifsc_code}
                    onChange={(e) => setNewInstForm({ ...newInstForm, ifsc_code: e.target.value.toUpperCase() })}
                    placeholder="IFSC"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition shadow-lg shadow-emerald-500/20"
                >
                  Onboard College & Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
