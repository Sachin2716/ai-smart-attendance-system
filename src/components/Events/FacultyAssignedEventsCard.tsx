'use client';

import React, { useState, useMemo } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { Calendar, MapPin, Clock, Shield, Sparkles, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { EventItem } from '@/types';
import { FacultyEventStationModal } from '@/components/Events/FacultyEventStationModal';

export const FacultyAssignedEventsCard: React.FC = () => {
  const { events } = useAttendance();
  const { user } = useAuth();

  const [selectedEventModal, setSelectedEventModal] = useState<EventItem | null>(null);

  // Filter events where logged in faculty is assigned
  const myAssignedEvents = useMemo(() => {
    if (!user) return [];
    const cleanEmail = (user.email || '').toLowerCase();
    const cleanName = (user.name || '').toLowerCase();

    return events.filter(e => {
      if (!e.assignedFaculty || e.assignedFaculty.length === 0) {
        // Fallback for mock events if coordinator email matches
        return e.coordinatorEmail?.toLowerCase() === cleanEmail;
      }
      return e.assignedFaculty.some(
        af => (af.facultyEmail || '').toLowerCase() === cleanEmail || (af.facultyName || '').toLowerCase().includes(cleanName)
      );
    });
  }, [events, user]);

  return (
    <div className="p-6 rounded-3xl glass-panel space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-400" />
          My Assigned Events
        </h3>

        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
          {myAssignedEvents.length} Events Assigned
        </span>
      </div>

      {myAssignedEvents.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1">
          <p className="text-xs font-bold text-slate-300">MY ASSIGNED EVENTS</p>
          <p className="text-xs text-slate-500">No events assigned to you.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {myAssignedEvents.map(e => {
            const assignment = (e.assignedFaculty || []).find(
              af => (af.facultyEmail || '').toLowerCase() === (user?.email || '').toLowerCase()
            );
            const myRole = assignment ? assignment.roleInEvent : 'ATTENDANCE_FACULTY';
            const isLiveStatus = e.status === 'LIVE' || e.status === 'ACTIVE';

            return (
              <div
                key={e.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 space-y-3 transition-all text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isLiveStatus ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' :
                    e.status === 'UPCOMING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {isLiveStatus ? '🟢 LIVE' : e.status === 'UPCOMING' ? '🟡 UPCOMING' : '⚪ COMPLETED'}
                  </span>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    myRole === 'COORDINATOR' || myRole === 'EVENT_COORDINATOR' ? 'bg-amber-500/20 text-amber-300' :
                    myRole === 'ATTENDANCE_FACULTY' ? 'bg-emerald-500/20 text-emerald-300' :
                    'bg-indigo-500/20 text-indigo-300'
                  }`}>
                    Role: {myRole === 'COORDINATOR' || myRole === 'EVENT_COORDINATOR' ? 'Event Coordinator' : myRole === 'ATTENDANCE_FACULTY' ? 'Attendance Faculty' : 'Viewer'}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-white text-sm">{e.name}</h4>
                  <p className="text-slate-400 text-[11px] flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                    <span>{e.venue}</span> • <span>{e.date} ({e.startTime})</span>
                  </p>
                </div>

                <button
                  onClick={() => setSelectedEventModal(e)}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-1 transition-all"
                >
                  <span>Open Event</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* EVENT STATION MODAL */}
      <FacultyEventStationModal
        event={selectedEventModal}
        onClose={() => setSelectedEventModal(null)}
      />
    </div>
  );
};
