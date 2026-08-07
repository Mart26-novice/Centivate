import React, { useState } from 'react';
import {
  PlusCircle,
  ClipboardList,
  Camera,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Building,
  MapPin,
  Search,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  HelpCircle,
  Clock,
  Send,
  UserCheck,
  FileText,
} from 'lucide-react';
import { Complaint, ComplaintCategory, BuildingLocation, ComplaintPriority, UserSession } from '../types';
import { PRESET_STUDENTS } from '../data/authData';
import { PhotoUploadModal } from './PhotoUploadModal';

interface StudentPortalProps {
  complaints: Complaint[];
  onCreateComplaint: (data: any) => Promise<Complaint>;
  onSelectComplaint: (complaint: Complaint) => void;
  onOpenTracker: (code?: string) => void;
  currentUser?: UserSession | null;
  onOpenLogin?: () => void;
}

const CATEGORY_OPTIONS: { name: ComplaintCategory; icon: string; desc: string }[] = [
  { name: 'Restroom & Sanitation', icon: '🚽', desc: 'Sinks, toilets, tissue holders, soap dispensers' },
  { name: 'Classroom Furniture', icon: '🪑', desc: 'Armchairs, whiteboards, teachers desks, bookshelves' },
  { name: 'HVAC & Ventilation', icon: '🌀', desc: 'Electric fans, air conditioners, exhaust vents' },
  { name: 'Lighting & Electrical', icon: '💡', desc: 'Fluorescent lights, power outlets, switches, breakers' },
  { name: 'Plumbing & Water', icon: '🚰', desc: 'Water fountains, leaking pipes, drainage, faucets' },
  { name: 'IT & Audio-Visual', icon: '💻', desc: 'Projectors, monitors, audio speakers, internet jacks' },
  { name: 'Doors, Windows & Structure', icon: '🚪', desc: 'Door knobs, window panes, jalousies, ceiling tiles' },
  { name: 'Grounds & Safety', icon: '🏫', desc: 'Walkways, stairs handrails, trash bins, sports courts' },
];

const BUILDING_OPTIONS: BuildingLocation[] = [
  'Main Building A',
  'Science & Tech Wing B',
  'Senior High Building C',
  'Gymnasium & Sports Complex',
  'Library & Learning Commons',
  'Cafeteria & Student Center',
  'Campus Grounds',
];

const STRAND_OPTIONS = [
  'STEM 12-A', 'STEM 12-B', 'STEM 11-A', 'STEM 11-B',
  'ABM 12-A', 'ABM 12-B', 'ABM 11-A', 'ABM 11-B',
  'HUMSS 12-A', 'HUMSS 12-B', 'HUMSS 11-A',
  'TVL-ICT 12-A', 'TVL-ICT 11-A', 'TVL-HE 12-A',
  'GAS 12-A', 'ARTS 12-A', 'SPORTS 12-A',
];

