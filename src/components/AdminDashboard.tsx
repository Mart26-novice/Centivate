import React, { useState } from 'react';
import {
  LayoutDashboard,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
  Archive,
  UserCheck,
  Building,
  MapPin,
  Calendar,
  MoreVertical,
  Plus,
  ArrowUpDown,
  Download,
  Printer,
  ShieldAlert,
  Users,
  Eye,
  FileSpreadsheet,
  Pencil,
  Trash2,
  UserPlus,
  Phone,
  Briefcase,
  X,
  Check,
  Shield,
} from 'lucide-react';
import { Complaint, ComplaintStatus, ComplaintCategory, BuildingLocation, SystemStats, MaintenanceStaff } from '../types';

interface AdminDashboardProps {
  complaints: Complaint[];
  stats: SystemStats | null;
  staffList: MaintenanceStaff[];
  onSelectComplaint: (complaint: Complaint) => void;
  onUpdateComplaintStatus: (id: string, status: ComplaintStatus, note?: string) => Promise<void>;
  onArchiveComplaint: (id: string) => Promise<void>;
  onAddStaff?: (staffData: Omit<MaintenanceStaff, 'id' | 'activeWorkload'>) => Promise<void> | void;
  onUpdateStaff?: (id: string, updates: Partial<MaintenanceStaff>) => Promise<void> | void;
  onDeleteStaff?: (id: string) => Promise<void> | void;
  onRefreshData: () => void;
}

const CATEGORY_OPTIONS: ComplaintCategory[] = [
  'Restroom & Sanitation',
  'Classroom Furniture',
  'HVAC & Ventilation',
  'Lighting & Electrical',
  'Plumbing & Water',
  'IT & Audio-Visual',
  'Doors, Windows & Structure',
  'Grounds & Safety',
  'Other Facilities',
];

