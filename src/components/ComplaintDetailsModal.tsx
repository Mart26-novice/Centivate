import React, { useState } from 'react';
import {
  X,
  Clock,
  User,
  Building,
  MapPin,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Sparkles,
  Send,
  Archive,
  RefreshCw,
  ShieldAlert,
  Calendar,
} from 'lucide-react';
import { Complaint, ComplaintStatus, ComplaintPriority, MaintenanceStaff } from '../types';
import campusBg from '../assets/images/cpu_campus_aerial.jpg';

interface ComplaintDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: Complaint | null;
  staffList: MaintenanceStaff[];
  onUpdateComplaint: (id: string, updates: any) => Promise<void>;
  onArchiveComplaint?: (id: string) => Promise<void>;
  isAdminView?: boolean;
}

export const ComplaintDetailsModal: React.FC<ComplaintDetailsModalProps> = ({
  isOpen,
  onClose,
  complaint,
  staffList,
  onUpdateComplaint,
  onArchiveComplaint,
  isAdminView = true,
}) => {
  if (!isOpen || !complaint) return null;

  const [status, setStatus] = useState<ComplaintStatus>(complaint.status);
  const [priority, setPriority] = useState<ComplaintPriority>(complaint.priority);
  const [assignedStaff, setAssignedStaff] = useState<string>(complaint.assignedStaff || '');
  const [estimatedDate, setEstimatedDate] = useState<string>(complaint.estimatedResolutionDate || '');
  const [resolutionNotes, setResolutionNotes] = useState<string>(complaint.resolutionNotes || '');
  const [resolutionPhotoUrl, setResolutionPhotoUrl] = useState<string>(complaint.resolutionPhotoUrl || '');
  const [logNote, setLogNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  const handleStatusChange = async () => {
    setIsSubmitting(true);
    try {
      await onUpdateComplaint(complaint.id, {
        status,
        priority,
        assignedStaff,
        estimatedResolutionDate: estimatedDate,
        resolutionNotes,
        resolutionPhotoUrl,
        note: logNote || `Status updated to ${status}.`,
        updatedBy: isAdminView ? 'Admin / Maintenance Team' : 'Student Portal',
      });
      setLogNote('');
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateAiAdvice = async () => {
    setAiGenerating(true);
    try {
      const res = await fetch('/api/ai/analyze-complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: complaint.title,
          description: complaint.description,
          building: complaint.locationBuilding,
          room: complaint.locationRoom,
          category: complaint.category,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update local complaint object with AI analysis
        await onUpdateComplaint(complaint.id, {
          priority: data.suggestedPriority || priority,
          note: `Gemini AI Maintenance Advisory generated: ${data.recommendedMaintenanceAction}`,
          updatedBy: 'Gemini AI Assistant',
        });
      }
    } catch (err) {
      console.error('AI analysis error:', err);
    } finally {
      setAiGenerating(false);
    }
  };

  const handlePrintSlip = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Centivate Facility Work Order - ${complaint.trackingCode}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #1e293b; }
            .header { border-bottom: 3px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #1e3a8a; }
            .sub { font-size: 12px; color: #64748b; }
            .box { border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; margin-bottom: 15px; background: #f8fafc; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; }
            .label { font-weight: bold; color: #334155; }
            .status { font-weight: bold; color: #1e3a8a; }
            .footer { margin-top: 30px; font-size: 11px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">CENTIVATE - CAMPUS FACILITY WORK ORDER</div>
            <div class="sub">Senior High School Maintenance & Complaint Reporting System</div>
          </div>
          <div class="box">
            <p><strong>Tracking Code:</strong> ${complaint.trackingCode}</p>
            <p><strong>Issue Title:</strong> ${complaint.title}</p>
            <p><strong>Description:</strong> ${complaint.description}</p>
          </div>
          <div class="grid box">
            <div><span class="label">Category:</span> ${complaint.category}</div>
            <div><span class="label">Priority:</span> ${complaint.priority}</div>
            <div><span class="label">Building:</span> ${complaint.locationBuilding}</div>
            <div><span class="label">Room / Area:</span> ${complaint.locationRoom}</div>
            <div><span class="label">Status:</span> <span class="status">${complaint.status}</span></div>
            <div><span class="label">Assigned Staff:</span> ${complaint.assignedStaff || 'Unassigned'}</div>
            <div><span class="label">Filed By:</span> ${complaint.isAnonymous ? 'Anonymous' : complaint.studentName} (${complaint.studentStrand || 'SHS'})</div>
            <div><span class="label">Filed Date:</span> ${new Date(complaint.createdAt).toLocaleString()}</div>
          </div>
          ${
            complaint.resolutionNotes
              ? `<div class="box"><strong>Resolution Notes:</strong> ${complaint.resolutionNotes}</div>`
              : ''
          }
          <div class="footer">
            Printed on ${new Date().toLocaleString()} • Centivate SHS Capstone Research Project
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-blue-200 overflow-hidden animate-fadeIn my-6 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 text-white px-6 py-4 flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-3">
            <span className="bg-amber-400 text-blue-950 font-mono font-black text-xs px-2.5 py-1 rounded-md shadow">
              {complaint.trackingCode}
            </span>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg line-clamp-1">{complaint.title}</h3>
              <p className="text-xs text-blue-200 flex items-center gap-2">
                <span>{complaint.category}</span>
                <span>•</span>
                <span>{complaint.locationBuilding}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintSlip}
              title="Print Work Order Slip"
              className="p-1.5 bg-blue-800 hover:bg-blue-700 text-amber-300 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-blue-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-800">
          {/* Top Status & Priority Badge Strip */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-bold">Current Status:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  complaint.status === 'Resolved'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : complaint.status === 'In Progress'
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                    : complaint.status === 'Pending'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : complaint.status === 'Cancelled'
                    ? 'bg-slate-200 text-slate-700 border border-slate-300'
                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                }`}
              >
                {complaint.status}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-bold">Priority Level:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black ${
                  complaint.priority === 'Urgent / Hazard'
                    ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                    : complaint.priority === 'High'
                    ? 'bg-orange-100 text-orange-800'
                    : complaint.priority === 'Medium'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {complaint.priority}
              </span>
            </div>
          </div>

          {/* Description & Main Info */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Issue Description
              </label>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-medium">
                {complaint.description}
              </div>
            </div>

            {/* Reporter & Location Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-800" />
                <div>
                  <span className="text-slate-500 font-semibold block">Filed By:</span>
                  <span className="font-bold text-blue-950">
                    {complaint.isAnonymous
                      ? 'Anonymous Student'
                      : `${complaint.studentName || 'Student'} (${complaint.studentStrand || 'SHS'})`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-800" />
                <div>
                  <span className="text-slate-500 font-semibold block">Specific Location:</span>
                  <span className="font-bold text-blue-950">
                    {complaint.locationBuilding} — {complaint.locationRoom}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Photo Evidence Attached */}
          {complaint.photoUrl && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Attached Photo Evidence
              </label>
              <img
                src={complaint.photoUrl}
                alt="Facility damage"
                referrerPolicy="no-referrer"
                className="w-full h-56 object-cover rounded-xl border border-slate-300 shadow-sm"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = campusBg;
                }}
              />
            </div>
          )}

          {/* Gemini AI Analysis Box */}
          {complaint.aiAnalysis && (
            <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-950 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span>Gemini AI Safety & Technical Diagnosis</span>
                </div>
                {complaint.aiAnalysis.safetyHazardDetected && (
                  <span className="bg-red-500 text-white font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Safety Hazard Flagged
                  </span>
                )}
              </div>
              <p className="text-slate-700">
                <strong>Urgency Note:</strong> {complaint.aiAnalysis.urgencyReason}
              </p>
              <p className="text-slate-700">
                <strong>Recommended Action:</strong> {complaint.aiAnalysis.recommendedMaintenanceAction}
              </p>
            </div>
          )}

          {/* ADMIN MANAGEMENT CONTROLS */}
          {isAdminView && (
            <div className="bg-slate-100 p-4 rounded-xl border border-slate-300 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-blue-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-amber-500" />
                  <span>Maintenance Admin Controls</span>
                </h4>
                <button
                  type="button"
                  onClick={handleGenerateAiAdvice}
                  disabled={aiGenerating}
                  className="px-3 py-1 bg-blue-900 hover:bg-blue-800 text-amber-300 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{aiGenerating ? 'Analyzing with Gemini...' : 'Run Gemini Maintenance Advisor'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* Status Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Update Status
                  </label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-blue-950 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  >
                    <option value="Filed">Filed</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Priority Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Set Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-blue-950 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent / Hazard">Urgent / Hazard</option>
                  </select>
                </div>

                {/* Assign Staff */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Assign Maintenance Staff
                  </label>
                  <select
                    value={assignedStaff}
                    onChange={(e) => setAssignedStaff(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-blue-950 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  >
                    <option value="">-- Unassigned --</option>
                    {staffList.map((st) => (
                      <option key={st.id} value={st.name}>
                        {st.name} ({st.specialty})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Estimated Completion Date & Resolution Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Est. Resolution Target Date
                  </label>
                  <input
                    type="date"
                    value={estimatedDate}
                    onChange={(e) => setEstimatedDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Add Status Log Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Parts retrieved from shop, repair ongoing..."
                    value={logNote}
                    onChange={(e) => setLogNote(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Resolution Notes field */}
              {status === 'Resolved' && (
                <div>
                  <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                    Final Resolution Summary Notes
                  </label>
                  <textarea
                    rows={2}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Describe repair actions performed, parts replaced, and safety verification..."
                    className="w-full bg-white border border-emerald-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                {onArchiveComplaint && (
                  <button
                    type="button"
                    onClick={() => onArchiveComplaint(complaint.id)}
                    className="text-xs text-slate-600 hover:text-red-700 font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Archive Complaint</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleStatusChange}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-blue-950 font-black text-xs uppercase tracking-wider rounded-xl shadow transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving Changes...' : 'Save & Update Log'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Audit History Logs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Status History Audit Trail
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto p-1">
              {complaint.logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-blue-950">{log.status}</span>
                      <span className="text-[11px] text-slate-500">• {log.updatedBy}</span>
                    </div>
                    <p className="text-slate-700 mt-1 font-medium">{log.note}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap ml-2">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-3 flex justify-end border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
          >
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
};
