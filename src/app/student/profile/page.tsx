'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  GraduationCap,
  School,
  Mail,
  Phone,
  Fingerprint,
  ShieldCheck,
  QrCode,
  Sparkles,
} from 'lucide-react';

export default function StudentProfilePage() {
  const [student, setStudent] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/student/dashboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStudent(data.student);
      })
      .catch(() => {});
  }, []);

  if (!student) {
    return <div className="p-8 text-center text-slate-500">Loading student identity profile...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Digital Student Identity Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <GraduationCap className="w-48 h-48 text-indigo-400" />
        </div>

        {/* Card Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-violet-500/25">
              {student.name.charAt(0)}
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold tracking-wider">
                CAIAS SMART IDENTITY CARD
              </span>
              <h2 className="text-xl font-extrabold text-white">{student.name}</h2>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
            {student.rollNumber}
          </span>
        </div>

        {/* Card Body */}
        <div className="grid grid-cols-2 gap-4 text-xs pt-4 border-t border-slate-800">
          <div className="space-y-1">
            <span className="text-slate-500 font-medium">Department</span>
            <p className="text-white font-semibold">{student.department?.name}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 font-medium">Class Section & Semester</span>
            <p className="text-white font-semibold">
              Semester {student.currentSemester} • Section {student.currentSection?.sectionName} ({student.currentSection?.fullLabel})
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 font-medium">Institutional Email</span>
            <p className="text-white font-semibold truncate">{student.email}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 font-medium">Contact Phone</span>
            <p className="text-white font-semibold">{student.phone || 'N/A'}</p>
          </div>
        </div>

        {/* Biometric Verification Badge */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-xl ${
                student.isFaceEnrolled
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white">
                {student.isFaceEnrolled ? 'Facial Biometrics Registered' : 'Biometrics Pending'}
              </p>
              <p className="text-[11px] text-slate-400">
                {student.isFaceEnrolled
                  ? 'MobileFaceNet 128D mathematical vector enrolled'
                  : 'Please visit administrative office for facial enrollment'}
              </p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              student.isFaceEnrolled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}
          >
            {student.isFaceEnrolled ? 'VERIFIED' : 'ACTION REQUIRED'}
          </span>
        </div>
      </div>
    </div>
  );
}