const PRESET_ROLES = [
  'Head Facilities Manager',
  'Lead Aircon & HVAC Technician',
  'Master Plumber & Water Specialist',
  'Master Electrician & Power Lead',
  'Carpentry & Furniture Repairs Lead',
  'IT & Audio-Visual Systems Specialist',
  'Campus Grounds & Safety Officer',
  'CPPO Facilities Administrator',
  'General Maintenance Worker',
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  complaints,
  stats,
  staffList,
  onSelectComplaint,
  onUpdateComplaintStatus,
  onArchiveComplaint,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  onRefreshData,
}) => {
  // Filter States
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'table' | 'staff'>('table');

  // Staff Management Modal State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<MaintenanceStaff | null>(null);
  const [staffSearchQuery, setStaffSearchQuery] = useState<string>('');

  // Form fields
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [customRole, setCustomRole] = useState<string>('');
  const [specialty, setSpecialty] = useState<ComplaintCategory>('Lighting & Electrical');
  const [phone, setPhone] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Staff Deletion Confirmation
  const [deleteConfirmStaff, setDeleteConfirmStaff] = useState<MaintenanceStaff | null>(null);

  const openAddStaffModal = () => {
    setEditingStaff(null);
    setName('');
    setRole('Head Facilities Manager');
    setCustomRole('');
    setSpecialty('Lighting & Electrical');
    setPhone('');
    setFormError('');
    setIsStaffModalOpen(true);
  };

  const openEditStaffModal = (st: MaintenanceStaff) => {
    setEditingStaff(st);
    setName(st.name);
    if (PRESET_ROLES.includes(st.role)) {
      setRole(st.role);
      setCustomRole('');
    } else {
      setRole('Custom');
      setCustomRole(st.role);
    }
    setSpecialty(st.specialty);
    setPhone(st.phone);
    setFormError('');
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Staff member full name is required.');
      return;
    }

    const finalRole = role === 'Custom' ? customRole.trim() : role.trim();
    if (!finalRole) {
      setFormError('Please select or specify a valid staff role/title.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (editingStaff) {
        if (onUpdateStaff) {
          await onUpdateStaff(editingStaff.id, {
            name: name.trim(),
            role: finalRole,
            specialty,
            phone: phone.trim() || '0917-000-0000',
          });
        }
      } else {
        if (onAddStaff) {
          await onAddStaff({
            name: name.trim(),
            role: finalRole,
            specialty,
            phone: phone.trim() || '0917-000-0000',
          });
        }
      }
      setIsStaffModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save staff information.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmStaff || !onDeleteStaff) return;
    setIsSubmitting(true);
    try {
      await onDeleteStaff(deleteConfirmStaff.id);
      setDeleteConfirmStaff(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete staff member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Logic for Complaints
  const filtered = complaints.filter((c) => {
    if (!showArchived && c.isArchived) return false;
    if (showArchived && !c.isArchived) return false;

    if (selectedStatus !== 'All' && c.status !== selectedStatus) return false;
    if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
    if (selectedBuilding !== 'All' && c.locationBuilding !== selectedBuilding) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        c.title.toLowerCase().includes(q) ||
        c.trackingCode.toLowerCase().includes(q) ||
        c.locationRoom.toLowerCase().includes(q) ||
        (c.studentName && c.studentName.toLowerCase().includes(q)) ||
        (c.assignedStaff && c.assignedStaff.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Filter Logic for Staff
  const filteredStaff = staffList.filter((st) => {
    if (!staffSearchQuery.trim()) return true;
    const q = staffSearchQuery.toLowerCase().trim();
    return (
      st.name.toLowerCase().includes(q) ||
      st.role.toLowerCase().includes(q) ||
      st.specialty.toLowerCase().includes(q) ||
      st.phone.toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    const headers = ['Tracking Code', 'Title', 'Category', 'Building', 'Room', 'Priority', 'Status', 'Assigned Staff', 'Filed Date', 'Student'];
    const rows = filtered.map((c) => [
      c.trackingCode,
      `"${c.title.replace(/"/g, '""')}"`,
      c.category,
      c.locationBuilding,
      c.locationRoom,
      c.priority,
      c.status,
      c.assignedStaff || 'Unassigned',
      new Date(c.createdAt).toLocaleDateString(),
      c.isAnonymous ? 'Anonymous' : c.studentName || 'Student',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Centivate_Complaints_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title & Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-blue-950 font-black text-xs px-2.5 py-0.5 rounded-md uppercase">
              Web Admin Portal
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Senior High School Maintenance Desk
            </span>
          </div>
          <h2 className="text-2xl font-black text-blue-950 tracking-tight mt-1">
            Facility Maintenance Management Dashboard
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV Dataset</span>
          </button>

          <div className="flex bg-slate-200 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'table' ? 'bg-blue-900 text-amber-300 shadow' : 'text-slate-700'
              }`}
            >
              Work Orders Table
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'staff' ? 'bg-blue-900 text-amber-300 shadow' : 'text-slate-700'
              }`}
            >
              Technicians Roster ({staffList.length})
            </button>
          </div>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
            Total Reports
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-950">
              {stats?.totalComplaints ?? complaints.length}
            </span>
            <LayoutDashboard className="w-5 h-5 text-blue-800" />
          </div>
        </div>

        {/* Filed / Pending */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-amber-600 tracking-wider">
            Pending Review
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600">
              {(stats?.filedCount ?? 0) + (stats?.pendingCount ?? 0)}
            </span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-indigo-600 tracking-wider">
            In Progress
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-indigo-600">
              {stats?.inProgressCount ?? 0}
            </span>
            <Wrench className="w-5 h-5 text-indigo-500" />
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-emerald-600 tracking-wider">
            Resolved
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600">
              {stats?.resolvedCount ?? 0}
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
        </div>

        {/* Urgent Hazards */}
        <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-red-600 tracking-wider">
            Urgent Hazards
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-red-600">
              {stats?.urgentHazardCount ?? 0}
            </span>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
        </div>

        {/* Avg Time */}
        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-blue-800 tracking-wider">
            Avg Resolution
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-900">
              {stats?.avgResolutionTimeHours ?? 24}h
            </span>
            <Clock className="w-5 h-5 text-blue-800" />
          </div>
        </div>
      </div>

      {activeTab === 'table' ? (
        /* MAIN WORK ORDERS TABLE CONTAINER */
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden space-y-4 p-6">
          {/* Filter Bar Controls */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by Code, Title, Room, Student, Staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-blue-950 focus:ring-2 focus:ring-amber-400 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Filed">Filed</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-blue-950 focus:ring-2 focus:ring-amber-400 focus:outline-none"
              >
                <option value="All">All Categories</option>
                <option value="Restroom & Sanitation">Restroom & Sanitation</option>
                <option value="Classroom Furniture">Classroom Furniture</option>
                <option value="HVAC & Ventilation">HVAC & Ventilation</option>
                <option value="Lighting & Electrical">Lighting & Electrical</option>
                <option value="Plumbing & Water">Plumbing & Water</option>
                <option value="IT & Audio-Visual">IT & Audio-Visual</option>
                <option value="Doors, Windows & Structure">Doors & Windows</option>
              </select>

              <select
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-blue-950 focus:ring-2 focus:ring-amber-400 focus:outline-none"
              >
                <option value="All">All Buildings</option>
                <option value="Main Building A">Main Building A</option>
                <option value="Science & Tech Wing B">Science & Tech Wing B</option>
                <option value="Senior High Building C">Senior High Building C</option>
                <option value="Gymnasium & Sports Complex">Gymnasium</option>
                <option value="Library & Learning Commons">Library</option>
              </select>

              <button
                type="button"
                onClick={() => setShowArchived(!showArchived)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 ${
                  showArchived
                    ? 'bg-amber-400 text-blue-950 border-amber-500'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span>{showArchived ? 'Viewing Archived' : 'Show Archive'}</span>
              </button>
            </div>
          </div>

          {/* TABLE VIEW */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-blue-950 text-white font-extrabold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Issue & Category</th>
                  <th className="p-3.5">Building & Room</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Assigned Staff</th>
                  <th className="p-3.5">Filed Date</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">
                      No complaints found matching current filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="p-3.5 font-mono font-bold text-blue-950" onClick={() => onSelectComplaint(item)}>
                        <span className="bg-blue-100 text-blue-900 px-2 py-1 rounded border border-blue-200">
                          {item.trackingCode}
                        </span>
                      </td>

                      <td className="p-3.5" onClick={() => onSelectComplaint(item)}>
                        <p className="font-bold text-slate-900 group-hover:text-blue-900 line-clamp-1">
                          {item.title}
                        </p>
                        <span className="text-[10px] text-slate-500 font-semibold block">
                          {item.category}
                        </span>
                      </td>

                      <td className="p-3.5" onClick={() => onSelectComplaint(item)}>
                        <p className="font-semibold text-slate-800">{item.locationBuilding}</p>
                        <span className="text-[10px] text-slate-500">{item.locationRoom}</span>
                      </td>

                      <td className="p-3.5" onClick={() => onSelectComplaint(item)}>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            item.priority === 'Urgent / Hazard'
                              ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                              : item.priority === 'High'
                              ? 'bg-orange-100 text-orange-800'
                              : item.priority === 'Medium'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </td>

                      <td className="p-3.5" onClick={() => onSelectComplaint(item)}>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            item.status === 'Resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'In Progress'
                              ? 'bg-indigo-100 text-indigo-800'
                              : item.status === 'Pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="p-3.5 font-semibold text-slate-700" onClick={() => onSelectComplaint(item)}>
                        {item.assignedStaff ? (
                          <span className="text-blue-900 font-bold">{item.assignedStaff}</span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="p-3.5 text-slate-500 font-mono text-[11px]" onClick={() => onSelectComplaint(item)}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>

                      <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => onSelectComplaint(item)}
                          className="px-2.5 py-1 bg-blue-900 hover:bg-blue-800 text-white font-bold text-[11px] rounded transition-colors"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TECHNICIANS ROSTER & STAFF MANAGEMENT VIEW */
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-900 text-amber-300 font-extrabold text-[10px] px-2 py-0.5 rounded uppercase">
                  CPPO Personnel Desk
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  {staffList.length} Registered Staff & Technicians
                </span>
              </div>
              <h3 className="text-xl font-black text-blue-950 tracking-tight mt-0.5">
                Campus Maintenance Staff & Role Roster
              </h3>
              <p className="text-xs text-slate-500">
                Manage, add, edit, or re-assign technician roles and domain specialties for facilities repairs.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Staff Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter staff by name, role..."
                  value={staffSearchQuery}
                  onChange={(e) => setStaffSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none w-48 sm:w-60"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              {/* Add Staff Button */}
              <button
                onClick={openAddStaffModal}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-blue-950 font-black text-xs rounded-xl shadow transition-transform transform active:scale-95 flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add New Staff / Role</span>
              </button>
            </div>
          </div>

          {filteredStaff.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="font-extrabold text-sm text-slate-700">No staff members found matching your search query.</p>
              <button
                onClick={() => setStaffSearchQuery('')}
                className="text-xs font-bold text-blue-900 underline hover:text-amber-600"
              >
                Clear Search Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredStaff.map((st) => (
                <div
                  key={st.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-950 text-amber-300 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner shrink-0 border border-amber-400/30">
                          {st.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-blue-950 group-hover:text-amber-600 transition-colors">
                            {st.name}
                          </h4>
                          <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-900 font-bold text-[11px] rounded-md border border-amber-300/60 mt-0.5">
                            {st.role}
                          </span>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditStaffModal(st)}
                          className="p-1.5 text-slate-500 hover:text-blue-950 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit Staff Details & Reassign Role"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmStaff(st)}
                          className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                          title="Remove Staff Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          <span>Specialty Domain:</span>
                        </span>
                        <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-[11px]">
                          {st.specialty}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>Phone Hotline:</span>
                        </span>
                        <span className="font-mono font-bold text-slate-800">{st.phone}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Wrench className="w-3.5 h-3.5 text-slate-400" />
                          <span>Active Workload:</span>
                        </span>
                        <span
                          className={`font-black px-2 py-0.5 rounded text-[11px] ${
                            st.activeWorkload === 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : st.activeWorkload < 3
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {st.activeWorkload} Active Task{st.activeWorkload === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-200/60">
                    <span className="font-mono font-semibold">ID: {st.id}</span>
                    <button
                      onClick={() => openEditStaffModal(st)}
                      className="text-blue-900 hover:text-amber-600 font-bold transition-colors"
                    >
                      Reassign Role →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADD / EDIT STAFF MODAL */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden space-y-0">
            {/* Modal Header */}
            <div className="bg-blue-950 text-white p-5 flex items-center justify-between border-b border-blue-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-400 text-blue-950 rounded-xl flex items-center justify-center font-black">
                  {editingStaff ? <Pencil className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">
                    {editingStaff ? 'Edit Staff Member & Role' : 'Add New Maintenance Staff'}
                  </h3>
                  <p className="text-xs text-amber-300 font-semibold">
                    {editingStaff ? `Updating record for ${editingStaff.name}` : 'Register technician to CPPO dispatch roster'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-blue-900 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveStaff} className="p-6 space-y-4 text-xs font-semibold text-slate-800">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-2 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-slate-700 font-extrabold">
                  Staff Member Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Engr. Juan Dela Cruz"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-semibold text-blue-950 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  required
                />
              </div>

              {/* Role Title Selection */}
              <div className="space-y-1">
                <label className="block text-slate-700 font-extrabold">
                  Assigned Staff Role / Position <span className="text-red-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-bold text-blue-950 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  {PRESET_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                  <option value="Custom">+ Specify Custom Role Title...</option>
                </select>
              </div>

              {/* Custom Role Input if selected */}
              {role === 'Custom' && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="block text-slate-700 font-extrabold">
                    Custom Role Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Refrigeration Specialist"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    className="w-full bg-amber-50 border border-amber-300 rounded-xl px-3.5 py-2.5 font-bold text-blue-950 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              )}

              {/* Specialty Domain */}
              <div className="space-y-1">
                <label className="block text-slate-700 font-extrabold">
                  Specialty Facility Domain <span className="text-red-500">*</span>
                </label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value as ComplaintCategory)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-bold text-blue-950 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phone Hotline */}
              <div className="space-y-1">
                <label className="block text-slate-700 font-extrabold">Contact Phone Hotline / Intercom</label>
                <input
                  type="text"
                  placeholder="e.g. 0917-555-0101 or Ext. 402"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-semibold text-blue-950 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              {/* Live Preview Card */}
              <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200 space-y-1">
                <span className="text-[10px] font-black uppercase text-blue-800 tracking-wider">Role Summary Preview</span>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-blue-950">{name || 'Staff Name'}</p>
                    <p className="text-amber-700 font-bold text-xs">{role === 'Custom' ? customRole || 'Custom Role' : role}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-900 text-amber-300 rounded font-bold text-[10px]">
                    {specialty}
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-950 hover:bg-blue-900 text-amber-300 font-black rounded-xl shadow transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingStaff ? 'Save Changes' : 'Register Staff'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 text-center">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto border-2 border-red-200 shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-blue-950">Remove Staff Member?</h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to remove <strong className="text-blue-950">{deleteConfirmStaff.name}</strong> ({deleteConfirmStaff.role}) from the active technicians roster?
              </p>
            </div>

            {deleteConfirmStaff.activeWorkload > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-bold text-left flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Notice: This technician currently has <strong>{deleteConfirmStaff.activeWorkload} active assigned tasks</strong>. Deleting will set those tasks to unassigned.
                </span>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmStaff(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel Keep Staff
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Remove Staff</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
