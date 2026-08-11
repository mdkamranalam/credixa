import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, LayoutDashboard, Folder, Settings, ShieldCheck, PlayCircle } from "lucide-react";
import { AuthContext } from "../context/AuthContext.jsx";
import NotificationBell from "./NotificationBell.jsx";

const GlobalNav = () => {
  const { logout, user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) return null;

  const role = user.role || "STUDENT";
  const dashboardPath = role === "STUDENT" ? "/student-dashboard" : role === "INSTITUTION_ADMIN" ? "/admin-dashboard" : "/superadmin-dashboard";

  const navLinks = [
    { name: "Dashboard", path: dashboardPath, icon: LayoutDashboard },
    { name: "Documents", path: dashboardPath + "#documents", icon: Folder },
    { name: "Settings", path: dashboardPath + "#settings", icon: Settings },
  ];

  return (
    <nav className="bg-white px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-40 border-b border-slate-100">
      <div className="flex items-center gap-8">
        <Link to={dashboardPath} className="flex items-center gap-2">
          <img src="/credixa-favicon.png" alt="Credixa" className="w-8 h-8" />
          <span className="text-2xl font-black tracking-tight text-slate-900">Credixa</span>
        </Link>
        <div className="hidden md:flex items-center space-x-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            // Since we are simulating anchors for now
            const isActive = location.pathname === link.path.split("#")[0] && (!link.path.includes("#") || location.hash === "#" + link.path.split("#")[1]);
            return (
              <a
                key={link.name}
                href={link.path}
                className={`flex items-center px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                  isActive ? "bg-emerald-50 text-emerald-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {link.name}
              </a>
            );
          })}
        </div>
      </div>
      <div className="flex items-center space-x-6">
        <button 
          className="hidden lg:flex items-center text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full border border-indigo-100 transition-colors"
          onClick={() => alert("Playing Demo Video...")}
        >
          <PlayCircle className="w-4 h-4 mr-1" /> How it Works
        </button>
        <div className="hidden md:flex items-center text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
          <ShieldCheck className="w-4 h-4 mr-1 text-emerald-500" /> AES-256 Secured
        </div>
        <NotificationBell />
        <button
          onClick={logout}
          className="text-slate-400 hover:text-red-500 flex items-center font-bold text-sm transition-colors"
        >
          <LogOut className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default GlobalNav;
