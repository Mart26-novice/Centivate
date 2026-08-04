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
} from 'lucide-react';
import { Complaint, ComplaintStatus, ComplaintCategory, BuildingLocation, SystemStats, MaintenanceStaff } from '../types';

interface AdminDashboardProps {
  complaints: Complaint[];
  stats: SystemStats | null;
  staffList: MaintenanceStaff[];
  onSelectComplaint: (complaint: Complaint) => void;
  onUpdateComplaintStatus: (id: string, status: ComplaintStatus, note?: string) => Promise<void>;
  onArchiveComplaint: (id: string) => Promise<void>;
  onRefreshData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  complaints,
  stats,
  staffList,
  onSelectComplaint,
  onUpdateComplaintStatus,
  onArchiveComplaint,
  onRefreshData,
}) => {
  // Filter States
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'table' | 'staff'>('table');

  // Filter Logic
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
        /* TECHNICIANS ROSTER VIEW */
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-6">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-blue-950">Campus Maintenance Staff Roster</h3>
              <p className="text-xs text-slate-500">
                Assigned technicians and their specialized facility repair domains.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.map((st) => (
              <div
                key={st.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs hover:border-amber-400 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-900 text-amber-300 rounded-xl flex items-center justify-center font-black text-lg">
                    {st.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-blue-950">{st.name}</h4>
                    <p className="text-xs font-bold text-amber-600">{st.role}</p>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Specialty:</span>
                    <span className="font-bold text-blue-900">{st.specialty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contact Hotline:</span>
                    <span className="font-mono font-semibold text-slate-800">{st.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Active Workload:</span>
                    <span className="font-bold text-emerald-700">{st.activeWorkload} Active Tasks</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
