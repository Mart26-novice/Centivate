import React, { useState } from 'react';
import {
  ShieldAlert,
  User,
  Lock,
  Mail,
  GraduationCap,
  ShieldCheck,
  Building,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  KeyRound,
  BookOpen,
  Search,
  LogIn,
} from 'lucide-react';
import { UserRole, UserSession } from '../types';
import { PRESET_USERS } from '../data/authData';
const campusBg = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: UserRole;
  onLoginSuccess: (user: UserSession) => void;
  onOpenTracker?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'student',
  onLoginSuccess,
  onOpenTracker,
}) => {
  const [role, setRole] = useState<UserRole>(initialRole);
  const [username, setUsername] = useState<string>(
    initialRole === 'admin' ? PRESET_USERS.admin.username : PRESET_USERS.student.username
  );
  const [email, setEmail] = useState<string>(
    initialRole === 'admin' ? PRESET_USERS.admin.email : PRESET_USERS.student.email
  );
  const [password, setPassword] = useState<string>('password123');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setError('');
    if (newRole === 'admin') {
      setUsername(PRESET_USERS.admin.username);
      setEmail(PRESET_USERS.admin.email);
    } else {
      setUsername(PRESET_USERS.student.username);
      setEmail(PRESET_USERS.student.email);
    }
  };

  const handleFillDemo = (demoType: 'student' | 'admin') => {
    handleRoleChange(demoType);
    setPassword('password123');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) {
      setError('Please provide username and email credentials.');
      return;
    }

    const newUser: UserSession = {
      id: `USR-${Date.now()}`,
      username: username.trim(),
      email: email.trim(),
      role: role,
      fullName:
        role === 'admin'
          ? username.toLowerCase() === 'admin'
            ? PRESET_USERS.admin.fullName
            : username
          : username.toLowerCase() === 'student'
          ? PRESET_USERS.student.fullName
          : username,
      strandOrDepartment:
        role === 'admin' ? 'Campus Facilities Office' : 'Senior High School Student',
    };

    onLoginSuccess(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col md:flex-row relative">
        {/* Left Visual Column featuring CPU Campus Image */}
        <div className="md:w-5/12 bg-blue-950 text-white relative min-h-[260px] md:min-h-[520px] flex flex-col justify-between p-6 overflow-hidden">
          {/* Background Image overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src={campusBg}
              alt="Central Philippine University Campus"
              className="w-full h-full object-cover opacity-40 mix-blend-overlay scale-105 transition-transform duration-700 hover:scale-100"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-950/80 to-blue-900/40" />
          </div>

          {/* Top Brand Header */}
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 bg-amber-400 text-blue-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Centivate Authentication Portal</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Central Philippine University
            </h2>
            <p className="text-xs text-amber-300 font-semibold">
              Senior High School Facility Maintenance & Reporting System
            </p>
          </div>

          {/* Middle Info Notice */}
          <div className="relative z-10 my-4 space-y-3 bg-blue-900/70 p-4 rounded-2xl border border-amber-400/30 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wide">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Role Security Clearance</span>
            </div>
            <p className="text-xs text-blue-100 leading-relaxed font-medium">
              Log in with student or admin credentials to file reports, track maintenance updates, and access administrative facilities dispatch.
            </p>
          </div>

          {/* Bottom Campus Tag */}
          <div className="relative z-10 pt-2 border-t border-blue-800/80 flex items-center justify-between text-[11px] text-blue-200">
            <span className="font-semibold text-white">Centivate SHS Facilities © 2026</span>
            <span className="text-amber-400 font-bold">CPU Campus</span>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="md:w-7/12 p-6 sm:p-8 flex flex-col justify-between bg-white">
          <div>
            {/* Top Close / Title */}
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <LogIn className="w-5 h-5 text-blue-900" />
                  Sign In to Centivate
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Select your role and enter temporary email credentials
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center font-bold text-sm transition-colors"
                title="Close Modal"
              >
                ✕
              </button>
            </div>

            {/* Role Selection Switcher */}
            <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => handleRoleChange('student')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  role === 'student'
                    ? 'bg-blue-900 text-white shadow-md border border-amber-400/40'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <GraduationCap className={`w-4 h-4 ${role === 'student' ? 'text-amber-400' : ''}`} />
                <span>Student Portal</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('admin')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  role === 'admin'
                    ? 'bg-blue-900 text-white shadow-md border border-amber-400/40'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <ShieldCheck className={`w-4 h-4 ${role === 'admin' ? 'text-amber-400' : ''}`} />
                <span>Admin Maintenance</span>
              </button>
            </div>

            {/* Quick Demo Credential Fillers */}
            <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-bold text-amber-900 text-[11px] uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  Quick Demo Credentials
                </span>
                <span className="text-amber-700 font-normal">Click to auto-fill</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleFillDemo('student')}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-colors flex items-center gap-1 ${
                    role === 'student'
                      ? 'bg-amber-500 text-blue-950 border-amber-600 font-bold'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-amber-100'
                  }`}
                >
                  <GraduationCap className="w-3 h-3" />
                  <span>Student Demo</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFillDemo('admin')}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-colors flex items-center gap-1 ${
                    role === 'admin'
                      ? 'bg-amber-500 text-blue-950 border-amber-600 font-bold'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-amber-100'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>Admin Demo</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username / ID Number
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={role === 'admin' ? 'admin' : 'student'}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Temporary {role === 'admin' ? 'Admin' : 'Student'} Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === 'admin' ? 'admin.facilities@cpu.edu.ph' : 'student.shs@cpu.edu.ph'}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Security Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-blue-900 focus:ring-blue-900 w-3.5 h-3.5"
                  />
                  <span>Keep session active</span>
                </label>
                {onOpenTracker && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenTracker();
                    }}
                    className="text-blue-900 font-bold hover:underline"
                  >
                    Guest Tracking Lookup?
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-950 hover:to-indigo-950 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg border-b-4 border-amber-400 flex items-center justify-center gap-2 transform active:scale-95 transition-all mt-2"
              >
                <span>Authorize & Enter Portal</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              CPU Facilities Encryption Active
            </span>
            <span className="font-semibold text-slate-500">v2.6 Secure Auth</span>
          </div>
        </div>
      </div>
    </div>
  );
};
