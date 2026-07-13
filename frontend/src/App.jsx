import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSkeleton from "./components/LoadingSkeleton";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy load all pages for better performance
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Register = lazy(() => import("./pages/Register"));
const Login = lazy(() => import("./pages/Login"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const LoanChecklist = lazy(() => import("./pages/LoanChecklist"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));

function App() {
  return (
    <ErrorBoundary>
      <Toaster position="top-right" />
      <Router>
        <Suspense fallback={<LoadingSkeleton />}>
          <Routes>
            {/* Public Route */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/register/:type" element={<Register />} />
            <Route path="/register" element={<Navigate to="/register/student" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/loan-checklist" element={<LoanChecklist />} />
            <Route path="/onboarding" element={<ProtectedRoute allowedRoles={["STUDENT"]}><Onboarding /></ProtectedRoute>} />

            {/* Protected Student Route */}
            <Route
              path="/student-dashboard"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Route */}
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute allowedRoles={["INSTITUTION_ADMIN"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected Superadmin Route */}
            <Route
              path="/superadmin-dashboard"
              element={
                <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
