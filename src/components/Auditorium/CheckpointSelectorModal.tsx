'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { ShieldCheck, MapPin, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CheckpointSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CHECKPOINT_OPTIONS = [
  { id: 'AUD-GATE-01', name: 'Checkpoint 01 (North Gate)', location: 'Main Auditorium Entrance A' },
  { id: 'AUD-GATE-02', name: 'Checkpoint 02 (South Gate)', location: 'Main Auditorium Entrance B' },
  { id: 'AUD-GATE-03', name: 'Checkpoint 03 (East Gate)', location: 'Convention Hall Ramp' },
  { id: 'AUD-GATE-04', name: 'Checkpoint 04 (West Gate)', location: 'VIP / Guest Lobby' },
  { id: 'AUD-GATE-05', name: 'Checkpoint 05 (Balcony Entry)', location: 'Upper Tier Entrance' },
  { id: 'AUD-GATE-06', name: 'Checkpoint 06 (Back Stage Gate)', location: 'Participant Access' },
];

export const CheckpointSelectorModal: React.FC<CheckpointSelectorModalProps> = ({ isOpen, onClose }) => {
  const { selectedCheckpoint, setSelectedCheckpoint } = useAttendance();
  const [customGate, setCustomGate] = useState('');

  if (!isOpen) return null;

  const handleSelect = (gateId: string) => {
    setSelectedCheckpoint(gateId);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customGate.trim()) {
      setSelectedCheckpoint(customGate.trim().toUpperCase());
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-xl p-6 rounded-3xl glass-panel border border-emerald-500/40 shadow-2xl space-y-5 text-xs"
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
            <div className="p-3 rounded-2xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                Select Active Gate Checkpoint
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Multiple faculty devices connect simultaneously to the SAME active auditorium event.
              </p>
            </div>
          </div>

          {/* Gate Grid Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CHECKPOINT_OPTIONS.map((cp) => {
              const isCurrent = selectedCheckpoint === cp.id;

              return (
                <div
                  key={cp.id}
                  onClick={() => handleSelect(cp.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                    isCurrent
                      ? 'bg-emerald-500/15 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800'
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="font-mono font-extrabold text-emerald-300 text-sm">{cp.id}</p>
                    <p className="font-bold text-white text-xs">{cp.name}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {cp.location}
                    </p>
                  </div>

                  {isCurrent && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                </div>
              );
            })}
          </div>

          {/* Custom Gate Entry */}
          <form onSubmit={handleCustomSubmit} className="pt-3 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={customGate}
              onChange={(e) => setCustomGate(e.target.value)}
              placeholder="Or enter custom Gate ID (e.g. AUD-VIP-GATE)"
              className="flex-1 px-3.5 py-2 rounded-xl glass-input text-slate-200 uppercase font-mono text-xs"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              Set Checkpoint
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
