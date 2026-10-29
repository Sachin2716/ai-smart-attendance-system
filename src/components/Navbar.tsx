'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAttendance } from '@/context/AttendanceContext';
import { NotificationDrawer } from '@/components/Notifications/NotificationDrawer';
import { ThemeToggle } from './ThemeToggle';
import { Shield, Clock, Radio, LogOut, ShieldCheck, Bell, Sparkles, UserCheck, Play, Server, Camera, CreditCard, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';

export const Navbar: React.FC = () => {
  const { user, logout, setIsLoginModalOpen, setIsOnboardingOpen } = useAuth();
  const { activeSession, setActiveTab, timetable, startSession, deviceStatus } = useAttendance();

  const [time, setTime] = useState<string>('');
  const [greeting, setGreeting] = useState<string>('Good Morning');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours();

      if (hour < 12) setGreeting('Good Morning');
      else if (hour < 17) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');

      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800 backdrop-blur-xl px-4 lg:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Brand Logo & Product Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="relative p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-lg shadow-indigo-500/30 text-white">
              <Shield className="w-6 h-6" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-slate-900 animate-ping" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                  CAIAS
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Attendance Management System
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {greeting}, <strong className="text-white">{user?.name || 'Faculty Member'}</strong>
              </p>
            </div>
          </div>

          {/* Center: Real-time Live Class Banner or Clock */}
          <div className="hidden lg:flex items-center space-x-4">
            {activeSession ? (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={() => setActiveTab('attendance')}
                className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold hover:bg-rose-500/20 transition-all shadow-sm animate-pulse"
              >
                <Radio className="w-3.5 h-3.5 text-rose-400" />
                <span>🔴 LIVE CLASS: {activeSession.subjectCode} ({activeSession.section})</span>
              </motion.button>
            ) : (
              <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 text-slate-300 text-xs font-mono">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-bold">{time}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              </div>
            )}

            {/* Quick Status Bar */}
            <div className="flex items-center space-x-2 text-[10px] font-mono">
              <span className={`px-2 py-0.5 rounded flex items-center gap-1 ${deviceStatus.cameraConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                <Camera className="w-3 h-3" />
                <span>{deviceStatus.cameraConnected ? 'Cam ✓' : 'Cam ✗'}</span>
              </span>
              <span className={`px-2 py-0.5 rounded flex items-center gap-1 ${deviceStatus.cardReaderConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                <CreditCard className="w-3 h-3" />
                <span>{deviceStatus.cardReaderConnected ? 'RFID ✓' : 'RFID ✗'}</span>
              </span>
            </div>
          </div>

          {/* Right Actions: Notifications + Theme + User Profile */}
          <div className="flex items-center space-x-3">
            
            {/* Notification Drawer Trigger */}
            <button
              onClick={() => setIsNotificationOpen(true)}
              className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
              title="System Activity & Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-400" />
            </button>

            <ThemeToggle />

            {user ? (
              <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
                <div
                  onClick={() => setIsOnboardingOpen(true)}
                  className="text-right hidden sm:block cursor-pointer group"
                >
                  <p className="text-xs font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                    {user.name} ✏️
                  </p>
                  <div className="flex items-center justify-end space-x-1">
                    <ShieldCheck className="w-3 h-3 text-indigo-400" />
                    <span className="text-[10px] text-slate-400 font-medium">
                      {user.role} • {user.department}
                    </span>
                  </div>
                </div>
                
                <div
                  onClick={() => setIsOnboardingOpen(true)}
                  className="relative group cursor-pointer"
                  title="Edit Profile"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/40 shadow-sm group-hover:scale-105 transition-transform"
                  />
                </div>

                <button
                  onClick={logout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all"
              >
                <UserCheck className="w-4 h-4" />
                <span>Faculty Login</span>
              </button>
            )}

          </div>

        </div>
      </header>

      {/* Slide-over Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />
    </>
  );
};
