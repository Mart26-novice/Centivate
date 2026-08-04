import React, { useState } from 'react';
import {
  ShieldAlert,
  ClipboardList,
  LayoutDashboard,
  BarChart3,
  Search,
  BookOpen,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  GraduationCap,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
} from 'lucide-react';
import { UserSession } from '../types';

interface HeaderProps {
  activeTab: 'student' | 'admin' | 'analytics' | 'research';
  setActiveTab: (tab: 'student' | 'admin' | 'analytics' | 'research') => void;
  onOpenTracker: (code?: string) => void;
  onOpenResearchInfo: () => void;
  pendingCount: number;
  urgentCount: number;
  currentUser: UserSession | null;
  onOpenLogin: (role?: 'student' | 'admin') => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenTracker,
  onOpenResearchInfo,
  pendingCount,
  urgentCount,
  currentUser,
  onOpenLogin,
  onLogout,
}) => {
  const [searchCode, setSearchCode] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCode.trim()) {
      onOpenTracker(searchCode.trim());
      setSearchCode('');
    }
  };

  return (
    <header className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 text-white shadow-lg border-b-4 border-amber-400 sticky top-0 z-40">
      {/* Top Banner Notice */}
      <div className="bg-amber-400 text-blue-950 px-4 py-1.5 text-xs font-semibold flex items-center justify-between shadow-inner">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-blue-950 text-amber-300 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded tracking-wider">
              SHS Capstone Project
            </span>
            <span className="hidden sm:inline">
              Centivate: Senior High School Campus Facility Complaint Reporting & Maintenance System
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenResearchInfo}
              className="flex items-center gap-1.5 text-blue-950 hover:text-blue-800 font-bold underline transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Research Docs & Evaluation Survey</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3.5">
          <div className="relative group cursor-pointer" onClick={() => setActiveTab('student')}>
            <div className="w-12 h-12 rounded-xl bg-amber-400 text-blue-950 flex items-center justify-center font-black text-2xl shadow-md border-2 border-amber-300 transform group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-7 h-7 text-blue-950" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-blue-900 flex items-center justify-center">
              <CheckCircle2 className="w-2.5 h-2.5 text-white" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white font-sans flex items-center gap-2">
                CENTIVATE
                <span className="text-amber-400 text-sm font-semibold tracking-normal px-2 py-0.5 rounded bg-blue-900/80 border border-amber-400/30">
                  v2.6
                </span>
              </h1>
            </div>
            <p className="text-xs text-blue-200 font-medium flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
              Senior High School Facility Maintenance & Reporting Portal
            </p>
          </div>
        </div>

        {/* Search Tracker Quick Form */}
        <form onSubmit={handleSearchSubmit} className="flex items-center w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Track code (e.g. CENT-2026-8912)..."
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="w-full bg-blue-950/80 border border-blue-700/80 text-white placeholder-blue-300/70 text-xs rounded-lg pl-8 pr-16 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
            />
            <Search className="w-3.5 h-3.5 text-amber-400 absolute left-2.5 top-2.5" />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-2.5 bg-amber-400 hover:bg-amber-300 text-blue-950 font-bold text-[11px] rounded transition-colors"
            >
              Track
            </button>
          </div>
        </form>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-blue-950/90 p-1 rounded-xl border border-blue-800/80 shadow-inner overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('student')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'student'
                ? 'bg-amber-400 text-blue-950 shadow'
                : 'text-blue-100 hover:text-white hover:bg-blue-900/60'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Student Portal</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all relative whitespace-nowrap ${
              activeTab === 'admin'
                ? 'bg-amber-400 text-blue-950 shadow'
                : 'text-blue-100 hover:text-white hover:bg-blue-900/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Admin Dashboard</span>
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-blue-950 text-[10px] font-black px-1.5 py-0.2 rounded-full border border-blue-900">
                {pendingCount}
              </span>
            )}
            {urgentCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                {urgentCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-amber-400 text-blue-950 shadow'
                : 'text-blue-100 hover:text-white hover:bg-blue-900/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics & Research</span>
          </button>
        </div>

        {/* User Session Auth Badge / Login Action */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2 bg-blue-950/90 border border-amber-400/50 pl-3 pr-1.5 py-1.5 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-400 text-blue-950 font-black flex items-center justify-center text-xs shadow">
                  {currentUser.role === 'admin' ? (
                    <ShieldCheck className="w-4 h-4 text-blue-950" />
                  ) : (
                    <GraduationCap className="w-4 h-4 text-blue-950" />
                  )}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="font-bold text-white text-[11px] leading-tight truncate max-w-[120px]">
                    {currentUser.fullName}
                  </p>
                  <p className="text-[10px] text-amber-300 capitalize font-medium">
                    {currentUser.role} Account
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 hover:bg-red-500/20 text-red-300 hover:text-red-200 rounded-lg transition-colors ml-1"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenLogin('student')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-blue-950 font-black text-xs rounded-xl shadow transition-transform active:scale-95 border-b-2 border-amber-600"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
