/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { UserCheck, ShieldAlert, Lock, ShieldCheck, Loader2 } from 'lucide-react';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { PublicTracker } from './components/PublicTracker';
import { ResearchInfoModal } from './components/ResearchInfoModal';
import { ComplaintDetailsModal } from './components/ComplaintDetailsModal';
import { LoginModal } from './components/LoginModal';

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
import { INITIAL_COMPLAINTS, INITIAL_STAFF, INITIAL_STUDENTS } from './data/initialData';
import { PRESET_USERS } from './data/authData';
import {
  subscribeToComplaints,
  subscribeToStudents,
  subscribeToStaff,
  subscribeToSurveys,
  addComplaintToDb,
  updateComplaintInDb,
  saveStudentToDb,
  deleteStudentFromDb,
  saveStaffToDb,
  deleteStaffFromDb,
} from './lib/firestoreService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'student' | 'admin' | 'analytics' | 'research'>('home');
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [staffList, setStaffList] = useState<MaintenanceStaff[]>(INITIAL_STAFF);
  const [studentList, setStudentList] = useState<OfficialStudent[]>(INITIAL_STUDENTS);

  // Authentication state
  const [currentUser, setCurrentUser] = useState<UserSession | null>(PRESET_USERS.student);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginModalInitialRole, setLoginModalInitialRole] = useState<UserRole>('student');

  // Modals
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isTrackerOpen, setIsTrackerOpen] = useState<boolean>(false);
  const [trackerCode, setTrackerCode] = useState<string>('');
  const [isResearchModalOpen, setIsResearchModalOpen] = useState<boolean>(false);

  // Real-time Firestore sync on mount
  useEffect(() => {
    // 1. Subscribe to complaints in Firestore
    const unsubscribeComplaints = subscribeToComplaints((liveComplaints) => {
      setComplaints(liveComplaints);
    });

    // 2. Subscribe to official students in Firestore
    const unsubscribeStudents = subscribeToStudents((liveStudents) => {
      setStudentList(liveStudents);
    });

    // 3. Subscribe to staff in Firestore (auto-seeds staff collection if empty)
    const unsubscribeStaff = subscribeToStaff((liveStaff) => {
      setStaffList(liveStaff);
    });

    // 4. Subscribe to surveys in Firestore (auto-seeds surveys collection if empty)
    const unsubscribeSurveys = subscribeToSurveys(() => {
      // surveys seeded and synchronized in Firestore
    });

    fetchStats();

    return () => {
      unsubscribeComplaints();
      unsubscribeStudents();
      unsubscribeStaff();
      unsubscribeSurveys();
    };
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.warn('Stats fetch failed:', err);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/staff');
      if (res.ok) {
        const data = await res.json();
        setStaffList(data);
      }
    } catch (err) {
      console.warn('Staff fetch failed:', err);
    }
  };

  const handleCreateComplaint = async (newReportData: any): Promise<Complaint> => {
    let created: Complaint;
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReportData),
      });

      if (res.ok) {
        created = await res.json();
      } else {
        throw new Error('Server returned error');
      }
    } catch (err) {
      // Fallback local creation if offline
      const now = new Date().toISOString();
      const code = `CENT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      created = {
        id: `CMP-${Date.now()}`,
        trackingCode: code,
        title: newReportData.title,
        description: newReportData.description,
        category: newReportData.category,
        locationBuilding: newReportData.locationBuilding,
        locationRoom: newReportData.locationRoom,
        priority: newReportData.priority || 'Medium',
        status: 'Filed',
        photoUrl: newReportData.photoUrl || '',
        studentName: newReportData.isAnonymous ? 'Anonymous' : newReportData.studentName,
        studentStrand: newReportData.isAnonymous ? '' : newReportData.studentStrand,
        isAnonymous: !!newReportData.isAnonymous,
        contactEmail: newReportData.contactEmail || '',
        logs: [
          {
            id: `LOG-${Date.now()}`,
            status: 'Filed',
            note: 'Complaint filed via Student Portal.',
            updatedBy: newReportData.studentName || 'Student',
            timestamp: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
        isArchived: false,
      };
    }

    // Always persist to live Firestore database
    try {
      await addComplaintToDb(created);
    } catch (e) {
      console.warn('Firestore add complaint error:', e);
    }

    setComplaints((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
    fetchStats();
    return created;
  };

  const handleUpdateComplaint = async (id: string, updates: any) => {
    try {
      await fetch(`/api/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.warn('API update failed, applying to Firestore directly:', err);
    }

    // Persist update in Firestore
    try {
      await updateComplaintInDb(id, updates);
    } catch (e) {
      console.warn('Firestore update complaint error:', e);
    }

    fetchStats();
  };

  const handleSaveStudent = async (student: OfficialStudent) => {
    try {
      await saveStudentToDb(student);
    } catch (err) {
      console.error('Failed to save student to Firestore:', err);
      setStudentList((prev) => {
        const exists = prev.some((s) => s.id === student.id);
        if (exists) return prev.map((s) => (s.id === student.id ? student : s));
        return [...prev, student];
      });
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      await deleteStudentFromDb(id);
    } catch (err) {
      console.error('Failed to delete student from Firestore:', err);
      setStudentList((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleUpdateComplaintStatus = async (id: string, newStatus: ComplaintStatus, note?: string) => {
    await handleUpdateComplaint(id, {
      status: newStatus,
      note: note || `Status updated to ${newStatus}`,
      updatedBy: 'Admin Maintenance Team',
    });
  };

  const handleArchiveComplaint = async (id: string) => {
    try {
      await fetch(`/api/complaints/${id}`, { method: 'DELETE' });
      setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, isArchived: true } : c)));
      if (selectedComplaint?.id === id) {
        setSelectedComplaint(null);
      }
      fetchStats();
    } catch (err) {
      console.error('Archive error:', err);
    }
  };

  const handleCreateStaff = async (staffData: Omit<MaintenanceStaff, 'id' | 'activeWorkload'>) => {
    let created: MaintenanceStaff;
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffData),
      });
      if (res.ok) {
        created = await res.json();
      } else {
        throw new Error('Server creation failed');
      }
    } catch (err) {
      console.warn('Backend API create staff failed, using Firestore fallback:', err);
      created = {
        id: `ST-${Date.now().toString().slice(-4)}`,
        ...staffData,
        activeWorkload: 0,
      };
    }
    try {
      await saveStaffToDb(created);
    } catch (e) {
      console.warn('Firestore save staff error:', e);
    }
  };

  const handleUpdateStaff = async (id: string, updates: Partial<MaintenanceStaff>) => {
    try {
      await fetch(`/api/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.warn('Backend API update staff failed:', err);
    }
    const existing = staffList.find((s) => s.id === id);
    if (existing) {
      const updatedMember = { ...existing, ...updates };
      try {
        await saveStaffToDb(updatedMember);
      } catch (e) {
        console.warn('Firestore update staff error:', e);
      }
    }
  };

  const handleDeleteStaff = async (id: string) => {
    try {
      await fetch(`/api/staff/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend API delete staff failed:', err);
    }
    try {
      await deleteStaffFromDb(id);
    } catch (e) {
      console.warn('Firestore delete staff error:', e);
    }
  };

  const handleOpenTracker = (code?: string) => {
    setTrackerCode(code || '');
    setIsTrackerOpen(true);
  };

  const handleOpenLogin = (role?: UserRole) => {
    setLoginModalInitialRole(role || 'student');
    setIsLoginModalOpen(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('home');
  };

  const handleTabChange = (tab: 'home' | 'student' | 'admin' | 'analytics' | 'research') => {
    if (tab === 'research') {
      setIsResearchModalOpen(true);
      return;
    }

    if (tab === 'student') {
      if (!currentUser) {
        handleOpenLogin('student');
        return;
      }
      if (currentUser.role !== 'student') {
        setActiveTab('student');
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
        return;
      }
    }

    setActiveTab(tab);
  };

  const pendingCount = useMemo(
    () => complaints.filter((c) => !c.isArchived && (c.status === 'Filed' || c.status === 'Pending')).length,
    [complaints]
  );
  const urgentCount = useMemo(
    () => complaints.filter((c) => !c.isArchived && (c.priority === 'Urgent / Hazard' || c.priority === 'High')).length,
    [complaints]
  );
  const resolvedCount = useMemo(
    () => complaints.filter((c) => c.status === 'Resolved').length,
    [complaints]
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-amber-300 selection:text-blue-950">
      {/* Global Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenTracker={handleOpenTracker}
        onOpenResearchInfo={() => setIsResearchModalOpen(true)}
        pendingCount={pendingCount}
        urgentCount={urgentCount}
        currentUser={currentUser}
        onOpenLogin={handleOpenLogin}
        onLogout={handleLogout}
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
            ) : currentUser.role !== 'student' ? (
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
          <div className="flex items-center gap-3 text-[11px] text-amber-300 font-bold">
            <button onClick={() => setIsResearchModalOpen(true)} className="hover:underline">
              System Evaluation Survey
            </button>
            <span>•</span>
            <button onClick={() => handleOpenTracker()} className="hover:underline">
              Public Tracker Lookup
            </button>
          </div>
        </div>
      </footer>

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
        avgSatisfactionScore={stats?.avgSatisfactionScore || 4.7}
        surveyCount={stats?.surveyCount || 3}
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
