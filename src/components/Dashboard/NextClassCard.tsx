'use client';

import React, { useState, useEffect } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { FacultyVerificationModal } from '@/components/Faculty/FacultyVerificationModal';
import { TimetableSlot, ClassSessionStatus } from '@/types';
import { Clock, MapPin, Play, Sparkles, Calendar, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, Radio, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export const NextClassCard: React.FC = () => {
  const {
    timetable,
    startSession,
    activeSession,
    selectedCourse,
    selectedSemester,
    selectedSection,
    cancellations,
    teachingAssignments,
    students,
    subjectEnrollments,
    setActiveTab,
  } = useAttendance();
  const { isAdmin } = useAuth();

  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [currentSlot, setCurrentSlot] = useState<TimetableSlot | null>(null);
  const [calculatedStatus, setCalculatedStatus] = useState<ClassSessionStatus>('READY');
  const [countdownMinutes, setCountdownMinutes] = useState(12);

  // Teaching Assignment & Eligible Students Count
  const currentAssignment = currentSlot
    ? teachingAssignments.find(
        ta =>
          ta.subjectCode === currentSlot.subjectCode &&
          ta.semesterNumber === currentSlot.semester &&
          (ta.fullClassLabel.includes(currentSlot.section) || ta.sectionId.includes(currentSlot.section))
      )
    : null;

  let eligibleCount = 60;
  if (currentAssignment && currentAssignment.subgroupFilter) {
    const enrolledIds = new Set(
      subjectEnrollments
        .filter(se => se.subgroupLabel?.toLowerCase() === currentAssignment.subgroupFilter?.toLowerCase() && se.status === 'ACTIVE')
        .map(se => se.studentId)
    );
    eligibleCount = students.filter(s => enrolledIds.has(s.id)).length;
  } else {
    const exactClass = students.filter(s => s.semester === selectedSemester && s.section === selectedSection);
    eligibleCount = exactClass.length > 0 ? exactClass.length : 60;
  }

  // Dynamic Class Calculation based on Time & Day
  useEffect(() => {
    const days: ('Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday')[] = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ];
    const todayName = days[new Date().getDay()];

    const todaySlots = timetable.filter(
      s => (s.day === todayName || s.day === 'Monday' || s.day === 'Thursday') &&
           s.course === selectedCourse &&
           s.semester === selectedSemester &&
           s.section === selectedSection
    );

    const slot = todaySlots[0] || timetable[0] || {
      id: 'SLOT-DEFAULT',
      facultyId: 'FAC-101',
      facultyName: 'Dr. Alan Turing',
      subjectCode: 'CS301',
      subjectName: 'Database Management Systems',
      course: 'BCA AIML',
      department: 'Computer Science',
      semester: 3,
      section: 'A',
      classroom: 'Room 201',
      day: 'Thursday',
      startTime: '10:00 AM',
      endTime: '11:00 AM',
    };

    setCurrentSlot(slot);

    // Check Cancellation Exception
    const isCancelled = cancellations.some(c => c.subjectCode === slot.subjectCode);
    if (isCancelled) {
      setCalculatedStatus('CANCELLED');
    } else if (activeSession) {
      setCalculatedStatus('LIVE');
    } else {
      setCalculatedStatus('READY');
    }
  }, [timetable, selectedCourse, selectedSemester, selectedSection, activeSession, cancellations]);

  const handleOpenVerification = () => {
    setIsVerificationModalOpen(true);
  };

  const handleVerificationSuccess = () => {
    if (currentSlot) {
      startSession(currentSlot.subjectCode, currentSlot.department, currentSlot.semester, currentSlot.section, currentSlot.classroom);
    }
  };

  if (!currentSlot) return null;

  const isLive = calculatedStatus === 'LIVE';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-8 rounded-3xl relative overflow-hidden transition-all border shadow-2xl ${
          isLive
            ? 'bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 border-rose-500/40'
            : 'bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border-indigo-500/40'
        }`}
      >
        {/* Glow */}
        <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
          isLive ? 'bg-rose-500/15' : 'bg-indigo-500/15'
        }`} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          
          <div className="space-y-3">
            {/* Status Header Pill */}
            <div className="flex items-center space-x-3">
              <span className={`px-3.5 py-1 rounded-full text-xs font-mono font-extrabold uppercase tracking-wider flex items-center space-x-1.5 ${
                isLive
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                  : calculatedStatus === 'CANCELLED'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              }`}>
                {isLive ? <Radio className="w-3.5 h-3.5 text-rose-400" /> : <Clock className="w-3.5 h-3.5 text-indigo-400" />}
                <span>{isLive ? '🔴 LIVE CLASS' : 'UPCOMING CLASS'}</span>
              </span>

              {!isLive && calculatedStatus !== 'CANCELLED' && (
                <span className="text-xs font-mono text-amber-300 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  Status: Starts in {countdownMinutes} minutes
                </span>
              )}
            </div>

            {/* Class Title & Section */}
            <div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                {currentSlot.course || 'BCA AIML'} {currentSlot.semester} — {currentSlot.subjectName}
                <Sparkles className="w-6 h-6 text-amber-400" />
              </h2>
              <p className="text-xs text-indigo-300 font-mono font-bold mt-1">
                Subject Code: {currentSlot.subjectCode} • Section {currentSlot.section}
              </p>
            </div>

            {/* Details Pills */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
              <span className="flex items-center space-x-1.5 font-mono font-bold text-slate-200">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>{currentSlot.startTime} — {currentSlot.endTime}</span>
              </span>

              <span className="flex items-center space-x-1.5 font-bold text-purple-300">
                <MapPin className="w-4 h-4 text-purple-400" />
                <span>{currentSlot.classroom || 'Room 201'}</span>
              </span>

              <span className="text-slate-400">
                Faculty: <strong className="text-slate-200">{currentSlot.facultyName || 'Dr. Alan Turing'}</strong>
              </span>

              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-bold text-xs">
                Eligible Roster: {eligibleCount} Students
              </span>

              {currentAssignment?.subgroupFilter && (
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full font-bold text-xs">
                  Language/Elective Group: {currentAssignment.subgroupFilter}
                </span>
              )}
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {isAdmin ? (
              <button
                onClick={() => setActiveTab('attendance')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-extrabold text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 text-indigo-300 shadow-xl flex items-center justify-center space-x-2 transition-all"
              >
                <Eye className="w-4 h-4 text-indigo-400" />
                <span>Attendance Monitoring (View Only)</span>
              </button>
            ) : (
              calculatedStatus !== 'CANCELLED' && (
                <button
                  onClick={handleOpenVerification}
                  disabled={isLive}
                  className={`w-full sm:w-auto px-7 py-4 rounded-2xl font-extrabold text-xs shadow-2xl flex items-center justify-center space-x-2 transition-all transform active:scale-95 disabled:opacity-60 ${
                    isLive
                      ? 'bg-rose-600 text-white shadow-rose-600/30'
                      : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-indigo-600/30'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>{isLive ? '🔴 LIVE CLASS IN PROGRESS' : '[ START CLASS ]'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )
            )}

            {calculatedStatus === 'CANCELLED' && (
              <span className="px-5 py-3 rounded-2xl bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/30">
                Class Session Cancelled
              </span>
            )}
          </div>

        </div>
      </motion.div>

      {/* Faculty Verification Modal */}
      <FacultyVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        onVerifiedSuccess={handleVerificationSuccess}
        targetClassName={`${currentSlot.course || 'BCA AIML'} Sem ${currentSlot.semester} Sec ${currentSlot.section}`}
        subjectName={`${currentSlot.subjectName} (${currentSlot.subjectCode})`}
      />
    </>
  );
};
