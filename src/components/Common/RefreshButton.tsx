'use client';

import React, { useState } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAttendance } from '@/context/AttendanceContext';

interface RefreshButtonProps {
  className?: string;
  onRefresh?: () => void;
  label?: string;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  className = '',
  onRefresh,
  label = 'Refresh',
}) => {
  const { refreshStateData } = useAttendance();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    setShowSuccessToast(false);

    try {
      // Execute state refresh without clearing session or logging out
      if (onRefresh) {
        onRefresh();
      } else if (refreshStateData) {
        refreshStateData();
      }

      await new Promise((resolve) => setTimeout(resolve, 600));

      setIsRefreshing(false);
      setShowSuccessToast(true);

      setTimeout(() => {
        setShowSuccessToast(false);
      }, 2500);
    } catch (err) {
      console.error('Refresh error:', err);
      setIsRefreshing(false);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        title="Reload latest data without resetting session or logging out"
        className={`px-3.5 py-2 rounded-xl glass-panel bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-white font-extrabold text-xs flex items-center space-x-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50 ${className}`}
      >
        <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span>{isRefreshing ? 'Refreshing...' : label}</span>
      </button>

      {showSuccessToast && (
        <span className="absolute -bottom-7 left-0 whitespace-nowrap text-[10px] font-bold text-emerald-400 bg-emerald-950/90 border border-emerald-500/40 px-2 py-0.5 rounded-md shadow-md flex items-center gap-1 z-20">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          Updated just now
        </span>
      )}
    </div>
  );
};
