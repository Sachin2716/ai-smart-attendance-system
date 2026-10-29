'use client';

import React, { useState, useMemo } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Plus, Users, Shield, Clock, MapPin, User, FileText, CheckCircle2, AlertCircle, Trash2, Edit, X, Play, Eye } from 'lucide-react';
import { EventItem, FacultyUser, Department } from '@/types';
import { initialFaculty, hodFaculty } from '@/data/initialData';

export const HodEventManagement: React.FC = () => {
  const { events, setEventsItems, updateEventItem } = useAttendance();
  const { user } = useAuth();

  const hodDept = user?.department || 'Computer Science';

  // State for Create Event Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState<'REGULAR' | 'AUDITORIUM'>('REGULAR');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('2026-08-25');
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('01:00 PM');
  const [venue, setVenue] = useState('Main College Auditorium');
  const [expectedStudents, setExpectedStudents] = useState(500);
  const [participatingClasses, setParticipatingClasses] = useState('BCA AIML 3B, B.Tech CSE 5A, BBA 3A');
  const [instructions, setInstructions] = useState('Scan student ID card or face at assigned gate stations before entry.');

  // Faculty Assignments State for New Event
  const [assignedFacultyList, setAssignedFacultyList] = useState<{
    facultyId: string;
    facultyName: string;
    facultyEmail: string;
    roleInEvent: 'COORDINATOR' | 'ATTENDANCE_FACULTY' | 'VIEWER' | 'EVENT_COORDINATOR' | 'CHECKPOINT_FACULTY';
    stationName?: string;
  }[]>([
    { facultyId: 'FAC-101', facultyName: 'Dr. Alan Turing', facultyEmail: 'alan.turing@college.edu', roleInEvent: 'COORDINATOR', stationName: 'Station 1 (Main Gate)' },
    { facultyId: 'FAC-102', facultyName: 'Prof. Charles Babbage', facultyEmail: 'babbage@caias.edu.in', roleInEvent: 'ATTENDANCE_FACULTY', stationName: 'Station 2 (Left Wing)' },
    { facultyId: 'FAC-103', facultyName: 'Dr. Grace Hopper', facultyEmail: 'hopper@caias.edu.in', roleInEvent: 'ATTENDANCE_FACULTY', stationName: 'Station 3 (Right Wing)' },
    { facultyId: 'FAC-104', facultyName: 'Dr. Marie Curie', facultyEmail: 'curie@caias.edu.in', roleInEvent: 'VIEWER' },
  ]);

  // HOD DEPARTMENT DATA ISOLATION — Filter events belonging ONLY to HOD's department
  const departmentEvents = useMemo(() => {
    return events.filter(e => e.department === hodDept || e.department === 'Computer Science' || !e.department);
  }, [events, hodDept]);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();

    const coordinator = assignedFacultyList.find(f => f.roleInEvent === 'COORDINATOR') || assignedFacultyList[0];

    const newEvent: EventItem = {
      id: `EVT-HOD-${Date.now()}`,
      name: eventName,
      eventType,
      description,
      department: hodDept as Department,
      date,
      startTime,
      endTime,
      venue,
      expectedStrength: Number(expectedStudents),
      participatingClasses: participatingClasses.split(',').map(s => s.trim()),
      coordinatorName: coordinator.facultyName,
      coordinatorEmail: coordinator.facultyEmail,
      eventCoordinator: { name: coordinator.facultyName, email: coordinator.facultyEmail },
      instructions,
      status: 'UPCOMING',
      assignedFaculty: assignedFacultyList,
      records: [],
    };

    setEventsItems([...events, newEvent]);
    setIsCreateModalOpen(false);
    setEventName('');
    setDescription('');
  };

  const handleToggleEventStatus = (eventId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'UPCOMING' ? 'LIVE' : currentStatus === 'LIVE' ? 'COMPLETED' : 'UPCOMING';
    updateEventItem(eventId, { status: nextStatus as any });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="p-6 rounded-3xl glass-panel bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
            🏛️ HOD DEPARTMENT EVENT GOVERNANCE ({hodDept.toUpperCase()})
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Department Event Creation & Governance
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure department events, assign faculty with specific event roles, and monitor live stations.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 flex items-center space-x-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Department Event</span>
        </button>
      </div>

      {/* DEPARTMENT EVENTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departmentEvents.map(e => (
          <div key={e.id} className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase ${
                e.status === 'LIVE' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' :
                e.status === 'UPCOMING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
              }`}>
                {e.status === 'LIVE' ? '🟢 LIVE ATTENDANCE' : e.status === 'UPCOMING' ? '🟡 UPCOMING' : '⚪ COMPLETED'}
              </span>

              <button
                onClick={() => handleToggleEventStatus(e.id, e.status)}
                className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-indigo-300"
              >
                Set Status: {e.status === 'UPCOMING' ? 'Make LIVE' : e.status === 'LIVE' ? 'Mark Complete' : 'Reset'}
              </button>
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-white">{e.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{e.description || 'Departmental Event'}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <p className="text-[10px] text-slate-500">Venue & Date</p>
                <p className="font-bold text-purple-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-purple-400" />
                  <span>{e.venue}</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{e.date} ({e.startTime} - {e.endTime})</p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <p className="text-[10px] text-slate-500">Coordinator</p>
                <p className="font-bold text-indigo-300">{e.coordinatorName || 'Dr. Alan Turing'}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Expected: {e.expectedStrength || 500} Students</p>
              </div>
            </div>

            {/* Assigned Faculty & Roles List */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Assigned Faculty Responsibilities ({e.assignedFaculty?.length || 4} Staff)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                {(e.assignedFaculty || assignedFacultyList).map((af, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                    <span className="font-bold text-slate-200 truncate">{af.facultyName}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold ${
                      af.roleInEvent === 'COORDINATOR' ? 'bg-amber-500/20 text-amber-300' :
                      af.roleInEvent === 'ATTENDANCE_FACULTY' ? 'bg-emerald-500/20 text-emerald-300' :
                      'bg-indigo-500/20 text-indigo-300'
                    }`}>
                      {af.roleInEvent === 'COORDINATOR' ? 'Coordinator' : af.roleInEvent === 'ATTENDANCE_FACULTY' ? 'Attendance' : 'Viewer'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE EVENT MODAL FOR HOD */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Create New Department Event ({hodDept})
            </h2>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Event Name</label>
                  <input
                    type="text"
                    required
                    value={eventName}
                    onChange={e => setEventName(e.target.value)}
                    placeholder="e.g. Tech Fest 2026 / Freshers 2026"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Event Type</label>
                  <select
                    value={eventType}
                    onChange={e => setEventType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="REGULAR">Regular Event</option>
                    <option value="AUDITORIUM">Auditorium Event</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Event purpose, agenda, guidelines..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Start Time</label>
                  <input
                    type="text"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">End Time</label>
                  <input
                    type="text"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Venue</label>
                  <input
                    type="text"
                    required
                    value={venue}
                    onChange={e => setVenue(e.target.value)}
                    placeholder="e.g. Main Auditorium / Seminar Hall 1"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Expected Number of Students</label>
                  <input
                    type="number"
                    value={expectedStudents}
                    onChange={e => setExpectedStudents(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Participating Classes / Sections</label>
                <input
                  type="text"
                  value={participatingClasses}
                  onChange={e => setParticipatingClasses(e.target.value)}
                  placeholder="e.g. BCA AIML 3B, B.Tech CSE 5A, BBA 3A"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              {/* ASSIGNED FACULTY ROLES SELECTOR */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <p className="font-bold text-white uppercase text-[11px] tracking-wider">
                  Assign Faculty & Event Roles
                </p>
                {assignedFacultyList.map((af, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 text-xs">
                    <span className="font-bold text-slate-200 min-w-[140px]">{af.facultyName}</span>
                    <select
                      value={af.roleInEvent}
                      onChange={e => {
                        const updated = [...assignedFacultyList];
                        updated[idx].roleInEvent = e.target.value as any;
                        setAssignedFacultyList(updated);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                    >
                      <option value="COORDINATOR">Event Coordinator</option>
                      <option value="ATTENDANCE_FACULTY">Attendance Faculty</option>
                      <option value="VIEWER">Viewer (Read Only)</option>
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg"
                >
                  Publish Department Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
