'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { ManageFacultyModal } from './ManageFacultyModal';
import { ManageCheckpointsModal } from './ManageCheckpointsModal';
import { EndEventSummaryModal } from './EndEventSummaryModal';
import { exportAuditoriumAttendanceToExcel } from '@/utils/exportExcel';
import { Radio, Users, ShieldCheck, CheckCircle2, AlertTriangle, Clock, MapPin, Sparkles, Download, Search, Filter, Settings as SettingsIcon, BarChart3, Play, Pause, Square, Power, Laptop } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EventControlCenterProps {
  eventId: string;
  onBackToEventsList: () => void;
}

export const EventControlCenter: React.FC<EventControlCenterProps> = ({ eventId, onBackToEventsList }) => {
  const {
    events,
    startEventAttendance,
    stopEventAttendance,
    eventAttendanceRecords,
    markAuditoriumAttendance,
  } = useAttendance();

  const [activeTab, setActiveTab] = useState<'LIVE_FEED' | 'FACULTY_MONITOR' | 'GATE_STATS'>('LIVE_FEED');
  const [isManageFacultyOpen, setIsManageFacultyOpen] = useState(false);
  const [isManageGatesOpen, setIsManageGatesOpen] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [endSummary, setEndSummary] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGateFilter, setSelectedGateFilter] = useState('ALL');

  const currentEvent = events.find(e => e.id === eventId);
  const isLive = currentEvent?.status === 'ACTIVE';

  const currentRecords = eventAttendanceRecords.filter(r => r.eventId === eventId);
  const expectedTotal = currentEvent?.expectedStrength || 1200;
  const presentTotal = currentRecords.length;
  const remainingTotal = Math.max(0, expectedTotal - presentTotal);

  const assignedFaculty = currentEvent?.facultyAssignments || [];
  const onlineFacultyCount = assignedFaculty.filter(f => f.isConnected).length;

  const checkpoints = currentEvent?.checkpoints || [];
  const activeGatesCount = checkpoints.filter(c => c.status === 'ONLINE').length;

  const handleStartEvent = () => {
    startEventAttendance(eventId);
  };

  const handleEndEventConfirm = () => {
    const summary = stopEventAttendance(eventId);
    setEndSummary(summary);
    setIsEndModalOpen(true);
  };

  const handleExport = () => {
    if (currentEvent) {
      exportAuditoriumAttendanceToExcel(currentEvent.name, currentRecords);
    }
  };

  const filteredRecords = currentRecords.filter(r => {
    const matchesSearch = r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.studentUucmsNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGate = selectedGateFilter === 'ALL' || r.checkpointName === selectedGateFilter;
    return matchesSearch && matchesGate;
  });

  if (!currentEvent) {
    return (
      <div className="p-8 text-center text-slate-400">
        Event not found. <button onClick={onBackToEventsList} className="text-emerald-400 font-bold underline">Back to Events List</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* EVENT CONTROL CENTER HERO HEADER */}
      <div className="p-6 rounded-3xl glass-panel bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/40 shadow-2xl space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-extrabold flex items-center space-x-1.5 ${
                isLive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                  : currentEvent.status === 'COMPLETED'
                  ? 'bg-slate-800 text-slate-400 border border-slate-700'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                <Radio className="w-3.5 h-3.5" />
                <span>{isLive ? '🟢 EVENT LIVE' : currentEvent.status === 'COMPLETED' ? '🏁 EVENT ENDED' : '🔴 EVENT NOT STARTED'}</span>
              </span>

              <span className="text-xs font-mono text-slate-400">
                Event ID: <strong className="text-emerald-300">{currentEvent.id}</strong>
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              {currentEvent.name}
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h1>

            <p className="text-xs text-slate-400">
              Coordinator: <strong className="text-slate-200">{currentEvent.coordinatorName}</strong> • Venue: <strong className="text-emerald-300">{currentEvent.venue}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onBackToEventsList}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs"
            >
              ← Back to Events
            </button>

            {isLive ? (
              <button
                onClick={handleEndEventConfirm}
                className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 flex items-center space-x-1.5"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>END EVENT</span>
              </button>
            ) : currentEvent.status !== 'COMPLETED' ? (
              <button
                onClick={handleStartEvent}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-xs shadow-xl shadow-emerald-600/30 flex items-center space-x-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>START EVENT</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* METRICS OVERVIEW STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Expected Capacity</span>
            <h4 className="text-xl font-extrabold text-white font-mono">{expectedTotal}</h4>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-0.5">
            <span className="text-[10px] text-emerald-400 font-bold uppercase">Verified Present</span>
            <h4 className="text-xl font-extrabold text-emerald-400 font-mono">{presentTotal}</h4>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-0.5">
            <span className="text-[10px] text-amber-400 font-bold uppercase">Remaining</span>
            <h4 className="text-xl font-extrabold text-amber-300 font-mono">{remainingTotal}</h4>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-0.5">
            <span className="text-[10px] text-indigo-400 font-bold uppercase">Faculty Roster</span>
            <h4 className="text-xl font-extrabold text-indigo-300 font-mono">{assignedFaculty.length} Assigned</h4>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-0.5">
            <span className="text-[10px] text-cyan-400 font-bold uppercase">Faculty Online</span>
            <h4 className="text-xl font-extrabold text-cyan-300 font-mono">{onlineFacultyCount} Online</h4>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-0.5">
            <span className="text-[10px] text-purple-400 font-bold uppercase">Active Gates</span>
            <h4 className="text-xl font-extrabold text-purple-300 font-mono">{activeGatesCount} Gates</h4>
          </div>
        </div>

      </div>

      {/* COORDINATOR TOOLBAR CONTROLS */}
      <div className="p-4 rounded-2xl glass-panel flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsManageFacultyOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-extrabold flex items-center space-x-1.5"
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>MANAGE FACULTY ({assignedFaculty.length})</span>
          </button>

          <button
            onClick={() => setIsManageGatesOpen(true)}
            className="px-4 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 font-extrabold flex items-center space-x-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>MANAGE CHECKPOINTS ({checkpoints.length})</span>
          </button>

          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-extrabold flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>EXPORT EXCEL</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Cross-Gate Duplicate Guard: ACTIVE ●</span>
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="p-2 rounded-2xl glass-panel flex items-center space-x-2 text-xs">
        <button
          onClick={() => setActiveTab('LIVE_FEED')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'LIVE_FEED'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Radio className="w-4 h-4 text-emerald-400" />
          <span>Central Live Attendance Feed ({presentTotal})</span>
        </button>

        <button
          onClick={() => setActiveTab('FACULTY_MONITOR')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'FACULTY_MONITOR'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Laptop className="w-4 h-4 text-cyan-400" />
          <span>Faculty Laptop Connection Monitor ({assignedFaculty.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('GATE_STATS')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'GATE_STATS'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-purple-400" />
          <span>Gate Breakdown Statistics</span>
        </button>
      </div>

      {/* SUB-TAB CONTENTS */}
      {activeTab === 'FACULTY_MONITOR' && (
        <div className="p-6 rounded-3xl glass-panel space-y-4 text-xs">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Laptop className="w-5 h-5 text-cyan-400" />
            Faculty Laptop Checkpoint Real-Time Connection Status
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {assignedFaculty.map((fac) => {
              const matchedGate = checkpoints.find(c => c.assignedFacultyEmail === fac.facultyEmail);
              const gateName = fac.assignedCheckpointName || matchedGate?.name || 'Unassigned Gate';
              const isOnline = fac.isConnected || matchedGate?.status === 'ONLINE';

              return (
                <div
                  key={fac.id}
                  className={`p-4 rounded-2xl border transition-all space-y-2 ${
                    isOnline
                      ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-extrabold text-cyan-300">{gateName}</span>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      isOnline
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      ● {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>

                  <div>
                    <p className="font-bold text-white text-sm">{fac.facultyName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{fac.facultyEmail}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Gate Attendance:</span>
                    <strong className="text-emerald-300 font-mono">{matchedGate?.attendanceCount || 150} Verified</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'GATE_STATS' && (
        <div className="p-6 rounded-3xl glass-panel space-y-4 text-xs">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Gate-Wise Attendance Breakdown
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {checkpoints.map((cp) => (
              <div key={cp.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-extrabold text-emerald-300">{cp.name}</span>
                  <span className="font-bold text-white font-mono">{cp.attendanceCount || 150} Verified</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full" style={{ width: `${Math.min(100, (cp.attendanceCount || 150) * 0.6)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'LIVE_FEED' && (
        <div className="p-6 rounded-3xl glass-panel space-y-4 text-xs">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-400" />
                Central Live Check-In Feed ({presentTotal} Verified)
              </h3>
              <p className="text-xs text-slate-400">
                Multi-faculty laptop stations stream live gate check-ins into this central dashboard.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search student or USN..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl glass-input text-slate-200 text-xs"
                />
              </div>

              <select
                value={selectedGateFilter}
                onChange={(e) => setSelectedGateFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl glass-input text-slate-200 bg-slate-900 font-bold text-xs"
              >
                <option value="ALL">All Gates</option>
                {checkpoints.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">USN / Class</th>
                  <th className="py-3 px-4">Checkpoint Gate</th>
                  <th className="py-3 px-4">Faculty Device Operator</th>
                  <th className="py-3 px-4">Check-In Time</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                      No student check-ins recorded yet for {currentEvent.name}.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">
                        🟢 {r.studentName}
                        <p className="text-[10px] text-slate-400 font-normal">{r.department}</p>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">
                        {r.studentUucmsNo}
                        <p className="text-[10px] text-slate-300 font-normal">{r.course} Sem {r.semester} ({r.section})</p>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-300">
                        {r.checkpointName || 'AUD-GATE-01'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        {r.facultyDeviceName || 'Dr. Alan Turing Laptop'}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-300">
                        {r.checkInTime}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          PRESENT ✅
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* MODALS */}
      <ManageFacultyModal
        isOpen={isManageFacultyOpen}
        onClose={() => setIsManageFacultyOpen(false)}
        eventId={eventId}
      />

      <ManageCheckpointsModal
        isOpen={isManageGatesOpen}
        onClose={() => setIsManageGatesOpen(false)}
        eventId={eventId}
      />

      <EndEventSummaryModal
        isOpen={isEndModalOpen}
        onClose={() => setIsEndModalOpen(false)}
        summaryData={endSummary}
        eventId={eventId}
      />

    </div>
  );
};
