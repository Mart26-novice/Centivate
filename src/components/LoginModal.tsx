import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  Mail,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  KeyRound,
  LogIn,
  Loader2,
  UserPlus,
  IdCard,
} from 'lucide-react';
import { UserRole, UserSession } from '../types';
import { auth, db } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import campusBg from '../assets/images/cpu_campus_aerial.jpg';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: UserRole;
  onLoginSuccess: (user: UserSession) => void;
  onOpenTracker?: () => void;
}

type SignupRole = 'student' | 'teacher' | 'admin';

const friendlyAuthError = (code: string): string => {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try logging in instead.';
    case 'auth/weak-password':
      return 'Password is too weak — use at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled for this project yet.';
    default:
      return 'Authentication failed. Please try again.';
  }
};

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'student',
  onLoginSuccess,
  onOpenTracker,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [signupRole, setSignupRole] = useState<SignupRole>(initialRole === 'admin' ? 'admin' : 'student');
  const [fullName, setFullName] = useState<string>('');
  const [strandOrDepartment, setStrandOrDepartment] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [accessCode, setAccessCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Email and password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      const profileSnap = await getDoc(doc(db, 'users', cred.user.uid));

      if (!profileSnap.exists()) {
        await signOut(auth);
        setError('Your account has no profile on record yet. Please contact the Centivate administrator.');
        return;
      }

      const profile = profileSnap.data() as {
        role: UserRole;
        fullName?: string;
        strandOrDepartment?: string;
      };

      const newUser: UserSession = {
        id: cred.user.uid,
        username: trimmedEmail.split('@')[0],
        email: trimmedEmail,
        role: profile.role,
        fullName: profile.fullName || trimmedEmail,
        strandOrDepartment: profile.strandOrDepartment || '',
      };

      onLoginSuccess(newUser);
      onClose();
    } catch (err: any) {
      setError(err.code ? friendlyAuthError(err.code) : err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();
    const trimmedCode = accessCode.trim();

    if (!trimmedName) {
      setError('Full name is required.');
      return;
    }
    if (!trimmedEmail) {
      setError('Email is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!trimmedCode) {
      setError(signupRole === 'admin' ? 'An admin setup code is required.' : 'A participant access code is required.');
      return;
    }

    setIsSubmitting(true);
    let createdUid: string | null = null;

    try {
      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      createdUid = cred.user.uid;
      const idToken = await cred.user.getIdToken();

      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          accessCode: trimmedCode,
          role: signupRole,
          fullName: trimmedName,
          strandOrDepartment: strandOrDepartment.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to complete account setup.');
      }

      const data = await res.json();

      const newUser: UserSession = {
        id: cred.user.uid,
        username: trimmedEmail.split('@')[0],
        email: trimmedEmail,
        role: data.role,
        fullName: trimmedName,
        strandOrDepartment: strandOrDepartment.trim(),
      };

      onLoginSuccess(newUser);
      onClose();
    } catch (err: any) {
      // Roll back the just-created auth account if profile setup failed,
      // so a bad access code doesn't leave an orphaned, role-less account.
      if (createdUid && auth.currentUser) {
        try {
          await auth.currentUser.delete();
        } catch {
          // ignore rollback failure
        }
      }
      setError(err.code ? friendlyAuthError(err.code) : err.message || 'Account creation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div role="dialog" aria-modal="true" aria-label="Centivate sign in" className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col md:flex-row relative">
        {/* Left Visual Column featuring CPU Campus Image */}
        <div className="md:w-5/12 bg-blue-950 text-white relative min-h-[260px] md:min-h-[520px] flex flex-col justify-between p-6 overflow-hidden">
          {/* Background Image overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src={campusBg}
              alt="Central Philippine University Campus"
              className="w-full h-full object-cover opacity-60 scale-100 hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = campusBg;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-950/70 to-blue-900/30" />
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
              <span>Research Pilot Notice</span>
            </div>
            <p className="text-xs text-blue-100 leading-relaxed font-medium">
              New here? Create an account with your own email and the access code given to you by the research
              team. Already registered? Just log in below.
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
                  {mode === 'login' ? 'Sign In to Centivate' : 'Create Your Centivate Account'}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {mode === 'login'
                    ? 'Enter the email and password for your account'
                    : 'Register with your own email and the access code you were given'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center font-bold text-sm transition-colors"
                title="Close Modal"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {/* Login / Sign Up Mode Switcher */}
            <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  mode === 'login'
                    ? 'bg-blue-900 text-white shadow-md border border-amber-400/40'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <LogIn className={`w-4 h-4 ${mode === 'login' ? 'text-amber-400' : ''}`} />
                <span>Log In</span>
              </button>

              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  mode === 'signup'
                    ? 'bg-blue-900 text-white shadow-md border border-amber-400/40'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <UserPlus className={`w-4 h-4 ${mode === 'signup' ? 'text-amber-400' : ''}`} />
                <span>Create Account</span>
              </button>
            </div>

            {error && (
              <div role="alert" className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="lm-field-1">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input id="lm-field-1"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="lm-field-2">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input id="lm-field-2"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {onOpenTracker && (
                  <div className="flex items-center justify-end text-xs pt-1">
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
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-950 hover:to-indigo-950 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg border-b-4 border-amber-400 flex items-center justify-center gap-2 transform active:scale-95 transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Log In</span>
                      <ArrowRight className="w-4 h-4 text-amber-400" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                {/* Role Selection Switcher */}
                <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSignupRole('student')}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      signupRole === 'student'
                        ? 'bg-blue-900 text-white shadow-md border border-amber-400/40'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <GraduationCap className={`w-4 h-4 ${signupRole === 'student' ? 'text-amber-400' : ''}`} />
                    <span>Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignupRole('teacher')}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      signupRole === 'teacher'
                        ? 'bg-blue-900 text-white shadow-md border border-amber-400/40'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <IdCard className={`w-4 h-4 ${signupRole === 'teacher' ? 'text-amber-400' : ''}`} />
                    <span>Teacher</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignupRole('admin')}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      signupRole === 'admin'
                        ? 'bg-blue-900 text-white shadow-md border border-amber-400/40'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <ShieldCheck className={`w-4 h-4 ${signupRole === 'admin' ? 'text-amber-400' : ''}`} />
                    <span>Admin</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="lm-field-3">Full Name</label>
                  <input id="lm-field-3"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Juan Dela Cruz"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all"
                  />
                </div>

                {signupRole !== 'admin' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="lm-field-4">
                      {signupRole === 'teacher' ? 'Department' : 'Strand / Section'}
                    </label>
                    <input id="lm-field-4"
                      type="text"
                      value={strandOrDepartment}
                      onChange={(e) => setStrandOrDepartment(e.target.value)}
                      placeholder={signupRole === 'teacher' ? 'e.g. STEM Department' : 'e.g. STEM 12-A'}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="lm-field-5">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input id="lm-field-5"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="lm-field-6">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input id="lm-field-6"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="min. 6 characters"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="lm-field-7">Confirm Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input id="lm-field-7"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="lm-field-8">
                    {signupRole === 'admin' ? 'Admin Setup Code' : 'Participant Access Code'}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input id="lm-field-8"
                      type="text"
                      required
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      placeholder={signupRole === 'admin' ? 'Given by the research lead' : 'Given by the research team'}
                      className="w-full pl-9 pr-3 py-2 bg-amber-50 border border-amber-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-950 hover:to-indigo-950 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg border-b-4 border-amber-400 flex items-center justify-center gap-2 transform active:scale-95 transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4 text-amber-400" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Firebase-Verified Authentication
            </span>
            <span className="font-semibold text-slate-500">v3.0 Secure Auth</span>
          </div>
        </div>
      </div>
    </div>
  );
};
