/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { UserCheck, ShieldAlert, Lock, ShieldCheck, Loader2 } from 'lucide-react';
import { Header } from './components/Header';
import { AppSidebar } from './components/AppSidebar';
import { LandingPage } from './components/LandingPage';
import { PublicTracker } from './components/PublicTracker';
import { ResearchInfoModal } from './components/ResearchInfoModal';
import { ComplaintDetailsModal } from './components/ComplaintDetailsModal';
import { LoginModal } from './components/LoginModal';
import { IntroOverlay } from './components/IntroOverlay';

// Code-splitting heavy dashboard, student portal, and analytics views
const StudentPortal = lazy(() => import('./components/StudentPortal').then((m) => ({ default: m.StudentPortal })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AnalyticsView = lazy(() => import('./components/AnalyticsView').then((m) => ({ default: m.AnalyticsView })));

const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] p-8 space-y-3 animate-fadeIn">
    <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
      Loading View...
    </span>
  </div>
);
import { Complaint, ComplaintStatus, SystemStats, MaintenanceStaff, UserSession, UserRole, OfficialStudent } from './types';
import { computeStatsFromComplaints } from './utils/complaintHelpers';
import {
  apiFetch,
  fetchComplaints,
  fetchStaff as fetchStaffFromApi,
  subscribeToComplaints,
  subscribeToStudents,
  subscribeToStaff,
  saveStudentToDb,
  deleteStudentFromDb,
  watchSession,
  signOutUser,
} from './lib/firestoreService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'student' | 'admin' | 'analytics' | 'research'>('home');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [staffList, setStaffList] = useState<MaintenanceStaff[]>([]);
  const [studentList, setStudentList] = useState<OfficialStudent[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const showError = (err: unknown, fallback: string) => {
    setNotice(err instanceof Error && err.message ? err.message : fallback);
    setTimeout(() => setNotice(null), 7000);
  };

  // Session Intro & Real Data Fetch Tracking
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('introShown');
    }
    return false;
  });
  const [loadedCollections, setLoadedCollections] = useState<Set<string>>(new Set());

  const markCollectionLoaded = (colName: string) => {
    setLoadedCollections((prev) => {
      if (prev.has(colName)) return prev;
      const next = new Set(prev);
      next.add(colName);
      return next;
    });
  };

  const totalCollections = 4;
  const fetchProgress = Math.min(100, (loadedCollections.size / totalCollections) * 100);
  const isDataLoaded = loadedCollections.size >= totalCollections;

  // Authentication state
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginModalInitialRole, setLoginModalInitialRole] = useState<UserRole>('student');
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

  // Modals
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isTrackerOpen, setIsTrackerOpen] = useState<boolean>(false);
  const [trackerCode, setTrackerCode] = useState<string>('');
  const [isResearchModalOpen, setIsResearchModalOpen] = useState<boolean>(false);

  // URL Hash Routing Sync
  useEffect(() => {
    const parseHashRoute = () => {
      const hash = window.location.hash.toLowerCase().replace('#', '');
      if (!hash || hash === 'home') {
        setActiveTab('home');
      } else if (hash === 'student') {
        setActiveTab('student');
      } else if (hash === 'admin') {
        setActiveTab('admin');
      } else if (hash === 'analytics') {
        setActiveTab('analytics');
      } else if (hash.startsWith('tracker')) {
        const parts = hash.split('=');
        if (parts[1]) {
          setTrackerCode(parts[1].toUpperCase());
        }
        setIsTrackerOpen(true);
      } else if (hash === 'research') {
        setIsResearchModalOpen(true);
      }
    };

    parseHashRoute();

    const handleHashChange = () => {
      parseHashRoute();
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const updateRouteHash = (route: string) => {
    if (window.location.hash !== `#${route}`) {
      window.history.pushState(null, '', `#${route}`);
    }
  };

  // Restore the signed-in session (role/name from users/{uid}) after a page refresh.
  useEffect(() => {
    return watchSession((user) => setCurrentUser(user));
  }, []);

  const fetchStats = async () => {
    try {
      setStats(await apiFetch<SystemStats>('/api/stats'));
    } catch (err) {
      console.warn('Stats fetch failed, using client-computed stats:', err);
      setStats((prev) => computeStatsFromComplaints(complaintsRef.current, prev));
    } finally {
      markCollectionLoaded('stats');
    }
  };

  const fetchStaff = async () => {
    try {
      setStaffList(await fetchStaffFromApi());
    } catch (err) {
      console.warn('Staff fetch failed:', err);
    }
  };

  const refreshComplaints = async () => {
    try {
      setComplaints(await fetchComplaints());
    } catch (err) {
      console.warn('Complaint refresh failed:', err);
    }
  };

  const complaintsRef = React.useRef<Complaint[]>([]);
  useEffect(() => {
    complaintsRef.current = complaints;
  }, [complaints]);

  // Staff + stats are public-safe and load once for everyone.
  useEffect(() => {
    const unsubscribeStaff = subscribeToStaff((liveStaff) => {
      setStaffList(liveStaff);
      markCollectionLoaded('staff');
    });

    fetchStats();
    const statsTimer = setInterval(fetchStats, 60000);

    // Safety fallback so the intro overlay never hangs on a slow connection
    const fallbackTimer = setTimeout(() => {
      ['complaints', 'students', 'staff', 'stats'].forEach(markCollectionLoaded);
    }, 2500);

    return () => {
      clearTimeout(fallbackTimer);
      clearInterval(statsTimer);
      unsubscribeStaff();
    };
  }, []);

  // Complaints/students depend on who is signed in (what the API returns and what the
  // security rules allow differ by role), so they re-subscribe whenever the user changes.
  useEffect(() => {
    const unsubscribeComplaints = subscribeToComplaints((liveComplaints) => {
      setComplaints(liveComplaints);
      setStats((prevStats) => computeStatsFromComplaints(liveComplaints, prevStats));
      markCollectionLoaded('complaints');
    });

    const unsubscribeStudents = subscribeToStudents((liveStudents) => {
      setStudentList(liveStudents);
      markCollectionLoaded('students');
    });

    return () => {
      unsubscribeComplaints();
      unsubscribeStudents();
    };
  }, [currentUser?.id]);

  const handleCreateComplaint = async (newReportData: any): Promise<Complaint> => {
    const created = await apiFetch<Complaint>('/api/complaints', { method: 'POST', body: newReportData });
    setComplaints((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
    fetchStats();
    return created;
  };

  const handleUpdateComplaint = async (id: string, updates: any) => {
    try {
      const updated = await apiFetch<Complaint>(`/api/complaints/${id}`, { method: 'PATCH', body: updates });
      setComplaints((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setSelectedComplaint((prev) => (prev && prev.id === id ? updated : prev));
      fetchStats();
      fetchStaff();
    } catch (err) {
      showError(err, 'Could not update the complaint.');
      throw err;
    }
  };

  const handleSaveStudent = async (student: OfficialStudent) => {
    try {
      await saveStudentToDb(student);
    } catch (err) {
      showError(err, 'Could not save the student record.');
      throw err;
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      await deleteStudentFromDb(id);
    } catch (err) {
      showError(err, 'Could not delete the student record.');
    }
  };

  const handleUpdateComplaintStatus = async (id: string, newStatus: ComplaintStatus, note?: string) => {
    try {
      await handleUpdateComplaint(id, {
        status: newStatus,
        note: note || `Status updated to ${newStatus}`,
      });
    } catch {
      // handleUpdateComplaint already told the admin what went wrong
    }
  };

  const handleArchiveComplaint = async (id: string) => {
    try {
      await apiFetch(`/api/complaints/${id}`, { method: 'DELETE' });
      setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, isArchived: true } : c)));
      if (selectedComplaint?.id === id) {
        setSelectedComplaint(null);
      }
      fetchStats();
    } catch (err) {
      showError(err, 'Could not archive the complaint.');
    }
  };

  const handleCreateStaff = async (staffData: Omit<MaintenanceStaff, 'id' | 'activeWorkload'>) => {
    try {
      await apiFetch('/api/staff', { method: 'POST', body: staffData });
      await fetchStaff();
    } catch (err) {
      showError(err, 'Could not add the staff member.');
      throw err;
    }
  };

  const handleUpdateStaff = async (id: string, updates: Partial<MaintenanceStaff>) => {
    try {
      await apiFetch(`/api/staff/${id}`, { method: 'PATCH', body: updates });
      await fetchStaff();
      refreshComplaints();
    } catch (err) {
      showError(err, 'Could not update the staff member.');
      throw err;
    }
  };

  const handleDeleteStaff = async (id: string) => {
    try {
      await apiFetch(`/api/staff/${id}`, { method: 'DELETE' });
      await fetchStaff();
      refreshComplaints();
    } catch (err) {
      showError(err, 'Could not remove the staff member.');
    }
  };

  const handleOpenTracker = (code?: string) => {
    setTrackerCode(code || '');
    setIsTrackerOpen(true);
    updateRouteHash(code ? `tracker=${code}` : 'tracker');
  };

  const handleOpenLogin = (role?: UserRole) => {
    setLoginModalInitialRole(role || 'student');
    setIsLoginModalOpen(true);
  };

  const handleLogout = () => {
    signOutUser().catch((err) => console.warn('Sign-out failed:', err));
    setCurrentUser(null);
    setActiveTab('home');
    updateRouteHash('home');
  };

  const handleTabChange = (tab: 'home' | 'student' | 'admin' | 'analytics' | 'research') => {
    if (tab === 'research') {
      setIsResearchModalOpen(true);
      updateRouteHash('research');
      return;
    }

    if (tab === 'student') {
      if (!currentUser) {
        handleOpenLogin('student');
        return;
      }
      if (currentUser.role !== 'student') {
        setActiveTab('student');
        updateRouteHash('student');
        return;
      }
    }

    if (tab === 'admin') {
      if (!currentUser) {
        handleOpenLogin('admin');
        return;
      }
      if (currentUser.role !== 'admin') {
        setActiveTab('admin');
        updateRouteHash('admin');
        return;
      }
    }

    setActiveTab(tab);
    updateRouteHash(tab);
  };

  const resolvedCount = useMemo(
    () => complaints.filter((c) => c.status === 'Resolved').length,
    [complaints]
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex font-sans selection:bg-amber-300 selection:text-blue-950">
      {/* Session Intro Overlay */}
      {showIntro && (
        <IntroOverlay
          progress={fetchProgress}
          isDataLoaded={isDataLoaded}
          onDismiss={() => setShowIntro(false)}
        />
      )}

      {/* App-level Navigation Sidebar */}
      <AppSidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        onOpenTracker={handleOpenTracker}
      />

      {notice && (
        <div
          role="alert"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] max-w-md w-[calc(100%-2rem)] bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-start justify-between gap-3"
        >
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss message" className="text-rose-500 hover:text-rose-800 font-black">
            ✕
          </button>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Global Header */}
        <Header
          onOpenTracker={handleOpenTracker}
          onOpenResearchInfo={() => setIsResearchModalOpen(true)}
          currentUser={currentUser}
          onOpenLogin={handleOpenLogin}
          onLogout={handleLogout}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

      {/* Main Content Area */}
      <main className="flex-1">
        <Suspense fallback={<LoadingFallback />}>
          {activeTab === 'home' && (
            <LandingPage
              onNavigate={(tab) => handleTabChange(tab)}
              onOpenTracker={() => handleOpenTracker()}
              onOpenLogin={(role) => handleOpenLogin(role)}
              currentUser={currentUser}
              totalComplaintsCount={complaints.length}
              resolvedCount={resolvedCount}
            />
          )}

          {activeTab === 'student' && (
            !currentUser ? (
              <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6 animate-fadeIn">
                <div className="w-20 h-20 bg-amber-100 text-blue-950 rounded-3xl flex items-center justify-center mx-auto border-2 border-amber-300 shadow-xl">
                  <UserCheck className="w-10 h-10 text-blue-950" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">Student Sign-In Required</h2>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Please log in with your CPU Senior High School student account to file maintenance reports and track your submitted tickets.
                  </p>
                </div>
                <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={() => handleOpenLogin('student')}
                    className="px-8 py-3.5 bg-amber-400 hover:bg-amber-300 text-blue-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl border-b-4 border-amber-600 transform active:scale-95 transition-all"
                  >
                    Sign In as Student
                  </button>
                  <button
                    onClick={() => setActiveTab('home')}
                    className="px-6 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-2xl transition-colors"
                  >
                    Return to Home Page
                  </button>
                </div>
              </div>
            ) : currentUser.role === 'admin' ? (
              <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6 animate-fadeIn">
                <div className="w-20 h-20 bg-red-100 text-red-700 rounded-3xl flex items-center justify-center mx-auto border-2 border-red-300 shadow-xl">
                  <ShieldAlert className="w-10 h-10 text-red-700" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">Student Access Restricted</h2>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    You are currently signed in as <strong className="text-blue-950">{currentUser.fullName}</strong> (<span className="text-amber-700 font-bold uppercase">{currentUser.role}</span>).
                    The Student Portal is dedicated to student complaint filing. Admin operations should be performed in the Facilities Admin Dashboard.
                  </p>
                </div>
                <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={() => handleOpenLogin('student')}
                    className="px-8 py-3.5 bg-amber-400 hover:bg-amber-300 text-blue-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl border-b-4 border-amber-600 transform active:scale-95 transition-all"
                  >
                    Switch / Sign In as Student
                  </button>
                  <button
                    onClick={() => setActiveTab('admin')}
                    className="px-6 py-3.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-2xl shadow transition-colors"
                  >
                    Go to Admin Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <StudentPortal
                complaints={complaints.filter((c) => !c.isArchived)}
                onCreateComplaint={handleCreateComplaint}
                onSelectComplaint={(c) => setSelectedComplaint(c)}
                onOpenTracker={handleOpenTracker}
                currentUser={currentUser}
                onOpenLogin={() => handleOpenLogin('student')}
              />
            )
          )}

          {activeTab === 'admin' && (
            !currentUser ? (
              <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6 animate-fadeIn">
                <div className="w-20 h-20 bg-blue-100 text-blue-950 rounded-3xl flex items-center justify-center mx-auto border-2 border-blue-300 shadow-xl">
                  <Lock className="w-10 h-10 text-blue-950" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">Administrator Sign-In Required</h2>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Access to the Campus Physical Plant Office (CPPO) Dispatch & Admin Dashboard is strictly restricted to authorized maintenance administrators.
                  </p>
                </div>
                <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={() => handleOpenLogin('admin')}
                    className="px-8 py-3.5 bg-blue-900 hover:bg-blue-800 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl border-b-4 border-blue-950 transform active:scale-95 transition-all flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Sign In as Admin</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('home')}
                    className="px-6 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-2xl transition-colors"
                  >
                    Return to Home Page
                  </button>
                </div>
              </div>
            ) : currentUser.role !== 'admin' ? (
              <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6 animate-fadeIn">
                <div className="w-20 h-20 bg-red-100 text-red-700 rounded-3xl flex items-center justify-center mx-auto border-2 border-red-300 shadow-xl">
                  <ShieldAlert className="w-10 h-10 text-red-700" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">Admin Portal Access Denied</h2>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    You are currently logged in as student <strong className="text-blue-950">{currentUser.fullName}</strong>. Your account does not have administrator privileges to dispatch technicians or change repair statuses.
                  </p>
                </div>
                <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={() => handleOpenLogin('admin')}
                    className="px-8 py-3.5 bg-blue-900 hover:bg-blue-800 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl border-b-4 border-blue-950 transform active:scale-95 transition-all flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Sign In as Admin</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('student')}
                    className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-blue-950 font-bold text-xs rounded-2xl shadow transition-colors"
                  >
                    Return to Student Portal
                  </button>
                </div>
              </div>
            ) : (
              <AdminDashboard
                complaints={complaints}
                stats={stats}
                staffList={staffList}
                studentList={studentList}
                onSelectComplaint={(c) => setSelectedComplaint(c)}
                onUpdateComplaintStatus={handleUpdateComplaintStatus}
                onArchiveComplaint={handleArchiveComplaint}
                onAddStaff={handleCreateStaff}
                onUpdateStaff={handleUpdateStaff}
                onDeleteStaff={handleDeleteStaff}
                onSaveStudent={handleSaveStudent}
                onDeleteStudent={handleDeleteStudent}
                onRefreshData={() => {
                  fetchStats();
                  fetchStaff();
                }}
              />
            )
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              stats={stats}
              complaints={complaints.filter((c) => !c.isArchived)}
              onOpenResearchInfo={() => setIsResearchModalOpen(true)}
            />
          )}
        </Suspense>
      </main>

      {/* Global Footer */}
      <footer className="bg-blue-950 text-blue-200 border-t-2 border-amber-400 py-6 text-xs text-center space-y-1 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold">
            Centivate © 2026 • Senior High School Complaint Reporting & Management System
          </p>
          <div className="flex items-center gap-1 text-xs text-amber-300 font-bold">
            <button onClick={() => setIsResearchModalOpen(true)} className="hover:underline min-h-[44px] px-2 inline-flex items-center">
              System Evaluation Survey
            </button>
            <span>•</span>
            <button onClick={() => handleOpenTracker()} className="hover:underline min-h-[44px] px-2 inline-flex items-center">
              Public Tracker Lookup
            </button>
          </div>
        </div>
      </footer>
      </div>

      {/* MODALS */}
      <ComplaintDetailsModal
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        complaint={selectedComplaint}
        staffList={staffList}
        onUpdateComplaint={handleUpdateComplaint}
        onArchiveComplaint={handleArchiveComplaint}
        isAdminView={activeTab === 'admin'}
      />

      <PublicTracker
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        initialCode={trackerCode}
        complaints={complaints}
      />

      <ResearchInfoModal
        isOpen={isResearchModalOpen}
        onClose={() => setIsResearchModalOpen(false)}
        avgSatisfactionScore={stats?.avgSatisfactionScore ?? 0}
        surveyCount={stats?.surveyCount ?? 0}
        onSurveySubmitted={fetchStats}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        initialRole={loginModalInitialRole}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          if (user.role === 'admin') {
            setActiveTab('admin');
          } else {
            setActiveTab('student');
          }
        }}
        onOpenTracker={() => handleOpenTracker()}
      />
    </div>
  );
}
