'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bell, CheckCircle2, AlertTriangle, Info, ShieldAlert, RefreshCw } from 'lucide-react';

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/student/dashboard');
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-violet-400" />
            System Notifications & Alerts
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time biometric attendance receipts, leave updates, and institutional notices.
          </p>
        </div>

        <button
          onClick={fetchNotifications}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start space-x-3 transition-all"
          >
            <div className="p-2 rounded-xl bg-slate-800 shrink-0 mt-0.5">
              {n.type === 'SUCCESS' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : n.type === 'ALERT' ? (
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              ) : n.type === 'WARNING' ? (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              ) : (
                <Info className="w-4 h-4 text-indigo-400" />
              )}
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white">{n.title}</h4>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{n.message}</p>
            </div>
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="p-12 rounded-3xl bg-slate-900/80 border border-slate-800 text-center text-slate-500 text-xs">
            No notifications available.
          </div>
        )}
      </div>
    </div>
  );
}
