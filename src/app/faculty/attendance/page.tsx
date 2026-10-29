'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Camera,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Users,
  Shield,
  RefreshCw,
  VideoOff,
  Video,
  AlertTriangle,
  Fingerprint,
  CalendarDays,
  MapPin,
  Check,
  X,
  Zap,
  CreditCard,
  Wifi,
  Search,
  ScanLine,
  ShieldCheck,
  Cpu,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  FileText,
  Download,
  Printer,
  ListOrdered,
  SortAsc,
  UserCheck,
  UserX,
  Eye,
  RotateCcw,
} from 'lucide-react';

export default function FacultyAttendancePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<any[]>([]);
  const [facultyName, setFacultyName] = useState('Faculty');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchRoster, setSearchRoster] = useState('');

  // Calling Queue & Auto-Advance State
  const [sortBy, setSortBy] = useState<'ROLL_NUMBER' | 'ALPHABETICAL'>('ROLL_NUMBER');
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);
  const [showCompletionReport, setShowCompletionReport] = useState(false);

  // Camera & AI State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<'IDLE' | 'MATCHED' | 'FAILED' | 'OFFLINE'>('IDLE');

  // RFID / NFC State
  const [isNfcScanning, setIsNfcScanning] = useState(false);
  const [lastNfcVerification, setLastNfcVerification] = useState<{
    studentName: string;
    rollNumber: string;
    timestamp: string;
    cardUid: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Fetch faculty's assigned classes and weekly timetable slots
  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/faculty/classes');
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.classes?.length > 0) {
          setClasses(data.classes);
          setSelectedAssignmentId(data.classes[0].assignmentId);
        }
        if (data.timetableSlots) {
          setTimetableSlots(data.timetableSlots);
        }
        if (data.facultyName) {
          setFacultyName(data.facultyName);
        }
      }
    } catch (e) {
      toast.error('Failed to load assigned classes and timetable');
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Cleanup webcam stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Sorted Records according to selected sort mode
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      if (sortBy === 'ALPHABETICAL') {
        return a.student.name.localeCompare(b.student.name);
      }
      return a.student.rollNumber.localeCompare(b.student.rollNumber, undefined, { numeric: true });
    });
  }, [records, sortBy]);

  // Current active student in the roll-call queue
  const currentStudent = sortedRecords[currentStudentIndex] || null;
  const nextStudent = sortedRecords[currentStudentIndex + 1] || null;

  // Auto-advance helper
  const advanceToNext = () => {
    if (currentStudentIndex + 1 < sortedRecords.length) {
      setCurrentStudentIndex((prev) => prev + 1);
    } else {
      // Reached the end of roster! Open report
      setShowCompletionReport(true);
      toast.success('Roll-call completed for all students! Generating report...');
    }
  };

  // Keyboard shortcut listener: Spacebar = Scan Face, Enter/P = Present & Next, A = Absent & Next, Right Arrow = Next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (!activeSession) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (isCameraActive && !isAiProcessing) {
          triggerAiFaceScan();
        } else if (!isCameraActive) {
          toast.info('Please activate the camera before scanning faces');
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        advanceToNext();
      } else if (e.code === 'ArrowLeft' && currentStudentIndex > 0) {
        e.preventDefault();
        setCurrentStudentIndex((prev) => Math.max(0, prev - 1));
      } else if ((e.key === 'p' || e.key === 'P' || e.code === 'Enter') && currentStudent) {
        e.preventDefault();
        markCurrentStudent('PRESENT');
      } else if ((e.key === 'a' || e.key === 'A') && currentStudent) {
        e.preventDefault();
        markCurrentStudent('ABSENT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSession, isCameraActive, isAiProcessing, currentStudent, currentStudentIndex, sortedRecords.length]);

  // Direct Start Lecture from Timetable Slot
  const handleDirectStartClass = async (classSectionId: string, courseId: string, courseName: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/faculty/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classSectionId,
          courseId,
          verificationMode: 'HYBRID_AI',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActiveSession(data.session);
        setCurrentStudentIndex(0);
        setShowCompletionReport(false);
        await fetchSessionDetails(data.session.id);
        toast.success(`Session opened: ${courseName}`);
        startCamera();
      } else if (res.status === 409 && data.existingSessionId) {
        toast.info('Rejoining existing active session for today');
        await fetchSessionDetails(data.existingSessionId);
        setCurrentStudentIndex(0);
        setShowCompletionReport(false);
        startCamera();
      } else {
        toast.error(data.error || 'Failed to start session');
      }
    } catch (e) {
      toast.error('Network error starting session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSession = async () => {
    const selectedAssignment = classes.find((c) => c.assignmentId === selectedAssignmentId);
    if (!selectedAssignment) return;

    handleDirectStartClass(
      selectedAssignment.classSection.id,
      selectedAssignment.course.id,
      selectedAssignment.course.name
    );
  };

  const fetchSessionDetails = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/faculty/sessions/${sessionId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setActiveSession(data.session);
        const fetchedRecords = data.session.records || [];
        setRecords(fetchedRecords);

        // If no students enrolled in this section, show report state immediately
        if (fetchedRecords.length === 0) {
          setShowCompletionReport(true);
        }
      }
    } catch (e) {
      toast.error('Failed to load session details');
    }
  };

  // Start Webcam
  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsCameraActive(true);
      }
    } catch (err) {
      setIsCameraActive(false);
      toast.info('Camera unavailable or permission denied. Manual fallback mode active.');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Capture frame & verify via AI service
  const triggerAiFaceScan = async () => {
    if (!activeSession) return;
    if (!videoRef.current || !isCameraActive) {
      toast.error('Please turn on camera before starting AI biometric scan');
      return;
    }

    setIsAiProcessing(true);
    setAiStatus('IDLE');
    setAiMessage('Scanning face and verifying biometric match...');

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageBase64 = canvas.toDataURL('image/jpeg', 0.85);

        const res = await fetch('/api/ai/verify-face', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: activeSession.id,
            imageBase64,
          }),
        });

        const data = await res.json();

        if (res.ok && data.success && data.student) {
          setAiStatus('MATCHED');
          setAiMessage(`✓ Verified: ${data.student.name} (${data.student.rollNumber})`);
          toast.success(`Face Verified: ${data.student.name}! Marked PRESENT.`);
          
          await fetchSessionDetails(activeSession.id);

          // Auto-advance to next student in queue
          if (autoAdvanceEnabled) {
            setTimeout(() => {
              advanceToNext();
            }, 800);
          }
        } else if (!data.aiAvailable) {
          setAiStatus('OFFLINE');
          setAiMessage(data.error);
          toast.warning('AI service offline. Use the manual buttons to mark attendance.');
        } else {
          setAiStatus('FAILED');
          const errorMsg = data.error || 'Face not recognized with sufficient confidence.';
          setAiMessage(`⚠️ Verification Failed: ${errorMsg}`);
          toast.error(errorMsg);
        }
      }
    } catch (e) {
      setAiStatus('FAILED');
      setAiMessage('Biometric capture error. Please retry or mark attendance manually.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  // RFID / NFC Smart Card Tap Attendance Handler
  const handleRfidCardTap = async (targetStudentId?: string) => {
    if (!activeSession) return;

    // Pick targeted student, or current student, or first absent student
    const studentRecord = targetStudentId
      ? records.find((r) => r.studentId === targetStudentId)
      : currentStudent || records.find((r) => r.status === 'ABSENT') || records[0];

    if (!studentRecord) {
      toast.info('No students available to tap card');
      return;
    }

    setIsNfcScanning(true);
    const mockUid = `E4:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}`;

    try {
      const res = await fetch('/api/faculty/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSession.id,
          studentId: studentRecord.studentId,
          status: 'PRESENT',
          verificationMethod: 'RFID_NFC',
          remarks: `RFID NFC Card Tap (UID: ${mockUid})`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastNfcVerification({
          studentName: studentRecord.student.name,
          rollNumber: studentRecord.student.rollNumber,
          timestamp: timeNow,
          cardUid: mockUid,
        });
        toast.success(`NFC Card Verified: ${studentRecord.student.name} marked PRESENT!`);
        await fetchSessionDetails(activeSession.id);

        if (autoAdvanceEnabled) {
          setTimeout(() => {
            advanceToNext();
          }, 600);
        }
      } else {
        toast.error(data.error || 'NFC verification recording failed');
      }
    } catch (e) {
      toast.error('Network error during RFID card scan');
    } finally {
      setIsNfcScanning(false);
    }
  };

  // Update single student record manually
  const updateStudentRecord = async (
    studentId: string,
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED',
    method: 'MANUAL' | 'FACE_AI' | 'RFID_NFC' = 'MANUAL',
    remarks: string = 'Manual verification by faculty',
    shouldAdvance = false
  ) => {
    if (!activeSession) return;

    try {
      const res = await fetch('/api/faculty/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSession.id,
          studentId,
          status,
          verificationMethod: method,
          remarks,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRecords((prev) =>
          prev.map((r) =>
            r.studentId === studentId ? { ...r, status, verificationMethod: method, markedAt: new Date().toISOString() } : r
          )
        );
        toast.success(`Marked ${status}!`);

        if (shouldAdvance && autoAdvanceEnabled) {
          setTimeout(() => {
            advanceToNext();
          }, 300);
        }
      } else {
        toast.error(data.error || 'Failed to update record');
      }
    } catch (e) {
      toast.error('Network error updating attendance');
    }
  };

  // Quick mark for current active student
  const markCurrentStudent = async (status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    if (!currentStudent) return;
    await updateStudentRecord(
      currentStudent.studentId,
      status,
      'MANUAL',
      `Roll-call verification by faculty`,
      true
    );
  };

  // Bulk Actions
  const handleBulkMark = async (status: 'PRESENT' | 'ABSENT') => {
    if (!activeSession || records.length === 0) return;
    const confirmMsg = status === 'PRESENT'
      ? 'Mark all students as PRESENT (Manual Fallback)?'
      : 'Reset all students to ABSENT?';
    if (!confirm(confirmMsg)) return;

    for (const record of records) {
      if (record.status !== status) {
        await updateStudentRecord(
          record.studentId,
          status,
          'MANUAL',
          `Bulk ${status.toLowerCase()} mark by faculty`,
          false
        );
      }
    }
  };

  // Finalize attendance session
  const handleFinalizeSession = async () => {
    if (!activeSession) return;

    try {
      const res = await fetch(`/api/faculty/sessions/${activeSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          reason: 'Lecture concluded; attendance finalized by instructor',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Attendance session finalized and locked in master database!');
        stopCamera();
        setActiveSession(null);
        setLastNfcVerification(null);
        setShowCompletionReport(false);
      } else {
        toast.error(data.error || 'Failed to finalize session');
      }
    } catch (e) {
      toast.error('Network error finalizing session');
    }
  };

  // Export CSV Report
  const exportAttendanceCsv = () => {
    if (!activeSession || records.length === 0) {
      toast.error('No attendance records to export');
      return;
    }

    const headers = ['Roll Number', 'Student Name', 'Email', 'Status', 'Verification Method', 'Marked Time'];
    const rows = sortedRecords.map((r) => [
      `"${r.student.rollNumber}"`,
      `"${r.student.name}"`,
      `"${r.student.email}"`,
      `"${r.status}"`,
      `"${r.verificationMethod || 'N/A'}"`,
      `"${r.markedAt ? new Date(r.markedAt).toLocaleTimeString() : 'N/A'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_${activeSession.course?.code}_${activeSession.classSection?.fullLabel}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attendance report exported as CSV!');
  };

  // Metrics
  const presentCount = records.filter((r) => ['PRESENT', 'LATE', 'EXCUSED'].includes(r.status)).length;
  const absentCount = records.filter((r) => r.status === 'ABSENT').length;
  const totalCount = records.length;
  const attendancePercent = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(0) : 0;

  // Filtered Roster for manual search
  const filteredRecords = sortedRecords.filter((r) => {
    if (!searchRoster) return true;
    const q = searchRoster.toLowerCase();
    return r.student.name.toLowerCase().includes(q) || r.student.rollNumber.toLowerCase().includes(q);
  });

  const presentList = sortedRecords.filter((r) => ['PRESENT', 'LATE', 'EXCUSED'].includes(r.status));
  const absentList = sortedRecords.filter((r) => r.status === 'ABSENT');

  // Timetable slot grouping
  const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaySlots = timetableSlots.filter(
    (s) => s.dayOfWeek.toLowerCase() === todayDay.toLowerCase()
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#18181B] border border-[#27272A] shadow-xl shadow-black/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#22D3EE] to-transparent opacity-80" />

        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/70 text-[#22D3EE] border border-cyan-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              FACULTY COMMAND CENTER
            </span>
            <span className="text-xs text-[#9CA3AF] font-mono">• {facultyName}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#F9FAFB] flex items-center gap-2">
            <Camera className="w-6 h-6 text-[#22D3EE]" />
            Live Biometric & Sequential Roll-Call Attendance
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Auto-advancing roll-call by Roll Number or Alphabetical order with AI facial recognition and instant report generation.
          </p>
        </div>

        {activeSession ? (
          <div className="flex items-center space-x-3 self-start sm:self-auto">
            <button
              onClick={() => setShowCompletionReport(!showCompletionReport)}
              className="px-4 py-2.5 rounded-xl bg-[#111318] hover:bg-[#27272A] border border-[#27272A] text-xs font-semibold text-cyan-300 flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#22D3EE]" />
              <span>{showCompletionReport ? 'Back to Live Camera' : 'View Session Report'}</span>
            </button>

            <button
              onClick={handleFinalizeSession}
              className="px-5 py-2.5 rounded-xl bg-[#22C55E] hover:bg-emerald-600 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition-all duration-200 cursor-pointer active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Finalize & Lock</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-3 self-start sm:self-auto">
            <select
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              className="px-3 py-2 bg-[#111318] border border-[#27272A] rounded-xl text-xs text-[#F9FAFB] focus:outline-none focus:border-[#3B82F6]"
            >
              {classes.map((c) => (
                <option key={c.assignmentId} value={c.assignmentId}>
                  {c.course.code} — {c.classSection.fullLabel}
                </option>
              ))}
            </select>

            <button
              onClick={handleStartSession}
              disabled={isLoading || !selectedAssignmentId}
              className="px-5 py-2 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 flex items-center space-x-2 transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isLoading ? 'Opening...' : 'Start Session'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ACTIVE ATTENDANCE SESSION VIEW */}
      {activeSession ? (
        <div className="space-y-6">
          {/* Active Session Status Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] space-y-1">
              <span className="text-[11px] font-mono text-[#9CA3AF]">Course & Section</span>
              <p className="text-sm font-bold text-white truncate">
                {activeSession.course?.code} ({activeSession.classSection?.fullLabel})
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] space-y-1">
              <span className="text-[11px] font-mono text-[#9CA3AF]">Total Enrolled</span>
              <p className="text-xl font-bold text-[#F9FAFB]">{totalCount} Students</p>
            </div>
            <div className="p-4 rounded-xl bg-[#18181B] border border-emerald-500/40 bg-gradient-to-b from-[#18181B] to-emerald-950/20 space-y-1">
              <span className="text-[11px] font-mono text-emerald-400">Present Count</span>
              <p className="text-xl font-bold text-[#22C55E]">
                {presentCount} ({attendancePercent}%)
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#18181B] border border-rose-500/40 bg-gradient-to-b from-[#18181B] to-rose-950/20 space-y-1">
              <span className="text-[11px] font-mono text-rose-400">Absent Count</span>
              <p className="text-xl font-bold text-[#EF4444]">{absentCount}</p>
            </div>
          </div>

          {/* SHOW REPORT IF COMPLETED OR REQUESTED */}
          {showCompletionReport || totalCount === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-[#18181B] border border-[#27272A] shadow-2xl space-y-6"
            >
              {/* Report Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27272A]">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#22D3EE]" />
                    <h2 className="text-lg font-bold text-white">
                      Attendance Session Summary Report
                    </h2>
                  </div>
                  <p className="text-xs text-[#9CA3AF] mt-0.5 font-mono">
                    {activeSession.course?.name} ({activeSession.course?.code}) • {activeSession.classSection?.fullLabel}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={exportAttendanceCsv}
                    className="px-3.5 py-2 rounded-xl bg-[#111318] hover:bg-[#27272A] border border-[#27272A] text-xs font-semibold text-white flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#22D3EE]" />
                    <span>Download CSV</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 rounded-xl bg-[#111318] hover:bg-[#27272A] border border-[#27272A] text-xs font-semibold text-white flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Print</span>
                  </button>

                  <button
                    onClick={() => setShowCompletionReport(false)}
                    className="px-3.5 py-2 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Resume Live Session</span>
                  </button>
                </div>
              </div>

              {/* Attendance Ratio Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#111318] border border-[#27272A] flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#9CA3AF] font-mono">Enrolled Total</span>
                    <p className="text-2xl font-extrabold text-white">{totalCount}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-950/40 text-blue-400 border border-blue-500/30">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-emerald-400 font-mono">Present Students</span>
                    <p className="text-2xl font-extrabold text-[#22C55E]">
                      {presentCount} <span className="text-sm font-normal">({attendancePercent}%)</span>
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-950/40 text-[#22C55E] border border-emerald-500/30">
                    <UserCheck className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-rose-400 font-mono">Absent Students</span>
                    <p className="text-2xl font-extrabold text-[#EF4444]">{absentCount}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-950/40 text-[#EF4444] border border-rose-500/30">
                    <UserX className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* PRESENT AND ABSENT LISTS SIDE BY SIDE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Present Students Column */}
                <div className="p-5 rounded-xl bg-[#111318] border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#27272A]">
                    <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                      Present Students ({presentList.length})
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                      VERIFIED
                    </span>
                  </div>

                  <div className="overflow-y-auto max-h-[360px] space-y-2 pr-1">
                    {presentList.map((r, idx) => (
                      <div
                        key={r.id}
                        className="p-3 rounded-xl bg-[#18181B] border border-emerald-500/20 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-cyan-400">{r.student.rollNumber}</span>
                            <span className="text-xs font-semibold text-white">{r.student.name}</span>
                          </div>
                          <span className="text-[10px] text-[#9CA3AF] font-mono">
                            {r.verificationMethod === 'FACE_AI' ? '⚡ AI Facial Match' : r.verificationMethod === 'RFID_NFC' ? '💳 RFID Card' : '✍️ Manual Call'}
                            {r.markedAt && ` • ${new Date(r.markedAt).toLocaleTimeString()}`}
                          </span>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/70 text-[#22C55E] border border-emerald-500/40">
                          {r.status}
                        </span>
                      </div>
                    ))}

                    {presentList.length === 0 && (
                      <p className="text-xs text-[#9CA3AF] italic text-center py-6">
                        No students marked present yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* Absent Students Column */}
                <div className="p-5 rounded-xl bg-[#111318] border border-rose-500/30 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#27272A]">
                    <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-[#EF4444]" />
                      Absent Students ({absentList.length})
                    </h3>
                    <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
                      NOT RECORDED
                    </span>
                  </div>

                  <div className="overflow-y-auto max-h-[360px] space-y-2 pr-1">
                    {absentList.map((r) => (
                      <div
                        key={r.id}
                        className="p-3 rounded-xl bg-[#18181B] border border-rose-500/20 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-rose-400">{r.student.rollNumber}</span>
                            <span className="text-xs font-semibold text-white">{r.student.name}</span>
                          </div>
                          <span className="text-[10px] text-[#9CA3AF] font-mono">{r.student.email}</span>
                        </div>

                        <button
                          onClick={() => updateStudentRecord(r.studentId, 'PRESENT', 'MANUAL', 'Late arrival marked by faculty', false)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold transition cursor-pointer"
                          title="Mark late arrival as present"
                        >
                          Mark Present
                        </button>
                      </div>
                    ))}

                    {absentList.length === 0 && (
                      <p className="text-xs text-emerald-400 font-medium text-center py-6">
                        🎉 Perfect attendance! All enrolled students are present.
                      </p>
                    )}
                  </div>
                </div>

              </div>

              {/* Bottom Finalize Button */}
              <div className="pt-4 border-t border-[#27272A] flex items-center justify-between">
                <p className="text-xs text-[#9CA3AF]">
                  Locking the session will persist these final records and sync student dashboard statistics.
                </p>

                <button
                  onClick={handleFinalizeSession}
                  className="px-6 py-2.5 rounded-xl bg-[#22C55E] hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Finalize Attendance Session</span>
                </button>
              </div>
            </motion.div>
          ) : (
            /* LIVE ATTENDANCE INTERACTIVE SESSION VIEW */
            <div className="space-y-6">

              {/* PROMINENT SEQUENTIAL CALLING HUD CARD */}
              <div className="p-5 rounded-2xl bg-[#18181B] border-2 border-blue-500/40 bg-gradient-to-r from-blue-950/20 via-[#18181B] to-cyan-950/20 shadow-xl shadow-black/40">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Current Student Calling Details */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-950 text-cyan-300 border border-cyan-500/40">
                        ROLL-CALL QUEUE: #{currentStudentIndex + 1} OF {sortedRecords.length}
                      </span>
                      <span className="text-xs text-[#9CA3AF] font-mono">
                        (Order: {sortBy === 'ROLL_NUMBER' ? 'Roll Number' : 'Alphabetical'})
                      </span>
                    </div>

                    {currentStudent ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-lg sm:text-2xl font-mono font-extrabold text-[#22D3EE]">
                          {currentStudent.student.rollNumber}
                        </span>
                        <span className="text-base sm:text-xl font-bold text-white">
                          {currentStudent.student.name}
                        </span>

                        <span
                          className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                            currentStudent.status === 'PRESENT'
                              ? 'bg-emerald-500/20 text-[#22C55E] border border-emerald-500/40'
                              : 'bg-rose-500/20 text-[#EF4444] border border-rose-500/40'
                          }`}
                        >
                          {currentStudent.status}
                        </span>

                        {nextStudent && (
                          <span className="text-xs font-mono text-[#9CA3AF] hidden lg:inline">
                            • Up Next: <strong className="text-slate-300">{nextStudent.student.rollNumber} ({nextStudent.student.name})</strong>
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-slate-300">
                        No students in queue.
                      </p>
                    )}
                  </div>

                  {/* One-Touch Quick Advance Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setCurrentStudentIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentStudentIndex === 0}
                      className="px-3 py-2 rounded-xl bg-[#111318] hover:bg-[#27272A] border border-[#27272A] text-xs font-semibold text-[#9CA3AF] hover:text-white transition cursor-pointer disabled:opacity-40"
                      title="Previous student (Left Arrow)"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => markCurrentStudent('PRESENT')}
                      disabled={!currentStudent}
                      className="px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition cursor-pointer active:scale-98"
                      title="Mark Present & Advance (Enter or P)"
                    >
                      <Check className="w-4 h-4" />
                      <span>Present & Next →</span>
                    </button>

                    <button
                      onClick={() => markCurrentStudent('ABSENT')}
                      disabled={!currentStudent}
                      className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                      title="Mark Absent & Advance (A)"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Absent & Next</span>
                    </button>

                    <button
                      onClick={advanceToNext}
                      className="px-3.5 py-2 rounded-xl bg-[#111318] hover:bg-[#27272A] border border-[#27272A] text-xs font-semibold text-cyan-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
                      title="Skip / Move to Next (Right Arrow)"
                    >
                      <span>Skip</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 2-Column Layout: Camera Viewport + Interactive Roster */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: AI Camera Viewport & RFID Station (5 Cols) */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* AI Facial Recognition Camera Viewport */}
                  <div
                    className={`p-5 rounded-2xl bg-[#18181B] border transition-all duration-300 space-y-4 shadow-xl shadow-black/40 ${
                      aiStatus === 'MATCHED'
                        ? 'border-emerald-500 shadow-[0_0_24px_rgba(34,197,94,0.25)]'
                        : aiStatus === 'FAILED'
                        ? 'border-rose-500 shadow-[0_0_24px_rgba(239,68,68,0.25)]'
                        : 'border-[#27272A]'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
                      <div className="flex items-center space-x-2">
                        <div className="p-1 rounded bg-cyan-950/60 border border-cyan-500/30 text-[#22D3EE]">
                          <Cpu className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                            AI Biometric Face Scanner
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          </h3>
                          <p className="text-[10px] text-[#9CA3AF] font-mono">Auto-advances when student face matches</p>
                        </div>
                      </div>

                      <button
                        onClick={isCameraActive ? stopCamera : startCamera}
                        className="px-2.5 py-1 rounded-lg bg-[#111318] hover:bg-[#27272A] border border-[#27272A] text-[11px] font-medium text-[#9CA3AF] hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        {isCameraActive ? <VideoOff className="w-3 h-3 text-rose-400" /> : <Video className="w-3 h-3 text-cyan-400" />}
                        <span>{isCameraActive ? 'Disable Cam' : 'Enable Cam'}</span>
                      </button>
                    </div>

                    {/* Video Screen with Cyan Scanning Visual */}
                    <div className="relative aspect-video rounded-xl bg-[#09090B] border border-[#27272A] overflow-hidden flex items-center justify-center group">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
                      />

                      {!isCameraActive && (
                        <div className="text-center p-6 space-y-2">
                          <div className="w-12 h-12 rounded-2xl bg-[#111318] border border-[#27272A] flex items-center justify-center mx-auto text-[#9CA3AF]">
                            <VideoOff className="w-6 h-6" />
                          </div>
                          <p className="text-xs text-[#9CA3AF]">Webcam currently inactive</p>
                          <button
                            onClick={startCamera}
                            className="px-3.5 py-1.5 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white font-semibold text-xs cursor-pointer transition-colors shadow-md shadow-blue-500/20"
                          >
                            Activate Camera
                          </button>
                        </div>
                      )}

                      {/* Corner Reticle Brackets */}
                      {isCameraActive && (
                        <div className="absolute inset-3 pointer-events-none">
                          <div className="absolute top-0 left-0 w-4 h-4 reticle-corner-tl" />
                          <div className="absolute top-0 right-0 w-4 h-4 reticle-corner-tr" />
                          <div className="absolute bottom-0 left-0 w-4 h-4 reticle-corner-bl" />
                          <div className="absolute bottom-0 right-0 w-4 h-4 reticle-corner-br" />
                        </div>
                      )}

                      {/* Animated Sweeping Cyan Laser Scan Line */}
                      {isCameraActive && (
                        <div className="absolute left-0 right-0 h-[2px] bg-[#22D3EE] shadow-[0_0_12px_#22D3EE] animate-laser-scan opacity-80 pointer-events-none" />
                      )}

                      {/* Target Oval Reticle */}
                      {isCameraActive && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className="w-48 h-56 border border-[#22D3EE]/50 rounded-3xl animate-cyan-pulse flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-[#22D3EE] rounded-full shadow-[0_0_8px_#22D3EE]" />
                          </div>
                        </div>
                      )}

                      {/* Target Student Tag on Camera */}
                      {isCameraActive && currentStudent && (
                        <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/80 border border-[#27272A] text-[10px] font-mono text-cyan-300 backdrop-blur-sm pointer-events-none">
                          Expecting: {currentStudent.student.rollNumber}
                        </div>
                      )}
                    </div>

                    {/* Status Indicator Banner */}
                    {aiMessage && (
                      <div
                        className={`p-3 rounded-xl text-xs border flex items-center gap-2.5 transition-all ${
                          aiStatus === 'MATCHED'
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                            : aiStatus === 'OFFLINE'
                            ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                            : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                        }`}
                      >
                        {aiStatus === 'MATCHED' ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#22C55E]" />
                        ) : aiStatus === 'OFFLINE' ? (
                          <AlertTriangle className="w-4 h-4 shrink-0 text-[#F59E0B]" />
                        ) : (
                          <XCircle className="w-4 h-4 shrink-0 text-[#EF4444]" />
                        )}
                        <span className="truncate">{aiMessage}</span>
                      </div>
                    )}

                    {/* Scan Action Controls */}
                    <div className="space-y-2 pt-1">
                      <button
                        onClick={triggerAiFaceScan}
                        disabled={!isCameraActive || isAiProcessing}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#22D3EE] hover:from-blue-600 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all duration-200 cursor-pointer disabled:opacity-50 active:scale-98"
                      >
                        {isAiProcessing ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Fingerprint className="w-4 h-4 text-white" />
                            <span>Scan Face (Spacebar) & Auto-Advance</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#111318] border border-[#27272A] text-[11px] text-[#9CA3AF]">
                        <span className="font-mono">Auto-Advance to Next Student:</span>
                        <button
                          type="button"
                          onClick={() => setAutoAdvanceEnabled(!autoAdvanceEnabled)}
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold cursor-pointer transition ${
                            autoAdvanceEnabled
                              ? 'bg-emerald-500/20 text-[#22C55E] border border-emerald-500/40'
                              : 'bg-[#18181B] text-[#9CA3AF] border border-[#27272A]'
                          }`}
                        >
                          {autoAdvanceEnabled ? 'ENABLED' : 'PAUSED'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* RFID / NFC Card Tap Section */}
                  <div className="p-5 rounded-2xl bg-[#18181B] border border-[#27272A] shadow-xl shadow-black/40 space-y-3.5">
                    <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
                      <div className="flex items-center space-x-2">
                        <div className="p-1 rounded bg-blue-950/60 border border-blue-500/30 text-blue-400">
                          <CreditCard className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            RFID / NFC Card Reader
                            <Wifi className="w-3 h-3 text-[#22D3EE] animate-pulse" />
                          </h4>
                          <p className="text-[10px] text-[#9CA3AF] font-mono">Tap student ID card to auto-advance</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRfidCardTap()}
                        disabled={isNfcScanning || records.length === 0}
                        className="px-3 py-1 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-semibold text-[11px] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                      >
                        {isNfcScanning ? (
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                        <span>Simulate Tap</span>
                      </button>
                    </div>

                    {lastNfcVerification && (
                      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                            Card Verified & Recorded
                          </span>
                          <span className="font-mono text-[10px] text-emerald-400">
                            {lastNfcVerification.timestamp}
                          </span>
                        </div>
                        <p className="text-[#F9FAFB] font-semibold text-xs">
                          {lastNfcVerification.studentName} ({lastNfcVerification.rollNumber})
                        </p>
                      </div>
                    )}
                  </div>

                </div>

                {/* Right Column: Live Interactive Class Roster (7 Cols) */}
                <div className="lg:col-span-7 p-6 rounded-2xl bg-[#18181B] border border-[#27272A] space-y-4 shadow-xl shadow-black/40 flex flex-col justify-between">
                  <div>
                    {/* Header Controls: Sort Order Toggle & Bulk Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#27272A]">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <h3 className="text-sm font-bold text-white">Class Roster ({sortedRecords.length})</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Sort Order Selector */}
                        <div className="flex items-center bg-[#111318] p-0.5 rounded-lg border border-[#27272A]">
                          <button
                            type="button"
                            onClick={() => {
                              setSortBy('ROLL_NUMBER');
                              setCurrentStudentIndex(0);
                            }}
                            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition cursor-pointer flex items-center gap-1 ${
                              sortBy === 'ROLL_NUMBER'
                                ? 'bg-[#3B82F6] text-white shadow'
                                : 'text-[#9CA3AF] hover:text-white'
                            }`}
                            title="Order by Roll Number"
                          >
                            <ListOrdered className="w-3 h-3" />
                            <span>Roll No</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSortBy('ALPHABETICAL');
                              setCurrentStudentIndex(0);
                            }}
                            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition cursor-pointer flex items-center gap-1 ${
                              sortBy === 'ALPHABETICAL'
                                ? 'bg-[#3B82F6] text-white shadow'
                                : 'text-[#9CA3AF] hover:text-white'
                            }`}
                            title="Order Alphabetically by Name"
                          >
                            <SortAsc className="w-3 h-3" />
                            <span>A-Z</span>
                          </button>
                        </div>

                        {/* Bulk Buttons */}
                        <button
                          onClick={() => handleBulkMark('PRESENT')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold transition cursor-pointer"
                        >
                          All Present
                        </button>
                        <button
                          onClick={() => handleBulkMark('ABSENT')}
                          className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-[10px] font-semibold transition cursor-pointer"
                        >
                          All Absent
                        </button>
                      </div>
                    </div>

                    {/* Search & Fallback Indicator */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-2.5 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Filter student name or roll..."
                          value={searchRoster}
                          onChange={(e) => setSearchRoster(e.target.value)}
                          className="w-full bg-[#111318] border border-[#27272A] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#F9FAFB] placeholder:text-[#9CA3AF]/60 focus:outline-none focus:border-[#3B82F6]"
                        />
                      </div>

                      <div className="p-2 rounded-xl bg-[#111318] border border-[#27272A] text-[10px] text-[#9CA3AF] flex items-center justify-between">
                        <span>Click student to jump focus</span>
                        <button
                          onClick={() => setShowCompletionReport(true)}
                          className="text-[#22D3EE] hover:underline font-semibold flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Report</span>
                        </button>
                      </div>
                    </div>

                    {/* Scrollable Roster Table */}
                    <div className="flex-1 overflow-y-auto max-h-[460px] pr-1 space-y-2 mt-3">
                      {filteredRecords.map((r, idx) => {
                        const isCurrentInQueue = sortedRecords[currentStudentIndex]?.studentId === r.studentId;

                        return (
                          <div
                            key={r.id}
                            onClick={() => {
                              const foundIdx = sortedRecords.findIndex((sr) => sr.studentId === r.studentId);
                              if (foundIdx !== -1) setCurrentStudentIndex(foundIdx);
                            }}
                            className={`p-3 rounded-xl border transition-all duration-200 flex items-center justify-between cursor-pointer ${
                              isCurrentInQueue
                                ? 'bg-blue-950/40 border-cyan-400 ring-1 ring-cyan-500 shadow-md'
                                : 'bg-[#111318] border-[#27272A] hover:border-blue-500/30'
                            }`}
                          >
                            <div className="overflow-hidden">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-xs font-bold text-cyan-400">{r.student.rollNumber}</span>
                                <span className="font-semibold text-xs text-white truncate max-w-[150px]">{r.student.name}</span>

                                {isCurrentInQueue && (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-cyan-400 text-black animate-pulse">
                                    CURRENT
                                  </span>
                                )}

                                {r.verificationMethod === 'FACE_AI' && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-950/60 text-[#22C55E] border border-emerald-500/30">
                                    AI VERIFIED
                                  </span>
                                )}
                                {r.verificationMethod === 'RFID_NFC' && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-950/60 text-[#22D3EE] border border-cyan-500/30">
                                    RFID TAP
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-[#9CA3AF] font-mono">
                                {r.student.email}
                                {r.markedAt && ` • ${new Date(r.markedAt).toLocaleTimeString()}`}
                              </span>
                            </div>

                            {/* Status Toggle Buttons: P, A, L, E */}
                            <div className="flex items-center space-x-1.5 text-xs" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => updateStudentRecord(r.studentId, 'PRESENT', 'MANUAL', 'Manual verification', true)}
                                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                                  r.status === 'PRESENT'
                                    ? 'bg-[#22C55E] text-white shadow-md shadow-emerald-500/30'
                                    : 'bg-[#18181B] text-[#9CA3AF] hover:text-white border border-[#27272A]'
                                }`}
                                title="Mark Present and Advance"
                              >
                                P
                              </button>

                              <button
                                onClick={() => updateStudentRecord(r.studentId, 'ABSENT', 'MANUAL', 'Manual verification', true)}
                                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                                  r.status === 'ABSENT'
                                    ? 'bg-[#EF4444] text-white shadow-md shadow-rose-500/30'
                                    : 'bg-[#18181B] text-[#9CA3AF] hover:text-white border border-[#27272A]'
                                }`}
                                title="Mark Absent and Advance"
                              >
                                A
                              </button>

                              <button
                                onClick={() => updateStudentRecord(r.studentId, 'LATE', 'MANUAL', 'Manual verification', true)}
                                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                                  r.status === 'LATE'
                                    ? 'bg-[#F59E0B] text-white shadow-md shadow-amber-500/30'
                                    : 'bg-[#18181B] text-[#9CA3AF] hover:text-white border border-[#27272A]'
                                }`}
                                title="Mark Late and Advance"
                              >
                                L
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {filteredRecords.length === 0 && (
                        <div className="p-8 text-center text-[#9CA3AF] italic text-xs">
                          {records.length === 0
                            ? 'No enrolled students found in this class section. Please register students at /register.'
                            : 'No students matching search filter.'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      ) : (
        /* NO ACTIVE SESSION: 1-CLICK TIMETABLE LAUNCH COMMAND */
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#18181B] border border-[#27272A] space-y-4 shadow-xl shadow-black/40">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#22D3EE]" />
                  <h2 className="text-base font-bold text-white">
                    Today's Scheduled Lectures ({todayDay} • BCA AIML B)
                  </h2>
                </div>
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  Click <strong>"Start Live Class"</strong> on any lecture to launch facial recognition and roll-call instantly.
                </p>
              </div>

              <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-blue-950/60 text-cyan-400 border border-cyan-500/30">
                {todaySlots.length} Classes Today
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {todaySlots.map((slot) => (
                <div
                  key={slot.id}
                  className="p-5 rounded-2xl bg-[#111318] border border-[#27272A] hover:border-blue-500/50 transition-all duration-200 space-y-3 flex flex-col justify-between group shadow-lg"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                        {slot.course.code}
                      </span>
                      <span className="text-[11px] font-mono text-[#9CA3AF] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#9CA3AF]" />
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                      {slot.course.name}
                    </h3>

                    <div className="flex items-center justify-between text-xs text-[#9CA3AF] pt-2 border-t border-[#27272A]">
                      <span className="font-semibold text-slate-300">{slot.classSection.fullLabel}</span>
                      <span className="flex items-center gap-1 text-[11px] text-[#9CA3AF] font-mono">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        {slot.roomNumber}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      handleDirectStartClass(
                        slot.classSectionId,
                        slot.courseId,
                        slot.course.name
                      )
                    }
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl bg-[#3B82F6] hover:bg-blue-600 active:scale-98 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center space-x-1.5 transition-all duration-200 cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current text-cyan-200" />
                    <span>Start Live Class Now</span>
                  </button>
                </div>
              ))}

              {todaySlots.length === 0 && (
                <div className="col-span-full p-8 text-center bg-[#111318] rounded-xl border border-[#27272A] text-[#9CA3AF] text-xs italic">
                  No classes scheduled on the weekly timetable for {todayDay}. Use the manual selector above or choose another day below.
                </div>
              )}
            </div>
          </div>

          {/* Full Week Schedule Reference */}
          <div className="p-6 rounded-2xl bg-[#18181B] border border-[#27272A] space-y-4 shadow-xl shadow-black/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Full Weekly Timetable Reference (BCA AIML B)</h3>
              </div>
              <span className="text-[11px] text-[#9CA3AF] font-mono">Department of Computer Science</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => {
                const daySlots = timetableSlots.filter(
                  (s) => s.dayOfWeek.toLowerCase() === day.toLowerCase()
                );
                const isToday = day.toLowerCase() === todayDay.toLowerCase();
                return (
                  <div
                    key={day}
                    className={`p-4 rounded-xl border transition-all ${
                      isToday
                        ? 'bg-blue-950/20 border-cyan-500/40'
                        : 'bg-[#111318] border-[#27272A]'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#27272A] mb-2">
                      <span className={`text-xs font-bold ${isToday ? 'text-cyan-400' : 'text-[#F9FAFB]'}`}>
                        {day} {isToday && '(Today)'}
                      </span>
                      <span className="text-[10px] font-mono text-[#9CA3AF]">
                        {daySlots.length} Lectures
                      </span>
                    </div>

                    <div className="space-y-2">
                      {daySlots.map((s) => (
                        <div
                          key={s.id}
                          className="p-2 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-blue-400 text-[11px]">{s.course.code}</span>
                              <span className="text-slate-200 font-medium truncate max-w-[120px]">{s.course.name}</span>
                            </div>
                            <span className="text-[10px] text-[#9CA3AF] font-mono">
                              {s.startTime} - {s.endTime} • {s.roomNumber}
                            </span>
                          </div>

                          <button
                            onClick={() =>
                              handleDirectStartClass(
                                s.classSectionId,
                                s.courseId,
                                s.course.name
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-[10px] font-bold transition cursor-pointer"
                            title="Start lecture"
                          >
                            Launch
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
