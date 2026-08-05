import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  Clock,
  Wrench,
  AlertCircle,
  Building,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Complaint, ComplaintStatus } from '../types';

interface PublicTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  complaints?: Complaint[];
}

const STATUS_STEPS: { status: ComplaintStatus; label: string; icon: any }[] = [
  { status: 'Filed', label: 'Report Filed', icon: FileText },
  { status: 'Pending', label: 'Admin Verified', icon: Clock },
  { status: 'In Progress', label: 'Work In Progress', icon: Wrench },
  { status: 'Resolved', label: 'Issue Resolved', icon: CheckCircle2 },
];

export const PublicTracker: React.FC<PublicTrackerProps> = ({
  isOpen,
  onClose,
  initialCode = '',
  complaints = [],
}) => {
  const [code, setCode] = useState(initialCode);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchTracker = async (searchCode: string) => {
    const trimmed = searchCode.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError(null);

    // 1. Check in client-side complaints list (from App state / Firestore subscription)
    const localMatch = complaints.find(
      (c) =>
        c.trackingCode.toUpperCase() === trimmed ||
        c.id.toUpperCase() === trimmed ||
        c.trackingCode.toUpperCase().includes(trimmed)
    );

    if (localMatch) {
      setComplaint(localMatch);
      setLoading(false);
      return;
    }

    // 2. Query backend API
    try {
      const res = await fetch(`/api/complaints/track/${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        setComplaint(data);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Backend API search failed, querying Firestore directly:', err);
    }

    // 3. Fallback: Query Firestore database directly
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      const snap = await getDocs(collection(db, 'complaints'));
      let fsMatch: Complaint | null = null;
      snap.forEach((docSnap) => {
        const data = docSnap.data() as Complaint;
        if (
          data.trackingCode &&
          (data.trackingCode.toUpperCase() === trimmed || docSnap.id.toUpperCase() === trimmed)
        ) {
          fsMatch = { id: docSnap.id, ...data };
        }
      });

      if (fsMatch) {
        setComplaint(fsMatch);
      } else {
        setComplaint(null);
        setError(`No complaint found with tracking code: ${trimmed}`);
      }
    } catch (fsErr: any) {
      console.error('Firestore tracker query error:', fsErr);
      setComplaint(null);
      setError('Tracking code not found in system.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      handleFetchTracker(initialCode);
    }
  }, [initialCode]);

  // Real-time synchronization: automatically update the displayed complaint whenever live complaints update
  useEffect(() => {
    if (complaint && complaints && complaints.length > 0) {
      const liveMatch = complaints.find(
        (c) =>
          c.id === complaint.id ||
          (c.trackingCode &&
            complaint.trackingCode &&
            c.trackingCode.trim().toUpperCase() === complaint.trackingCode.trim().toUpperCase())
      );
      if (liveMatch && JSON.stringify(liveMatch) !== JSON.stringify(complaint)) {
        setComplaint(liveMatch);
      }
    }
  }, [complaints]);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleFetchTracker(code);
  };

  const getStepIndex = (currentStatus: ComplaintStatus | string): number => {
    const s = (currentStatus || '').toLowerCase().trim();
    if (s === 'filed') return 0;
    if (s === 'pending') return 1;
    if (s === 'in progress' || s === 'inprogress' || s === 'ongoing') return 2;
    if (s === 'resolved' || s === 'completed' || s === 'done' || s === 'fixed') return 3;
    if (s === 'cancelled' || s === 'canceled') return -1;
    return 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-blue-200 overflow-hidden animate-fadeIn my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 to-blue-900 text-white px-6 py-4 flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-extrabold text-lg">Live Complaint Tracking</h3>
              <p className="text-xs text-blue-200">Public Transparency Tracker</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-blue-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Code Search Input */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter Reference Code (e.g. CENT-2026-8912)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm font-semibold uppercase tracking-wider text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-blue-950 font-black text-xs uppercase tracking-wider rounded-xl shadow transition-colors flex items-center gap-1.5"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-1" />
              <p className="text-xs font-bold text-red-800">{error}</p>
              <p className="text-[11px] text-red-600 mt-0.5">
                Please double-check your code format (e.g., CENT-2026-8912).
              </p>
            </div>
          )}

          {/* Results Display */}
          {complaint && (
            <div className="space-y-6">
              {/* Header Box */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-900 text-amber-300 font-mono font-extrabold text-xs px-2.5 py-1 rounded-md">
                      {complaint.trackingCode}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Filed: {new Date(complaint.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-blue-950 mt-1">{complaint.title}</h4>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      complaint.status === 'Resolved'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : complaint.status === 'In Progress'
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                        : complaint.status === 'Pending'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}
                  >
                    {complaint.status}
                  </span>
                </div>
              </div>

              {/* Workflow Stepper */}
              {complaint.status !== 'Cancelled' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Progress Workflow
                  </label>
                  <div className="relative flex items-center justify-between max-w-md mx-auto px-4">
                    {/* Connecting Line */}
                    <div className="absolute top-1/2 left-8 right-8 h-1 bg-slate-200 -translate-y-1/2 z-0" />
                    <div
                      className={`absolute top-1/2 left-8 h-1 -translate-y-1/2 z-0 transition-all duration-500 ${
                        getStepIndex(complaint.status) === 3 ? 'bg-emerald-500' : 'bg-amber-400'
                      }`}
                      style={{
                        width: `calc((100% - 64px) * ${Math.max(
                          0,
                          getStepIndex(complaint.status) / (STATUS_STEPS.length - 1)
                        )})`,
                      }}
                    />

                    {STATUS_STEPS.map((step, idx) => {
                      const currentIdx = getStepIndex(complaint.status);
                      const isDone = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;
                      const isResolved = currentIdx === 3;
                      const StepIcon = step.icon;

                      return (
                        <div key={idx} className="relative z-10 flex flex-col items-center">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow ${
                              isResolved && idx === 3
                                ? 'bg-emerald-500 text-white ring-4 ring-emerald-200 scale-110'
                                : isCurrent
                                ? 'bg-amber-400 text-blue-950 ring-4 ring-amber-200 scale-110'
                                : isDone
                                ? 'bg-blue-900 text-white'
                                : 'bg-slate-100 text-slate-400 border border-slate-300'
                            }`}
                          >
                            <StepIcon className="w-4 h-4" />
                          </div>
                          <span
                            className={`text-[10px] font-bold mt-1 text-center max-w-[70px] ${
                              isResolved && idx === 3
                                ? 'text-emerald-700 font-black'
                                : isCurrent
                                ? 'text-blue-950 font-black'
                                : isDone
                                ? 'text-blue-800'
                                : 'text-slate-400'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-100 p-3 rounded-xl border border-slate-300 text-center">
                  <p className="text-xs font-bold text-slate-700">This complaint was Cancelled.</p>
                </div>
              )}

              {/* Facility Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block">Facility Category:</span>
                  <span className="font-bold text-slate-800">{complaint.category}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Location:</span>
                  <span className="font-bold text-slate-800">
                    {complaint.locationBuilding} — {complaint.locationRoom}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Assigned Technician:</span>
                  <span className="font-bold text-blue-900">
                    {complaint.assignedStaff || 'Pending Assignment'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Estimated Resolution:</span>
                  <span className="font-bold text-slate-800">
                    {complaint.estimatedResolutionDate || 'To be scheduled'}
                  </span>
                </div>
              </div>

              {/* Photo Evidence */}
              {complaint.photoUrl && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Attached Photo Evidence
                  </label>
                  <img
                    src={complaint.photoUrl}
                    alt="Complaint photo"
                    className="w-full h-48 object-cover rounded-xl border border-slate-300 shadow-sm"
                  />
                </div>
              )}

              {/* Resolution Notes if Resolved */}
              {complaint.status === 'Resolved' && complaint.resolutionNotes && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Resolution Maintenance Report</span>
                  </div>
                  <p className="text-xs text-emerald-900 font-medium">{complaint.resolutionNotes}</p>
                </div>
              )}

              {/* Audit Log Timeline */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  System Audit Trail & History
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto p-1">
                  {complaint.logs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs flex justify-between items-start shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-900">{log.status}</span>
                          <span className="text-[10px] text-slate-400">• {log.updatedBy}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">{log.note}</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-3 flex justify-end border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
};
