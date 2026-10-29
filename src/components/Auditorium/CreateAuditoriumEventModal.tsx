'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Clock, MapPin, User, X, Sparkles, Plus, ToggleLeft, ToggleRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateAuditoriumEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (eventId: string) => void;
}

export const CreateAuditoriumEventModal: React.FC<CreateAuditoriumEventModalProps> = ({
  isOpen,
  onClose,
  onEventCreated,
}) => {
  const { createAuditoriumEvent } = useAttendance();
  const { user } = useAuth();

  const [name, setName] = useState('CAIAS Annual Tech Summit 2026');
  const [description, setDescription] = useState('National Level AI, IoT & Cloud Convention for 1,200+ students & delegates.');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:30 AM');
  const [endTime, setEndTime] = useState('05:00 PM');
  const [venue, setVenue] = useState('Main College Auditorium & Convention Center');
  const [expectedStrength, setExpectedStrength] = useState(1200);
  const [coordinatorName, setCoordinatorName] = useState(user?.name || 'Dr. Alan Turing');
  const [coordinatorEmail, setCoordinatorEmail] = useState(user?.email || 'alan.turing@college.edu');

  const [allowCheckOut, setAllowCheckOut] = useState(true);
  const [faceRecognitionEnabled, setFaceRecognitionEnabled] = useState(true);
  const [cardRfidEnabled, setCardRfidEnabled] = useState(true);
  const [spacebarDemoEnabled, setSpacebarDemoEnabled] = useState(true);

  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEv = createAuditoriumEvent({
      name,
      description,
      date,
      startTime,
      endTime,
      venue,
      expectedStrength: Number(expectedStrength),
      coordinatorName,
      coordinatorEmail,
      allowCheckOut,
      faceRecognitionEnabled,
      cardRfidEnabled,
      spacebarDemoEnabled,
    });

    setCreatedEventId(newEv.id);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-xl p-6 rounded-3xl glass-panel border border-emerald-500/40 shadow-2xl space-y-5 text-xs max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {createdEventId ? (
            /* SUCCESS BANNER SCREEN */
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-white">Auditorium Event Created Successfully</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Unique Event ID: <strong className="text-emerald-300 font-mono text-sm">{createdEventId}</strong>
                </p>
              </div>

              <div className="pt-4 flex items-center justify-center space-x-3">
                <button
                  onClick={() => {
                    onEventCreated(createdEventId);
                    onClose();
                  }}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-extrabold text-xs shadow-xl shadow-emerald-600/30 flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>OPEN EVENT CONTROL CENTER</span>
                </button>
              </div>
            </div>
          ) : (
            /* FORM SCREEN */
            <>
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                    Create Auditorium Event (1,000+ Students)
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </h2>
                  <p className="text-xs text-slate-400">
                    Setup multi-faculty, multi-checkpoint gate attendance event.
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
                    placeholder="e.g. CAIAS Annual Tech Summit 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Event Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief details about the auditorium event..."
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-slate-200"
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
                      className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Start Time</label>
                    <input
                      type="text"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      placeholder="09:30 AM"
                      className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">End Time</label>
                    <input
                      type="text"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      placeholder="05:00 PM"
                      className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Venue / Auditorium</label>
                    <input
                      type="text"
                      required
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="Main Auditorium & Convention Center"
                      className="w-full px-3.5 py-2 rounded-xl glass-input text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Expected Student Count</label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={expectedStrength}
                      onChange={(e) => setExpectedStrength(Number(e.target.value))}
                      placeholder="1200"
                      className="w-full px-3.5 py-2 rounded-xl glass-input text-slate-200 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Event Coordinator</label>
                    <input
                      type="text"
                      required
                      value={coordinatorName}
                      onChange={(e) => setCoordinatorName(e.target.value)}
                      placeholder="Dr. Alan Turing"
                      className="w-full px-3.5 py-2 rounded-xl glass-input text-slate-200"
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
                      className="w-full px-3.5 py-2 rounded-xl glass-input text-slate-200 font-mono text-[11px]"
                    />
                  </div>
                </div>

                {/* TOGGLES */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">Face Recognition</p>
                      <p className="text-[10px] text-slate-400">Live Webcam AI</p>
                    </div>
                    <button type="button" onClick={() => setFaceRecognitionEnabled(!faceRecognitionEnabled)} className={faceRecognitionEnabled ? 'text-emerald-400' : 'text-slate-500'}>
                      {faceRecognitionEnabled ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                    </button>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">Card / RFID Tap</p>
                      <p className="text-[10px] text-slate-400">Card verification</p>
                    </div>
                    <button type="button" onClick={() => setCardRfidEnabled(!cardRfidEnabled)} className={cardRfidEnabled ? 'text-emerald-400' : 'text-slate-500'}>
                      {cardRfidEnabled ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                    </button>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">Spacebar Demo</p>
                      <p className="text-[10px] text-slate-400">Keyboard simulation</p>
                    </div>
                    <button type="button" onClick={() => setSpacebarDemoEnabled(!spacebarDemoEnabled)} className={spacebarDemoEnabled ? 'text-emerald-400' : 'text-slate-500'}>
                      {spacebarDemoEnabled ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                    </button>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">Check-Out Tracker</p>
                      <p className="text-[10px] text-slate-400">Duration tracking</p>
                    </div>
                    <button type="button" onClick={() => setAllowCheckOut(!allowCheckOut)} className={allowCheckOut ? 'text-emerald-400' : 'text-slate-500'}>
                      {allowCheckOut ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                    </button>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-extrabold shadow-lg shadow-emerald-600/30 flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Auditorium Event</span>
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
