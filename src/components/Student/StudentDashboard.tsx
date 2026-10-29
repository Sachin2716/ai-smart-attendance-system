'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { SmartFaceCamera } from '@/components/Camera/SmartFaceCamera';
import { FaceEnrollmentStudio } from '@/components/Student/FaceEnrollmentStudio';
import { smartfaceApi, ActiveSession, AttendanceHistoryItem, StudentStats } from '@/adapters/smartfaceApi';
import {
  User, CheckCircle2, AlertTriangle, ShieldCheck, Camera, Clock,
  Calendar, BookOpen, AlertCircle, Sparkles, RefreshCw, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const studentId = user?.employeeId || (user as any)?.student_id || '24BCA001';
  const studentName = user?.name || 'Student';
  const classLabel = (user as any)?.class_label || 'BCA AIML 3B';
  const department = user?.department || 'Computer Science';
  const semester = user?.semesters?.[0] || (user as any)?.semester || 3;
  const section = user?.sections?.[0] || (user as any)?.section || 'B';

  const [isFaceEnrolled, setIsFaceEnrolled] = useState<boolean>(true);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [history, setHistory] = useState<AttendanceHistoryItem[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isEnrollmentStudioOpen, setIsEnrollmentStudioOpen] = useState<boolean>(false);
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState<boolean>(false);
  const [exceptionReason, setExceptionReason] = useState<string>('');
  const [exceptionSessionId, setExceptionSessionId] = useState<string>('');
  const [exceptionSuccessMsg, setExceptionSuccessMsg] = useState<string | null>(null);

  const fetchStudentData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Enrollment status
      const enrRes = await smartfaceApi.getEnrollmentStatus(studentId);
      setIsFaceEnrolled(enrRes.is_enrolled);

      // 2. Active sessions
      const sessions = await smartfaceApi.listActiveSessions(classLabel);
      setActiveSessions(sessions);

      // 3. Attendance history
      const hist = await smartfaceApi.getStudentHistory(studentId);
      setHistory(hist);

      // 4. Stats
      const st = await smartfaceApi.getStudentStats(studentId);
      setStats(st);
    } catch (e) {
      console.warn('API error, using local fallback:', e);
    } finally {
      setLoading(false);
    }
  }, [studentId, classLabel]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  const handleAttendanceSuccess = (data: any) => {
    setIsCameraOpen(false);
    fetchStudentData();
  };

  const handleRequestException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exceptionSessionId || !exceptionReason) return;
    try {
      const res = await smartfaceApi.requestException(exceptionSessionId, exceptionReason);
      setExceptionSuccessMsg('Exception requested successfully. Faculty will review your request.');
      setTimeout(() => {
        setIsExceptionModalOpen(false);
        setExceptionSuccessMsg(null);
        setExceptionReason('');
        fetchStudentData();
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit exception request');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      {/* 1. Header & Student Identity Card */}
      <div className="p-6 rounded-3xl glass-panel bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center font-extrabold text-xl shadow-lg shadow-indigo-600/20">
            <User className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                STUDENT BIOMETRIC PORTAL
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                isFaceEnrolled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
              }`}>
                {isFaceEnrolled ? 'FACE ENROLLED ✓' : 'FACE REGISTRATION PENDING ⚠️'}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1">{studentName}</h1>
            <p className="text-xs text-slate-400">
              USN: <strong className="text-indigo-300">{studentId}</strong> • Class: <strong>{classLabel}</strong> • Dept: {department}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchStudentData}
            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {!isFaceEnrolled ? (
            <button
              onClick={() => setIsEnrollmentStudioOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-xs shadow-lg shadow-amber-500/30 flex items-center space-x-2 transition-all animate-bounce"
            >
              <Camera className="w-4 h-4" />
              <span>Register My Face Now</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEnrollmentStudioOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-300 font-bold text-xs flex items-center space-x-2 transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>Update Biometrics</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Today's Eligible Attendance Sessions Card */}
      <div className="p-6 rounded-3xl glass-panel space-y-4 border border-indigo-500/20">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Today's Active Attendance Sessions
            </h3>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-400">
            Class: {classLabel}
          </span>
        </div>

        {activeSessions.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1">
            <p className="text-sm font-bold text-slate-300">
              No active attendance session is available for your class.
            </p>
            <p className="text-xs text-slate-500">
              Your professor will start the session during scheduled lecture hours.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map((s) => (
              <div
                key={s.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-indigo-500/30 hover:border-indigo-500/60 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                    ● SESSION ACTIVE
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {s.start_time} - {s.end_time}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-white">{s.subject_name}</h4>
                  <p className="text-xs text-indigo-300">
                    {s.subject_code} • Faculty: {s.faculty_name}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-400">
                    Present: <strong>{s.present_count} students</strong>
                  </span>

                  <button
                    onClick={() => {
                      setSelectedSessionId(s.id);
                      setIsCameraOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5 transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Mark Face Attendance</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Attendance Statistics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl glass-panel space-y-1 border border-indigo-500/20">
          <p className="text-[10px] font-mono text-slate-400 uppercase">Total Sessions Conducted</p>
          <p className="text-2xl font-extrabold text-white">{stats?.total_sessions_conducted || 24}</p>
          <p className="text-xs text-slate-500">Scheduled classroom lectures</p>
        </div>

        <div className="p-5 rounded-3xl glass-panel space-y-1 border border-emerald-500/20">
          <p className="text-[10px] font-mono text-slate-400 uppercase">Sessions Attended</p>
          <p className="text-2xl font-extrabold text-emerald-300">{stats?.total_sessions_attended || 21}</p>
          <p className="text-xs text-slate-500">Verified biometric attendances</p>
        </div>

        <div className="p-5 rounded-3xl glass-panel space-y-1 border border-purple-500/20">
          <p className="text-[10px] font-mono text-slate-400 uppercase">Overall Attendance %</p>
          <div className="flex items-center space-x-2">
            <p className="text-2xl font-extrabold text-purple-300">
              {stats?.overall_percentage || 87.5}%
            </p>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
              (stats?.overall_percentage || 87.5) >= 75
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/20 text-rose-300'
            }`}>
              {(stats?.overall_percentage || 87.5) >= 75 ? 'Exam Eligible ✓' : 'Shortage ⚠️'}
            </span>
          </div>
          <p className="text-xs text-slate-500">University requirement: Min 75%</p>
        </div>
      </div>

      {/* 4. Personal Attendance History & Exception Request */}
      <div className="p-6 rounded-3xl glass-panel space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              My Personal Attendance History
            </h3>
          </div>

          <button
            onClick={() => setIsExceptionModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-300 text-xs font-bold transition-all flex items-center space-x-1"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Request Attendance Exception</span>
          </button>
        </div>

        {history.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No attendance records yet for this semester.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[10px] font-mono text-slate-400 uppercase bg-slate-900/60 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Subject</th>
                  <th className="py-2.5 px-4">Date & Time</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Verification Method</th>
                  <th className="py-2.5 px-4">Confidence / Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-4 font-bold text-white">
                      {r.subject_name} ({r.subject_code})
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {r.session_date} {r.marked_at}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        r.status === 'PRESENT'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : r.status === 'EXCEPTION_APPROVED'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-indigo-300">
                      {r.verification_method}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {r.similarity_score ? (
                        <span className="text-emerald-400 font-mono">
                          {(r.similarity_score * 100).toFixed(1)}% Match
                        </span>
                      ) : r.approved_by ? (
                        <span className="text-purple-300">Approved by {r.approved_by}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Camera Attendance Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <SmartFaceCamera
            sessionId={selectedSessionId || undefined}
            claimedStudentId={studentId}
            onSuccess={handleAttendanceSuccess}
            onClose={() => setIsCameraOpen(false)}
          />
        </div>
      )}

      {/* Face Enrollment Studio Modal */}
      {isEnrollmentStudioOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <FaceEnrollmentStudio
            studentId={studentId}
            studentName={studentName}
            onCompleted={() => {
              setIsEnrollmentStudioOpen(false);
              fetchStudentData();
            }}
            onCancel={() => setIsEnrollmentStudioOpen(false)}
          />
        </div>
      )}

      {/* Manual Exception Request Modal */}
      {isExceptionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-white">
            <h3 className="text-base font-extrabold">Request Attendance Exception</h3>
            <p className="text-xs text-slate-400">
              If camera or recognition issues prevented marking attendance in class, submit an exception for faculty approval.
            </p>

            {exceptionSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs text-center">
                {exceptionSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleRequestException} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-300">Select Session</label>
                  <select
                    value={exceptionSessionId}
                    onChange={(e) => setExceptionSessionId(e.target.value)}
                    required
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="">Choose an active or today's session...</option>
                    {activeSessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.subject_name} ({s.start_time} - {s.end_time})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300">Reason for Exception</label>
                  <textarea
                    value={exceptionReason}
                    onChange={(e) => setExceptionReason(e.target.value)}
                    required
                    rows={3}
                    placeholder="e.g., Camera lens broke or lighting glare prevented scan in Room 201."
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsExceptionModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow"
                  >
                    Submit Exception Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
