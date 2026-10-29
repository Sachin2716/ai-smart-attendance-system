'use client';

import React, { useState, useMemo } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { BarChart3, Calendar, Download, Users, FileText, CheckCircle2, Search, BookOpen, Clock } from 'lucide-react';
import { exportStudentsToExcel } from '@/utils/exportExcel';

export const MyFacultyReports: React.FC = () => {
  const { students, sessions, auditLogs, selectedCourse, selectedSemester, selectedSection } = useAttendance();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Faculty Assigned Class Students Scoped
  const facultyStudents = useMemo(() => {
    return students.filter(s => s.course === selectedCourse && s.semester === selectedSemester && s.section === selectedSection && s.status !== 'inactive');
  }, [students, selectedCourse, selectedSemester, selectedSection]);

  // Filtered Students
  const displayedStudents = useMemo(() => {
    return facultyStudents.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.uucmsNo || s.rollNo || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [facultyStudents, searchTerm]);

  // Statistics for Faculty's Class
  const totalStudents = facultyStudents.length;
  const highAttendanceCount = facultyStudents.filter(s => s.attendancePercentage >= 75).length;
  const lowAttendanceCount = facultyStudents.filter(s => s.attendancePercentage < 75).length;
  const averageAttendancePct = totalStudents > 0
    ? Math.round(facultyStudents.reduce((acc, s) => acc + s.attendancePercentage, 0) / totalStudents)
    : 0;

  // Faculty Session History
  const facultySessions = useMemo(() => {
    return sessions.filter(s => s.semester === selectedSemester && s.section === selectedSection);
  }, [sessions, selectedSemester, selectedSection]);

  const handleExportFacultyReport = () => {
    exportStudentsToExcel(facultyStudents, `My_Class_Attendance_Report_${selectedCourse}_Sem${selectedSemester}${selectedSection}.xlsx`);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="p-6 rounded-3xl glass-panel bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
            👨‍🏫 FACULTY CLASS REPORTS
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            My Class Attendance & Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Attendance reports scoped to {selectedCourse} Sem {selectedSemester} Sec {selectedSection} • Faculty: {user?.name}
          </p>
        </div>

        <button
          onClick={handleExportFacultyReport}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export My Class Excel Report</span>
        </button>
      </div>

      {/* CLASS STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-1">
          <p className="text-slate-400 font-semibold">Assigned Class Strength</p>
          <p className="text-2xl font-extrabold text-white">{totalStudents} Students</p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-emerald-500/30 bg-emerald-500/10 space-y-1">
          <p className="text-emerald-300 font-semibold">Average Attendance</p>
          <p className="text-2xl font-extrabold text-emerald-400">{averageAttendancePct}%</p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-indigo-500/30 bg-indigo-500/10 space-y-1">
          <p className="text-indigo-300 font-semibold">Good Attendance (≥ 75%)</p>
          <p className="text-2xl font-extrabold text-indigo-400">{highAttendanceCount} Students</p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-rose-500/30 bg-rose-500/10 space-y-1">
          <p className="text-rose-300 font-semibold">Shortage (&lt; 75%)</p>
          <p className="text-2xl font-extrabold text-rose-400">{lowAttendanceCount} Students</p>
        </div>
      </div>

      {/* STUDENT ATTENDANCE ROSTER REPORT TABLE */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Class Student Attendance Summary
          </h3>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search student name or UUCMS..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-bold uppercase border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">UUCMS / Roll</th>
                <th className="py-3.5 px-4">Class & Sec</th>
                <th className="py-3.5 px-4">Attendance %</th>
                <th className="py-3.5 px-4">Status Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No matching student records found for this class.
                  </td>
                </tr>
              ) : (
                displayedStudents.map(s => (
                  <tr key={s.id} className="hover:bg-slate-900/60">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={s.avatar || s.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={s.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <span className="font-bold text-white">{s.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-300">
                      {s.uucmsNo || s.rollNo}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {s.course || 'BCA AIML'} Sem {s.semester} ({s.section})
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] ${
                        s.attendancePercentage >= 75
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {s.attendancePercentage}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {s.attendancePercentage >= 75 ? (
                        <span className="text-emerald-400 font-semibold text-[10px]">Eligible ✓</span>
                      ) : (
                        <span className="text-rose-400 font-semibold text-[10px]">Shortage Warning ⚠️</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
