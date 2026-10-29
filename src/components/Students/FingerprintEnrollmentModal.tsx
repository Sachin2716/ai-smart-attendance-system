'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { Student } from '@/types';
import { Fingerprint, CheckCircle2, AlertCircle, X, ShieldCheck, Cpu, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FingerprintEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
}

export const FingerprintEnrollmentModal: React.FC<FingerprintEnrollmentModalProps> = ({
  isOpen,
  onClose,
  student,
}) => {
  const { students, enrollStudentFingerprint } = useAttendance();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(student?.id || students[0]?.id || '');
  const [slotId, setSlotId] = useState<number>(student?.fingerprintSlotId || Math.floor(Math.random() * 50) + 1);
  const [isScanning, setIsScanning] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentStudent = students.find(s => s.id === selectedStudentId) || student || students[0];

  const handleRegisterFingerprint = () => {
    if (!currentStudent) return;

    setIsScanning(true);
    setSuccessMsg(null);

    // Simulate sensor capture & slot binding
    setTimeout(() => {
      enrollStudentFingerprint(currentStudent.id, slotId);
      setIsScanning(false);
      setSuccessMsg(`Fingerprint Template successfully registered to Slot #${slotId} for ${currentStudent.name}!`);

      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 2000);
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-md p-6 rounded-3xl glass-panel border border-indigo-500/40 shadow-2xl overflow-hidden"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center space-x-3 mb-5">
            <div className="p-3 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/30">
              <Fingerprint className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">
                Fingerprint Template Registration
              </h2>
              <p className="text-xs text-slate-400">
                Enroll student fingerprint slot ID on handheld device
              </p>
            </div>
          </div>

          {/* Student Selector */}
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Select Student</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl glass-input text-slate-200 bg-slate-900 font-bold"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.uucmsNo || s.rollNo}) - Card: {s.cardUid || s.rfidTag}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Details */}
            {currentStudent && (
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">UUCMS Register No:</span>
                  <span className="font-mono font-bold text-white">{currentStudent.uucmsNo || currentStudent.rollNo}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Assigned Card UID:</span>
                  <span className="font-mono font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                    {currentStudent.cardUid || currentStudent.rfidTag}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Fingerprint Template Slot:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {currentStudent.fingerprintSlotId ? `Slot #${currentStudent.fingerprintSlotId} (Enrolled ✓)` : `Not Registered`}
                  </span>
                </div>
              </div>
            )}

            {/* Sensor Enrollment Area */}
            <div className="p-6 rounded-2xl border border-dashed border-indigo-500/40 text-center bg-slate-900/40 space-y-3">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center border transition-all ${
                isScanning
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 animate-pulse ring-4 ring-indigo-500/30'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}>
                <Fingerprint className="w-8 h-8" />
              </div>

              <div>
                <p className="font-bold text-white">
                  {isScanning ? 'Place Finger on Sensor Back...' : 'Ready for Sensor Input'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Assigning to Template Slot ID #{slotId}
                </p>
              </div>
            </div>

            {/* Success Message */}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Submit */}
            <div className="pt-2">
              <button
                onClick={handleRegisterFingerprint}
                disabled={isScanning}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                <Fingerprint className="w-4 h-4" />
                <span>{isScanning ? 'CAPTURING TEMPLATE...' : 'REGISTER FINGERPRINT'}</span>
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
