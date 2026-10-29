'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { CreateAuditoriumEventModal } from './CreateAuditoriumEventModal';
import { EventControlCenter } from './EventControlCenter';
import { FacultyCheckpointStation } from './FacultyCheckpointStation';
import { exportAuditoriumAttendanceToExcel } from '@/utils/exportExcel';
import { RefreshButton } from '@/components/Common/RefreshButton';
import { Radio, ShieldCheck, Plus, Calendar, Clock, MapPin, Sparkles, Download, Search, Filter, Settings as SettingsIcon, BarChart3, Play, Laptop, Eye, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AuditoriumModule: React.FC = () => {
  const {
    events,
    activeEvent,
    startEventAttendance,
    eventAttendanceRecords,
  } = useAttendance();

  const [activeSubTab, setActiveSubTab] = useState<'EVENTS_LIST' | 'CONTROL_CENTER' | 'MY_STATION' | 'HISTORY'>('EVENTS_LIST');
  const [selectedEventId, setSelectedEventId] = useState<string>(activeEvent?.id || 'CAIAS-TECH-2026-001');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'UPCOMING' | 'COMPLETED'>('ALL');

  const auditoriumEvents = events.filter(e => e.mode === 'AUDITORIUM');

  const filteredEvents = auditoriumEvents.filter(e => {
    if (statusFilter === 'ALL') return true;
    return e.status === statusFilter;
  });

  const handleOpenControlCenter = (id: string) => {
    setSelectedEventId(id);
    setActiveSubTab('CONTROL_CENTER');
  };

  return (
    <div className="space-y-6">
      
      {/* TOP HERO BANNER */}
      <div className="p-6 rounded-3xl glass-panel bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4" />
            <span>Auditorium Event Management & Multi-Faculty Control System</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            CAIAS Auditorium Event Hub (1,000+ Students)
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Multi-faculty & multi-checkpoint gate attendance engine for large-scale college conventions.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <RefreshButton />

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-xs shadow-xl shadow-emerald-600/30 flex items-center space-x-2 transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ CREATE AUDITORIUM EVENT</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB NAVIGATION */}
      <div className="p-2 rounded-2xl glass-panel flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={() => setActiveSubTab('EVENTS_LIST')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 ${
            activeSubTab === 'EVENTS_LIST'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Auditorium Events List ({auditoriumEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('CONTROL_CENTER')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 ${
            activeSubTab === 'CONTROL_CENTER'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <SettingsIcon className="w-4 h-4 text-cyan-400" />
          <span>Event Control Center</span>
        </button>

        <button
          onClick={() => setActiveSubTab('MY_STATION')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 ${
            activeSubTab === 'MY_STATION'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Laptop className="w-4 h-4 text-purple-400" />
          <span>My Checkpoint Station</span>
        </button>

        <button
          onClick={() => setActiveSubTab('HISTORY')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 ${
            activeSubTab === 'HISTORY'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <span>Completed Event History</span>
        </button>
      </div>

      {/* SUB-TAB VIEWS */}
      {activeSubTab === 'CONTROL_CENTER' && (
        <EventControlCenter
          eventId={selectedEventId}
          onBackToEventsList={() => setActiveSubTab('EVENTS_LIST')}
        />
      )}

      {activeSubTab === 'MY_STATION' && <FacultyCheckpointStation />}

      {activeSubTab === 'EVENTS_LIST' && (
        <div className="p-6 rounded-3xl glass-panel space-y-4 text-xs">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                Registered Auditorium Conventions & Summits
              </h3>
              <p className="text-xs text-slate-400">
                Multi-faculty & checkpoint event management dashboard.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-bold">Filter Status:</span>
              <button onClick={() => setStatusFilter('ALL')} className={`px-3 py-1 rounded-xl font-bold ${statusFilter === 'ALL' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400'}`}>All</button>
              <button onClick={() => setStatusFilter('ACTIVE')} className={`px-3 py-1 rounded-xl font-bold ${statusFilter === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400'}`}>🟢 Live</button>
              <button onClick={() => setStatusFilter('UPCOMING')} className={`px-3 py-1 rounded-xl font-bold ${statusFilter === 'UPCOMING' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400'}`}>Upcoming</button>
              <button onClick={() => setStatusFilter('COMPLETED')} className={`px-3 py-1 rounded-xl font-bold ${statusFilter === 'COMPLETED' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400'}`}>Completed</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEvents.map((ev) => {
              const isLive = ev.status === 'ACTIVE';

              return (
                <div
                  key={ev.id}
                  className={`p-5 rounded-3xl border transition-all space-y-4 shadow-lg ${
                    isLive
                      ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border-emerald-500/40'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isLive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                        : ev.status === 'COMPLETED'
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      ● {isLive ? '🟢 LIVE' : ev.status}
                    </span>

                    <span className="text-xs font-mono text-slate-400">
                      ID: <strong className="text-emerald-300">{ev.id}</strong>
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-extrabold text-white">{ev.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{ev.description}</p>
                    <p className="text-xs text-teal-300 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{ev.venue}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-950/60 text-[11px]">
                    <div>
                      <span className="text-slate-500 font-bold block">Expected</span>
                      <strong className="text-white font-mono">{ev.expectedStrength || 1200} Students</strong>
                    </div>

                    <div>
                      <span className="text-slate-500 font-bold block">Checkpoints</span>
                      <strong className="text-cyan-300 font-mono">{ev.checkpoints?.length || 6} Gates</strong>
                    </div>

                    <div>
                      <span className="text-slate-500 font-bold block">Coordinator</span>
                      <strong className="text-indigo-300 line-clamp-1">{ev.coordinatorName}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleOpenControlCenter(ev.id)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-1.5"
                    >
                      <SettingsIcon className="w-3.5 h-3.5 text-cyan-400" />
                      <span>OPEN EVENT CONTROL CENTER</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedEventId(ev.id);
                        setActiveSubTab('MY_STATION');
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center space-x-1"
                    >
                      <Laptop className="w-3.5 h-3.5" />
                      <span>Join Checkpoint</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {activeSubTab === 'HISTORY' && (
        <div className="p-6 rounded-3xl glass-panel space-y-4 text-xs">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            Completed Auditorium Events History
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {auditoriumEvents.filter(e => e.status === 'COMPLETED').map((ev) => {
              const recs = eventAttendanceRecords.filter(r => r.eventId === ev.id);

              return (
                <div key={ev.id} className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                      🏁 COMPLETED
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">{ev.date}</span>
                  </div>

                  <div>
                    <h4 className="text-base font-extrabold text-white">{ev.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{ev.venue}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-950/60 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Expected</span>
                      <strong className="text-white font-mono">{ev.expectedStrength || 1200}</strong>
                    </div>

                    <div>
                      <span className="text-slate-500 block">Verified Present</span>
                      <strong className="text-emerald-400 font-mono">{recs.length || 1087}</strong>
                    </div>

                    <div>
                      <span className="text-slate-500 block">Gates Used</span>
                      <strong className="text-cyan-300 font-mono">{ev.checkpoints?.length || 6} Gates</strong>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => exportAuditoriumAttendanceToExcel(ev.name, recs)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Final Excel</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      <CreateAuditoriumEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={(id) => handleOpenControlCenter(id)}
      />

    </div>
  );
};
