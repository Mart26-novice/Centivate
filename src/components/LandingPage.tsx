import React from 'react';
import {
  ShieldAlert,
  GraduationCap,
  ShieldCheck,
  Search,
  CheckCircle2,
  ArrowRight,
  Clock,
  Sparkles,
  Award,
  BookOpen,
  Wrench,
  Building,
  BarChart3,
  HeartHandshake,
  UserCheck,
  LogIn,
} from 'lucide-react';
import { UserSession } from '../types';
import campusBg from '../assets/images/cpu_campus_aerial_1785881684967.jpg';

interface LandingPageProps {
  onNavigate: (tab: 'student' | 'admin' | 'analytics' | 'research') => void;
  onOpenTracker: () => void;
  onOpenLogin: (role?: 'student' | 'admin') => void;
  currentUser: UserSession | null;
  totalComplaintsCount: number;
  resolvedCount: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onOpenTracker,
  onOpenLogin,
  currentUser,
  totalComplaintsCount,
  resolvedCount,
}) => {
  return (
    <div className="space-y-12 pb-16 animate-fadeIn">
      {/* Hero Banner with CPU Aerial Campus Image */}
      <section className="relative min-h-[500px] lg:min-h-[580px] bg-blue-950 text-white rounded-b-3xl sm:rounded-3xl overflow-hidden shadow-2xl border-b-4 border-amber-400 max-w-7xl mx-auto">
        {/* Background Image overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={campusBg || '/cpu_campus_aerial.jpg'}
            alt="Central Philippine University Aerial Campus View"
            className="w-full h-full object-cover opacity-70 scale-105 transition-transform duration-1000 hover:scale-100"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.dataset.triedPublicJpg) {
                target.dataset.triedPublicJpg = 'true';
                target.src = '/cpu_campus_aerial_1785881684967.jpg';
              } else if (!target.dataset.triedPublicJpgAlt) {
                target.dataset.triedPublicJpgAlt = 'true';
                target.src = '/cpu_campus_aerial.jpg';
              } else if (!target.dataset.triedPublicWebp) {
                target.dataset.triedPublicWebp = 'true';
                target.src = '/cpu_campus_aerial.webp';
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-900/60 to-blue-950/50 mix-blend-multiply" />
          <div className="absolute inset-0 bg-blue-950/30" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 sm:py-20 text-center flex flex-col items-center justify-center min-h-[500px] lg:min-h-[580px] space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-400 text-blue-950 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-lg transform hover:scale-105 transition-transform">
            <GraduationCap className="w-4 h-4 text-blue-950" />
            <span>Central Philippine University </span>
          </div>

          {/* Title & Tagline */}
          <div className="space-y-3 max-w-4xl">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              CENTIVATE <span className="text-amber-400 font-extrabold"></span> Maintenance Portal
            </h1>
            <p className="text-base sm:text-xl text-blue-100 font-medium leading-relaxed max-w-3xl mx-auto">
              Empowering CPU Centralians with a fast, transparent, and accountable facility complaint reporting system. Ensuring clean classrooms, working equipment, and safe learning environments.
            </p>
          </div>

          {/* Quick Stats Banner Pill */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 bg-blue-900/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-amber-400/30 text-xs font-bold text-amber-300 shadow-xl">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{resolvedCount} Facility Repairs Resolved</span>
            </div>
            <span className="hidden sm:inline text-blue-600">•</span>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>24/48 Hr Emergency Response Target</span>
            </div>
            <span className="hidden sm:inline text-blue-600">•</span>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Capstone ISO 9001 Compliant</span>
            </div>
          </div>

          {/* Call to Actions */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 w-full max-w-md">
            <button
              onClick={() => onNavigate('student')}
              className="w-full sm:w-auto flex-1 px-8 py-4 bg-amber-400 hover:bg-amber-300 text-blue-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl border-b-4 border-amber-600 flex items-center justify-center gap-2 transform active:scale-95 transition-all"
            >
              <ShieldAlert className="w-5 h-5 text-blue-950" />
              <span>Report Facility Issue</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('admin')}
              className="w-full sm:w-auto px-6 py-4 bg-blue-900/90 hover:bg-blue-800 text-white font-bold text-sm rounded-2xl shadow-lg border border-amber-400/40 backdrop-blur-sm flex items-center justify-center gap-2 transform active:scale-95 transition-all"
            >
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>Admin / Staff Dispatch</span>
            </button>
          </div>

          {/* Secondary Quick Tracking Search Button */}
          <div className="pt-2">
            <button
              onClick={onOpenTracker}
              className="inline-flex items-center gap-2 text-xs text-blue-200 hover:text-amber-300 font-semibold bg-blue-900/40 px-4 py-2 rounded-xl border border-blue-800 hover:border-amber-400/50 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>Already filed a complaint? Track your ticket here</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Feature Cards Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 text-blue-900 font-black text-xs uppercase tracking-widest bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>System Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tight">
            Designed for CPU Senior High School Excellence
          </h2>
          <p className="text-sm text-slate-600">
            Centivate bridges the gap between student maintenance reporting and prompt facilities maintenance action.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 hover:shadow-xl hover:border-amber-400 transition-all group flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-blue-950 flex items-center justify-center font-black text-xl border border-amber-300 group-hover:bg-amber-400 transition-colors">
                <ShieldAlert className="w-6 h-6 text-blue-950" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-800 group-hover:text-blue-950 transition-colors">
                1. Submit Complaint
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Log facility problems in Senior High School classrooms, laboratories, aircons, lighting, or restrooms with optional photo attachments.
              </p>
            </div>
            <button
              onClick={() => onNavigate('student')}
              className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-900 group-hover:text-amber-600 transition-colors"
            >
              <span>File Report Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 hover:shadow-xl hover:border-amber-400 transition-all group flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-blue-950 flex items-center justify-center font-black text-xl border border-amber-300 group-hover:bg-amber-400 transition-colors">
                <Search className="w-6 h-6 text-blue-950" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-800 group-hover:text-blue-950 transition-colors">
                2. Real-Time Tracking
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Receive an automatic tracking code (e.g. CENT-2026-8812) to monitor repair progress and maintenance status without hassle.
              </p>
            </div>
            <button
              onClick={onOpenTracker}
              className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-900 group-hover:text-amber-600 transition-colors"
            >
              <span>Lookup Ticket</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 hover:shadow-xl hover:border-amber-400 transition-all group flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-blue-950 flex items-center justify-center font-black text-xl border border-amber-300 group-hover:bg-amber-400 transition-colors">
                <Wrench className="w-6 h-6 text-blue-950" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-800 group-hover:text-blue-950 transition-colors">
                3. Admin Dispatch
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Campus Physical Plant Office (CPPO) staff triage priority complaints, assign technicians, and log repair completions.
              </p>
            </div>
            <button
              onClick={() => onNavigate('admin')}
              className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-900 group-hover:text-amber-600 transition-colors"
            >
              <span>Facilities Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 hover:shadow-xl hover:border-amber-400 transition-all group flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-blue-950 flex items-center justify-center font-black text-xl border border-amber-300 group-hover:bg-amber-400 transition-colors">
                <BarChart3 className="w-6 h-6 text-blue-950" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-800 group-hover:text-blue-950 transition-colors">
                4. Research & Analytics
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Built-in research analytics dashboard featuring repair response times, category breakdowns, and user satisfaction surveys.
              </p>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-900 group-hover:text-amber-600 transition-colors"
            >
              <span>View Analytics</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Campus Identity & Mission Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl border-l-8 border-amber-400 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 bg-amber-400 text-blue-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
              <Building className="w-3.5 h-3.5" />
              <span>Central Philippine University Mission</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Fostering Excellence, Character, and Safety at CPU SHS
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed font-medium">
              In pursuit of Exemplary Christian Education for Life (EXCEL), Centivate maintains high standards for physical campus infrastructure. Every student report contributes directly to campus safety, academic comfort, and sustainable facilities management.
            </p>

            <div className="pt-2 flex flex-wrap gap-4 text-xs font-bold text-amber-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Senior High School Building
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Roblee Hall & Science Labs
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                University Gymnasium & Grounds
              </span>
            </div>
          </div>

          {/* Quick Authentication Box */}
          <div className="w-full md:w-auto bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center space-y-4 max-w-sm relative z-10">
            <h3 className="text-base font-extrabold text-white flex items-center justify-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-400" />
              <span>User Authentication</span>
            </h3>
            <p className="text-xs text-blue-200">
              {currentUser ? (
                <>
                  Signed in as <strong className="text-amber-300">{currentUser.fullName}</strong> ({currentUser.role})
                </>
              ) : (
                'Sign in with student or maintenance admin credentials for personalized access.'
              )}
            </p>
            {currentUser ? (
              <button
                onClick={() => onNavigate('student')}
                className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-blue-950 font-black text-xs rounded-xl shadow transition-transform active:scale-95"
              >
                Go to Student Portal
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => onOpenLogin('student')}
                  className="flex-1 py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-blue-950 font-black text-xs rounded-xl shadow transition-transform active:scale-95"
                >
                  Student Sign In
                </button>
                <button
                  onClick={() => onOpenLogin('admin')}
                  className="flex-1 py-2.5 px-3 bg-blue-800 hover:bg-blue-700 text-white font-bold text-xs rounded-xl border border-amber-400/40 shadow transition-transform active:scale-95"
                >
                  Admin Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
