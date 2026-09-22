import React, { useState } from 'react';
import {
  Home,
  ClipboardList,
  LayoutDashboard,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Search,
  X,
} from 'lucide-react';

type Tab = 'home' | 'student' | 'admin' | 'analytics' | 'research';

interface AppSidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenTracker: (code?: string) => void;
}

const NAV_ITEMS: { tab: 'home' | 'student' | 'admin' | 'analytics'; label: string; icon: React.ElementType }[] = [
  { tab: 'home', label: 'CPU Campus Home', icon: Home },
  { tab: 'student', label: 'Student Portal', icon: ClipboardList },
  { tab: 'admin', label: 'Admin Dashboard', icon: LayoutDashboard },
  { tab: 'analytics', label: 'Analytics & Research', icon: BarChart3 },
];

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  onCloseMobile,
  onOpenTracker,
}) => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('centivate_app_sidebar_collapsed') === '1';
    } catch {
      return false;
    }
  });
  const [mobileSearchCode, setMobileSearchCode] = useState('');

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('centivate_app_sidebar_collapsed', next ? '1' : '0');
      } catch {
        // ignore storage failures (private browsing, etc.)
      }
      return next;
    });
  };

  const handleMobileTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileSearchCode.trim()) {
      onOpenTracker(mobileSearchCode.trim());
      setMobileSearchCode('');
      onCloseMobile();
    }
  };

  const renderNav = (variant: 'desktop' | 'mobile') =>
    NAV_ITEMS.map((item) => {
      const Icon = item.icon;
      const isActive = activeTab === item.tab;
      const isCollapsed = variant === 'desktop' && collapsed;
      return (
        <button
          key={item.tab}
          onClick={() => {
            setActiveTab(item.tab);
            if (variant === 'mobile') onCloseMobile();
          }}
          title={isCollapsed ? item.label : undefined}
          className={`w-full flex items-center gap-3 rounded-xl font-bold transition-all ${
            isCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-3 text-left'
          } ${variant === 'mobile' ? 'text-sm' : 'text-xs'} ${
            isActive ? 'bg-amber-400 text-blue-950 shadow' : 'text-blue-100 hover:bg-blue-900/60 hover:text-white'
          }`}
        >
          <Icon className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
        </button>
      );
    });

  return (
    <>
      {/* DESKTOP/TABLET PERSISTENT SIDEBAR */}
      <aside
        className={`hidden md:flex md:flex-col shrink-0 sticky top-0 h-screen bg-gradient-to-b from-blue-950 via-blue-900 to-indigo-900 border-r-4 border-amber-400 transition-all duration-300 ${
          collapsed ? 'w-[64px]' : 'w-60'
        }`}
      >
        <div className={`flex items-center gap-2 px-3 py-4 border-b border-blue-800/60 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-amber-400 text-blue-950 flex items-center justify-center font-black shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          {!collapsed && <span className="text-white font-black text-sm tracking-tight truncate">CENTIVATE</span>}
        </div>

        <nav className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">{renderNav('desktop')}</nav>

        <button
          onClick={toggleCollapsed}
          className={`flex items-center gap-2 m-2 p-2.5 rounded-lg text-blue-200 hover:bg-blue-900/60 hover:text-white transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs font-bold">Collapse</span>
            </>
          )}
        </button>
      </aside>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full bg-gradient-to-b from-blue-950 via-blue-900 to-indigo-900 shadow-2xl p-4 animate-fadeIn overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-blue-950 flex items-center justify-center font-black shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <span className="text-white font-black text-sm tracking-tight truncate">CENTIVATE</span>
              </div>
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-blue-200 hover:bg-blue-900/60 hover:text-white transition-colors"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMobileTrack} className="flex items-center">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Track code (e.g. CENT-2026-8912)..."
                  value={mobileSearchCode}
                  onChange={(e) => setMobileSearchCode(e.target.value)}
                  className="w-full bg-blue-950/80 border border-blue-700/80 text-white placeholder-blue-300/70 text-xs rounded-lg pl-9 pr-16 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                />
                <Search className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-3" />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 px-2.5 bg-amber-400 hover:bg-amber-300 text-blue-950 font-bold text-[11px] rounded transition-colors"
                >
                  Track
                </button>
              </div>
            </form>

            <nav className="flex flex-col gap-1">{renderNav('mobile')}</nav>
          </div>
        </div>
      )}
    </>
  );
};
