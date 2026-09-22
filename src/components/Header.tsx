import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  GraduationCap,
  LogIn,
  LogOut,
  ShieldCheck,
  Menu,
} from 'lucide-react';
import { UserSession } from '../types';

interface HeaderProps {
  onOpenTracker: (code?: string) => void;
  onOpenResearchInfo: () => void;
  currentUser: UserSession | null;
  onOpenLogin: (role?: 'student' | 'admin') => void;
  onLogout: () => void;
  onOpenMobileNav: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenTracker,
  onOpenResearchInfo,
  currentUser,
  onOpenLogin,
  onLogout,
  onOpenMobileNav,
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
          <div className="flex items-center gap-2 min-w-0">
            <span className="bg-blue-950 text-amber-300 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded tracking-wider shrink-0">
              SHS Capstone
            </span>
            <span className="hidden md:inline truncate">
              Centivate: Senior High School Campus Facility Complaint Reporting & Maintenance System
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenResearchInfo}
              className="flex items-center gap-1.5 text-blue-950 hover:text-blue-800 font-bold underline transition-colors"
            >
              <span className="hidden sm:inline">Research Docs & Evaluation Survey</span>
              <span className="sm:hidden">Research</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-3.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        {/* Mobile: menu trigger + brand */}
        <div className="flex md:hidden items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenMobileNav}
            className="p-2 rounded-lg bg-blue-950/90 border border-blue-800/80 text-amber-300 hover:bg-blue-900 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="relative group cursor-pointer shrink-0">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-blue-950 flex items-center justify-center font-black shadow-md border-2 border-amber-300">
              <ShieldAlert className="w-5 h-5 text-blue-950" />
            </div>
          </div>
        </div>

        {/* Desktop: brand */}
        <div className="hidden md:flex items-center gap-2.5 md:gap-3.5 shrink-0">
          <div className="relative group shrink-0">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-amber-400 text-blue-950 flex items-center justify-center font-black text-2xl shadow-md border-2 border-amber-300">
              <ShieldAlert className="w-6 h-6 md:w-7 md:h-7 text-blue-950" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-blue-900 flex items-center justify-center">
              <CheckCircle2 className="w-2.5 h-2.5 text-white" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-2xl font-black tracking-tight text-white font-sans flex items-center gap-2">
                CENTIVATE
                <span className="hidden sm:inline text-amber-400 text-sm font-semibold tracking-normal px-2 py-0.5 rounded bg-blue-900/80 border border-amber-400/30">
                  v2.6
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Desktop: search + auth */}
        <div className="hidden md:flex flex-wrap items-center gap-3 lg:gap-4">
          {/* Search Tracker Quick Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center">
            <div className="relative w-56 lg:w-72">
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

        {/* Mobile: compact auth badge / login */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-blue-950 font-black flex items-center justify-center text-xs shadow shrink-0">
                {currentUser.role === 'admin' ? (
                  <ShieldCheck className="w-4 h-4 text-blue-950" />
                ) : (
                  <GraduationCap className="w-4 h-4 text-blue-950" />
                )}
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-lg bg-blue-950/90 border border-blue-800/80 text-red-300 hover:bg-blue-900 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenLogin('student')}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-400 hover:bg-amber-300 text-blue-950 font-black text-xs rounded-xl shadow transition-transform active:scale-95 border-b-2 border-amber-600"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
