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
  Home,
  Layout,
  Menu,
  X,
} from 'lucide-react';
import { UserSession } from '../types';

interface HeaderProps {
  activeTab: 'home' | 'student' | 'admin' | 'analytics' | 'research';
  setActiveTab: (tab: 'home' | 'student' | 'admin' | 'analytics' | 'research') => void;
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCode.trim()) {
      onOpenTracker(searchCode.trim());
      setSearchCode('');
      setMobileMenuOpen(false);
    }
  };

  const handleMobileNavClick = (tab: 'home' | 'student' | 'admin' | 'analytics' | 'research') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const navItems: {
    tab: 'home' | 'student' | 'admin' | 'analytics';
    label: string;
    icon: React.ReactNode;
  }[] = [
    { tab: 'home', label: 'CPU Campus Home', icon: <Home className="w-4 h-4" /> },
    { tab: 'student', label: 'Student Portal', icon: <ClipboardList className="w-4 h-4" /> },
    { tab: 'admin', label: 'Admin Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { tab: 'analytics', label: 'Analytics & Research', icon: <BarChart3 className="w-4 h-4" /> },
  ];

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
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Research Docs & Evaluation Survey</span>
              <span className="sm:hidden">Research</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-3.5 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2.5 md:gap-3.5 min-w-0">
          <div className="relative group cursor-pointer shrink-0" onClick={() => handleMobileNavClick('home')}>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-amber-400 text-blue-950 flex items-center justify-center font-black text-2xl shadow-md border-2 border-amber-300 transform group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-6 h-6 md:w-7 md:h-7 text-blue-950" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-blue-900 flex items-center justify-center">
              <CheckCircle2 className="w-2.5 h-2.5 text-white" />
            </div>
          </div>

          <div className="cursor-pointer min-w-0" onClick={() => handleMobileNavClick('home')}>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-2xl font-black tracking-tight text-white font-sans flex items-center gap-2">
                CENTIVATE
                <span className="hidden sm:inline text-amber-400 text-sm font-semibold tracking-normal px-2 py-0.5 rounded bg-blue-900/80 border border-amber-400/30">
                  v2.6
                </span>
              </h1>
            </div>
            </p>
          </div>
        </div>

        {/* Desktop: search + nav + auth (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-4">
          {/* Search Tracker Quick Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center">
            <div className="relative w-72">
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
            {navItems.map((item) => (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === item.tab
                    ? 'bg-amber-400 text-blue-950 shadow'
                    : 'text-blue-100 hover:text-white hover:bg-blue-900/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
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

        {/* Mobile: compact auth badge + hamburger toggle */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          {currentUser ? (
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-blue-950 font-black flex items-center justify-center text-xs shadow shrink-0">
              {currentUser.role === 'admin' ? (
                <ShieldCheck className="w-4 h-4 text-blue-950" />
              ) : (
                <GraduationCap className="w-4 h-4 text-blue-950" />
              )}
            </div>
          ) : null}
          <button
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="p-2 rounded-lg bg-blue-950/90 border border-blue-800/80 text-amber-300 hover:bg-blue-900 transition-colors"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-blue-800/80 bg-blue-950/95 px-4 py-4 space-y-4 animate-fadeIn">
          {/* Search Tracker Quick Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Track code (e.g. CENT-2026-8912)..."
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className="w-full bg-blue-900/80 border border-blue-700/80 text-white placeholder-blue-300/70 text-sm rounded-lg pl-9 pr-16 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
              />
              <Search className="w-4 h-4 text-amber-400 absolute left-2.5 top-3" />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-3 bg-amber-400 hover:bg-amber-300 text-blue-950 font-bold text-xs rounded transition-colors"
              >
                Track
              </button>
            </div>
          </form>

          {/* Navigation Tabs — stacked, full width, thumb-friendly */}
          <div className="flex flex-col gap-1.5">
            {navItems.map((item) => (
              <button
                key={item.tab}
                onClick={() => handleMobileNavClick(item.tab)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === item.tab
                    ? 'bg-amber-400 text-blue-950 shadow'
                    : 'text-blue-100 hover:bg-blue-900/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Auth section */}
          <div className="pt-2 border-t border-blue-800/60">
            {currentUser ? (
              <div className="flex items-center justify-between bg-blue-900/60 border border-amber-400/50 pl-3 pr-2 py-2 rounded-xl text-xs">
                <div>
                  <p className="font-bold text-white text-xs leading-tight">{currentUser.fullName}</p>
                  <p className="text-[10px] text-amber-300 capitalize font-medium">
                    {currentUser.role} Account
                  </p>
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-red-300 hover:text-red-200 hover:bg-red-500/10 rounded-lg transition-colors font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenLogin('student');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-3 bg-amber-400 hover:bg-amber-300 text-blue-950 font-black text-sm rounded-xl shadow transition-transform active:scale-95 border-b-2 border-amber-600"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
