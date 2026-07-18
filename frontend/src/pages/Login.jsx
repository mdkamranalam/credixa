import React, { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Lock, Mail, AlertCircle, ArrowLeft, CheckCircle } from "lucide-react";
import api from "../services/api";

const Login = () => {
  const [viewMode, setViewMode] = useState("LOGIN"); // LOGIN, FORGOT
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const loggedInUser = await login(email, password);

      if (loggedInUser.role === "SUPER_ADMIN") {
        navigate("/superadmin-dashboard");
      } else if (loggedInUser.role === "STUDENT") {
        if (loggedInUser.kyc_status === "PENDING") {
          navigate("/onboarding");
        } else {
          navigate("/student-dashboard");
        }
      } else if (loggedInUser.role === "INSTITUTION_ADMIN") {
        navigate("/admin-dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await api.post("/auth/forgot-password", { email });
      setSuccess(res.data.message);
      setViewMode("LOGIN");
    } catch (error) {
      setError(error.response?.data?.error || "Failed to submit request.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderHeader = () => {
    if (viewMode === "FORGOT") return "Reset your password";
    return "Sign in to Credixa";
  };

  const renderSubtext = () => {
    if (viewMode === "FORGOT") return "Enter your email to request a reset.";
    return "Welcome back! Access your dashboard.";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img src="/credixa-favicon.png" alt="Credixa Logo" className="mx-auto h-12 w-12 rounded-xl object-contain shadow-sm mb-4" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {viewMode === "LOGIN" ? (
            <>Sign in to <span className="text-emerald-500">Credixa</span></>
          ) : (
            renderHeader()
          )}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {renderSubtext()}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 bg-emerald-50 border-l-4 border-emerald-400 p-4 flex items-center">
              <CheckCircle className="h-5 w-5 text-emerald-400 mr-2" />
              <p className="text-sm text-emerald-700">{success}</p>
            </div>
          )}

          {viewMode === "LOGIN" && (
            <form className="space-y-6" onSubmit={handleLoginSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <button type="button" onClick={() => { setViewMode("FORGOT"); setError(""); setSuccess(""); }} className="text-sm text-emerald-600 hover:text-emerald-500">
                    Forgot your password?
                  </button>
                </div>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-emerald-500 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
              >
                {isLoading ? "Authenticating..." : "Sign in"}
              </button>
            </form>
          )}

          {viewMode === "FORGOT" && (
            <form className="space-y-6" onSubmit={handleForgotSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-emerald-500 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
              >
                {isLoading ? "Submitting..." : "Request Reset"}
              </button>
              <div className="text-center">
                <button type="button" onClick={() => { setViewMode("LOGIN"); setError(""); }} className="text-sm font-medium text-gray-500 hover:text-gray-700 inline-flex items-center">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back to login
                </button>
              </div>
            </form>
          )}

          {viewMode === "LOGIN" && (
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  to="/register/student"
                  className="font-bold text-emerald-500 hover:text-emerald-500/80"
                >
                  Sign up
                </Link>
              </p>
              <button type="button" onClick={() => { navigate("/reset-password"); setError(""); setSuccess(""); }} className="text-xs text-gray-400 hover:text-gray-600">
                Have an approved reset request? Set new password here.
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
