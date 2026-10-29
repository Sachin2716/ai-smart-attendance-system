'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Users,
  Play,
  Search,
  RefreshCw,
  Fingerprint,
  AlertCircle,
  GraduationCap,
  Percent,
} from 'lucide-react';

export default function FacultyClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClassIndex, setSelectedClassIndex] = useState(0);

  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/faculty/classes');
      const data = await res.json();
      if (res.ok && data.success) {
        setClasses(data.classes);
      } else {
        toast.error(data.error || 'Failed to fetch assigned classes');
      }
    } catch (e) {
      toast.error('Network error loading classes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const activeClass = classes[selectedClassIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            My Assigned Classes & Student Rosters
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Access enrolled student rosters, biometric registration statuses, and course performance.
          </p>
        </div>

        <button
          onClick={fetchClasses}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Class Selector Tabs */}
      <div className="flex flex-wrap gap-2.5">
        {classes.map((c, idx) => (
          <button
            key={c.assignmentId}
            onClick={() => setSelectedClassIndex(idx)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
              selectedClassIndex === idx
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {c.course.code} — Class {c.classSection.fullLabel}
          </button>
        ))}
      </div>

      {activeClass && (
        <div className="space-y-6">
          {/* Class Summary Bar */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="font-mono text-xs font-bold text-emerald-400">{activeClass.course.code}</span>
              <h2 className="text-lg font-bold text-white mt-1">{activeClass.course.name}</h2>
              <p className="text-xs text-slate-400">
                Class {activeClass.classSection.fullLabel} • {activeClass.classSection.department} • {activeClass.studentCount} Enrolled Students
              </p>
            </div>

            <button
              onClick={() => router.push('/faculty/attendance')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all cursor-pointer self-start md:self-auto"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Live Session for this Class</span>
            </button>
          </div>

          {/* Student Roster Table */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-3">Roll Number</th>
                    <th className="pb-3">Student Name</th>
                    <th className="pb-3">Email & Contact</th>
                    <th className="pb-3">Biometrics</th>
                    <th className="pb-3">Attendance Sessions</th>
                    <th className="pb-3 text-right">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {activeClass.students.map((stu: any) => (
                    <tr key={stu.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 font-mono font-bold text-emerald-400">{stu.rollNumber}</td>
                      <td className="py-3 font-semibold text-white">{stu.name}</td>
                      <td className="py-3 text-slate-400">
                        <p>{stu.email}</p>
                        <p className="text-[11px] text-slate-500">{stu.phone || 'N/A'}</p>
                      </td>
                      <td className="py-3">
                        {stu.isFaceEnrolled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <Fingerprint className="w-3 h-3" />
                            Enrolled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <AlertCircle className="w-3 h-3" />
                            Pending Setup
                          </span>
                        )}
                      </td>
                      <td className="py-3 font-mono text-slate-400">
                        {stu.attendedSessions} / {stu.totalSessions} Sessions
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`font-mono font-bold ${
                            stu.attendancePercentage >= 75 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {stu.attendancePercentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {activeClass.students.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No students enrolled in this section yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
