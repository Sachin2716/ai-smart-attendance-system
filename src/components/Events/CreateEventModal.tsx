'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Clock, MapPin, User, X, Sparkles, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose }) => {
  const { createEvent } = useAttendance();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('01:00 PM');
  const [venue, setVenue] = useState('Auditorium Hall B');
  const [coordinatorName, setCoordinatorName] = useState(user?.name || 'Prof. Marie Curie');
  const [coordinatorEmail, setCoordinatorEmail] = useState(user?.email || 'marie.curie@college.edu');
  const [allowCheckOut, setAllowCheckOut] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEvent({
      name,
      date,
      startTime,
      endTime,
      venue,
      coordinatorName,
      coordinatorEmail,
      allowCheckOut,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg p-6 rounded-3xl glass-panel border border-indigo-500/40 shadow-2xl space-y-5 text-xs"
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
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                Create New College Event
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Setup multi-class/multi-department event attendance session.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Event Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. National AI & Data Science Workshop 2026"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-slate-200"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-slate-200 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Start Time</label>
                <input
                  type="text"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="10:00 AM"
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-slate-200 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">End Time</label>
                <input
                  type="text"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="01:00 PM"
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-slate-200 font-mono text-[11px]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Venue / Auditorium</label>
              <input
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Auditorium Hall B / Main Innovation Lab"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Event Coordinator</label>
                <input
                  type="text"
                  required
                  value={coordinatorName}
                  onChange={(e) => setCoordinatorName(e.target.value)}
                  placeholder="Prof. Marie Curie"
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Coordinator Email</label>
                <input
                  type="email"
                  required
                  value={coordinatorEmail}
                  onChange={(e) => setCoordinatorEmail(e.target.value)}
                  placeholder="coordinator@college.edu"
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-slate-200 font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-white">Enable Check-Out Feature</p>
                <p className="text-[10px] text-slate-400">Track check-in, check-out time and duration</p>
              </div>

              <button
                type="button"
                onClick={() => setAllowCheckOut(!allowCheckOut)}
                className={`p-2 rounded-xl transition-all ${
                  allowCheckOut ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {allowCheckOut ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
              </button>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-extrabold shadow-lg shadow-indigo-600/30 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Event</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
