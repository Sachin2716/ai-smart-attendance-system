'use client';

import React from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { Camera, CreditCard, Wifi, Server, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

export const DeviceStatusWidget: React.FC = () => {
  const { deviceStatus, toggleEmergencyOverride, offlineQueue } = useAttendance();

  const statuses = [
    { label: 'Camera', status: deviceStatus.cameraConnected, icon: Camera, text: deviceStatus.cameraConnected ? 'CONNECTED' : 'DISCONNECTED' },
    { label: 'Card Reader', status: deviceStatus.cardReaderConnected, icon: CreditCard, text: deviceStatus.cardReaderConnected ? 'CONNECTED' : 'DISCONNECTED' },
    { label: 'Internet', status: deviceStatus.internetConnected, icon: Wifi, text: deviceStatus.internetConnected ? 'CONNECTED' : 'DISCONNECTED' },
    { label: 'Server', status: deviceStatus.serverOnline, icon: Server, text: deviceStatus.serverOnline ? 'ONLINE' : 'OFFLINE' },
  ];

  return (
    <div className="p-4 rounded-3xl glass-panel flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] flex items-center gap-1.5">
          <Server className="w-3.5 h-3.5 text-indigo-400" />
          <span>System & Hardware Status:</span>
        </span>

        {statuses.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 font-mono font-bold ${
                item.status
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}:</span>
              <span className="text-[10px] uppercase">{item.text}</span>
            </div>
          );
        })}
      </div>

      {/* Offline Queue Badge & Emergency Override Toggle */}
      <div className="flex items-center space-x-3">
        {offlineQueue.length > 0 && (
          <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold animate-pulse">
            Pending Sync: {offlineQueue.length} Records
          </span>
        )}

        <button
          onClick={toggleEmergencyOverride}
          className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center space-x-1.5 transition-all ${
            deviceStatus.emergencyManualOverride
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
          title="Toggle emergency manual override mode when hardware is offline"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>Emergency Override: {deviceStatus.emergencyManualOverride ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </div>
  );
};
