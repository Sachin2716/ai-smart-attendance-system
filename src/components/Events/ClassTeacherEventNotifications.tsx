'use client';

import React from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { Bell, Users, Clock, ShieldCheck, CheckCircle2, Sparkles, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export const ClassTeacherEventNotifications: React.FC = () => {
  const { eventNotifications, eventAttendanceRecords } = useAttendance();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl glass-panel flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4" />
            <span>Faculty Event Notifications Center</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">Class Teacher & Current Faculty Alerts</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time notifications dispatched to Permanent Class Teachers & Current Class Faculty when students attend events.
          </p>
        </div>
      </div>

      {/* Notifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {eventNotifications.map((notif, idx) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="p-5 rounded-3xl glass-panel border border-indigo-500/30 space-y-3 shadow-lg relative"
          >
            <div className="flex items-center justify-between">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                notif.recipientRole === 'PERMANENT_CLASS_TEACHER'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              }`}>
                ● {notif.recipientRole === 'PERMANENT_CLASS_TEACHER' ? 'Class Teacher Alert' : 'Current Faculty Alert'}
              </span>

              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {notif.timestamp}
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                {notif.eventName}
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h4>

              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {notif.message}
              </p>
            </div>

            {/* Recipient Details */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Notified: <strong className="text-slate-200">{notif.recipientFacultyName}</strong></span>
              <span className="font-mono text-emerald-400 font-bold">Verification: Card + Face ✅</span>
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
};