export const StudentPortal: React.FC<StudentPortalProps> = ({
  complaints,
  onCreateComplaint,
  onSelectComplaint,
  onOpenTracker,
  currentUser,
  onOpenLogin,
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('Classroom Furniture');
  const [locationBuilding, setLocationBuilding] = useState<BuildingLocation>('Senior High Building C');
  const [locationRoom, setLocationRoom] = useState('');
  const [priority, setPriority] = useState<ComplaintPriority>('Medium');
  const [photoUrl, setPhotoUrl] = useState('');
  const [studentName, setStudentName] = useState(currentUser?.fullName || 'Juan De La Cruz');
  const [studentStrand, setStudentStrand] = useState(currentUser?.strandOrDepartment || 'STEM 12-A');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [contactEmail, setContactEmail] = useState(currentUser?.email || 'student.shs@cpu.edu.ph');

  React.useEffect(() => {
    if (currentUser) {
      setStudentName(currentUser.fullName || '');
      setStudentStrand(currentUser.strandOrDepartment || 'STEM 12-A');
      setContactEmail(currentUser.email || '');
    }
  }, [currentUser]);

  // UI state
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [successComplaint, setSuccessComplaint] = useState<Complaint | null>(null);
  const [copied, setCopied] = useState(false);

  // Search and account filtering in student list
  const [searchQuery, setSearchQuery] = useState('');
  const [accountFilter, setAccountFilter] = useState<string>('current');

  const handleAiPreCheck = async () => {
    if (!description.trim()) {
      alert('Please type a short description of the facility issue first!');
      return;
    }

    setAiAnalyzing(true);
    setAiResult(null);

    try {
      const res = await fetch('/api/ai/analyze-complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          building: locationBuilding,
          room: locationRoom,
          category,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiResult(data);

        // Auto-apply AI suggestions if available
        if (data.suggestedCategory) setCategory(data.suggestedCategory);
        if (data.suggestedPriority) setPriority(data.suggestedPriority);
      }
    } catch (err) {
      console.error('AI check error:', err);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !locationRoom) {
      alert('Please fill in all required fields (title, description, room/area).');
      return;
    }

    setSubmitting(true);
    try {
      const newReport = await onCreateComplaint({
        title,
        description,
        category,
        locationBuilding,
        locationRoom,
        priority,
        photoUrl,
        studentName,
        studentStrand,
        isAnonymous,
        contactEmail,
      });

      setSuccessComplaint(newReport);
      // Reset form
      setTitle('');
      setDescription('');
      setLocationRoom('');
      setPhotoUrl('');
      setAiResult(null);
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Failed to submit complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeStudentEmail = accountFilter === 'current'
    ? (currentUser?.email || contactEmail).toLowerCase()
    : accountFilter.toLowerCase();
  const activeStudentName = currentUser?.fullName || studentName;

  const myStudentComplaints = complaints.filter((c) => {
    if (accountFilter === 'all') return true;
    const emailMatch = Boolean(c.contactEmail && c.contactEmail.toLowerCase() === activeStudentEmail);
    const nameMatch = Boolean(c.studentName && activeStudentName && c.studentName.toLowerCase() === activeStudentName.toLowerCase());
    return emailMatch || nameMatch;
  });

  const filteredComplaints = myStudentComplaints.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.trackingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.locationRoom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Quick Toggle */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border-l-8 border-amber-400 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Background Campus Image */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="/cpu_campus_aerial.jpg"
            alt="CPU Campus"
            className="w-full h-full object-cover opacity-35"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/95 via-blue-950/80 to-indigo-950/90" />
        </div>

        <div className="space-y-2 z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-amber-400 text-blue-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 fill-blue-950" />
            <span>SHS Student Reporting Portal</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Report Campus Facility Issues Effortlessly
          </h2>
          <p className="text-xs sm:text-sm text-blue-200 leading-relaxed font-medium">
            Help maintain a safe and comfortable learning environment. Submit reports for damaged furniture, broken fans, electrical hazards, or plumbing issues in real-time.
          </p>
        </div>

        {/* Tab Switch Buttons */}
        <div className="flex bg-blue-900/90 p-1.5 rounded-xl border border-blue-700/80 shadow-lg z-10 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black transition-all ${
              activeTab === 'form'
                ? 'bg-amber-400 text-blue-950 shadow-md'
                : 'text-blue-100 hover:text-white hover:bg-blue-800'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit New Report</span>
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black transition-all ${
              activeTab === 'list'
                ? 'bg-amber-400 text-blue-950 shadow-md'
                : 'text-blue-100 hover:text-white hover:bg-blue-800'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Submitted Complaints ({myStudentComplaints.length})</span>
          </button>
        </div>
      </div>

      {/* SUCCESS MODAL AFTER SUBMISSION */}
      {successComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-amber-400 text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-400 shadow-sm">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div>
              <h3 className="text-xl font-black text-blue-950">Complaint Submitted Successfully!</h3>
              <p className="text-xs text-slate-600 mt-1">
                Your report has been logged into the Centivate system. Save your reference tracking code to monitor real-time repair progress.
              </p>
            </div>

            {/* Generated Code Box */}
            <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl p-4 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                Your Reference Tracking Code
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-mono font-black text-blue-950">
                  {successComplaint.trackingCode}
                </span>
                <button
                  onClick={() => handleCopyCode(successComplaint.trackingCode)}
                  className="p-1.5 bg-amber-400 hover:bg-amber-300 text-blue-950 rounded-lg transition-colors font-bold text-xs flex items-center gap-1"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSuccessComplaint(null);
                  setActiveTab('list');
                }}
                className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
              >
                View My Reports List
              </button>
              <button
                onClick={() => setSuccessComplaint(null)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors"
              >
                File Another Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORM TAB */}
      {activeTab === 'form' && (
        <form onSubmit={handleSubmitComplaint} className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-8">
          {/* Section 1: Facility Issue Categorization */}
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-blue-950 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-900 text-amber-300 text-xs flex items-center justify-center font-extrabold">
                    1
                  </span>
                  Select Facility Category
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose the type of maintenance issue you are experiencing on campus.
                </p>
              </div>
            </div>

            {/* Category Grid Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CATEGORY_OPTIONS.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <div
                    key={cat.name}
                    onClick={() => setCategory(cat.name)}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-400 bg-amber-50/60 ring-2 ring-amber-400/30 scale-[1.02] shadow-sm'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
                    }`}
                  >
                    <div>
                      <div className="text-2xl mb-1">{cat.icon}</div>
                      <h4 className="font-extrabold text-xs text-blue-950 leading-snug">{cat.name}</h4>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{cat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Issue Details & Location */}
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-blue-950 uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-900 text-amber-300 text-xs flex items-center justify-center font-extrabold">
                  2
                </span>
                Issue Details & Location
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Issue Title */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Issue Summary Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Broken wall electric fan in Room 304 / Water leak in 2nd floor restroom"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              {/* Building Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Campus Building <span className="text-red-500">*</span>
                </label>
                <select
                  value={locationBuilding}
                  onChange={(e: any) => setLocationBuilding(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold text-blue-950 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  {BUILDING_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room / Specific Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Room Number / Specific Area <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Room 304 - STEM 12-A / AVR 1 / 2nd Floor Male Restroom"
                  value={locationRoom}
                  onChange={(e) => setLocationRoom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              {/* Detailed Description */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Detailed Description <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAiPreCheck}
                    disabled={aiAnalyzing}
                    className="text-[11px] font-bold text-blue-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-400" />
                    <span>{aiAnalyzing ? 'Analyzing...' : 'Gemini AI Auto-Diagnose & Priority Check'}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the problem in detail (e.g., condition of the object, any safety hazards, exact location inside the room, noise level)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none leading-relaxed"
                />
              </div>
            </div>

            {/* AI Diagnosis Result Card */}
            {aiResult && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-950 font-black text-xs uppercase">
                    <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span>Gemini AI Smart Assistant Recommendation</span>
                  </div>
                  {aiResult.safetyHazardDetected && (
                    <span className="bg-red-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3" /> Safety Risk Detected
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 font-bold block">Suggested Priority:</span>
                    <span className="font-black text-blue-900">{aiResult.suggestedPriority}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">Reason:</span>
                    <span className="font-medium text-slate-800">{aiResult.urgencyReason}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Photo Evidence Attachment */}
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <h3 className="text-base font-black text-blue-950 uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-900 text-amber-300 text-xs flex items-center justify-center font-extrabold">
                  3
                </span>
                Photo Evidence Attachment (Optional)
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {photoUrl ? (
                <div className="relative group">
                  <img
                    src={photoUrl}
                    alt="Attached evidence"
                    referrerPolicy="no-referrer"
                    className="w-28 h-28 object-cover rounded-xl border-2 border-amber-400 shadow-sm"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/cpu_campus_aerial.jpg';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow hover:scale-110 transition-transform"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-28 h-28 bg-white border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400">
                  <Camera className="w-8 h-8 mb-1" />
                  <span className="text-[10px] font-bold">No Photo</span>
                </div>
              )}

              <div className="space-y-2 flex-1">
                <p className="text-xs font-bold text-slate-800">
                  Attach a photo of the damaged facility equipment or area
                </p>
                <p className="text-[11px] text-slate-500">
                  Photos significantly speed up maintenance technician response times by identifying required replacement parts in advance.
                </p>
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(true)}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-2"
                >
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>{photoUrl ? 'Change Attached Photo' : 'Upload / Select Facility Photo'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Student Reporter Info */}
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <h3 className="text-base font-black text-blue-950 uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-900 text-amber-300 text-xs flex items-center justify-center font-extrabold">
                  4
                </span>
                Reporter Information
              </h3>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-300 transition-colors">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-800">Submit Anonymously</span>
              </label>
            </div>

            {!isAnonymous && (
              <div className="space-y-3">
                {currentUser ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-slate-800">
                        Logged in as: <span className="text-blue-900">{currentUser.fullName}</span> ({currentUser.email})
                      </span>
                    </div>
                    <span className="bg-amber-400 text-blue-950 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                      {currentUser.role} Credentials
                    </span>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">
                      Reporting as guest. Want to log in with your temporary student or admin email?
                    </span>
                    {onOpenLogin && (
                      <button
                        type="button"
                        onClick={onOpenLogin}
                        className="px-3 py-1 bg-blue-900 text-white font-bold text-[11px] rounded-lg hover:bg-blue-800"
                      >
                        Sign In Now
                      </button>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Student Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Marc Vincent Reyes"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Grade & Strand / Section
                  </label>
                  <select
                    value={studentStrand}
                    onChange={(e) => setStudentStrand(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-blue-950 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  >
                    {STRAND_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    School Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="student@shs.edu.ph"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
            )}
          </div>

          {/* Submit Button Bar */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-[11px] text-slate-500 font-medium">
              By submitting, your report will be sent directly to the SHS Maintenance Admin Desk.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-blue-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4 stroke-[3]" />
              <span>{submitting ? 'Submitting Report...' : 'Submit Facility Report'}</span>
            </button>
          </div>
        </form>
      )}

      {/* LIST TAB: MY SUBMITTED COMPLAINTS */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-blue-950">Student Complaints Register</h3>
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {accountFilter === 'all' ? 'All Complaints Mode' : 'Personal Account'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Displaying facility reports filed specifically under this student account.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              {/* Account Filter Selector */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs">
                <UserCheck className="w-4 h-4 text-blue-900 shrink-0" />
                <span className="font-bold text-slate-600 shrink-0">Portal Account:</span>
                <select
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
                  className="bg-transparent font-extrabold text-blue-950 focus:outline-none text-xs cursor-pointer max-w-[200px] truncate"
                >
                  <option value="current">
                    {currentUser ? `${currentUser.fullName} (${currentUser.email})` : 'My Current Student Account'}
                  </option>
                  {PRESET_STUDENTS.map((s) => (
                    <option key={s.id} value={s.email}>
                      {s.fullName} ({s.strandOrDepartment})
                    </option>
                  ))}
                  <option value="all">-- Show All Complaints (Admin View) --</option>
                </select>
              </div>

              <div className="relative w-full sm:w-56">
                <input
                  type="text"
                  placeholder="Search code, location, title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* List Cards Grid */}
          {filteredComplaints.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h4 className="font-bold text-slate-700 text-sm">No Reports Found</h4>
              <p className="text-xs text-slate-500 mt-1">
                You haven't submitted any complaints matching this search query yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredComplaints.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectComplaint(item)}
                  className="bg-white border border-slate-200 hover:border-amber-400 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="bg-blue-950 text-amber-300 font-mono font-extrabold text-xs px-2.5 py-0.5 rounded-md">
                        {item.trackingCode}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
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
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition-colors line-clamp-1">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-800" />
                      {item.locationBuilding} ({item.locationRoom})
                    </span>
                    <span className="text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Photo Upload Modal */}
      <PhotoUploadModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onSelectPhoto={(url) => setPhotoUrl(url)}
        currentPhotoUrl={photoUrl}
      />
    </div>
  );
};
