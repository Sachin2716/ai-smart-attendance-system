'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { Radio, ShieldCheck, Camera, CheckCircle2, AlertTriangle, Clock, MapPin, Sparkles, LogOut, Play, Square, RefreshCw, Key, Power } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LiveCameraView } from '@/components/Attendance/LiveCameraView';
import { RfidCardTapCard } from '@/components/Attendance/RfidCardTapCard';

export const FacultyCheckpointStation: React.FC = () => {
  const {
    activeEvent,
    eventAttendanceRecords,
    selectedCheckpoint,
    setSelectedCheckpoint,
    isStationConnected,
    joinCheckpointStation,
    leaveCheckpointStation,
    markAuditoriumAttendance,
  } = useAttendance();

  const { user } = useAuth();
  const [scanAlert, setScanAlert] = useState<{ success: boolean; message: string } | null>(null);

  const checkpointName = selectedCheckpoint || 'AUD-GATE-01';
  const stationRecords = eventAttendanceRecords.filter(
    r => r.eventId === activeEvent?.id && r.checkpointName === checkpointName
  );

  const handleScan = () => {
    const res = markAuditoriumAttendance(checkpointName);
    setScanAlert({ success: res.success, message: res.message });
  };

  const handleCrossGateDuplicateTest = () => {
    const allRecords = eventAttendanceRecords.filter(r => r.eventId === activeEvent?.id);
    if (allRecords.length > 0) {
      const first = allRecords[0];
      const res = markAuditoriumAttendance(checkpointName, first.studentId);
      setScanAlert({ success: res.success, message: res.message });
    }
  };

  if (!activeEvent || activeEvent.status !== 'ACTIVE') {
    return (
      <div className="p-12 rounded-3xl glass-panel text-center max-w-xl mx-auto space-y-4">
        <Radio className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-xl font-extrabold text-white">No Active Auditorium Event</h3>
        <p className="text-xs text-slate-400">Ask the Event Coordinator to start the auditorium event in the Event Control Center.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* STATION CONNECT STATUS HEADER BANNER */}
      <div className="p-6 rounded-3xl glass-panel bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 border border-teal-500/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-extrabold flex items-center space-x-1.5 ${
              isStationConnected
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}>
              <Radio className="w-3.5 h-3.5" />
              <span>{isStationConnected ? '🟢 STATION CONNECTED & LIVE' : '🔴 NOT CONNECTED TO GATE'}</span>
            </span>

            <span className="text-xs font-mono text-slate-400">
              {activeEvent.name}
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Checkpoint Station: <span className="text-cyan-300 font-mono">{checkpointName}</span>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h1>

          <p className="text-xs text-slate-400">
            Faculty Operator: <strong className="text-slate-200">{user?.name || 'Prof. Anil'}</strong> • Venue: <strong className="text-teal-300">{activeEvent.venue}</strong>
          </p>
        </div>

        {/* Join / Disconnect Action */}
        <div>
          {isStationConnected ? (
            <button
              onClick={leaveCheckpointStation}
              className="px-5 py-2.5 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-extrabold text-xs flex items-center space-x-2 transition-all"
            >
              <Power className="w-4 h-4" />
              <span>Disconnect Station</span>
            </button>
          ) : (
            <button
              onClick={() => joinCheckpointStation(activeEvent.id, checkpointName)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-xs shadow-xl shadow-emerald-600/30 flex items-center space-x-2 transition-all transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>JOIN CHECKPOINT STATION</span>
            </button>
          )}
        </div>
      </div>

      {/* SCANNER STATION INTERFACE */}
      {isStationConnected ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* CAMERA VIEWFINDER CARD */}
          <div className="md:col-span-2 p-6 rounded-3xl glass-panel space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Laptop Camera Viewfinder & Face AI</span>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Camera Active ●
              </span>
            </div>

            {/* Live Camera Feed */}
            <LiveCameraView isActive={isStationConnected && activeEvent.status === 'ACTIVE'} />

            {/* Smart Card RFID Tap Reader UI */}
            <RfidCardTapCard
              onTapCard={handleScan}
              lastScannedCardUid={stationRecords[0]?.studentUucmsNo || 'A7:B2:91:4C'}
              lastScannedStudentName={stationRecords[0] ? `${stationRecords[0].studentName} (${stationRecords[0].course} Sem ${stationRecords[0].semester})` : 'Gate Checkpoint Scanner Ready'}
              mode="AUDITORIUM"
              statusText={`CHECKPOINT ${checkpointName} READY`}
            />

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleScan}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Scan Next Student (Simulate)</span>
              </button>

              <button
                onClick={handleCrossGateDuplicateTest}
                className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-300 font-bold text-xs flex items-center space-x-1.5"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Test Cross-Gate Duplicate Guard</span>
              </button>
            </div>

            {/* Scan Alert Banner */}
            {scanAlert && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3.5 rounded-2xl border font-bold text-xs flex items-center justify-between shadow-lg ${
                    scanAlert.success
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  }`}
                >
                  <span>{scanAlert.message}</span>
                  <button onClick={() => setScanAlert(null)} className="text-slate-400 hover:text-white">✕</button>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* CHECKPOINT LIVE METRICS SIDEBAR */}
          <div className="p-6 rounded-3xl glass-panel space-y-4 text-xs">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              Station Activity Log ({stationRecords.length})
            </h3>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-slate-400 font-bold text-[10px] uppercase">Verified at {checkpointName}</span>
              <h4 className="text-3xl font-extrabold text-emerald-400 font-mono">{stationRecords.length}</h4>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {stationRecords.length === 0 ? (
                <p className="text-slate-500 text-center py-6">No check-ins recorded at this station yet.</p>
              ) : (
                stationRecords.map((r) => (
                  <div key={r.id} className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-0.5">
                    <p className="font-bold text-white">🟢 {r.studentName}</p>
                    <p className="text-[10px] text-indigo-300 font-mono">{r.studentUucmsNo} • {r.course} {r.section}</p>
                    <p className="text-[10px] text-emerald-400 font-mono text-right">{r.checkInTime}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="p-12 rounded-3xl glass-panel text-center max-w-xl mx-auto space-y-4">
          <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-xl font-extrabold text-white">Station Ready for Checkpoint Join</h3>
          <p className="text-xs text-slate-400">
            Click <strong>JOIN CHECKPOINT STATION</strong> above to connect this laptop to gate <strong>{checkpointName}</strong>.
          </p>
        </div>
      )}

    </div>
  );
};
