/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  };

  const handleTabChange = (tab: 'home' | 'student' | 'admin' | 'analytics' | 'research') => {
    if (tab === 'research') {
      setIsResearchModalOpen(true);
      return;
    }

    if (tab === 'admin' && currentUser?.role !== 'admin') {
      // Prompt admin login
      handleOpenLogin('admin');
      return;
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
          <StudentPortal
            complaints={complaints.filter((c) => !c.isArchived)}
            onCreateComplaint={handleCreateComplaint}
            onSelectComplaint={(c) => setSelectedComplaint(c)}
            onOpenTracker={handleOpenTracker}
            currentUser={currentUser}
            onOpenLogin={() => handleOpenLogin('student')}
          />
        )}

        {activeTab === 'admin' && (
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
