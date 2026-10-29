'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileCheck2,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronRight,
  Shield,
  Clock,
  Sparkles,
  School,
  UserCheck,
  Cpu,
} from 'lucide-react';
import Image from 'next/image';
import { AnimatedBackground } from './AnimatedBackground';
import { BrandLogoIntro } from './BrandLogoIntro';

interface AppShellProps {
  children: React.ReactNode;
  role: 'ADMIN' | 'FACULTY' | 'STUDENT';
}

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'FACULTY' | 'STUDENT';
}

export function AppShell({ children, role }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Signed out successfully');
      router.push('/login');
      router.refresh();
    } catch (e) {
      router.push('/login');
    }
  };

  const adminNav = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Students', href: '/admin/students', icon: GraduationCap },
    { label: 'Faculty', href: '/admin/faculty', icon: Users },
    { label: 'Departments & Courses', href: '/admin/departments', icon: BookOpen },
    { label: 'Classes & Timetable', href: '/admin/timetable', icon: CalendarDays },
    { label: 'Attendance', href: '/admin/attendance', icon: CheckCircle2 },
    { label: 'Correction Requests', href: '/admin/corrections', icon: FileCheck2 },
    { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const facultyNav = [
    { label: 'Dashboard', href: '/faculty/dashboard', icon: LayoutDashboard },
    { label: 'My Classes', href: '/faculty/classes', icon: Users },
    { label: 'Timetable', href: '/faculty/timetable', icon: CalendarDays },
    { label: 'Take Attendance', href: '/faculty/attendance', icon: CheckCircle2 },
    { label: 'Attendance History', href: '/faculty/history', icon: Clock },
    { label: 'Correction Requests', href: '/faculty/corrections', icon: FileCheck2 },
    { label: 'Reports', href: '/faculty/reports', icon: BarChart3 },
    { label: 'Profile', href: '/faculty/profile', icon: UserCheck },
  ];

  const studentNav = [
    { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { label: 'My Timetable', href: '/student/timetable', icon: CalendarDays },
    { label: 'My Attendance', href: '/student/attendance', icon: CheckCircle2 },
    { label: 'Correction Requests', href: '/student/corrections', icon: FileCheck2 },
    { label: 'Notifications', href: '/student/notifications', icon: Bell },
    { label: 'Profile', href: '/student/profile', icon: UserCheck },
  ];

  const navItems = role === 'ADMIN' ? adminNav : role === 'FACULTY' ? facultyNav : studentNav;

  const roleBadge = {
    ADMIN: { label: 'ADMIN AUTHORITY', badge: 'bg-blue-950/60 text-blue-400 border-blue-500/40' },
    FACULTY: { label: 'FACULTY COMMAND', badge: 'bg-cyan-950/60 text-cyan-400 border-cyan-500/40' },
    STUDENT: { label: 'STUDENT PORTAL', badge: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40' },
  }[role];

  return (
    <div className="min-h-screen flex bg-[#09090B] text-[#F9FAFB] relative overflow-hidden">
      <AnimatedBackground />
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#111318]/95 backdrop-blur-md border-r border-[#27272A] p-4 shrink-0 select-none z-10">
        {/* Brand */}
        <div className="flex items-center space-x-3 px-2 py-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-[#18181B] border border-cyan-500/40 p-1 flex items-center justify-center text-white shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-400/30 overflow-hidden">
            <Image
              src="/logo.png"
              alt="AI Smart Attendance Logo"
              width={40}
              height={40}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm tracking-tight text-white block">AI SMART</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <span className="text-[10px] text-[#9CA3AF] font-mono tracking-wider">ATTENDANCE SYSTEM</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/25 to-cyan-600/10 text-white border border-blue-500/40 shadow-sm'
                    : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#18181B] hover:border-[#27272A] border border-transparent'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b from-blue-500 to-cyan-400 shadow-sm shadow-cyan-400/50"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <div className="flex items-center space-x-3 pl-1">
                  <Icon
                    className={`w-4 h-4 transition-colors duration-200 ${
                      isActive ? 'text-cyan-400' : 'text-[#9CA3AF] group-hover:text-blue-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="pt-4 border-t border-[#27272A] mt-auto space-y-2">
          <div className="p-3 rounded-xl bg-[#18181B] border border-[#27272A] flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-cyan-300 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
              {user?.name?.charAt(0) || role.charAt(0)}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-[#F9FAFB] truncate">{user?.name || 'Authorized User'}</p>
              <p className="text-[10px] text-[#9CA3AF] truncate font-mono">{user?.email || role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center justify-center space-x-2 transition-all duration-200 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-[#111318]/90 backdrop-blur-md border-b border-[#27272A] px-4 lg:px-8 flex items-center justify-between z-20">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-[#18181B] border border-[#27272A] text-[#9CA3AF] hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border ${roleBadge.badge}`}
              >
                {roleBadge.label}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                SYSTEM ACTIVE
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center text-xs text-[#9CA3AF] space-x-2 bg-[#18181B] px-3 py-1.5 rounded-xl border border-[#27272A]">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div className="flex items-center space-x-2 pl-2 border-l border-[#27272A]">
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 text-cyan-400 flex items-center justify-center text-xs font-bold">
                {user?.name?.charAt(0) || role.charAt(0)}
              </div>
              <div className="hidden md:block text-left leading-tight">
                <p className="text-xs font-semibold text-white">{user?.name || 'User'}</p>
                <p className="text-[10px] text-[#9CA3AF] capitalize">{role.toLowerCase()}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Viewport Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#09090B]">
          {children}
        </main>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative flex flex-col w-72 max-w-xs h-full bg-[#111318] border-r border-[#27272A] p-4 text-[#F9FAFB]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#27272A] mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#18181B] border border-cyan-500/40 p-0.5 flex items-center justify-center text-white overflow-hidden">
                    <Image
                      src="/logo.png"
                      alt="AI Smart Attendance Logo"
                      width={28}
                      height={28}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="font-bold text-sm text-white">AI SMART ATTENDANCE</span>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1 rounded-lg text-[#9CA3AF] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <button
                      key={item.href}
                      onClick={() => {
                        router.push(item.href);
                        setIsMobileOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer ${
                        isActive
                          ? 'bg-blue-600/25 text-white border border-blue-500/40'
                          : 'text-[#9CA3AF] hover:text-white hover:bg-[#18181B]'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-[#9CA3AF]'}`} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-[#27272A] mt-auto">
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center justify-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
