'use client';

import React from 'react';
import { Student } from '@/types';
import { X, Cpu, ShieldCheck, Mail, Phone, Calendar, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StudentProfileModalProps {
  student: Student | null;
  onClose: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ student, onClose }) => {
  if (!student) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg p-6 rounded-3xl glass-panel border border-slate-700/60 shadow-2xl overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* RFID & Biometrics Badge Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-xl relative overflow-hidden mb-6">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Badge Header */}
            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-indigo-400 animate-pulse" />
                <span className="font-extrabold text-xs tracking-wider uppercase bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Dual Biometric RFID Pass
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                ACTIVE BADGE
              </span>
            </div>

            {/* Layout */}
            <div className="flex items-start space-x-4">
              <img
                src={student.avatar}
                alt={student.name}
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-indigo-500/50 shadow-md"
              />

              <div className="flex-1">
                <h3 className="text-base font-extrabold text-white">{student.name}</h3>
                <p className="text-xs font-mono font-bold text-indigo-400">Roll: {student.rollNo}</p>
                <p className="text-xs text-slate-300 mt-1">{student.department}</p>
                <p className="text-[11px] text-slate-400">Sem {student.semester} • Section {student.section}</p>
                
                {/* RFID Tag Chip */}
                <div className="mt-2 flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>{student.rfidTag}</span>
                  </span>

                  <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold">
                    <Camera className="w-3 h-3" />
                    <span>FACE ID ENROLLED</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-indigo-500/20 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>ID: {student.id}</span>
              <span>128D VECTOR ENCRYPTED</span>
            </div>
          </div>

          {/* Attendance & Registration Info */}
          <div className="grid grid-cols-2 gap-3 text-xs mb-4">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <p className="text-[10px] text-slate-400 font-semibold mb-1">Attendance Percentage</p>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold font-mono text-emerald-400">
                  {student.attendancePercentage}%
                </span>
                <span className="text-[10px] text-emerald-500 font-bold">Verified</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <p className="text-[10px] text-slate-400 font-semibold mb-1">Registered On</p>
              <div className="flex items-center space-x-1.5 text-slate-200 font-medium">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>{student.joinedDate}</span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-2 text-xs text-slate-300 p-3 rounded-xl bg-slate-900/60">
            <div className="flex items-center space-x-2">
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>{student.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-3.5 h-3.5 text-indigo-400" />
              <span>{student.phone}</span>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
