'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { smartfaceApi, ActiveSession } from '@/adapters/smartfaceApi';
import {
  Play, Pause, Plus, Download, Search, CheckCircle2, XCircle,
  AlertTriangle, Clock, Users, BookOpen, FileSpreadsheet, ShieldCheck, RefreshCw, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const FacultySessionManager: React.FC = () => {
  const { user } = useAuth();
  
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [liveRosterData, setLiveRosterData] = useState<any | null>(null);
  const [pendingExceptions, setPendingExceptions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newClassLabel, setNewClassLabel] = useState<string>('BCA AIML 3B');
  const [newSubjectCode, setNewSubjectCode] = useState<string>('CS301');
  const [newStartTime, setNewStartTime] = useState<string>('09:00 AM');
  const [newEndTime, setNewEndTime] = useState<string>('10:00 AM');

  // Review exception state
  const [reviewModalExcId, setReviewModalExcId] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [reviewRemarks, setReviewRemarks] = useState<string>('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const sessions = await smartfaceApi.listActiveSessions();
      setActiveSessions(sessions);
      if (sessions.length > 0 && !selectedSessionId) {
        setSelectedSessionId(sessions[0].id);
      }

      // Load pending exceptions
      const exps = await smartfaceApi.listPendingExceptions();
      setPendingExceptions(exps);
    } catch (e) {
      console.warn('Error loading sessions:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load live roster for selected session with auto-polling
  useEffect(() => {
    if (!selectedSessionId) return;

    const fetchRoster = async () => {
      try {
        const data = await smartfaceApi.getLiveSessionRoster(selectedSessionId);
        setLiveRosterData(data);
      } catch (e) {
        console.warn('Roster fetch error:', e);
      }
    };

    fetchRoster();
    const interval = setInterval(fetchRoster, 3500); // 3.5s live polling
    return () => clearInterval(interval);
  }, [selectedSessionId]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await smartfaceApi.createSession({
        class_label: newClassLabel,
        subject_code: newSubjectCode,
        start_time: newStartTime,
        end_time: newEndTime,
      });

      // Start the newly created session
      await smartfaceApi.startSession(res.session_id);

      setIsCreateModalOpen(false);
      setSelectedSessionId(res.session_id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create session');
    }
  };

  const handleCloseSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to close this attendance session? Unmarked students will be recorded as Absent.')) return;
    try {
      await smartfaceApi.closeSession(sessionId);
      loadData();
      if (selectedSessionId === sessionId) {
        const data = await smartfaceApi.getLiveSessionRoster(sessionId);
        setLiveRosterData(data);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to close session');
    }
  };

  const handleReviewExceptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalExcId) return;
    try {
      await smartfaceApi.reviewException(reviewModalExcId, reviewAction, reviewRemarks);
      setReviewModalExcId(null);
      setReviewRemarks('');
      loadData();
      if (selectedSessionId) {
        const data = await smartfaceApi.getLiveSessionRoster(selectedSessionId);
        setLiveRosterData(data);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to review exception');
    }
  };

  const filteredRoster = (liveRosterData?.roster || []).filter(
    (s: any) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="p-6 rounded-3xl glass-panel bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            👨‍🏫 FACULTY ATTENDANCE COMMAND CENTER
          </span>
          <h2 className="text-xl font-extrabold text-white mt-1">Class-Wise Session Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Create, start, monitor, and export live facial recognition attendance records
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Session</span>
          </button>

          <a
            href={smartfaceApi.getReportDownloadUrl('xlsx')}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-300 font-bold text-xs flex items-center space-x-1.5 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </a>
        </div>
      </div>

      {/* 2. Active Session Selector / Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {activeSessions.length === 0 ? (
          <div className="p-4 rounded-2xl glass-panel text-xs text-slate-400 w-full text-center">
            No active session currently running. Click <strong>"Create New Session"</strong> above to launch one.
          </div>
        ) : (
          activeSessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSessionId(s.id)}
              className={`px-4 py-3 rounded-2xl border text-left transition-all flex-shrink-0 ${
                selectedSessionId === s.id
                  ? 'bg-indigo-600/20 border-indigo-500/60 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="font-extrabold text-xs">{s.subject_name}</p>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {s.class_label} • {s.start_time} - {s.end_time} • <strong>{s.present_count} Present</strong>
              </p>
            </button>
          ))
        )}
      </div>

      {/* 3. Live Session Control & Roster */}
      {selectedSessionId && liveRosterData && (
        <div className="p-6 rounded-3xl glass-panel space-y-5 border border-indigo-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
                  {liveRosterData.status}
                </span>
                <h3 className="text-base font-extrabold text-white">
                  {liveRosterData.subject_name} ({liveRosterData.class_label})
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Faculty: {liveRosterData.faculty_name} • Total Strength: {liveRosterData.total_students} students
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-3 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
                <span className="text-emerald-400 font-bold">✓ {liveRosterData.present_count} Present</span>
                <span className="text-rose-400 font-bold">✕ {liveRosterData.absent_count} Absent</span>
              </div>

              {liveRosterData.status === 'ACTIVE' && (
                <button
                  onClick={() => handleCloseSession(selectedSessionId)}
                  className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-extrabold text-xs transition-all flex items-center space-x-1"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Close Session</span>
                </button>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search student by name or USN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500"
              />
            </div>

            <div className="text-[11px] text-slate-400 font-mono">
              Auto-updating via live biometric feed
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[10px] font-mono text-slate-400 uppercase bg-slate-900/80 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">USN</th>
                  <th className="py-2.5 px-4">Student Name</th>
                  <th className="py-2.5 px-4">Face Enrolled</th>
                  <th className="py-2.5 px-4">Attendance Status</th>
                  <th className="py-2.5 px-4">Time Marked</th>
                  <th className="py-2.5 px-4">Confidence / Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRoster.map((s: any) => (
                  <tr key={s.student_id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-300">{s.student_id}</td>
                    <td className="py-3 px-4 font-bold text-white">{s.name}</td>
                    <td className="py-3 px-4">
                      {s.is_enrolled ? (
                        <span className="text-emerald-400 font-bold text-[10px]">Enrolled ✓</span>
                      ) : (
                        <span className="text-amber-400 text-[10px]">Unregistered ⚠️</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        s.status === 'PRESENT'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : s.status === 'ABSENT'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{s.marked_at || '—'}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {s.similarity_score ? (
                        <span className="text-emerald-400 font-mono font-bold">
                          {(s.similarity_score * 100).toFixed(1)}% AI Match
                        </span>
                      ) : s.method ? (
                        <span className="text-purple-300">{s.method}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Attendance Exception Review Panel */}
      {pendingExceptions.length > 0 && (
        <div className="p-6 rounded-3xl glass-panel space-y-4 border border-purple-500/30">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Manual Attendance Exception Requests
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300">
              {pendingExceptions.length} Pending Review
            </span>
          </div>

          <div className="space-y-3">
            {pendingExceptions.map((exc) => (
              <div
                key={exc.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-white text-sm">{exc.student_name}</span>
                    <span className="font-mono text-xs text-indigo-300">({exc.student_id})</span>
                    <span className="text-xs text-slate-400">• {exc.class_label}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    <strong>Reason:</strong> {exc.reason}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Submitted: {exc.created_at}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setReviewModalExcId(exc.id);
                      setReviewAction('REJECT');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold transition-all"
                  >
                    Reject
                  </button>

                  <button
                    onClick={() => {
                      setReviewModalExcId(exc.id);
                      setReviewAction('APPROVE');
                    }}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs transition-all shadow"
                  >
                    Approve & Mark Present
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Session Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-white">
            <h3 className="text-base font-extrabold">Create Attendance Session</h3>
            <p className="text-xs text-slate-400">
              Configure class and subject details to start facial recognition attendance.
            </p>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-300">Class & Section</label>
                <select
                  value={newClassLabel}
                  onChange={(e) => setNewClassLabel(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="BCA AIML 3B">BCA AIML 3B</option>
                  <option value="BCA AIML 5A">BCA AIML 5A</option>
                  <option value="B.Tech CSE 1A">B.Tech CSE 1A</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300">Subject</label>
                <select
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="CS301">CS301 - Python Artificial Intelligence</option>
                  <option value="CS501">CS501 - Database Management Systems</option>
                  <option value="CS302">CS302 - Computer Vision & Biometrics</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300">Start Time</label>
                  <input
                    type="text"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300">End Time</label>
                  <input
                    type="text"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    placeholder="10:00 AM"
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow"
                >
                  Start Session Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Exception Modal */}
      {reviewModalExcId && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-white">
            <h3 className="text-base font-extrabold">
              {reviewAction === 'APPROVE' ? 'Approve' : 'Reject'} Attendance Exception
            </h3>
            <p className="text-xs text-slate-400">
              Provide faculty verification remarks for auditing purposes.
            </p>

            <form onSubmit={handleReviewExceptionSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-300">Faculty Remarks</label>
                <textarea
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  required
                  rows={3}
                  placeholder="e.g. Student presented physical college ID card; verified in classroom."
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewModalExcId(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-bold shadow text-white ${
                    reviewAction === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  Confirm {reviewAction === 'APPROVE' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
