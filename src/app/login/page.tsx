'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  School,
  GraduationCap,
  Briefcase,
  Shield,
  Cpu,
  ScanLine,
  Fingerprint,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { BrandLogoIntro } from '@/components/layout/BrandLogoIntro';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import Image from 'next/image';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '';
  const registered = searchParams.get('registered');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both your institutional email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Authentication failed. Please verify credentials.');
        toast.error(data.error || 'Login failed');
        setIsLoading(false);
        return;
      }

      toast.success(`Identity Verified: Welcome, ${data.user.name}!`);
      const destination = callbackUrl || data.redirectUrl;
      router.push(destination);
      router.refresh();
    } catch (err) {
      setErrorMessage('Network connection error. Please try again.');
      toast.error('Network connection error');
      setIsLoading(false);
    }
  };

  const quickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-[#09090B]">
      <AnimatedBackground />
      <BrandLogoIntro />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        <div className="p-6 sm:p-8 rounded-2xl bg-[#18181B] border border-[#27272A] shadow-2xl shadow-black/80 space-y-6 relative overflow-hidden">
          
          {/* Subtle AI Scanning Line at Card Top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#22D3EE] to-transparent animate-laser-scan opacity-70" />

          {/* Header with AI Scanner Visual & Official Logo */}
          <div className="text-center space-y-3">
            <div className="relative inline-flex items-center justify-center mb-1">
              {/* Outer scanning reticle */}
              <div className="w-20 h-20 rounded-2xl bg-[#111318] border border-cyan-500/40 p-2 flex items-center justify-center relative overflow-hidden group shadow-[0_0_25px_rgba(34,211,238,0.2)]">
                {/* Corner reticle marks */}
                <div className="absolute top-1 left-1 w-2.5 h-2.5 reticle-corner-tl" />
                <div className="absolute top-1 right-1 w-2.5 h-2.5 reticle-corner-tr" />
                <div className="absolute bottom-1 left-1 w-2.5 h-2.5 reticle-corner-bl" />
                <div className="absolute bottom-1 right-1 w-2.5 h-2.5 reticle-corner-br" />
                
                {/* Laser scan line across icon */}
                <div className="absolute left-0 right-0 h-[1.5px] bg-[#22D3EE] animate-laser-scan opacity-75 shadow-[0_0_8px_#22D3EE]" />
                
                <Image
                  src="/logo.png"
                  alt="AI Smart Attendance Logo"
                  width={64}
                  height={64}
                  priority
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center gap-1.5">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#F9FAFB]">
                  AI SMART ATTENDANCE
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950/70 text-[#22D3EE] border border-cyan-500/40">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-[#9CA3AF] mt-1 font-medium">
                Smarter Attendance • Brighter Future
              </p>
            </div>
          </div>

          {registered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Biometric profile enrolled! Sign in with your institutional credentials.</span>
            </motion.div>
          )}

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">Access Denied</p>
                <p className="text-[11px] text-rose-300/90 mt-0.5">{errorMessage}</p>
              </div>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#F9FAFB]">
                Institutional Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="name@caias.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#111318] border border-[#27272A] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#F9FAFB] placeholder:text-[#9CA3AF]/60 focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-[#F9FAFB]">Password</label>
                <span className="text-[11px] text-[#22D3EE] font-mono">Encrypted SHA-256</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#111318] border border-[#27272A] rounded-xl pl-9 pr-10 py-2.5 text-xs text-[#F9FAFB] placeholder:text-[#9CA3AF]/60 focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#3B82F6] hover:bg-blue-600 active:scale-[0.99] text-white font-semibold text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate & Enter</span>
                  <ArrowRight className="w-4 h-4 text-cyan-200" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins Helper */}
          <div className="pt-4 border-t border-[#27272A] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#9CA3AF] uppercase tracking-wider">
                Instant System Access
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">1-Click Fill</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickFill('admin@caias.edu.in', 'Admin@123')}
                className="p-2.5 rounded-xl bg-[#111318] hover:bg-[#1C1C21] border border-[#27272A] hover:border-blue-500/40 text-left transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center justify-between text-blue-400 mb-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-mono text-[#9CA3AF] group-hover:text-blue-300">ADMIN</span>
                </div>
                <p className="text-[11px] font-semibold text-white truncate">College Admin</p>
                <p className="text-[10px] text-[#9CA3AF] font-mono">Admin@123</p>
              </button>

              <button
                type="button"
                onClick={() => quickFill('faculty@caias.edu.in', 'Faculty@123')}
                className="p-2.5 rounded-xl bg-[#111318] hover:bg-[#1C1C21] border border-[#27272A] hover:border-cyan-500/40 text-left transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center justify-between text-[#22D3EE] mb-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-mono text-[#9CA3AF] group-hover:text-cyan-300">FACULTY</span>
                </div>
                <p className="text-[11px] font-semibold text-white truncate">Dr. Alan Turing</p>
                <p className="text-[10px] text-[#9CA3AF] font-mono">Faculty@123</p>
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-[#111318] border border-[#27272A] flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span className="text-[#9CA3AF]">New student enrollment?</span>
              </div>
              <a
                href="/register"
                className="text-[#22D3EE] hover:text-cyan-300 font-semibold hover:underline transition-colors"
              >
                Register Face →
              </a>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-[#22D3EE] rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
