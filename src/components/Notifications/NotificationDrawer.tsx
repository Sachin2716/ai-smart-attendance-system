'use client';

import React from 'react';
import { Bell, X, CheckCircle2, AlertTriangle, Radio, Info, Sparkles, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface NotificationItem {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'live';
  title: string;
  message: string;
  time: string;
  read?: boolean;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: NotificationItem[];
}

export const defaultNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'live',
    title: 'Class Starting in 5 Minutes',
    message: 'BCA AIML 3 DBMS session is ready in Room 201.',
    time: 'Just now',
  },
  {
    id: 'notif-2',
    type: 'success',
    title: 'Attendance Saved',
    message: 'Attendance session for Data Structures (42 Present) was archived successfully.',
    time: '10 mins ago',
  },
  {
    id: 'notif-3',
    type: 'warning',
    title: 'Low Attendance Alert',
    message: '5 students have attendance below 75% threshold in BCA AIML 3.',
    time: '1 hour ago',
  },
  {
    id: 'notif-4',
    type: 'info',
    title: 'Timetable Updated',
    message: 'Dr. Alan Turing assigned extra class slot for Artificial Intelligence on Friday.',
    time: '2 hours ago',
  },
];

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications = defaultNotifications,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="relative w-full max-w-md h-full glass-panel border-l border-slate-800 bg-slate-950/95 shadow-2xl flex flex-col justify-between"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm">System Notifications</h3>
                <p className="text-[11px] text-slate-400">CAIAS AMS Real-time Activity Center</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center space-x-1 ${
                    n.type === 'live'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                      : n.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : n.type === 'warning'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}>
                    {n.type === 'live' && <Radio className="w-3 h-3 text-rose-400" />}
                    {n.type === 'success' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    {n.type === 'warning' && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                    {n.type === 'info' && <Info className="w-3 h-3 text-indigo-400" />}
                    <span className="uppercase">{n.type}</span>
                  </span>

                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {n.time}
                  </span>
                </div>

                <h4 className="font-bold text-white text-xs">{n.title}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">{n.message}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 text-center">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 transition-all"
            >
              Mark All as Read
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
