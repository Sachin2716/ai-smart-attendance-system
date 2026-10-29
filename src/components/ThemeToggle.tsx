'use client';

import React from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useAttendance();

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="relative p-2 rounded-xl glass-panel text-slate-300 hover:text-white transition-all flex items-center justify-center w-10 h-10 shadow-sm"
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
    >
      <motion.div
        key={theme}
        initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 0.5, rotate: 90, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 text-amber-400" />
        ) : (
          <Moon className="w-5 h-5 text-indigo-600" />
        )}
      </motion.div>
    </button>
  );
};
