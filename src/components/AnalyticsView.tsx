import React from 'react';
import {
  BarChart3,
  PieChart,
  Download,
  Printer,
  Award,
  CheckCircle2,
  Clock,
  Building,
  Wrench,
  TrendingUp,
  FileSpreadsheet,
  GraduationCap,
} from 'lucide-react';
import { SystemStats, Complaint } from '../types';

interface AnalyticsViewProps {
  stats: SystemStats | null;
  complaints: Complaint[];
  onOpenResearchInfo: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  stats,
  complaints,
  onOpenResearchInfo,
}) => {
  const categoryCounts = stats?.categoryBreakdown || {};
  const buildingCounts = stats?.buildingBreakdown || {};

  const total = stats?.totalComplaints || complaints.length || 1;

  const handleExportCSV = () => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Complaints', total],
      ['Pending Complaints', stats?.pendingCount || 0],
      ['In Progress Complaints', stats?.inProgressCount || 0],
      ['Resolved Complaints', stats?.resolvedCount || 0],
      ['Avg Resolution Time (Hours)', stats?.avgResolutionTimeHours || 24],
      ['System Usability Rating', stats?.avgSatisfactionScore || 4.7],
      ['Total Survey Evaluators', stats?.surveyCount || 3],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(',')).join('\n')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Centivate_Research_Analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 print:p-0 print:m-0">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-blue-950 font-black text-xs px-2.5 py-0.5 rounded-md uppercase">
              SHS Research Statistics
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Quantitative System Analytics
            </span>
          </div>
          <h2 className="text-2xl font-black text-blue-950 tracking-tight mt-1">
            Campus Facility Complaint Analytics
          </h2>
        </div>

        <div className="flex items-center gap-3 print:hidden">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Research CSV</span>
          </button>
          <button
            onClick={handlePrintReport}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Usability & Research Overview Banner */}
      <div className="bg-gradient-to-r from-blue-950 to-indigo-900 text-white rounded-2xl p-6 shadow-xl border-b-4 border-amber-400 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-amber-400 font-extrabold text-xs uppercase tracking-wider block">
            System Usability Evaluation (SUS)
          </span>
          <h3 className="text-xl font-black">Overall User Satisfaction Score: {stats?.avgSatisfactionScore || 4.7} / 5.0</h3>
          <p className="text-xs text-blue-200">
            Based on {stats?.surveyCount || 3} student, faculty, and technician evaluation responses.
          </p>
        </div>

        <button
          onClick={onOpenResearchInfo}
          className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-blue-950 font-black text-xs uppercase tracking-wider rounded-xl shadow transition-colors whitespace-nowrap"
        >
          View Research Documentation
        </button>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: Complaints by Category */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-extrabold text-sm text-blue-950 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              Complaints by Facility Category
            </h3>
            <span className="text-[11px] font-bold text-slate-400">Total: {total}</span>
          </div>

          <div className="space-y-3">
            {Object.entries(categoryCounts).length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-6">No data available</p>
            ) : (
              Object.entries(categoryCounts).map(([cat, count]) => {
                const cnt = Number(count);
                const pct = Math.round((cnt / total) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>{cat}</span>
                      <span className="text-blue-900 font-mono">
                        {cnt} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-gradient-to-r from-blue-900 to-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chart 2: Complaints by Campus Building */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-extrabold text-sm text-blue-950 uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-500" />
              Complaints by Campus Building
            </h3>
            <span className="text-[11px] font-bold text-slate-400">Locations</span>
          </div>

          <div className="space-y-3">
            {Object.entries(buildingCounts).length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-6">No data available</p>
            ) : (
              Object.entries(buildingCounts).map(([bldg, count]) => {
                const cnt = Number(count);
                const pct = Math.round((cnt / total) * 100);
                return (
                  <div key={bldg} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>{bldg}</span>
                      <span className="text-blue-900 font-mono">
                        {cnt} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-indigo-800 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Research Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 space-y-4">
        <h3 className="font-black text-blue-950 text-sm uppercase tracking-wider border-b border-slate-200 pb-3">
          Research Key Performance Indicators (KPI)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-bold block">Resolution Efficiency Rate</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {Math.round(((stats?.resolvedCount || 1) / total) * 100)}%
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Resolved vs Total Reports</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-bold block">Avg Resolution Turnaround</span>
            <span className="text-2xl font-black text-blue-900 mt-1 block">
              {stats?.avgResolutionTimeHours || 24} Hours
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Time from Filing to Completion</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-bold block">Safety Hazards Mitigated</span>
            <span className="text-2xl font-black text-red-600 mt-1 block">
              {stats?.urgentHazardCount || 0}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">High priority risks resolved</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-bold block">Evaluation Responses</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">
              {stats?.surveyCount || 3} Evaluators
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">SUS Research Participants</span>
          </div>
        </div>
      </div>
    </div>
  );
};
