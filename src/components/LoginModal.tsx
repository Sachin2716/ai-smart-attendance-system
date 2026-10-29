'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Mail, Lock, X, UserCheck, Sparkles, Fingerprint, ArrowRight, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  if (!isLoginModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email || 'alan.turing@college.edu', password || 'password123');
  };

  const handleQuickLogin = (demoEmail: string) => {
    login(demoEmail, 'password123');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-4xl rounded-3xl glass-panel border border-indigo-500/30 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2"
        >
          {/* Close button */}
          <button
            onClick={() => setIsLoginModalOpen(false)}
            className="absolute top-4 right-4 z-20 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* LEFT SIDE: CAIAS Branding & Abstract Visual */}
          <div className="relative p-8 md:p-10 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 flex flex-col justify-between overflow-hidden border-r border-indigo-500/20">
            {/* Background Glow Nodes */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* CAIAS Logo & Product Title */}
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-600/30">
                  <Shield className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                    CAIAS
                  </h1>
                  <p className="text-[11px] font-extrabold text-indigo-400 uppercase tracking-widest">
                    Attendance Management System
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Next-Generation Academic Attendance & Biometric Technology Platform for CAIAS College.
              </p>
            </div>

            {/* Abstract Visual Graphical Cards */}
            <div className="relative z-10 my-8 space-y-3">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-2 shadow-lg transform -rotate-1 hover:rotate-0 transition-transform">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center space-x-1.5">
                    <Fingerprint className="w-4 h-4 text-emerald-400" />
                    <span>RFID Card + Fingerprint</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    &lt; 1s Response
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 w-3/4 rounded-full" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-2 shadow-lg transform rotate-1 hover:rotate-0 transition-transform">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Live Class Attendance Engine</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Auto Synchronized
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                  <span className="text-emerald-400 font-bold">42 Present</span>
                  <span>•</span>
                  <span className="text-amber-400 font-bold">3 Late</span>
                  <span>•</span>
                  <span className="text-rose-400 font-bold">15 Absent</span>
                </div>
              </div>
            </div>

            {/* Bottom Footer Note */}
            <div className="relative z-10 text-[10px] text-slate-400 font-mono">
              Enterprise Attendance Infrastructure v3.5
            </div>
          </div>

          {/* RIGHT SIDE: Welcome Back & Sign In Form */}
          <div className="p-8 md:p-10 flex flex-col justify-between space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Welcome Back</h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your authorized faculty credentials to log in.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">College Email ID</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alan.turing@caias.edu.in"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Remember me</span>
                </label>

                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Password reset link sent to registered email.'); }} className="text-indigo-400 hover:underline font-semibold">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all transform active:scale-95 mt-2"
              >
                <span>Sign In to CAIAS AMS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Accounts */}
            <div className="pt-4 border-t border-slate-800">
              <p className="text-[11px] font-bold text-slate-400 mb-2">
                Quick Demo Faculty Login:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('alan.turing@caias.edu.in')}
                  className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-900/60 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 text-left transition-all group"
                >
                  <UserCheck className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-[11px] font-bold text-slate-200">Dr. Alan Turing</p>
                    <p className="text-[9px] text-slate-400">Head of CS Dept</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('marie.curie@caias.edu.in')}
                  className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-900/60 hover:bg-purple-600/20 border border-slate-800 hover:border-purple-500/40 text-left transition-all group"
                >
                  <UserCheck className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-[11px] font-bold text-slate-200">Prof. Marie Curie</p>
                    <p className="text-[9px] text-slate-400">Electronics Dept</p>
                  </div>
                </button>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
