'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  CheckCircle2,
  CalendarCheck,
  Search,
  RefreshCw,
  X,
  Clock,
  MapPin,
  Sparkles,
  Users,
  Shield,
  Fingerprint,
  CreditCard,
  Filter,
  Check,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export default function AdminAttendancePage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  const fetchFilters = async () => {
    try {
      const res = await fetch('/api/admin/classes');
      const data = await res.json();
      if (data.success) {
        setSections(data.sections || []);
        setCourses(data.courses || []);
      }
    } catch (e) {}
  };

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSection) params.append('sectionId', selectedSection);
      if (selectedCourse) params.append('courseId', selectedCourse);

      const res = await fetch(`/api/admin/attendance?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) setSessions(data.sessions);
    } catch (e) {
      toast.error('Failed to load attendance sessions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
    fetchSessions();
  }, []);

  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.course?.name?.toLowerCase().includes(q) ||
      s.course?.code?.toLowerCase().includes(q) ||
      s.classSection?.fullLabel?.toLowerCase().includes(q) ||
      s.faculty?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#18181B] border border-[#27272A] shadow-xl shadow-black/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent opacity-80" />

        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-950/70 text-[#22D3EE] border border-cyan-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              SESSION AUDIT & ARCHIVES
            </span>
            <span className="text-xs text-[#9CA3AF] font-mono">• All Enrolled Departments</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#F9FAFB] flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-[#3B82F6]" />
            Institutional Attendance Records
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Centralized immutable ledger of conducted lecture sessions, biometric verifications, and RFID logs.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={fetchSessions}
            className="p-2.5 rounded-xl bg-[#111318] hover:bg-[#27272A] text-[#9CA3AF] hover:text-[#F9FAFB] border border-[#27272A] transition-all duration-200 cursor-pointer"
            title="Refresh Sessions"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] flex flex-wrap items-center justify-between gap-3 shadow-md shadow-black/20">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search course, class, or faculty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111318] border border-[#27272A] rounded-xl pl-8 pr-3 py-2 text-xs text-[#F9FAFB] placeholder:text-[#9CA3AF]/60 focus:outline-none focus:border-[#3B82F6]"
            />
          </div>

          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="px-3 py-2 bg-[#111318] border border-[#27272A] rounded-xl text-xs text-[#F9FAFB] focus:outline-none focus:border-[#3B82F6]"
          >
            <option value="">All Class Sections</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullLabel}
              </option>
            ))}
          </select>

          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-2 bg-[#111318] border border-[#27272A] rounded-xl text-xs text-[#F9FAFB] focus:outline-none focus:border-[#3B82F6]"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchSessions}
          className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white font-semibold text-xs shadow-md shadow-blue-500/20 cursor-pointer transition-all duration-200"
        >
          Apply Filter
        </button>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSessions.map((sess) => {
          const presentCount = sess.records.filter((r: any) =>
            ['PRESENT', 'LATE', 'EXCUSED'].includes(r.status)
          ).length;
          const totalCount = sess.records.length;
          const percent = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(0) : 0;

          return (
            <div
              key={sess.id}
              onClick={() => setSelectedSession(sess)}
              className="p-5 rounded-2xl bg-[#18181B] border border-[#27272A] hover:border-blue-500/50 transition-all duration-200 cursor-pointer space-y-3 group shadow-xl shadow-black/40 card-hover-effect relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                  {sess.course?.code}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    sess.status === 'COMPLETED'
                      ? 'bg-emerald-950/60 text-[#22C55E] border-emerald-500/30'
                      : sess.status === 'ACTIVE'
                      ? 'bg-blue-950/60 text-[#22D3EE] border-cyan-500/30 animate-pulse'
                      : 'bg-rose-950/60 text-[#EF4444] border-rose-500/30'
                  }`}
                >
                  {sess.status}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#F9FAFB] group-hover:text-cyan-300 transition-colors line-clamp-1">
                  {sess.course?.name}
                </h3>
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  Class: <strong className="text-slate-200">{sess.classSection?.fullLabel}</strong>
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-[#9CA3AF] pt-2 border-t border-[#27272A]">
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Clock className="w-3 h-3 text-[#9CA3AF]" />
                  {sess.sessionDate} • {sess.startTime}
                </span>
                <span className="font-mono font-bold text-[#22D3EE]">
                  {presentCount}/{totalCount} ({percent}%)
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] pt-1">
                <span className="truncate max-w-[160px]">Faculty: {sess.faculty?.name}</span>
                <span className="text-blue-400 font-semibold group-hover:underline flex items-center gap-1">
                  View Roster →
                </span>
              </div>
            </div>
          );
        })}

        {filteredSessions.length === 0 && (
          <div className="col-span-full py-16 text-center bg-[#18181B] border border-[#27272A] rounded-2xl text-[#9CA3AF] text-xs">
            <CalendarCheck className="w-8 h-8 mx-auto text-[#9CA3AF]/40 mb-2" />
            <p className="font-semibold text-white">No Attendance Sessions Found</p>
            <p className="text-[11px] text-[#9CA3AF] mt-1">Try adjusting the filter criteria or conduct a new session from Faculty Command.</p>
          </div>
        )}
      </div>

      {/* Session Details Modal */}
      <AnimatePresence>
        {selectedSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl rounded-2xl bg-[#18181B] border border-[#27272A] p-6 space-y-4 shadow-2xl shadow-black max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedSession.course?.name} ({selectedSession.course?.code})
                  </h3>
                  <p className="text-xs text-[#9CA3AF] font-mono mt-0.5">
                    {selectedSession.classSection?.fullLabel} • {selectedSession.sessionDate} • {selectedSession.startTime}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#27272A] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-1">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#27272A] text-[#9CA3AF] font-mono text-[11px]">
                      <th className="pb-2">Roll No</th>
                      <th className="pb-2">Student Name</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Method</th>
                      <th className="pb-2 text-right">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272A]">
                    {selectedSession.records.map((r: any) => (
                      <tr key={r.id} className="hover:bg-[#111318]/50 transition-colors">
                        <td className="py-2.5 font-mono text-cyan-400 font-bold">{r.student.rollNumber}</td>
                        <td className="py-2.5 font-medium text-white">{r.student.name}</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              r.status === 'PRESENT'
                                ? 'bg-emerald-950/60 text-[#22C55E] border border-emerald-500/30'
                                : r.status === 'LATE'
                                ? 'bg-amber-950/60 text-[#F59E0B] border border-amber-500/30'
                                : r.status === 'EXCUSED'
                                ? 'bg-blue-950/60 text-[#3B82F6] border border-blue-500/30'
                                : 'bg-rose-950/60 text-[#EF4444] border border-rose-500/30'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono text-[10px] text-[#9CA3AF]">
                          {r.verificationMethod}
                        </td>
                        <td className="py-2.5 text-right font-mono text-[11px] text-[#9CA3AF]">
                          {r.confidenceScore ? `${(r.confidenceScore * 100).toFixed(1)}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-3 border-t border-[#27272A] flex justify-end">
                <button
                  onClick={() => setSelectedSession(null)}
                  className="px-4 py-2 rounded-xl bg-[#111318] hover:bg-[#27272A] border border-[#27272A] text-xs font-semibold text-[#F9FAFB] transition-colors"
                >
                  Close Archive
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
