'use client';

import React from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { BookOpen, CheckCircle2, Radio, Clock, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export const StatsOverview: React.FC = () => {
  const { activeSession } = useAttendance();

  const stats = [
    {
      title: "Today's Classes",
      value: 8,
      subtitle: 'Total scheduled slots',
      icon: BookOpen,
      color: 'from-indigo-600/20 to-purple-600/20 text-indigo-400 border-indigo-500/30',
      badge: '100% Scheduled',
    },
    {
      title: 'Completed',
      value: 5,
      subtitle: 'Sessions archived',
      icon: CheckCircle2,
      color: 'from-emerald-600/20 to-teal-600/20 text-emerald-400 border-emerald-500/30',
      badge: '62.5% Complete',
    },
    {
      title: 'Live',
      value: activeSession ? 1 : 0,
      subtitle: 'Active attendance session',
      icon: Radio,
      color: 'from-rose-600/20 to-pink-600/20 text-rose-400 border-rose-500/30 animate-pulse',
      badge: activeSession ? 'Active Now' : 'Idle',
    },
    {
      title: 'Upcoming',
      value: activeSession ? 2 : 3,
      subtitle: 'Classes remaining today',
      icon: Clock,
      color: 'from-amber-600/20 to-orange-600/20 text-amber-400 border-amber-500/30',
      badge: 'Next at 10:00 AM',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;

        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="p-5 rounded-3xl glass-panel border border-slate-800 hover:border-slate-700/80 transition-all hover:scale-[1.02] cursor-pointer group space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-2xl bg-gradient-to-br border ${stat.color}`}>
                <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-900 text-slate-400 border border-slate-800">
                {stat.badge}
              </span>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400">{stat.title}</p>
              <h3 className="text-3xl font-extrabold text-white tracking-tight mt-0.5 font-mono">
                {stat.value}
              </h3>
            </div>

            <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              {stat.subtitle}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
};
