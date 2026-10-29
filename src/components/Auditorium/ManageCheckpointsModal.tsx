'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { ShieldCheck, Plus, MapPin, X, Sparkles, UserCheck, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ManageCheckpointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
}

export const ManageCheckpointsModal: React.FC<ManageCheckpointsModalProps> = ({ isOpen, onClose, eventId }) => {
  const { events, addAuditoriumCheckpoint, assignFacultyToCheckpoint } = useAttendance();

  const [newGateName, setNewGateName] = useState('');
  const [newGateLocation, setNewGateLocation] = useState('');

  if (!isOpen) return null;

  const currentEvent = events.find(e => e.id === eventId);
  const checkpoints = currentEvent?.checkpoints || [];
  const facultyAssignments = currentEvent?.facultyAssignments || [];

  const handleCreateGate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGateName.trim()) {
      addAuditoriumCheckpoint(eventId, newGateName.trim().toUpperCase(), newGateLocation.trim() || 'Auditorium Gate');
      setNewGateName('');
      setNewGateLocation('');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-3xl p-6 rounded-3xl glass-panel border border-cyan-500/40 shadow-2xl space-y-5 text-xs max-h-[85vh] overflow-y-auto"
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
            <div className="p-3 rounded-2xl bg-cyan-600/10 text-cyan-400 border border-cyan-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                Manage Gate Checkpoints & Faculty Assignment
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Create unlimited gate checkpoints and assign faculty laptops on the fly.
              </p>
            </div>
          </div>

          {/* Create Checkpoint Form */}
          <form onSubmit={handleCreateGate} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              required
              value={newGateName}
              onChange={(e) => setNewGateName(e.target.value)}
              placeholder="Gate Name (e.g. AUD-ENTRY-01)"
              className="px-3.5 py-2 rounded-xl glass-input text-slate-200 uppercase font-mono w-full sm:w-48"
            />
            <input
              type="text"
              value={newGateLocation}
              onChange={(e) => setNewGateLocation(e.target.value)}
              placeholder="Location Description (e.g. East Wing Ramp Access)"
              className="px-3.5 py-2 rounded-xl glass-input text-slate-200 flex-1 w-full"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center space-x-1 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Checkpoint</span>
            </button>
          </form>

          {/* Checkpoints Table */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-white text-xs uppercase tracking-wider text-slate-400">
              Active Checkpoints List ({checkpoints.length} Gates)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Gate Checkpoint</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Assigned Faculty</th>
                    <th className="py-2.5 px-3 text-right">Assign / Swap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {checkpoints.map((cp) => (
                    <tr key={cp.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-3 font-mono font-extrabold text-cyan-300">
                        {cp.name}
                      </td>

                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        {cp.locationDescription || 'Auditorium Gate'}
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          cp.status === 'ONLINE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          ● {cp.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-bold text-white">
                        {cp.assignedFacultyName || <span className="text-slate-500 font-normal italic">Unassigned</span>}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <select
                          value={cp.assignedFacultyEmail || ''}
                          onChange={(e) => assignFacultyToCheckpoint(eventId, e.target.value, cp.name)}
                          className="px-2.5 py-1 rounded-xl glass-input text-slate-200 bg-slate-900 font-bold text-[11px]"
                        >
                          <option value="">-- Assign Faculty --</option>
                          {facultyAssignments.map((fac) => (
                            <option key={fac.id} value={fac.facultyEmail}>
                              {fac.facultyName} ({fac.assignedCheckpointName || 'Unassigned'})
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              Close Checkpoint Manager
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
