'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { Users, Plus, Trash2, X, Shield, Sparkles, CheckCircle2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ManageFacultyModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
}

const AVAILABLE_FACULTY_ROSTER = [
  { name: 'Dr. Alan Turing', email: 'alan.turing@college.edu', dept: 'Computer Science' },
  { name: 'Prof. Marie Curie', email: 'marie.curie@college.edu', dept: 'Electronics & Comm.' },
  { name: 'Prof. Anil', email: 'anil@college.edu', dept: 'Computer Science' },
  { name: 'Prof. Priya', email: 'priya@college.edu', dept: 'Computer Science' },
  { name: 'Prof. Kumar', email: 'kumar@college.edu', dept: 'Mechanical Engg.' },
  { name: 'Prof. Sneha', email: 'sneha@college.edu', dept: 'Business Admin.' },
  { name: 'Prof. Rahul', email: 'rahul@college.edu', dept: 'Information Science' },
  { name: 'Prof. Divya', email: 'divya@college.edu', dept: 'Civil Engg.' },
  { name: 'Prof. Raj', email: 'raj@college.edu', dept: 'Computer Science' },
  { name: 'Prof. Vikram', email: 'vikram@college.edu', dept: 'Mathematics' },
];

export const ManageFacultyModal: React.FC<ManageFacultyModalProps> = ({ isOpen, onClose, eventId }) => {
  const { events, addAuditoriumFaculty, removeAuditoriumFaculty } = useAttendance();

  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const currentEvent = events.find(e => e.id === eventId);
  const assignedFaculty = currentEvent?.facultyAssignments || [];
  const assignedEmails = new Set(assignedFaculty.map(f => f.facultyEmail));

  const filteredRoster = AVAILABLE_FACULTY_ROSTER.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.dept.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl p-6 rounded-3xl glass-panel border border-emerald-500/40 shadow-2xl space-y-5 text-xs max-h-[85vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                Manage Event Faculty Roster ({assignedFaculty.length} Assigned)
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Select faculty members from the college database with <strong>no limit</strong>.
              </p>
            </div>
          </div>

          {/* Assigned Faculty Section */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-white text-xs uppercase tracking-wider text-slate-400">
              Currently Assigned Event Faculty ({assignedFaculty.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {assignedFaculty.map((fac) => (
                <div
                  key={fac.id}
                  className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-white">{fac.facultyName}</p>
                    <p className="text-[10px] font-mono text-slate-400">{fac.facultyEmail}</p>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      fac.role === 'EVENT_COORDINATOR'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {fac.role === 'EVENT_COORDINATOR' ? '👑 Event Coordinator' : '🚪 Checkpoint Faculty'}
                    </span>
                  </div>

                  {fac.role !== 'EVENT_COORDINATOR' && (
                    <button
                      onClick={() => removeAuditoriumFaculty(eventId, fac.facultyEmail)}
                      className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-500/20 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add Faculty Roster Section */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-extrabold text-white text-xs uppercase tracking-wider text-slate-400">
                Add Faculty from College Database
              </h3>

              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search faculty..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl glass-input text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {filteredRoster.map((f) => {
                const isAssigned = assignedEmails.has(f.email);

                return (
                  <div
                    key={f.email}
                    className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold text-white">{f.name}</p>
                      <p className="text-[10px] text-slate-400">{f.dept}</p>
                    </div>

                    {isAssigned ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Assigned
                      </span>
                    ) : (
                      <button
                        onClick={() => addAuditoriumFaculty(eventId, f.name, f.email)}
                        className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              Done Managing Roster
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
