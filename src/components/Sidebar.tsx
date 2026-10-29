'use client';

import React, { useState } from 'react';
import { useAttendance, TabType } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Calendar as CalendarIcon, Clock, BookOpen, Users, Radio, BarChart3, Settings as SettingsIcon, ShieldCheck, ChevronRight, Fingerprint, FileText, Shield, ChevronLeft, LogOut, User, Building2, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, activeSession, activeEvent, students, timetable, auditLogs } = useAttendance();
  const { user, isAdmin, isHod, logout, setIsOnboardingOpen } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Dynamic Navigation Items based on User Role (RBAC)
  const navItems: { id: TabType; label: string; icon: React.ElementType; badge?: string | number; activeBadgeColor?: string }[] = isAdmin ? [
    // ADMIN NAVIGATION (Clean Governance & Master Data Ownership)
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Student Management', icon: Users, badge: students.length },
    { id: 'classes', label: 'Classes & Sections', icon: BookOpen },
    { id: 'admin', label: 'Admin Governance', icon: Shield, badge: 'ADMIN' },
    { id: 'reports', label: 'College Reports', icon: BarChart3 },
    { id: 'settings', label: 'System Settings', icon: SettingsIcon },
  ] : isHod ? [
    // HOD NAVIGATION (Department-level Control)
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'classes', label: 'Department Classes', icon: BookOpen },
    { id: 'events', label: 'HOD Event Management', icon: CalendarIcon },
    { id: 'reports', label: 'Department Reports', icon: BarChart3 },
    { id: 'settings', label: 'HOD Profile', icon: SettingsIcon },
  ] : [
    // FACULTY NAVIGATION (Clean: Dashboard, My Timetable, Start Class, Reports, My Profile)
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'timetable', label: 'My Timetable', icon: Clock, badge: timetable.length },
    { 
      id: 'attendance', 
      label: 'Start Class / Live Attendance', 
      icon: Radio, 
      badge: activeSession ? 'LIVE' : undefined,
      activeBadgeColor: 'bg-rose-500 text-white animate-pulse'
    },
    { id: 'reports', label: 'My Reports', icon: BarChart3 },
    { id: 'settings', label: 'My Profile', icon: SettingsIcon },
  ];

  return (
    <aside
      className={`glass-panel border-r border-slate-800 min-h-[calc(100vh-4rem)] p-3 flex flex-col justify-between transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-full md:w-64'
      }`}
    >
      <div className="space-y-4">
        
        {/* Header & Role Badge */}
        <div className="flex items-center justify-between px-2 py-1">
          {!isCollapsed && (
            <div>
              <div className="flex items-center space-x-1.5 mb-1">
                <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-extrabold font-mono uppercase tracking-wider ${
                  isAdmin
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : isHod
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {isAdmin ? '🛡️ ADMIN' : isHod ? '🏛️ HOD' : '👨‍🏫 FACULTY'}
                </span>
              </div>
              <p className="text-xs font-bold text-white leading-tight">
                CAIAS Attendance
              </p>
              <p className="text-[10px] text-slate-400 font-mono font-semibold">
                {user?.department || 'Computer Science'}
              </p>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all mx-auto md:mx-0"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'} py-2.5 rounded-xl font-semibold text-xs transition-all relative ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-indigo-400'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>

                {!isCollapsed && item.badge !== undefined && (
                  <span
                    suppressHydrationWarning
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.activeBadgeColor
                        ? item.activeBadgeColor
                        : isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Profile & Logout */}
      <div className="pt-3 border-t border-slate-800 space-y-2">
        {!isCollapsed ? (
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setIsOnboardingOpen(true)}>
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt="User"
                className="w-8 h-8 rounded-xl object-cover ring-2 ring-indigo-500/40"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                  <span>{user?.role}</span> • <span>{user?.department}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
              <button
                onClick={() => setActiveTab('settings')}
                className="text-slate-400 hover:text-white text-[11px] font-bold flex items-center space-x-1"
              >
                <SettingsIcon className="w-3.5 h-3.5" />
                <span>Profile</span>
              </button>

              <button
                onClick={logout}
                className="text-rose-400 hover:text-rose-300 text-[11px] font-bold flex items-center space-x-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              title="Profile"
            >
              <User className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
