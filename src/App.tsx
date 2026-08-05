/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserCheck, ShieldAlert, Lock, ShieldCheck } from 'lucide-react';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { StudentPortal } from './components/StudentPortal';
import { AdminDashboard } from './components/AdminDashboard';
import { AnalyticsView } from './components/AnalyticsView';
import { PublicTracker } from './components/PublicTracker';
import { ResearchInfoModal } from './components/ResearchInfoModal';
import { ComplaintDetailsModal } from './components/ComplaintDetailsModal';
import { LoginModal } from './components/LoginModal';
import { Complaint, ComplaintStatus, SystemStats, MaintenanceStaff, UserSession, UserRole } from './types';
import { INITIAL_COMPLAINTS, INITIAL_STAFF } from './data/initialData';
import { PRESET_USERS } from './data/authData';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'student' | 'admin' | 'analytics' | 'research'>('home');
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [staffList, setStaffList] = useState<MaintenanceStaff[]>(INITIAL_STAFF);

  // Authentication state
  const [currentUser, setCurrentUser] = useState<UserSession | null>(PRESET_USERS.student);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginModalInitialRole, setLoginModalInitialRole] = useState<UserRole>('student');

  // Modals
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isTrackerOpen, setIsTrackerOpen] = useState<boolean>(false);
  const [trackerCode, setTrackerCode] = useState<string>('');
  const [isResearchModalOpen, setIsResearchModalOpen] = useState<boolean>(false);

  // Fetch data on mount
  const fetchComplaints = async () => {
    try {
      const res = await fetch('/api/complaints?includeArchived=true');
      if (res.ok) {
        const data = await res.json();
        setComplaints(data);
      }
    } catch (err) {
      console.warn('Backend fetch failed, using local state:', err);
    }
  };

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

  useEffect(() => {
    fetchComplaints();
    fetchStats();
  }, []);

  const handleCreateComplaint = async (newReportData: any): Promise<Complaint> => {
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReportData),
      });

      if (res.ok) {
        const created: Complaint = await res.json();
        setComplaints((prev) => [created, ...prev]);
        fetchStats();
        return created;
      } else {
        throw new Error('Server returned error');
      }
    } catch (err) {
      // Fallback local creation if offline
      const now = new Date().toISOString();
      const code = `CENT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const fallback: Complaint = {
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

      setComplaints((prev) => [fallback, ...prev]);
      return fallback;
    }
  };

  const handleUpdateComplaint = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const updatedItem: Complaint = await res.json();
        setComplaints((prev) => prev.map((c) => (c.id === id ? updatedItem : c)));
        if (selectedComplaint?.id === id) {
          setSelectedComplaint(updatedItem);
        }
        fetchStats();
      }
    } catch (err) {
      console.error('Failed to update complaint:', err);
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

  const pendingCount = complaints.filter((c) => !c.isArchived && (c.status === 'Filed' || c.status === 'Pending')).length;
  const urgentCount = complaints.filter((c) => !c.isArchived && (c.priority === 'Urgent / Hazard' || c.priority === 'High')).length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;

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
              onSelectComplaint={(c) => setSelectedComplaint(c)}
              onUpdateComplaintStatus={handleUpdateComplaintStatus}
              onArchiveComplaint={handleArchiveComplaint}
              onRefreshData={() => {
                fetchComplaints();
                fetchStats();
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
