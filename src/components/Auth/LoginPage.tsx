'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Eye, EyeOff, Lock, Mail, Sparkles, Building2, ArrowRight, KeyRound, AlertCircle, CheckCircle2, UserCheck, Layers, BookOpen, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import { Department } from '@/types';

export interface LoginPageProps {
  onNavigateToRegister?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToRegister }) => {
  const { login } = useAuth();

  const [selectedRole, setSelectedRole] = useState<'Admin' | 'Head of Dept' | 'Faculty' | 'Student'>('Admin');
  const [selectedDept, setSelectedDept] = useState<Department>('Computer Science');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  const departmentsList: Department[] = [
    'Computer Science',
    'Electronics & Comm.',
    'Mechanical Eng.',
    'Civil Eng.',
    'AI & Data Science',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() && selectedRole !== 'Admin') {
      setEmail(
        selectedRole === 'Head of Dept'
          ? `hod.${selectedDept.toLowerCase().replace(/\s+/g, '')}@caias.edu.in`
          : selectedRole === 'Student'
          ? '24bca001@caias.edu.in'
          : `alan.turing@college.edu`
      );
    }

    setIsLoading(true);

    setTimeout(() => {
      const targetEmail = email.trim() || (
        selectedRole === 'Admin' ? 'admin@caias.edu.in' :
        selectedRole === 'Head of Dept' ? `hod.${selectedDept.toLowerCase().replace(/\s+/g, '')}@caias.edu.in` :
        selectedRole === 'Student' ? '24bca001@caias.edu.in' :
        `alan.turing@college.edu`
      );

      const success = login(targetEmail, password, selectedRole, selectedDept);
      setIsLoading(false);
      if (!success) {
        setErrorMsg('Invalid email or password. Please try again.');
      }
    }, 500);
  };

  const handleQuickRoleLogin = (
    role: 'Admin' | 'Head of Dept' | 'Faculty' | 'Student',
    dept: Department,
    quickEmail: string
  ) => {
    setSelectedRole(role);
    setSelectedDept(dept);
    setEmail(quickEmail);
    setPassword('password123');
    setIsLoading(true);

    setTimeout(() => {
      login(quickEmail, 'password123', role, dept);
      setIsLoading(false);
    }, 400);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetSuccessMsg(`Password reset instructions sent to ${resetEmail}`);
    setTimeout(() => {
      setResetSuccessMsg('');
      setShowForgotPasswordModal(false);
      setResetEmail('');
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg p-8 rounded-3xl glass-panel border border-indigo-500/30 shadow-2xl space-y-6 relative z-10"
      >
        {/* CAIAS Branding & Logo */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/20 border border-indigo-400/30">
            <Building2 className="w-8 h-8 text-white" />
          </div>

          <div className="pt-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              CAIAS INSTITUTIONAL PORTAL
            </span>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
              CAIAS Attendance Management System
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Select your system role and department to authenticate
            </p>
          </div>
        </div>

        {/* ROLE SELECTION TABS */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider text-center">
            Select Your Role
          </label>
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setSelectedRole('Admin')}
              className={`p-2.5 rounded-2xl font-extrabold text-[11px] transition-all border flex flex-col items-center gap-1 ${
                selectedRole === 'Admin'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>ADMIN</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('Head of Dept')}
              className={`p-2.5 rounded-2xl font-extrabold text-[11px] transition-all border flex flex-col items-center gap-1 ${
                selectedRole === 'Head of Dept'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>HOD</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('Faculty')}
              className={`p-2.5 rounded-2xl font-extrabold text-[11px] transition-all border flex flex-col items-center gap-1 ${
                selectedRole === 'Faculty'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>FACULTY</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('Student')}
              className={`p-2.5 rounded-2xl font-extrabold text-[11px] transition-all border flex flex-col items-center gap-1 ${
                selectedRole === 'Student'
                  ? 'bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-600/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>STUDENT</span>
            </button>
          </div>
        </div>

        {/* DEPARTMENT SELECTOR (for HOD and Faculty and Student) */}
        {selectedRole !== 'Admin' && (
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">
              Select Department ({selectedRole})
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value as Department)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-white font-bold text-xs focus:border-purple-500"
            >
              {departmentsList.map((d) => (
                <option key={d} value={d}>
                  {d} Department
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              College Email / ID ({selectedRole})
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  selectedRole === 'Admin'
                    ? 'admin@caias.edu.in'
                    : selectedRole === 'Head of Dept'
                    ? `hod.${selectedDept.toLowerCase().replace(/\s+/g, '')}@caias.edu.in`
                    : selectedRole === 'Student'
                    ? '24bca001@caias.edu.in'
                    : `alan.turing@college.edu`
                }
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl glass-input text-slate-200 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-300">Password</label>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className="text-[11px] font-bold text-indigo-400 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl glass-input text-slate-200 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {isLoading ? (
              <span>Authenticating {selectedRole} Account...</span>
            ) : (
              <>
                <span>Sign In as {selectedRole.toUpperCase()}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* QUICK DEMO ROLE ACCOUNTS SELECTOR */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <p className="text-[10px] font-mono font-bold text-center text-slate-400 uppercase tracking-wider">
            Quick Role Demo Sign-Ins
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-left">
            <button
              onClick={() => handleQuickRoleLogin('Admin', 'Computer Science', 'admin@caias.edu.in')}
              className="p-2 rounded-xl bg-slate-900 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/50 space-y-0.5 transition-all"
            >
              <div className="flex items-center space-x-1 text-indigo-400 font-bold text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </div>
              <p className="text-[9px] text-slate-400 truncate font-mono">College-Wide</p>
            </button>

            <button
              onClick={() => handleQuickRoleLogin('Head of Dept', 'Computer Science', 'hod.cs@caias.edu.in')}
              className="p-2 rounded-xl bg-slate-900 hover:bg-purple-950/60 border border-slate-800 hover:border-purple-500/50 space-y-0.5 transition-all"
            >
              <div className="flex items-center space-x-1 text-purple-400 font-bold text-[10px]">
                <Building2 className="w-3.5 h-3.5" />
                <span>HOD CS</span>
              </div>
              <p className="text-[9px] text-slate-400 truncate font-mono">Comp. Science</p>
            </button>

            <button
              onClick={() => handleQuickRoleLogin('Faculty', 'Computer Science', 'alan.turing@college.edu')}
              className="p-2 rounded-xl bg-slate-900 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-500/50 space-y-0.5 transition-all"
            >
              <div className="flex items-center space-x-1 text-emerald-400 font-bold text-[10px]">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Faculty CS</span>
              </div>
              <p className="text-[9px] text-slate-400 truncate font-mono">Dr. Turing</p>
            </button>

            <button
              onClick={() => handleQuickRoleLogin('Student', 'Computer Science', '24bca001@caias.edu.in')}
              className="p-2 rounded-xl bg-slate-900 hover:bg-amber-950/60 border border-slate-800 hover:border-amber-500/50 space-y-0.5 transition-all"
            >
              <div className="flex items-center space-x-1 text-amber-400 font-bold text-[10px]">
                <Camera className="w-3.5 h-3.5" />
                <span>Student 1</span>
              </div>
              <p className="text-[9px] text-slate-400 truncate font-mono">Aarav (Enrolled)</p>
            </button>

            <button
              onClick={() => handleQuickRoleLogin('Student', 'Computer Science', '24bca002@caias.edu.in')}
              className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-500/50 space-y-0.5 transition-all"
            >
              <div className="flex items-center space-x-1 text-rose-400 font-bold text-[10px]">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Student 2</span>
              </div>
              <p className="text-[9px] text-slate-400 truncate font-mono">Aditya (No Face)</p>
            </button>
          </div>
        </div>

        {/* Student Self-Registration CTA */}
        {onNavigateToRegister && (
          <div className="pt-2 text-center border-t border-slate-800/80">
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors inline-flex items-center gap-1.5"
            >
              <span>First time student?</span>
              <span className="text-indigo-400 hover:text-indigo-300 font-extrabold underline underline-offset-2">
                Register Face Biometrics &rarr;
              </span>
            </button>
          </div>
        )}
      </motion.div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100 relative">
            <button
              onClick={() => setShowForgotPasswordModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <div className="flex items-center space-x-2 text-indigo-400">
              <KeyRound className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">Reset Account Password</h3>
            </div>

            {resetSuccessMsg && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{resetSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3 text-xs">
              <p className="text-slate-400 text-[11px]">
                Enter your registered CAIAS college email address to receive password reset link.
              </p>
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="your.email@caias.edu.in"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow"
                >
                  Send Reset Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
