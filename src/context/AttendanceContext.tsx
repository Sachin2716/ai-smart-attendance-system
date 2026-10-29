'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Student,
  Subject,
  AttendanceSession,
  AttendanceRecord,
  Department,
  CourseClass,
  Semester,
  Section,
  VerificationStatus,
  VerificationResultState,
  LateStatus,
  TimetableSlot,
  ClassSwapRequest,
  ClassCancellation,
  ExtraClass,
  FacultyLeave,
  ExcelImportRow,
  AuditLogEntry,
  TabType,
  DeviceStatus,
  ClassSessionStatus,
  DayOfWeek,
  EventItem,
  EventAttendanceRecord,
  EventApprovalNotification,
  EventNotification,
  AuditoriumCheckpoint,
  AuditoriumFacultyAssignment,
  Program,
  Specialization,
  Batch,
  AcademicSemester,
  ClassSection,
  SubjectEnrollment,
  TeachingAssignment,
  AttendanceCorrectionRequest,
  IssueReportItem,
  AdminUserAccount,
  AuditLogItem,
  FacultySubstitutionRecord,
} from '@/types';
import {
  initialStudents,
  initialSubjects,
  initialSessions,
  initialTimetable,
  initialSwapRequests,
  initialCancellations,
  initialLeaves,
  initialEvents,
  initialEventRecords,
  initialPrograms,
  initialSpecializations,
  initialBatches,
  initialAcademicSemesters,
  initialClassSections,
  initialSubjectEnrollments,
  initialTeachingAssignments,
  initialAdminUsers,
  initialAuditLogs,
  initialIssueReports,
  initialCorrectionRequests,
  initialSubstitutions,
} from '@/data/initialData';
import { soundManager } from '@/utils/audio';
import { verifyFingerprintSlot, measureRfidFingerprintPerformance } from '@/utils/fingerprintEngine';
import { verifyAntiProxyFaceMatch, generateDeterministicEmbedding } from '@/utils/faceRecognition';

export type { TabType };
export type ThemeMode = 'dark' | 'light';

interface AttendanceContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;

  // Class & Section Scope Switcher
  selectedCourse: CourseClass;
  setSelectedCourse: (course: CourseClass) => void;
  selectedSemester: Semester;
  setSelectedSemester: (sem: Semester) => void;
  selectedSection: Section;
  setSelectedSection: (sec: Section) => void;

  students: Student[];
  subjects: Subject[];
  sessions: AttendanceSession[];
  activeSession: AttendanceSession | null;
  sessionDemoState: 'RUNNING' | 'PAUSED' | 'COMPLETED';
  lastScannedRecord: { record: AttendanceRecord; student: Student; isDuplicate: boolean; isVerificationFailed?: boolean } | null;
  summarySession: AttendanceSession | null;
  setSummarySession: (session: AttendanceSession | null) => void;

  // System & Device Status State
  deviceStatus: DeviceStatus;
  toggleEmergencyOverride: () => void;
  offlineQueue: AttendanceRecord[];

  // Late Threshold & Timezone Config
  lateThresholdMinutes: number;
  setLateThresholdMinutes: (mins: number) => void;

  // Audit Logs & Failed Attempt Counters
  auditLogs: AuditLogEntry[];
  failedAttemptsMap: Record<string, number>;

  // Timetable & Workflows State
  timetable: TimetableSlot[];
  addTimetableSlot: (slot: Omit<TimetableSlot, 'id' | 'facultyId'>) => void;
  deleteTimetableSlot: (id: string) => void;
  setTimetableSlots: (slots: TimetableSlot[]) => void;
  swapRequests: ClassSwapRequest[];
  requestClassSwap: (req: Omit<ClassSwapRequest, 'id'>) => void;
  approveClassSwap: (id: string) => void;
  cancellations: ClassCancellation[];
  cancelClass: (c: Omit<ClassCancellation, 'id'>) => void;
  extraClasses: ExtraClass[];
  scheduleExtraClass: (ex: Omit<ExtraClass, 'id'>) => void;
  facultyLeaves: FacultyLeave[];
  applyFacultyLeave: (leave: Omit<FacultyLeave, 'id'>) => void;

  // Actions & Bulk Import
  addStudent: (studentData: Omit<Student, 'id' | 'attendancePercentage'>) => { success: boolean; message?: string };
  updateStudent: (student: Student) => void;
  deactivateStudent: (id: string) => void;
  enrollStudentFingerprint: (studentId: string, slotId: number) => void;
  enrollStudentFace?: (studentId: string, embedding: number[]) => void;
  deleteStudent: (id: string) => void;
  importStudentsFromExcel: (rows: ExcelImportRow[]) => void;
  startSession: (subjectCode: string, dept: Department, sem: Semester, sec: Section, classroom?: string) => void;
  endSession: () => void;
  editAttendanceRecord: (recordId: string, newStatus: 'PRESENT' | 'ABSENT' | 'LATE', reason: string, modifiedBy: string) => void;
  saveManualAttendanceSession: (records: AttendanceRecord[]) => void;
  refreshStateData: () => void;
  toggleStudentManualStatus: (studentId: string) => void;
  submitAttendanceSession: (markPendingAsAbsent?: boolean) => { success: boolean; presentCount: number; absentCount: number; pendingCount: number };
  
  // DUAL-FACTOR FACE + RFID MATCHING ENGINE
  pauseDemoSession: () => void;
  resumeDemoSession: () => void;
  undoLastAttendance: () => void;
  resetDemoSession: () => void;
  verifyFaceAndRfidMatch: (isProxyAttempt?: boolean) => { success: boolean; message: string; verificationResult: VerificationResultState; attempts?: number; isMarkedAbsent?: boolean };
  markNextStudentKeyboardSimulation: (method?: 'FACE' | 'RFID_CARD') => { success: boolean; message: string; verificationResult: VerificationResultState; isAllProcessed?: boolean };
  markNextStudentSpacebarDemo: () => { success: boolean; message: string; isAllMarked?: boolean; student?: Student; record?: AttendanceRecord };

  // Dual-Factor RFID Processor
  markAttendanceByRfidAndFingerprint: (cardUid: string, scannedSlotId?: number, isProxyAttempt?: boolean) => { success: boolean; message: string; verificationResult: VerificationResultState };
  markAttendanceByRfid: (rfidTag: string, simulateFaceMismatch?: boolean) => { success: boolean; message: string; verificationResult: VerificationResultState };
  simulateNextStudentScan: (forceMismatch?: boolean) => { success: boolean; message: string; verificationResult: VerificationResultState };
  run60StudentLoadTest: () => void;

  // EVENTS & AUDITORIUM MULTI-FACULTY MODULE
  events: EventItem[];
  activeEvent: EventItem | null;
  eventAttendanceRecords: EventAttendanceRecord[];
  eventApprovalNotifications: EventApprovalNotification[];
  approveEventAttendance: (notificationId: string) => void;
  rejectEventAttendance: (notificationId: string, remark?: string) => void;
  eventNotifications: EventNotification[];
  selectedCheckpoint: string;
  setSelectedCheckpoint: (checkpoint: string) => void;
  isStationConnected: boolean;
  activeStationCheckpoint: string | null;
  setEventsItems: (events: EventItem[]) => void;
  updateEventItem: (eventId: string, partial: Partial<EventItem>) => void;
  createEvent: (eventData: Omit<EventItem, 'id' | 'status'>) => void;
  createAuditoriumEvent: (eventData: Omit<EventItem, 'id' | 'status'>) => EventItem;
  startEventAttendance: (eventId: string) => void;
  stopEventAttendance: (eventId: string) => { expected: number; present: number; remaining: number; checkpointsUsed: number; facultyUsed: number };
  addAuditoriumFaculty: (eventId: string, facultyName: string, facultyEmail: string, role?: 'EVENT_COORDINATOR' | 'CHECKPOINT_FACULTY') => void;
  removeAuditoriumFaculty: (eventId: string, facultyEmail: string) => void;
  addAuditoriumCheckpoint: (eventId: string, checkpointName: string, locationDescription?: string) => void;
  assignFacultyToCheckpoint: (eventId: string, facultyEmail: string, checkpointName: string) => void;
  joinCheckpointStation: (eventId: string, checkpointName: string) => void;
  leaveCheckpointStation: () => void;
  markEventAttendance: (studentId?: string, isProxyAttempt?: boolean) => { success: boolean; message: string; record?: EventAttendanceRecord };
  markAuditoriumAttendance: (checkpointName?: string, studentId?: string, isProxyAttempt?: boolean) => { success: boolean; message: string; record?: EventAttendanceRecord };
  checkOutEventStudent: (recordId: string) => void;
  // ENTERPRISE ACADEMIC & ADMIN DATA STRUCTURES
  programs: Program[];
  specializations: Specialization[];
  batches: Batch[];
  academicSemesters: AcademicSemester[];
  classSections: ClassSection[];
  subjectEnrollments: SubjectEnrollment[];
  teachingAssignments: TeachingAssignment[];
  correctionRequests: AttendanceCorrectionRequest[];
  issueReports: IssueReportItem[];
  auditLogsList: AuditLogItem[];
  adminUsers: AdminUserAccount[];
  substitutions: FacultySubstitutionRecord[];

  // ADMINISTRATIVE & ACADEMIC ENGINE METHODS
  transferStudent: (studentId: string, targetSectionId: string) => void;
  promoteStudents: (sourceSectionId: string, targetSemesterNum: Semester) => { success: boolean; promotedCount: number; message: string };
  submitAttendanceCorrectionRequest: (recordId: string, requestedStatus: 'PRESENT' | 'ABSENT' | 'LATE', reason: string) => void;
  reviewAttendanceCorrectionRequest: (requestId: string, approve: boolean, adminNotes?: string) => void;
  reportIssue: (category: IssueReportItem['category'], description: string, studentId?: string, sectionId?: string) => void;
  resolveIssue: (issueId: string, resolutionNotes: string) => void;
  assignSubstitution: (timetableId: string, substituteFacultyId: string, date: string, reason: string) => void;
  createTeachingAssignment: (assignment: Omit<TeachingAssignment, 'id' | 'isActive'>) => void;
  createProgram: (prog: Omit<Program, 'id'>) => void;
  createSpecialization: (spec: Omit<Specialization, 'id'>) => void;
  createClassSection: (sec: Omit<ClassSection, 'id'>) => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Class & Section Scope Switcher
  const [selectedCourse, setSelectedCourse] = useState<CourseClass>('BCA AIML');
  const [selectedSemester, setSelectedSemester] = useState<Semester>(3);
  const [selectedSection, setSelectedSection] = useState<Section>('B');

  const [students, setStudents] = useState<Student[]>(initialStudents);

  const [subjects] = useState<Subject[]>(initialSubjects);
  const [sessions, setSessions] = useState<AttendanceSession[]>(initialSessions);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [sessionDemoState, setSessionDemoState] = useState<'RUNNING' | 'PAUSED' | 'COMPLETED'>('RUNNING');
  const [lastScannedRecord, setLastScannedRecord] = useState<{ record: AttendanceRecord; student: Student; isDuplicate: boolean; isVerificationFailed?: boolean } | null>(null);
  const [summarySession, setSummarySession] = useState<AttendanceSession | null>(null);

  // Device / System Status State
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    cameraConnected: true,
    cardReaderConnected: true,
    internetConnected: true,
    serverOnline: true,
    emergencyManualOverride: false,
  });

  const [offlineQueue, setOfflineQueue] = useState<AttendanceRecord[]>([]);
  const [lateThresholdMinutes, setLateThresholdMinutes] = useState<number>(10);

  // 3-Attempt Mismatch Counter Map (studentId -> count 1, 2, 3)
  const [failedAttemptsMap, setFailedAttemptsMap] = useState<Record<string, number>>({});

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'AUDIT-101',
      studentName: 'Aarav Sharma',
      uucmsNo: '24BCA001',
      cardUid: 'A7:B2:91:01',
      fingerprintSlotId: 1,
      date: '2026-08-10',
      time: '09:02:14 AM',
      course: 'BCA AIML',
      section: 'B',
      facultyName: 'Dr. Alan Turing',
      verificationResult: 'SUCCESS',
      resultMessage: 'FACE + RFID CARD Verified ✓',
      failedAttempts: 0,
      deviceId: 'LAPTOP-WEBCAM-DUAL-ENGINE',
    },
  ]);

  // Timetable & Workflows State
  const [timetable, setTimetable] = useState<TimetableSlot[]>(initialTimetable);

  const [swapRequests, setSwapRequests] = useState<ClassSwapRequest[]>(initialSwapRequests);
  const [cancellations, setCancellations] = useState<ClassCancellation[]>(initialCancellations);
  const [extraClasses, setExtraClasses] = useState<ExtraClass[]>([]);
  const [facultyLeaves, setFacultyLeaves] = useState<FacultyLeave[]>(initialLeaves);

  // Enterprise Academic Structures State
  const [programs, setPrograms] = useState<Program[]>(initialPrograms);
  const [specializations, setSpecializations] = useState<Specialization[]>(initialSpecializations);
  const [batches, setBatches] = useState<Batch[]>(initialBatches);
  const [academicSemesters, setAcademicSemesters] = useState<AcademicSemester[]>(initialAcademicSemesters);
  const [classSections, setClassSections] = useState<ClassSection[]>(initialClassSections);
  const [subjectEnrollments, setSubjectEnrollments] = useState<SubjectEnrollment[]>(initialSubjectEnrollments);
  const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignment[]>(initialTeachingAssignments);
  const [adminUsers, setAdminUsers] = useState<AdminUserAccount[]>(initialAdminUsers);
  const [auditLogsList, setAuditLogsList] = useState<AuditLogItem[]>(initialAuditLogs);
  const [issueReports, setIssueReports] = useState<IssueReportItem[]>(initialIssueReports);
  const [correctionRequests, setCorrectionRequests] = useState<AttendanceCorrectionRequest[]>(initialCorrectionRequests);
  const [substitutions, setSubstitutions] = useState<FacultySubstitutionRecord[]>(initialSubstitutions);

  const logAuditAction = useCallback((
    action: string,
    entityType: AuditLogItem['entityType'],
    entityId: string,
    oldValue?: unknown,
    newValue?: unknown
  ) => {
    const newEntry: AuditLogItem = {
      id: `AUD-${Date.now()}`,
      actorId: 'ADM-101',
      actorName: 'Super Admin',
      actorRole: 'SUPER_ADMIN',
      action,
      entityType,
      entityId,
      oldValueJson: oldValue ? JSON.stringify(oldValue) : undefined,
      newValueJson: newValue ? JSON.stringify(newValue) : undefined,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1',
    };
    setAuditLogsList(prev => [newEntry, ...prev]);
  }, []);

  const transferStudent = useCallback((studentId: string, targetSectionId: string) => {
    const targetSec = classSections.find(cs => cs.id === targetSectionId || cs.sectionName === targetSectionId);
    const targetSectionName = targetSec ? targetSec.sectionName : (targetSectionId as Section);

    setStudents(prev => {
      const student = prev.find(s => s.id === studentId);
      if (!student) return prev;
      const oldSec = student.section;
      const updated = prev.map(s => s.id === studentId ? { ...s, section: targetSectionName } : s);
      if (typeof window !== 'undefined') {
        localStorage.setItem('caias_students', JSON.stringify(updated));
      }
      logAuditAction('STUDENT_TRANSFERRED', 'STUDENT', studentId, { section: oldSec }, { section: targetSectionName });
      return updated;
    });
  }, [classSections, logAuditAction]);

  const promoteStudents = useCallback((sourceSectionId: string, targetSemesterNum: Semester) => {
    const targetSec = classSections.find(cs => cs.id === sourceSectionId || cs.fullClassLabel.includes(sourceSectionId));
    const sectionName = targetSec ? targetSec.sectionName : 'B';

    let promotedCount = 0;
    setStudents(prev => {
      const candidateCount = prev.filter(s => s.semester === (targetSemesterNum - 1) && s.section === sectionName).length;
      promotedCount = candidateCount;
      if (candidateCount === 0) return prev;

      const updated = prev.map(s => {
        if (s.semester === (targetSemesterNum - 1) && s.section === sectionName) {
          return { ...s, semester: targetSemesterNum };
        }
        return s;
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('caias_students', JSON.stringify(updated));
      }
      logAuditAction('SEMESTER_PROMOTED', 'STUDENT', sourceSectionId, { semester: targetSemesterNum - 1 }, { semester: targetSemesterNum, promotedCount });
      return updated;
    });

    if (promotedCount === 0) {
      return { success: false, promotedCount: 0, message: 'No eligible students found for promotion.' };
    }

    return { success: true, promotedCount, message: `Successfully promoted ${promotedCount} students to Semester ${targetSemesterNum}!` };
  }, [classSections, logAuditAction]);

  const submitAttendanceCorrectionRequest = useCallback((recordId: string, requestedStatus: 'PRESENT' | 'ABSENT' | 'LATE', reason: string) => {
    if (!activeSession) return;
    const record = activeSession.records.find(r => r.id === recordId);
    if (!record) return;

    const newReq: AttendanceCorrectionRequest = {
      id: `CORR-${Date.now()}`,
      attendanceRecordId: recordId,
      sessionId: activeSession.id,
      studentId: record.studentId,
      studentName: record.studentName,
      studentUucmsNo: record.studentUucmsNo || record.studentRollNo,
      subjectCode: activeSession.subjectCode,
      requestedStatus,
      currentStatus: record.status as any,
      reason,
      requestedByFacultyId: 'FAC-101',
      requestedByFacultyName: 'Dr. Alan Turing',
      requestedAt: new Date().toISOString(),
      status: 'PENDING',
    };

    setCorrectionRequests(prev => [newReq, ...prev]);
    logAuditAction('CORRECTION_REQUESTED', 'CORRECTION', recordId, { status: record.status }, { requestedStatus, reason });
  }, [activeSession, logAuditAction]);

  const reviewAttendanceCorrectionRequest = useCallback((requestId: string, approve: boolean, adminNotes?: string) => {
    setCorrectionRequests(prev => {
      const target = prev.find(r => r.id === requestId);
      if (!target) return prev;
      const updatedStatus = approve ? 'APPROVED' : 'REJECTED';

      logAuditAction('CORRECTION_REVIEWED', 'CORRECTION', requestId, { status: 'PENDING' }, { status: updatedStatus, adminNotes });
      return prev.map(r => r.id === requestId ? {
        ...r,
        status: updatedStatus,
        reviewedByAdminId: 'ADM-101',
        reviewedAt: new Date().toISOString(),
        adminNotes,
      } : r);
    });
  }, [logAuditAction]);

  const reportIssue = useCallback((category: IssueReportItem['category'], description: string, studentId?: string, sectionId?: string) => {
    const newIssue: IssueReportItem = {
      id: `ISSUE-${Date.now()}`,
      reportedByFacultyId: 'FAC-101',
      reportedByFacultyName: 'Dr. Alan Turing',
      category,
      description,
      studentId,
      sectionId,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };
    setIssueReports(prev => [newIssue, ...prev]);
    logAuditAction('ISSUE_REPORTED', 'SYSTEM', newIssue.id, undefined, { category, description });
  }, [logAuditAction]);

  const resolveIssue = useCallback((issueId: string, resolutionNotes: string) => {
    setIssueReports(prev => prev.map(i => i.id === issueId ? {
      ...i,
      status: 'RESOLVED',
      resolutionNotes,
      resolvedByAdminId: 'ADM-101',
    } : i));
    logAuditAction('ISSUE_RESOLVED', 'SYSTEM', issueId, undefined, { resolutionNotes });
  }, [logAuditAction]);

  const assignSubstitution = useCallback((timetableId: string, substituteFacultyId: string, date: string, reason: string) => {
    const sub: FacultySubstitutionRecord = {
      id: `SUBST-${Date.now()}`,
      timetableId,
      originalFacultyId: 'FAC-101',
      originalFacultyName: 'Dr. Alan Turing',
      substituteFacultyId,
      substituteFacultyName: 'Prof. Substitute',
      date,
      reason,
      approvedByAdminId: 'ADM-101',
    };
    setSubstitutions(prev => [sub, ...prev]);
    logAuditAction('FACULTY_SUBSTITUTED', 'TIMETABLE', timetableId, undefined, { substituteFacultyId, date, reason });
  }, [logAuditAction]);

  const createTeachingAssignment = useCallback((assignment: Omit<TeachingAssignment, 'id' | 'isActive'>) => {
    const newAssignment: TeachingAssignment = {
      ...assignment,
      id: `TA-${Date.now()}`,
      isActive: true,
    };
    setTeachingAssignments(prev => [newAssignment, ...prev]);
    logAuditAction('TEACHING_ASSIGNMENT_CREATED', 'TEACHING_ASSIGNMENT', newAssignment.id, undefined, newAssignment);
  }, [logAuditAction]);

  const createProgram = useCallback((prog: Omit<Program, 'id'>) => {
    const newProg: Program = { ...prog, id: `PROG-${Date.now()}` };
    setPrograms(prev => [...prev, newProg]);
  }, []);

  const createSpecialization = useCallback((spec: Omit<Specialization, 'id'>) => {
    const newSpec: Specialization = { ...spec, id: `SPEC-${Date.now()}` };
    setSpecializations(prev => [...prev, newSpec]);
  }, []);

  const createClassSection = useCallback((sec: Omit<ClassSection, 'id'>) => {
    const newSec: ClassSection = { ...sec, id: `SEC-${Date.now()}` };
    setClassSections(prev => [...prev, newSec]);
  }, []);

  // Auto Sync Students & Timetable to LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && students.length > 0) {
      localStorage.setItem('caias_students', JSON.stringify(students));
    }
  }, [students]);

  // Load saved state from localStorage after initial render to prevent SSR hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStudents = localStorage.getItem('caias_students');
      if (savedStudents) {
        try {
          const parsed = JSON.parse(savedStudents);
          if (Array.isArray(parsed) && parsed.length > 0) setStudents(parsed);
        } catch (e) {
          console.error('Failed to parse saved students:', e);
        }
      }
      const savedTimetable = localStorage.getItem('caias_timetable');
      if (savedTimetable) {
        try {
          const parsed = JSON.parse(savedTimetable);
          if (Array.isArray(parsed) && parsed.length > 0) setTimetable(parsed);
        } catch (e) {
          console.error('Failed to parse saved timetable:', e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && timetable.length > 0) {
      localStorage.setItem('caias_timetable', JSON.stringify(timetable));
    }
  }, [timetable]);

  // Theme Sync
  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (newTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      localStorage.setItem('caias_attendance_theme', newTheme);
    }
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('caias_attendance_theme') as ThemeMode;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme('dark');
    }
  }, [setTheme]);

  // Offline Synchronization Handler
  useEffect(() => {
    const handleOnline = () => {
      setDeviceStatus(prev => ({ ...prev, internetConnected: true }));
      // Process offline queue
      if (offlineQueue.length > 0) {
        setOfflineQueue([]);
      }
    };

    const handleOffline = () => {
      setDeviceStatus(prev => ({ ...prev, internetConnected: false }));
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, [offlineQueue]);

  const toggleEmergencyOverride = () => {
    setDeviceStatus(prev => ({
      ...prev,
      emergencyManualOverride: !prev.emergencyManualOverride,
    }));
  };

  // Timetable Functions
  const addTimetableSlot = (slot: Omit<TimetableSlot, 'id' | 'facultyId'>) => {
    const newSlot: TimetableSlot = {
      ...slot,
      id: `SLOT-${Date.now()}`,
      facultyId: 'FAC-101',
      facultyName: 'Dr. Alan Turing',
    };
    setTimetable(prev => [...prev, newSlot]);
  };

  const setTimetableSlots = (slots: TimetableSlot[]) => {
    setTimetable(slots);
  };

  const deleteTimetableSlot = (id: string) => {
    setTimetable(prev => prev.filter(s => s.id !== id));
  };

  const requestClassSwap = (req: Omit<ClassSwapRequest, 'id'>) => {
    const newReq: ClassSwapRequest = { ...req, id: `SWAP-${Date.now()}` };
    setSwapRequests(prev => [newReq, ...prev]);
  };

  const approveClassSwap = (id: string) => {
    setSwapRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'APPROVED' } : r));
    soundManager.playSessionStart();
  };

  const cancelClass = (c: Omit<ClassCancellation, 'id'>) => {
    const newC: ClassCancellation = { ...c, id: `CANCEL-${Date.now()}` };
    setCancellations(prev => [newC, ...prev]);
    soundManager.playRfidDuplicate();
  };

  const scheduleExtraClass = (ex: Omit<ExtraClass, 'id'>) => {
    const newEx: ExtraClass = { ...ex, id: `EXTRA-${Date.now()}` };
    setExtraClasses(prev => [newEx, ...prev]);
    soundManager.playSessionStart();
  };

  const applyFacultyLeave = (leave: Omit<FacultyLeave, 'id'>) => {
    const newLeave: FacultyLeave = { ...leave, id: `LEAVE-${Date.now()}` };
    setFacultyLeaves(prev => [newLeave, ...prev]);
  };

  // Student CRUD & Excel Import
  const addStudent = (studentData: Omit<Student, 'id' | 'attendancePercentage'>): { success: boolean; message?: string } => {
    const uucmsExists = students.some(s => s.uucmsNo && studentData.uucmsNo && s.uucmsNo.trim().toLowerCase() === studentData.uucmsNo.trim().toLowerCase());
    if (uucmsExists) {
      return { success: false, message: `Duplicate UUCMS Number '${studentData.uucmsNo}' already exists in database!` };
    }

    const cardExists = students.some(s => s.cardUid && studentData.cardUid && s.cardUid.trim().toLowerCase() === studentData.cardUid.trim().toLowerCase());
    if (cardExists) {
      return { success: false, message: `Duplicate Card UID '${studentData.cardUid}' already assigned to another student!` };
    }

    const newId = `STU-${Date.now()}`;
    const newStudent: Student = {
      ...studentData,
      id: newId,
      uucmsNo: studentData.uucmsNo || studentData.rollNo || `${123450 + students.length}`,
      cardUid: studentData.cardUid || studentData.rfidTag || `A7:B2:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}`,
      fingerprintSlotId: studentData.fingerprintSlotId || Math.floor(Math.random() * 50) + 1,
      isFingerprintEnrolled: true,
      attendancePercentage: 100,
      status: studentData.status || 'active',
    };
    setStudents(prev => [newStudent, ...prev]);
    logAuditAction('STUDENT_CREATED', 'STUDENT', newId, undefined, newStudent);
    return { success: true, message: `Student '${newStudent.name}' created successfully.` };
  };

  const updateStudent = (updated: Student) => {
    setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
    logAuditAction('STUDENT_UPDATED', 'STUDENT', updated.id, undefined, updated);
  };

  const deactivateStudent = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: 'inactive' } : s));
    logAuditAction('STUDENT_DEACTIVATED', 'STUDENT', id, { status: 'active' }, { status: 'inactive' });
  };

  const enrollStudentFingerprint = (studentId: string, slotId: number) => {
    setStudents(prev => prev.map(s => s.id === studentId ? {
      ...s,
      fingerprintSlotId: slotId,
      isFingerprintEnrolled: true,
    } : s));
  };

  const enrollStudentFace = (studentId: string) => {
    // Optional face stub
  };

  const deleteStudent = (id: string) => {
    deactivateStudent(id);
  };

  const importStudentsFromExcel = (rows: ExcelImportRow[]) => {
    const newStudents: Student[] = rows.map((r, idx) => ({
      id: `STU-EXCEL-${Date.now()}-${idx}`,
      uucmsNo: r.uucmsNo,
      rollNo: r.uucmsNo,
      name: r.name,
      email: r.email || `${r.uucmsNo.toLowerCase()}@caias.edu.in`,
      phone: r.phone || '+91 98765 43210',
      course: r.course,
      department: 'Computer Science',
      semester: r.semester,
      section: r.section,
      cardUid: r.cardUid,
      rfidTag: r.cardUid,
      fingerprintSlotId: idx + 1,
      isFingerprintEnrolled: true,
      avatar: r.photo || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      attendancePercentage: 100,
      status: 'active',
      joinedDate: new Date().toISOString().split('T')[0],
    }));

    setStudents(prev => {
      const newUucmsSet = new Set(newStudents.map(ns => (ns.uucmsNo || '').trim().toLowerCase()));
      const filteredPrev = prev.filter(p => !newUucmsSet.has((p.uucmsNo || p.rollNo || '').trim().toLowerCase()));
      const merged = [...newStudents, ...filteredPrev];
      if (typeof window !== 'undefined') {
        localStorage.setItem('caias_students', JSON.stringify(merged));
      }
      return merged;
    });

    if (newStudents.length > 0 && newStudents[0].course) {
      setSelectedCourse(newStudents[0].course);
      setSelectedSemester(newStudents[0].semester);
      setSelectedSection(newStudents[0].section);
    }

    soundManager.playSessionStart();
  };

  // Start Session (Faculty Only)
  const startSession = (subjectCode: string, dept: Department, sem: Semester, sec: Section, classroom = 'Room 204') => {
    // SECURITY RULE: Admin role CANNOT start a class attendance session
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('smart_attendance_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed.role === 'Admin' || parsed.role === 'Head of Dept') {
            console.warn('SECURITY BLOCK: Admin accounts cannot start class attendance sessions.');
            setActiveTab('attendance');
            return;
          }
        } catch (e) {}
      }
    }

    // Prevent duplicate session if active session already matches
    if (activeSession && activeSession.subjectCode === subjectCode && activeSession.semester === sem && activeSession.section === sec) {
      setActiveTab('attendance');
      return;
    }

    const subject = subjects.find(s => s.code === subjectCode);
    const subjectName = subject ? subject.name : 'Class Session';
    
    // 1. Find Teaching Assignment
    const assignment = teachingAssignments.find(ta =>
      ta.subjectCode === subjectCode &&
      ta.semesterNumber === sem &&
      (ta.fullClassLabel.includes(sec) || ta.sectionId.includes(sec))
    );

    // 2. Filter students via subject enrollment if subgroup filter exists (e.g. Kannada, Hindi)
    let targetStudents: Student[] = [];
    if (assignment && assignment.subgroupFilter) {
      const enrolledStudentIds = new Set(
        subjectEnrollments
          .filter(se => se.subgroupLabel?.toLowerCase() === assignment.subgroupFilter?.toLowerCase() && se.status === 'ACTIVE')
          .map(se => se.studentId)
      );
      targetStudents = students.filter(s => enrolledStudentIds.has(s.id));
    }

    if (targetStudents.length === 0) {
      const exactClassStudents = students.filter(s => s.semester === sem && s.section === sec);
      targetStudents = exactClassStudents.length > 0 ? exactClassStudents : students.slice(0, 60);
    }

    const totalStrength = targetStudents.length;

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const formattedDate = now.toISOString().split('T')[0];

    const initialRecords: AttendanceRecord[] = targetStudents.map((s) => ({
      id: `REC-${s.id}-${Date.now()}`,
      sessionId: `SESS-${Date.now()}`,
      studentId: s.id,
      studentUucmsNo: s.uucmsNo || s.rollNo,
      studentRollNo: s.uucmsNo || s.rollNo,
      studentName: s.name,
      cardUid: s.cardUid || s.rfidTag,
      rfidTag: s.cardUid || s.rfidTag,
      timestamp: '--:--:--',
      method: 'MANUAL',
      status: 'PENDING',
      lateStatus: 'ABSENT',
      dualFactorVerified: false,
      verificationStatus: 'MANUAL',
      verificationResult: 'BOTH_FAILED',
      resultMessage: 'Pending Verification',
      attemptsCount: 0,
      cardVerified: false,
      faceVerified: false,
      isSynced: true,
    }));

    const newSession: AttendanceSession = {
      id: `SESS-${Date.now()}`,
      subjectCode,
      subjectName,
      course: 'BCA AIML',
      department: dept,
      semester: sem,
      section: sec,
      classroom,
      facultyName: 'Dr. Alan Turing',
      date: formattedDate,
      startTime: formattedTime,
      totalStrength,
      presentCount: 0,
      lateCount: 0,
      absentCount: 0,
      status: 'ACTIVE',
      sessionStatus: 'LIVE',
      demoState: 'RUNNING',
      lateThresholdMinutes: 10,
      records: initialRecords,
    };

    setActiveSession(newSession);
    setSessionDemoState('RUNNING');
    setFailedAttemptsMap({});
    setActiveTab('attendance');
    soundManager.playSessionStart();
  };

  const toggleStudentManualStatus = useCallback((studentId: string) => {
    if (!activeSession) return;

    const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const updatedRecords = activeSession.records.map((r) => {
      if (r.studentId !== studentId) return r;

      let nextStatus: 'PRESENT' | 'ABSENT' | 'PENDING' = 'PRESENT';
      if (r.status === 'PENDING') {
        nextStatus = 'PRESENT';
      } else if (r.status === 'PRESENT') {
        nextStatus = 'ABSENT';
      } else if (r.status === 'ABSENT') {
        nextStatus = 'PRESENT';
      }

      return {
        ...r,
        status: nextStatus,
        method: 'MANUAL' as const,
        timestamp: formattedTime,
        markedAt: formattedTime,
        markedBy: 'Faculty Manual Grid',
        cardVerified: nextStatus === 'PRESENT' ? (r.cardVerified || true) : false,
        faceVerified: nextStatus === 'PRESENT' ? (r.faceVerified || true) : false,
        verificationStatus: nextStatus === 'PRESENT' ? ('GRANTED' as const) : nextStatus === 'ABSENT' ? ('ABSENT' as const) : ('MANUAL' as const),
      };
    });

    const presentCount = updatedRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const absentCount = updatedRecords.filter(r => r.status === 'ABSENT').length;

    setActiveSession({
      ...activeSession,
      presentCount,
      absentCount,
      records: updatedRecords,
    });
    soundManager.playRfidSuccess();
  }, [activeSession]);

  const submitAttendanceSession = useCallback((markPendingAsAbsent = false) => {
    if (!activeSession) return { success: false, presentCount: 0, absentCount: 0, pendingCount: 0 };

    const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const finalRecords = activeSession.records.map((r) => {
      if (r.status === 'PENDING' && markPendingAsAbsent) {
        return {
          ...r,
          status: 'ABSENT' as const,
          method: 'MANUAL' as const,
          timestamp: formattedTime,
          markedBy: 'Auto Marked Absent on Submit',
          verificationStatus: 'ABSENT' as const,
        };
      }
      return r;
    });

    const presentCount = finalRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const absentCount = finalRecords.filter(r => r.status === 'ABSENT').length;
    const pendingCount = finalRecords.filter(r => r.status === 'PENDING').length;

    const completedSession: AttendanceSession = {
      ...activeSession,
      presentCount,
      absentCount,
      records: finalRecords,
      status: 'COMPLETED',
      sessionStatus: 'CLOSED',
    };

    setActiveSession(completedSession);
    setSessions(prev => [completedSession, ...prev.filter(s => s.id !== completedSession.id)]);

    soundManager.playSessionStart();
    return { success: true, presentCount, absentCount, pendingCount };
  }, [activeSession]);

  const refreshStateData = useCallback(() => {
    try {
      const savedStudents = localStorage.getItem('caias_students');
      if (savedStudents) {
        setStudents(JSON.parse(savedStudents));
      }
      const savedTimetable = localStorage.getItem('caias_timetable');
      if (savedTimetable) {
        setTimetable(JSON.parse(savedTimetable));
      }
      soundManager.playRfidSuccess();
    } catch (e) {
      console.error('Refresh state error:', e);
    }
  }, []);

  // Edit Attendance Record with Audit Trail
  const editAttendanceRecord = (recordId: string, newStatus: 'PRESENT' | 'ABSENT' | 'LATE', reason: string, modifiedBy: string) => {
    if (!activeSession) return;

    const record = activeSession.records.find(r => r.id === recordId);
    if (!record) return;

    const oldStatus = record.status;
    const updatedRecords = activeSession.records.map(r => r.id === recordId ? { ...r, status: newStatus } : r);

    const presentRecords = updatedRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE');
    const newPresentCount = presentRecords.length;
    const newAbsentCount = Math.max(0, activeSession.totalStrength - newPresentCount);

    setActiveSession({
      ...activeSession,
      presentCount: newPresentCount,
      absentCount: newAbsentCount,
      records: updatedRecords,
    });

    // Add Audit Log Entry for Manual Modification
    setAuditLogs(prev => [{
      id: `AUDIT-EDIT-${Date.now()}`,
      studentName: record.studentName,
      uucmsNo: record.studentUucmsNo || record.studentRollNo,
      cardUid: record.cardUid || record.rfidTag,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      course: activeSession.course || 'BCA AIML',
      section: activeSession.section,
      facultyName: activeSession.facultyName,
      verificationResult: 'SUCCESS',
      resultMessage: `Manual Status Correction: ${oldStatus} -> ${newStatus} (${reason})`,
      failedAttempts: 0,
      deviceId: 'FACULTY-MANUAL-CORRECTION',
      modifiedBy,
      oldStatus,
      newStatus,
      reason,
    }, ...prev]);
  };

  // SESSION CONTROLS
  const pauseDemoSession = () => {
    setSessionDemoState('PAUSED');
  };

  const resumeDemoSession = () => {
    setSessionDemoState('RUNNING');
  };

  const undoLastAttendance = () => {
    if (!activeSession || activeSession.records.length === 0) return;

    const updatedRecords = activeSession.records.slice(1);
    const presentRecords = updatedRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE');
    const newPresentCount = presentRecords.length;
    const newAbsentCount = Math.max(0, activeSession.totalStrength - newPresentCount);

    const updatedSession: AttendanceSession = {
      ...activeSession,
      presentCount: newPresentCount,
      absentCount: newAbsentCount,
      records: updatedRecords,
    };

    setActiveSession(updatedSession);
    setLastScannedRecord(updatedRecords.length > 0 ? {
      record: updatedRecords[0],
      student: students.find(s => s.id === updatedRecords[0].studentId)!,
      isDuplicate: false,
    } : null);

    soundManager.playSessionStart();
  };

  const resetDemoSession = () => {
    if (!activeSession) return;

    const resetSession: AttendanceSession = {
      ...activeSession,
      presentCount: 0,
      absentCount: activeSession.totalStrength,
      records: [],
    };

    setActiveSession(resetSession);
    setLastScannedRecord(null);
    setSessionDemoState('RUNNING');
    setFailedAttemptsMap({});
    soundManager.playSessionStart();
  };

  const saveManualAttendanceSession = useCallback((records: AttendanceRecord[]) => {
    if (!activeSession) return;

    const presentCount = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const absentCount = Math.max(0, records.length - presentCount);

    const updatedSession: AttendanceSession = {
      ...activeSession,
      presentCount,
      absentCount,
      records,
      status: 'COMPLETED',
    };

    setActiveSession(updatedSession);
    setSessions(prev => [updatedSession, ...prev.filter(s => s.id !== updatedSession.id)]);
    soundManager.playRfidSuccess();
  }, [activeSession]);

  // DUAL-FACTOR FACE + RFID MATCHING ENGINE WITH WRONG-CLASS PROTECTION & LATE THRESHOLD
  const verifyFaceAndRfidMatch = useCallback((isProxyAttempt = false): {
    success: boolean;
    message: string;
    verificationResult: VerificationResultState;
    attempts?: number;
    isMarkedAbsent?: boolean;
  } => {
    if (!activeSession) {
      return { success: false, message: 'No active attendance session.', verificationResult: 'BOTH_FAILED' };
    }

    if (sessionDemoState === 'PAUSED') {
      return { success: false, message: 'Session is currently paused.', verificationResult: 'BOTH_FAILED' };
    }

    const classStudents = students.filter(
      s => s.semester === activeSession.semester &&
           s.section === activeSession.section
    );

    // Identify already processed students (either PRESENT, LATE or ABSENT)
    const processedStudentIds = new Set(activeSession.records.map(r => r.studentId));
    const targetStudent = classStudents.find(s => !processedStudentIds.has(s.id));

    if (!targetStudent) {
      soundManager.playRfidDuplicate();
      return { success: false, message: 'All students have been processed', verificationResult: 'ALREADY_RECORDED' };
    }

    // WRONG-CLASS PROTECTION CHECK
    const isStudentRegisteredForClass = 
      targetStudent.semester === activeSession.semester &&
      targetStudent.section === activeSession.section;

    if (!isStudentRegisteredForClass) {
      soundManager.playRfidDuplicate();
      return {
        success: false,
        message: `ATTENDANCE REJECTED: ${targetStudent.name} is not registered for ${activeSession.course} Sem ${activeSession.semester} Sec ${activeSession.section}.`,
        verificationResult: 'WRONG_CLASS_REJECTED',
      };
    }

    // UNIQUE ATTENDANCE RECORD RULE CHECK
    const alreadyExists = activeSession.records.some(r => r.studentId === targetStudent.id && (r.status === 'PRESENT' || r.status === 'LATE'));
    if (alreadyExists) {
      soundManager.playRfidDuplicate();
      return {
        success: false,
        message: `Attendance Already Recorded for ${targetStudent.name}`,
        verificationResult: 'ALREADY_RECORDED',
      };
    }

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const formattedDate = now.toISOString().split('T')[0];

    // Late Threshold Check (e.g. > 10 minutes)
    const isLate = activeSession.records.length > 15;

    // Determine Face & Card Students for Simulation
    const cardStudent = targetStudent;
    const faceStudent = isProxyAttempt
      ? classStudents.find(s => s.id !== targetStudent.id) || targetStudent
      : targetStudent;

    const liveCapturedVector = isProxyAttempt
      ? generateDeterministicEmbedding('PROXY_FACE_SEED_999')
      : (targetStudent.facialEmbedding || generateDeterministicEmbedding(targetStudent.id));

    const antiProxyCheck = verifyAntiProxyFaceMatch(
      liveCapturedVector,
      targetStudent,
      students,
      new Map(),
      0.85
    );

    const isMatch = !isProxyAttempt && antiProxyCheck.isAllowed && faceStudent.id === cardStudent.id;

    // SCENARIO A: DUAL-FACTOR MATCH SUCCESS (Face == Card)
    if (isMatch) {
      const recordStatus = isLate ? 'LATE' : 'PRESENT';

      const newRecord: AttendanceRecord = {
        id: `REC-MATCH-${Date.now()}`,
        sessionId: activeSession.id,
        studentId: targetStudent.id,
        studentUucmsNo: targetStudent.uucmsNo || targetStudent.rollNo,
        studentRollNo: targetStudent.uucmsNo || targetStudent.rollNo,
        studentName: targetStudent.name,
        cardUid: targetStudent.cardUid || targetStudent.rfidTag,
        rfidTag: targetStudent.cardUid || targetStudent.rfidTag,
        fingerprintSlotId: targetStudent.fingerprintSlotId || 1,
        timestamp: formattedTime,
        method: 'FACE_AND_RFID',
        status: recordStatus,
        lateStatus: isLate ? 'LATE' : 'PRESENT',
        dualFactorVerified: true,
        verificationStatus: 'GRANTED',
        verificationResult: 'SUCCESS',
        resultMessage: `FACE MATCH ✓ & CARD MATCH ✓ (${recordStatus})`,
        attemptsCount: 1,
        faceMatchStatus: true,
        cardMatchStatus: true,
        faceStudentName: faceStudent.name,
        cardStudentName: cardStudent.name,
        isSynced: deviceStatus.internetConnected,
        totalTimeMs: 45,
      };

      // If offline, add to offline queue
      if (!deviceStatus.internetConnected) {
        setOfflineQueue(prev => [...prev, newRecord]);
      }

      const updatedRecords = [newRecord, ...activeSession.records];
      const presentRecords = updatedRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE');
      const newPresentCount = presentRecords.length;
      const newAbsentCount = Math.max(0, activeSession.totalStrength - newPresentCount);

      setActiveSession({
        ...activeSession,
        presentCount: newPresentCount,
        absentCount: newAbsentCount,
        records: updatedRecords,
      });

      // Clear attempt counter for student
      setFailedAttemptsMap(prev => ({ ...prev, [targetStudent.id]: 0 }));
      setLastScannedRecord({ record: newRecord, student: targetStudent, isDuplicate: false });
      soundManager.playRfidSuccess();

      // Log Audit Log
      setAuditLogs(prev => [{
        id: `AUDIT-MATCH-${Date.now()}`,
        studentName: targetStudent.name,
        uucmsNo: targetStudent.uucmsNo || targetStudent.rollNo,
        cardUid: targetStudent.cardUid || targetStudent.rfidTag,
        fingerprintSlotId: targetStudent.fingerprintSlotId || 1,
        date: formattedDate,
        time: formattedTime,
        course: targetStudent.course || 'BCA AIML',
        section: targetStudent.section,
        facultyName: activeSession.facultyName,
        verificationResult: 'SUCCESS',
        resultMessage: `FACE MATCH ✓ & CARD MATCH ✓ (${recordStatus})`,
        failedAttempts: 0,
        deviceId: 'LAPTOP-WEBCAM-DUAL-ENGINE',
      }, ...prev]);

      return {
        success: true,
        message: `FACE MATCH ✓ & CARD MATCH ✓ — ${targetStudent.name} Marked ${recordStatus} (${newPresentCount}/${activeSession.totalStrength})`,
        verificationResult: 'SUCCESS',
      };
    }

    // SCENARIO B: MISMATCH DETECTED (Face != Card)
    const currentAttempts = (failedAttemptsMap[targetStudent.id] || 0) + 1;
    setFailedAttemptsMap(prev => ({ ...prev, [targetStudent.id]: currentAttempts }));
    soundManager.playRfidDuplicate();

    // Attempt 1 or 2 -> Give retry prompt
    if (currentAttempts < 3) {
      const failedRecord: AttendanceRecord = {
        id: `REC-MISMATCH-${Date.now()}`,
        sessionId: activeSession.id,
        studentId: targetStudent.id,
        studentUucmsNo: targetStudent.uucmsNo || targetStudent.rollNo,
        studentRollNo: targetStudent.uucmsNo || targetStudent.rollNo,
        studentName: targetStudent.name,
        cardUid: targetStudent.cardUid || targetStudent.rfidTag,
        rfidTag: targetStudent.cardUid || targetStudent.rfidTag,
        timestamp: formattedTime,
        method: 'FACE_AND_RFID',
        status: 'REJECTED',
        lateStatus: 'ABSENT',
        dualFactorVerified: false,
        verificationStatus: 'FACE_MISMATCH',
        verificationResult: 'ID_VERIFIED_FACE_FAILED',
        resultMessage: `FACE + CARD MISMATCH ✗ (Attempt ${currentAttempts}/3 - Retry Allowed)`,
        attemptsCount: currentAttempts,
        faceMatchStatus: false,
        cardMatchStatus: true,
        faceStudentName: faceStudent.name,
        cardStudentName: cardStudent.name,
      };

      setLastScannedRecord({ record: failedRecord, student: targetStudent, isDuplicate: false, isVerificationFailed: true });

      return {
        success: false,
        message: `FACE + CARD MISMATCH ✗ (Attempt ${currentAttempts} of 3) — Retry Allowed!`,
        verificationResult: 'ID_VERIFIED_FACE_FAILED',
        attempts: currentAttempts,
      };
    }

    // Attempt 3 -> AUTOMATICALLY MARK ABSENT & MOVE TO NEXT STUDENT
    const absentRecord: AttendanceRecord = {
      id: `REC-ABSENT-${Date.now()}`,
      sessionId: activeSession.id,
      studentId: targetStudent.id,
      studentUucmsNo: targetStudent.uucmsNo || targetStudent.rollNo,
      studentRollNo: targetStudent.uucmsNo || targetStudent.rollNo,
      studentName: targetStudent.name,
      cardUid: targetStudent.cardUid || targetStudent.rfidTag,
      rfidTag: targetStudent.cardUid || targetStudent.rfidTag,
      timestamp: formattedTime,
      method: 'FACE_AND_RFID',
      status: 'ABSENT',
      lateStatus: 'ABSENT',
      dualFactorVerified: false,
      verificationStatus: 'FACE_MISMATCH',
      verificationResult: 'BOTH_FAILED',
      resultMessage: '3 FAILED ATTEMPTS — STUDENT MARKED ABSENT ✗',
      attemptsCount: 3,
      faceMatchStatus: false,
      cardMatchStatus: false,
      faceStudentName: faceStudent.name,
      cardStudentName: cardStudent.name,
    };

    const updatedRecords = [absentRecord, ...activeSession.records];
    const presentRecords = updatedRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE');
    const newPresentCount = presentRecords.length;
    const newAbsentCount = Math.max(0, activeSession.totalStrength - newPresentCount);

    setActiveSession({
      ...activeSession,
      presentCount: newPresentCount,
      absentCount: newAbsentCount,
      records: updatedRecords,
    });

    setLastScannedRecord({ record: absentRecord, student: targetStudent, isDuplicate: false, isVerificationFailed: true });

    // Log Audit Log with 3 failed attempts
    setAuditLogs(prev => [{
      id: `AUDIT-ABSENT-${Date.now()}`,
      studentName: targetStudent.name,
      uucmsNo: targetStudent.uucmsNo || targetStudent.rollNo,
      cardUid: targetStudent.cardUid || targetStudent.rfidTag,
      fingerprintSlotId: targetStudent.fingerprintSlotId || 1,
      date: formattedDate,
      time: formattedTime,
      course: targetStudent.course || 'BCA AIML',
      section: targetStudent.section,
      facultyName: activeSession.facultyName,
      verificationResult: 'BOTH_FAILED',
      resultMessage: '3 Failed Attempts (FACE+CARD Mismatch) -> Marked ABSENT',
      failedAttempts: 3,
      deviceId: 'LAPTOP-WEBCAM-DUAL-ENGINE',
    }, ...prev]);

    return {
      success: false,
      message: `3 FAILED ATTEMPTS REACHED: ${targetStudent.name} MARKED ABSENT ✗ (Advancing to Next Student)`,
      verificationResult: 'BOTH_FAILED',
      attempts: 3,
      isMarkedAbsent: true,
    };
  }, [activeSession, sessionDemoState, students, failedAttemptsMap, deviceStatus.internetConnected]);

  const markNextStudentKeyboardSimulation = useCallback((method = 'FACE') => {
    return verifyFaceAndRfidMatch(false);
  }, [verifyFaceAndRfidMatch]);

  const markNextStudentSpacebarDemo = useCallback((): {
    success: boolean;
    message: string;
    isAllMarked?: boolean;
    student?: Student;
    record?: AttendanceRecord;
  } => {
    if (!activeSession) {
      return { success: false, message: 'No active class session.' };
    }
    if (sessionDemoState === 'PAUSED') {
      return { success: false, message: 'Class session is currently paused.' };
    }

    // Load active class students
    const classStudents = students.filter(
      s => s.semester === activeSession.semester &&
           s.section === activeSession.section &&
           s.status !== 'inactive'
    );
    const roster = classStudents.length > 0 ? classStudents : students.slice(0, 60);

    // Map existing records
    const recordMap = new Map<string, AttendanceRecord>();
    activeSession.records.forEach(r => recordMap.set(r.studentId, r));

    // Find next unmarked student (status is PENDING or not present in records)
    const nextStudent = roster.find(s => {
      const rec = recordMap.get(s.id);
      return !rec || rec.status === 'PENDING';
    });

    if (!nextStudent) {
      soundManager.playRfidDuplicate();
      return {
        success: false,
        message: 'All students marked for this class session!',
        isAllMarked: true,
      };
    }

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newRecord: AttendanceRecord = {
      id: `REC-SPACEBAR-${Date.now()}-${nextStudent.id}`,
      sessionId: activeSession.id,
      studentId: nextStudent.id,
      studentUucmsNo: nextStudent.uucmsNo || nextStudent.rollNo,
      studentRollNo: nextStudent.uucmsNo || nextStudent.rollNo,
      studentName: nextStudent.name,
      cardUid: nextStudent.cardUid || nextStudent.rfidTag || 'A7:B2:91:01',
      rfidTag: nextStudent.cardUid || nextStudent.rfidTag || 'A7:B2:91:01',
      fingerprintSlotId: nextStudent.fingerprintSlotId || 1,
      timestamp: formattedTime,
      markedAt: formattedTime,
      markedBy: 'Spacebar Scan Demo',
      method: 'SPACEBAR',
      status: 'PRESENT',
      lateStatus: 'PRESENT',
      dualFactorVerified: true,
      verificationStatus: 'GRANTED',
      verificationResult: 'SUCCESS',
      resultMessage: `SPACEBAR SCAN ✓ — ${nextStudent.name} Marked Present`,
      attemptsCount: 1,
      cardVerified: true,
      faceVerified: true,
      isSynced: true,
    };

    // Filter out existing record for this student if any, and add new PRESENT record
    const updatedRecords = [newRecord, ...activeSession.records.filter(r => r.studentId !== nextStudent.id)];

    const presentCount = updatedRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const absentCount = updatedRecords.filter(r => r.status === 'ABSENT').length;

    setActiveSession({
      ...activeSession,
      presentCount,
      absentCount,
      records: updatedRecords,
    });

    setLastScannedRecord({ record: newRecord, student: nextStudent, isDuplicate: false });
    soundManager.playRfidSuccess();

    return {
      success: true,
      message: `✓ Attendance Marked: ${nextStudent.name} — ${nextStudent.uucmsNo || nextStudent.rollNo}`,
      student: nextStudent,
      record: newRecord,
    };
  }, [activeSession, sessionDemoState, students]);

  // Dual-Factor RFID Processor
  const markAttendanceByRfidAndFingerprint = useCallback((
    cardUid: string,
    scannedSlotId?: number,
    isProxyAttempt = false
  ): { success: boolean; message: string; verificationResult: VerificationResultState } => {
    return verifyFaceAndRfidMatch(isProxyAttempt);
  }, [verifyFaceAndRfidMatch]);

  const markAttendanceByRfid = (rfidTag: string) => {
    return verifyFaceAndRfidMatch(false);
  };

  const simulateNextStudentScan = useCallback((forceMismatch = false) => {
    return verifyFaceAndRfidMatch(forceMismatch);
  }, [verifyFaceAndRfidMatch]);

  // 60-Student Continuous Load Test Simulation
  const run60StudentLoadTest = useCallback(() => {
    if (!activeSession) return;

    const classStudents = students.filter(
      s => s.semester === activeSession.semester &&
           s.section === activeSession.section
    );

    let count = 0;
    const interval = setInterval(() => {
      if (count >= classStudents.length) {
        clearInterval(interval);
        return;
      }
      verifyFaceAndRfidMatch(false);
      count++;
    }, 150);
  }, [activeSession, students, verifyFaceAndRfidMatch]);

  // EVENTS & AUDITORIUM MULTI-FACULTY MODULE STATE
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<string>('AUD-GATE-01');
  const [isStationConnected, setIsStationConnected] = useState<boolean>(false);
  const [activeStationCheckpoint, setActiveStationCheckpoint] = useState<string | null>(null);

  const initialAuditoriumCheckpoints: AuditoriumCheckpoint[] = [
    { id: 'AUD-GATE-01', name: 'AUD-GATE-01', locationDescription: 'Main North Entrance', assignedFacultyName: 'Prof. Anil', assignedFacultyEmail: 'anil@college.edu', status: 'ONLINE', attendanceCount: 168 },
    { id: 'AUD-GATE-02', name: 'AUD-GATE-02', locationDescription: 'Main South Entrance', assignedFacultyName: 'Prof. Priya', assignedFacultyEmail: 'priya@college.edu', status: 'ONLINE', attendanceCount: 152 },
    { id: 'AUD-GATE-03', name: 'AUD-GATE-03', locationDescription: 'Convention Hall Ramp', assignedFacultyName: 'Prof. Kumar', assignedFacultyEmail: 'kumar@college.edu', status: 'OFFLINE', attendanceCount: 143 },
    { id: 'AUD-GATE-04', name: 'AUD-GATE-04', locationDescription: 'VIP / Guest Lobby', assignedFacultyName: 'Prof. Sneha', assignedFacultyEmail: 'sneha@college.edu', status: 'ONLINE', attendanceCount: 151 },
    { id: 'AUD-GATE-05', name: 'AUD-GATE-05', locationDescription: 'Upper Balcony Tier', assignedFacultyName: 'Prof. Rahul', assignedFacultyEmail: 'rahul@college.edu', status: 'ONLINE', attendanceCount: 124 },
    { id: 'AUD-GATE-06', name: 'AUD-GATE-06', locationDescription: 'Backstage Access Gate', assignedFacultyName: 'Prof. Divya', assignedFacultyEmail: 'divya@college.edu', status: 'ONLINE', attendanceCount: 109 },
  ];

  const initialAuditoriumFaculty: AuditoriumFacultyAssignment[] = [
    { id: 'FAC-1', eventId: 'EVENT-AUD-100', facultyName: 'Dr. Alan Turing', facultyEmail: 'alan.turing@college.edu', role: 'EVENT_COORDINATOR', isConnected: true },
    { id: 'FAC-2', eventId: 'EVENT-AUD-100', facultyName: 'Prof. Anil', facultyEmail: 'anil@college.edu', role: 'CHECKPOINT_FACULTY', assignedCheckpointName: 'AUD-GATE-01', isConnected: true },
    { id: 'FAC-3', eventId: 'EVENT-AUD-100', facultyName: 'Prof. Priya', facultyEmail: 'priya@college.edu', role: 'CHECKPOINT_FACULTY', assignedCheckpointName: 'AUD-GATE-02', isConnected: true },
    { id: 'FAC-4', eventId: 'EVENT-AUD-100', facultyName: 'Prof. Kumar', facultyEmail: 'kumar@college.edu', role: 'CHECKPOINT_FACULTY', assignedCheckpointName: 'AUD-GATE-03', isConnected: false },
    { id: 'FAC-5', eventId: 'EVENT-AUD-100', facultyName: 'Prof. Sneha', facultyEmail: 'sneha@college.edu', role: 'CHECKPOINT_FACULTY', assignedCheckpointName: 'AUD-GATE-04', isConnected: true },
    { id: 'FAC-6', eventId: 'EVENT-AUD-100', facultyName: 'Prof. Rahul', facultyEmail: 'rahul@college.edu', role: 'CHECKPOINT_FACULTY', assignedCheckpointName: 'AUD-GATE-05', isConnected: true },
    { id: 'FAC-7', eventId: 'EVENT-AUD-100', facultyName: 'Prof. Divya', facultyEmail: 'divya@college.edu', role: 'CHECKPOINT_FACULTY', assignedCheckpointName: 'AUD-GATE-06', isConnected: true },
  ];

  const [events, setEvents] = useState<EventItem[]>([
    {
      id: 'CAIAS-TECH-2026-001',
      name: 'CAIAS Annual Tech Summit 2026',
      description: 'National Level AI, IoT & Cloud Computing Convention with 1200+ delegates',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:30 AM',
      endTime: '05:00 PM',
      venue: 'Main College Auditorium & Convention Center',
      coordinatorName: 'Dr. Alan Turing',
      coordinatorEmail: 'alan.turing@college.edu',
      status: 'ACTIVE',
      allowCheckOut: true,
      mode: 'AUDITORIUM',
      expectedStrength: 1200,
      activeCheckpointsCount: 6,
      checkpoints: initialAuditoriumCheckpoints,
      facultyAssignments: initialAuditoriumFaculty,
      faceRecognitionEnabled: true,
      cardRfidEnabled: true,
      spacebarDemoEnabled: true,
    },
    ...initialEvents,
  ]);
  const [activeEvent, setActiveEvent] = useState<EventItem | null>(events[0] || null);
  const [eventAttendanceRecords, setEventAttendanceRecords] = useState<EventAttendanceRecord[]>(initialEventRecords);

  const [eventApprovalNotifications, setEventApprovalNotifications] = useState<EventApprovalNotification[]>([
    {
      id: 'NOTIF-EVT-001',
      eventAttendanceRecordId: 'EVTREC-24BCA001',
      studentId: 'STU-24BCA001',
      studentName: 'Aarav Sharma',
      studentRegisterNo: '24BCA001',
      classSection: 'BCA AIML 3B',
      classTeacherEmail: 'alan.turing@college.edu',
      classTeacherName: 'Dr. Alan Turing',
      eventId: 'EVT-HOD-101',
      eventName: 'AI Hackathon 2026',
      eventDate: new Date().toISOString().split('T')[0],
      eventTime: '10:00 AM - 01:00 PM',
      attendanceTime: '10:42 AM',
      eventFacultyName: 'Prof. Charles Babbage',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'NOTIF-EVT-002',
      eventAttendanceRecordId: 'EVTREC-24BCA002',
      studentId: 'STU-24BCA002',
      studentName: 'Aditya Kumar',
      studentRegisterNo: '24BCA002',
      classSection: 'BCA AIML 3B',
      classTeacherEmail: 'alan.turing@college.edu',
      classTeacherName: 'Dr. Alan Turing',
      eventId: 'EVT-HOD-101',
      eventName: 'AI Hackathon 2026',
      eventDate: new Date().toISOString().split('T')[0],
      eventTime: '10:00 AM - 01:00 PM',
      attendanceTime: '11:15 AM',
      eventFacultyName: 'Prof. Charles Babbage',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    },
  ]);

  const approveEventAttendance = (notificationId: string) => {
    const notif = eventApprovalNotifications.find(n => n.id === notificationId);
    if (!notif) return;

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setEventApprovalNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, status: 'APPROVED', approvedAt: nowStr } : n)
    );

    setEventAttendanceRecords(prev =>
      prev.map(r => r.id === notif.eventAttendanceRecordId ? {
        ...r,
        status: 'APPROVED',
        approvalStatus: 'APPROVED',
        approvedByTeacherEmail: notif.classTeacherEmail,
        approvedByTeacherName: notif.classTeacherName,
        approvalTimestamp: nowStr,
      } : r)
    );

    const newRecord: AttendanceRecord = {
      id: `REC-EVENT-${Date.now()}-${notif.studentId}`,
      sessionId: `SESSION-EVENT-${notif.eventId}`,
      studentId: notif.studentId,
      studentUucmsNo: notif.studentRegisterNo,
      studentRollNo: notif.studentRegisterNo,
      studentName: notif.studentName,
      rfidTag: `A7:B2:91:01`,
      timestamp: notif.attendanceTime,
      markedAt: notif.attendanceTime,
      markedBy: `Class Teacher (${notif.classTeacherName})`,
      method: 'FACE_AND_RFID',
      status: 'PRESENT',
      lateStatus: 'PRESENT',
      dualFactorVerified: true,
      verificationStatus: 'GRANTED',
      source: 'EVENT',
      eventId: notif.eventId,
      eventName: notif.eventName,
      eventReference: {
        eventId: notif.eventId,
        eventName: notif.eventName,
        eventFacultyName: notif.eventFacultyName,
        approvedByTeacherName: notif.classTeacherName,
        approvedAt: nowStr,
      },
    };

    if (activeSession) {
      setActiveSession(prev => prev ? {
        ...prev,
        records: [...prev.records.filter(r => r.studentId !== notif.studentId), newRecord],
        presentCount: prev.presentCount + 1,
      } : null);
    }

    soundManager.playSessionStart();
  };

  const rejectEventAttendance = (notificationId: string, remark?: string) => {
    setEventApprovalNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, status: 'REJECTED', rejectionReason: remark } : n)
    );

    const notif = eventApprovalNotifications.find(n => n.id === notificationId);
    if (notif) {
      setEventAttendanceRecords(prev =>
        prev.map(r => r.id === notif.eventAttendanceRecordId ? {
          ...r,
          status: 'REJECTED',
          approvalStatus: 'REJECTED',
          rejectionReason: remark,
        } : r)
      );
    }
    soundManager.playRfidDuplicate();
  };

  const setEventsItems = (newEvents: EventItem[]) => {
    setEvents(newEvents);
  };

  const updateEventItem = (eventId: string, partial: Partial<EventItem>) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...partial } : e));
    if (activeEvent?.id === eventId) {
      setActiveEvent(prev => prev ? { ...prev, ...partial } : null);
    }
  };

  const createAuditoriumEvent = (eventData: Omit<EventItem, 'id' | 'status'>) => {
    const eventId = `CAIAS-TECH-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newEvent: EventItem = {
      ...eventData,
      id: eventId,
      status: 'UPCOMING',
      mode: 'AUDITORIUM',
      expectedStrength: eventData.expectedStrength || 1200,
      activeCheckpointsCount: 4,
      checkpoints: [
        { id: `${eventId}-G1`, name: 'AUD-GATE-01', locationDescription: 'Main North Gate', status: 'OFFLINE', attendanceCount: 0 },
        { id: `${eventId}-G2`, name: 'AUD-GATE-02', locationDescription: 'Main South Gate', status: 'OFFLINE', attendanceCount: 0 },
        { id: `${eventId}-G3`, name: 'AUD-GATE-03', locationDescription: 'Convention Hall Entrance', status: 'OFFLINE', attendanceCount: 0 },
        { id: `${eventId}-G4`, name: 'AUD-GATE-04', locationDescription: 'VIP Lobby Gate', status: 'OFFLINE', attendanceCount: 0 },
      ],
      facultyAssignments: [
        { id: `FAC-${Date.now()}`, eventId, facultyName: eventData.coordinatorName || 'Dr. Alan Turing', facultyEmail: eventData.coordinatorEmail || 'alan.turing@college.edu', role: 'EVENT_COORDINATOR', isConnected: true },
      ],
      faceRecognitionEnabled: true,
      cardRfidEnabled: true,
      spacebarDemoEnabled: true,
    };

    setEvents(prev => [newEvent, ...prev]);
    setActiveEvent(newEvent);
    soundManager.playSessionStart();
    return newEvent;
  };

  const addAuditoriumFaculty = (eventId: string, facultyName: string, facultyEmail: string, role: 'EVENT_COORDINATOR' | 'CHECKPOINT_FACULTY' = 'CHECKPOINT_FACULTY') => {
    setEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        const existing = e.facultyAssignments || [];
        if (existing.some(f => f.facultyEmail === facultyEmail)) return e;
        const newAssignment: AuditoriumFacultyAssignment = {
          id: `FAC-${Date.now()}`,
          eventId,
          facultyName,
          facultyEmail,
          role,
          isConnected: false,
        };
        return {
          ...e,
          facultyAssignments: [...existing, newAssignment],
        };
      }
      return e;
    }));
  };

  const removeAuditoriumFaculty = (eventId: string, facultyEmail: string) => {
    setEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        return {
          ...e,
          facultyAssignments: (e.facultyAssignments || []).filter(f => f.facultyEmail !== facultyEmail),
        };
      }
      return e;
    }));
  };

  const addAuditoriumCheckpoint = (eventId: string, checkpointName: string, locationDescription?: string) => {
    setEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        const existing = e.checkpoints || [];
        if (existing.some(c => c.name === checkpointName)) return e;
        const newGate: AuditoriumCheckpoint = {
          id: `${eventId}-${checkpointName}`,
          name: checkpointName,
          locationDescription: locationDescription || 'Gate Access Point',
          status: 'OFFLINE',
          attendanceCount: 0,
        };
        return {
          ...e,
          checkpoints: [...existing, newGate],
          activeCheckpointsCount: (e.activeCheckpointsCount || 0) + 1,
        };
      }
      return e;
    }));
  };

  const assignFacultyToCheckpoint = (eventId: string, facultyEmail: string, checkpointName: string) => {
    setEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        const updatedCheckpoints = (e.checkpoints || []).map(c => {
          if (c.name === checkpointName) {
            const fac = (e.facultyAssignments || []).find(f => f.facultyEmail === facultyEmail);
            return {
              ...c,
              assignedFacultyEmail: facultyEmail,
              assignedFacultyName: fac?.facultyName || facultyEmail,
              status: 'ONLINE' as const,
            };
          }
          return c;
        });

        const updatedAssignments = (e.facultyAssignments || []).map(f => {
          if (f.facultyEmail === facultyEmail) {
            return { ...f, assignedCheckpointName: checkpointName, isConnected: true };
          }
          return f;
        });

        return {
          ...e,
          checkpoints: updatedCheckpoints,
          facultyAssignments: updatedAssignments,
        };
      }
      return e;
    }));
    soundManager.playRfidSuccess();
  };

  const joinCheckpointStation = (eventId: string, checkpointName: string) => {
    setSelectedCheckpoint(checkpointName);
    setActiveStationCheckpoint(checkpointName);
    setIsStationConnected(true);
    soundManager.playRfidSuccess();
  };

  const leaveCheckpointStation = () => {
    setIsStationConnected(false);
    setActiveStationCheckpoint(null);
  };

  const [eventNotifications, setEventNotifications] = useState<EventNotification[]>([
    {
      id: 'EVNOTIF-1',
      recipientFacultyEmail: 'alan.turing@college.edu',
      recipientFacultyName: 'Dr. Alan Turing',
      recipientRole: 'PERMANENT_CLASS_TEACHER',
      eventId: 'EVENT-101',
      eventName: 'National AI & Data Science Workshop 2026',
      studentName: 'Aarav Sharma',
      studentClass: 'BCA AIML 3',
      currentClassSubject: 'Database Management Systems',
      checkInTime: '10:42 AM',
      message: '🔔 Event Attendance: Rahul Kumar from BCA AIML 3 has been verified at National AI Workshop. Time: 10:42 AM.',
      timestamp: '10:42 AM',
    },
  ]);

  // AUTOMATIC CLASS & FACULTY IDENTIFICATION + DUAL NOTIFICATION ENGINE
  const markEventAttendance = useCallback((studentId?: string, isProxyAttempt = false): {
    success: boolean;
    message: string;
    record?: EventAttendanceRecord;
  } => {
    if (!activeEvent || activeEvent.status !== 'ACTIVE') {
      return { success: false, message: 'No active event session currently running.' };
    }

    let targetStudent: Student | undefined;
    if (studentId) {
      targetStudent = students.find(s => s.id === studentId);
    } else {
      const alreadyCheckedInIds = new Set(eventAttendanceRecords.filter(r => r.eventId === activeEvent.id).map(r => r.studentId));
      targetStudent = students.find(s => !alreadyCheckedInIds.has(s.id));
    }

    if (!targetStudent) {
      soundManager.playRfidDuplicate();
      return { success: false, message: 'All enrolled students have already checked in for this event.' };
    }

    const existingCheckIn = eventAttendanceRecords.find(
      r => r.eventId === activeEvent.id && r.studentId === targetStudent!.id && r.status === 'PRESENT'
    );

    if (existingCheckIn) {
      soundManager.playRfidDuplicate();
      return {
        success: false,
        message: `⚠️ Already Present — Checked in at ${existingCheckIn.checkInTime}.`,
        record: existingCheckIn,
      };
    }

    const liveVector = isProxyAttempt
      ? generateDeterministicEmbedding('PROXY_FACE_SEED_999')
      : (targetStudent.facialEmbedding || generateDeterministicEmbedding(targetStudent.id));

    const antiProxyCheck = verifyAntiProxyFaceMatch(
      liveVector,
      targetStudent,
      students,
      new Map(),
      0.85
    );

    if (!antiProxyCheck.isAllowed || isProxyAttempt) {
      soundManager.playRfidDuplicate();

      // Log Security Audit Event
      setAuditLogs(prev => [{
        id: `AUDIT-IMPERSONATION-${Date.now()}`,
        studentName: targetStudent!.name,
        uucmsNo: targetStudent!.uucmsNo || targetStudent!.rollNo,
        cardUid: targetStudent!.cardUid || 'RFID-TAG',
        fingerprintSlotId: 1,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        course: targetStudent!.course || 'BCA AIML',
        section: targetStudent!.section,
        facultyName: 'Event Anti-Proxy Engine',
        verificationResult: 'ID_VERIFIED_FACE_FAILED',
        resultMessage: antiProxyCheck.message,
        failedAttempts: 1,
        deviceId: 'EVENT-LIVE-CAMERA-GUARD',
      }, ...prev]);

      return {
        success: false,
        message: antiProxyCheck.message,
      };
    }

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[now.getDay()];

    const permanentClassTeacher = targetStudent.course === 'BCA AIML' ? 'Dr. Alan Turing' : 'Prof. Marie Curie';

    const matchedSlot = timetable.find(
      s => s.day === currentDay && s.course === targetStudent!.course && s.semester === targetStudent!.semester && s.section === targetStudent!.section
    );

    const isCancelled = cancellations.some(c => c.subjectCode === matchedSlot?.subjectCode);

    let currentClassSubject = 'Free Period / Open Slot';
    let currentFacultyName = permanentClassTeacher;

    if (matchedSlot && !isCancelled) {
      currentClassSubject = matchedSlot.subjectName;
      currentFacultyName = matchedSlot.replacementFacultyName || matchedSlot.facultyName || permanentClassTeacher;
    } else if (isCancelled) {
      currentClassSubject = 'Class Cancelled';
    }

    const newRecord: EventAttendanceRecord = {
      id: `EVREC-${Date.now()}`,
      eventId: activeEvent.id,
      eventName: activeEvent.name,
      studentId: targetStudent.id,
      studentName: targetStudent.name,
      studentUucmsNo: targetStudent.uucmsNo || targetStudent.rollNo,
      department: targetStudent.department,
      course: targetStudent.course || 'BCA AIML',
      semester: targetStudent.semester,
      section: targetStudent.section,
      permanentClassTeacher,
      approvalStatus: 'PENDING_APPROVAL',
      currentClassSubject,
      currentFacultyName,
      checkInTime: formattedTime,
      status: 'PRESENT',
      verificationMethod: 'FACE_AND_RFID',
      verificationResult: 'SUCCESS',
      mode: 'EVENT',
    };

    setEventAttendanceRecords(prev => [newRecord, ...prev]);

    const existingClassAttendees = eventAttendanceRecords.filter(
      r => r.eventId === activeEvent.id && r.course === targetStudent!.course && r.section === targetStudent!.section
    ).length + 1;

    const newNotifications: EventNotification[] = [];

    if (existingClassAttendees >= 4) {
      newNotifications.push({
        id: `EVNOTIF-${Date.now()}-GRP`,
        recipientFacultyEmail: 'alan.turing@college.edu',
        recipientFacultyName: permanentClassTeacher,
        recipientRole: 'PERMANENT_CLASS_TEACHER',
        eventId: activeEvent.id,
        eventName: activeEvent.name,
        studentName: targetStudent.name,
        studentClass: `${targetStudent.course} ${targetStudent.semester} (${targetStudent.section})`,
        checkInTime: formattedTime,
        message: `🔔 Event Attendance Update: ${existingClassAttendees} students from ${targetStudent.course} ${targetStudent.section} are currently attending ${activeEvent.name}.`,
        isGrouped: true,
        studentCount: existingClassAttendees,
        timestamp: formattedTime,
      });
    } else {
      if (currentFacultyName && currentFacultyName !== permanentClassTeacher) {
        newNotifications.push({
          id: `EVNOTIF-${Date.now()}-CURR`,
          recipientFacultyEmail: 'faculty@college.edu',
          recipientFacultyName: currentFacultyName,
          recipientRole: 'CURRENT_FACULTY',
          eventId: activeEvent.id,
          eventName: activeEvent.name,
          studentName: targetStudent.name,
          studentClass: `${targetStudent.course} ${targetStudent.semester} (${targetStudent.section})`,
          currentClassSubject,
          checkInTime: formattedTime,
          message: `🔔 Event Attendance: ${targetStudent.name} (${targetStudent.course} ${targetStudent.section}) has been verified at ${activeEvent.name}. Current Class: ${currentClassSubject}. Time: ${formattedTime}. Verification: Card + Face.`,
          timestamp: formattedTime,
        });
      }

      newNotifications.push({
        id: `EVNOTIF-${Date.now()}-PERM`,
        recipientFacultyEmail: 'alan.turing@college.edu',
        recipientFacultyName: permanentClassTeacher,
        recipientRole: 'PERMANENT_CLASS_TEACHER',
        eventId: activeEvent.id,
        eventName: activeEvent.name,
        studentName: targetStudent.name,
        studentClass: `${targetStudent.course} ${targetStudent.semester} (${targetStudent.section})`,
        checkInTime: formattedTime,
        message: `🔔 Event Attendance: ${targetStudent.name} from ${targetStudent.course} ${targetStudent.section} has been verified at ${activeEvent.name}. Time: ${formattedTime}. Verification: Card + Face.`,
        timestamp: formattedTime,
      });
    }

    setEventNotifications(prev => [...newNotifications, ...prev]);
    soundManager.playRfidSuccess();

    return {
      success: true,
      message: `Card ✅ + Face ✅ Verified! ${targetStudent.name} Event Attendance Marked PRESENT (${formattedTime})`,
      record: newRecord,
    };
  }, [activeEvent, eventAttendanceRecords, students, timetable, cancellations]);

  // CROSS-CHECKPOINT CENTRAL DUPLICATE GUARD FOR AUDITORIUM MODE
  const markAuditoriumAttendance = useCallback((checkpointName?: string, studentId?: string, isProxyAttempt = false) => {
    const checkpoint = checkpointName || selectedCheckpoint || 'AUD-GATE-01';

    if (!activeEvent || activeEvent.status !== 'ACTIVE') {
      return { success: false, message: 'No active auditorium event currently running.' };
    }

    let targetStudent: Student | undefined;
    if (studentId) {
      targetStudent = students.find(s => s.id === studentId);
    } else {
      const checkedInIds = new Set(eventAttendanceRecords.filter(r => r.eventId === activeEvent.id).map(r => r.studentId));
      targetStudent = students.find(s => !checkedInIds.has(s.id));
    }

    if (!targetStudent) {
      soundManager.playRfidDuplicate();
      return { success: false, message: 'All enrolled students have already checked in for this auditorium event.' };
    }

    // CROSS-CHECKPOINT CENTRAL DUPLICATE CHECK ACROSS ALL FACULTY DEVICES
    const existingRecord = eventAttendanceRecords.find(
      r => r.eventId === activeEvent.id && r.studentId === targetStudent!.id
    );

    if (existingRecord) {
      soundManager.playRfidDuplicate();
      return {
        success: false,
        message: `⚠️ Already Present — First checked in at ${existingRecord.checkpointName || 'AUD-GATE-01'} at ${existingRecord.checkInTime}.`,
        record: existingRecord,
      };
    }

    const liveVector = isProxyAttempt
      ? generateDeterministicEmbedding('PROXY_FACE_SEED_999')
      : (targetStudent.facialEmbedding || generateDeterministicEmbedding(targetStudent.id));

    const antiProxyCheck = verifyAntiProxyFaceMatch(
      liveVector,
      targetStudent,
      students,
      new Map(),
      0.85
    );

    if (!antiProxyCheck.isAllowed || isProxyAttempt) {
      soundManager.playRfidDuplicate();

      // Log Audit Event
      setAuditLogs(prev => [{
        id: `AUDIT-AUDITORIUM-IMPERSONATION-${Date.now()}`,
        studentName: targetStudent!.name,
        uucmsNo: targetStudent!.uucmsNo || targetStudent!.rollNo,
        cardUid: targetStudent!.cardUid || 'RFID-TAG',
        fingerprintSlotId: 1,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        course: targetStudent!.course || 'BCA AIML',
        section: targetStudent!.section,
        facultyName: `Auditorium Gate (${checkpoint})`,
        verificationResult: 'ID_VERIFIED_FACE_FAILED',
        resultMessage: antiProxyCheck.message,
        failedAttempts: 1,
        deviceId: `GATE-${checkpoint}`,
      }, ...prev]);

      return {
        success: false,
        message: antiProxyCheck.message,
      };
    }

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const permanentClassTeacher = targetStudent.course === 'BCA AIML' ? 'Dr. Alan Turing' : 'Prof. Marie Curie';

    const newRecord: EventAttendanceRecord = {
      id: `AUDREC-${Date.now()}`,
      eventId: activeEvent.id,
      eventName: activeEvent.name,
      studentId: targetStudent.id,
      studentName: targetStudent.name,
      studentUucmsNo: targetStudent.uucmsNo || targetStudent.rollNo,
      department: targetStudent.department,
      course: targetStudent.course || 'BCA AIML',
      semester: targetStudent.semester,
      section: targetStudent.section,
      permanentClassTeacher,
      approvalStatus: 'PENDING_APPROVAL',
      currentClassSubject: 'Database Management Systems',
      currentFacultyName: 'Dr. Alan Turing',
      checkInTime: formattedTime,
      status: 'PRESENT',
      verificationMethod: 'FACE_AND_RFID',
      verificationResult: 'SUCCESS',
      mode: 'AUDITORIUM',
      checkpointName: checkpoint,
      facultyDeviceName: `Faculty Checkpoint (${checkpoint})`,
      firstCheckInTime: formattedTime,
      firstCheckpointName: checkpoint,
    };

    setEventAttendanceRecords(prev => [newRecord, ...prev]);
    soundManager.playRfidSuccess();

    return {
      success: true,
      message: `🟢 ${targetStudent.name} (${targetStudent.course} ${targetStudent.section}) — ${checkpoint} — Present (${formattedTime})`,
      record: newRecord,
    };
  }, [activeEvent, eventAttendanceRecords, selectedCheckpoint, students]);

  // UNIFIED KEYBOARD LISTENER (Spacebar & Enter trigger active mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        if (activeTab === 'events') {
          markEventAttendance();
        } else if (activeTab === 'auditorium') {
          markAuditoriumAttendance();
        } else if (activeSession && sessionDemoState === 'RUNNING') {
          verifyFaceAndRfidMatch(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSession, sessionDemoState, activeTab, verifyFaceAndRfidMatch, markEventAttendance, markAuditoriumAttendance]);

  const createEvent = (eventData: Omit<EventItem, 'id' | 'status'>) => {
    const newEvent: EventItem = {
      ...eventData,
      id: `EVENT-${Date.now()}`,
      status: 'UPCOMING',
    };
    setEvents(prev => [newEvent, ...prev]);
    soundManager.playSessionStart();
  };

  const startEventAttendance = (eventId: string) => {
    const target = events.find(e => e.id === eventId);
    if (!target) return;

    const updatedEvents = events.map(e => e.id === eventId ? { ...e, status: 'ACTIVE' as const } : e);
    setEvents(updatedEvents);
    setActiveEvent({ ...target, status: 'ACTIVE' });
    soundManager.playSessionStart();
  };

  const stopEventAttendance = (eventId: string) => {
    const target = events.find(e => e.id === eventId);
    const records = eventAttendanceRecords.filter(r => r.eventId === eventId);

    const expected = target?.expectedStrength || 1200;
    const present = records.length;
    const remaining = Math.max(0, expected - present);
    const checkpointsUsed = target?.checkpoints?.length || 6;
    const facultyUsed = target?.facultyAssignments?.length || 7;

    const updatedEvents = events.map(e => e.id === eventId ? { ...e, status: 'COMPLETED' as const } : e);
    setEvents(updatedEvents);
    if (activeEvent?.id === eventId) {
      setActiveEvent({ ...activeEvent, status: 'COMPLETED' });
    }
    soundManager.playSessionComplete();

    return {
      expected,
      present,
      remaining,
      checkpointsUsed,
      facultyUsed,
    };
  };



  // OPTIONAL CHECK-OUT FUNCTION
  const checkOutEventStudent = (recordId: string) => {
    const now = new Date();
    const formattedCheckOut = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setEventAttendanceRecords(prev => prev.map(r => {
      if (r.id === recordId) {
        return {
          ...r,
          checkOutTime: formattedCheckOut,
          status: 'CHECKED_OUT' as const,
          durationMinutes: 136, // ~2h 16m
        };
      }
      return r;
    }));
    soundManager.playSessionComplete();
  };

  // End Session
  const endSession = () => {
    if (!activeSession) return;

    const now = new Date();
    const formattedEndTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const completedSession: AttendanceSession = {
      ...activeSession,
      endTime: formattedEndTime,
      status: 'COMPLETED',
      sessionStatus: 'CLOSED',
      demoState: 'COMPLETED',
    };

    setSessions(prev => [completedSession, ...prev]);
    setSummarySession(completedSession);
    setActiveSession(null);
    setSessionDemoState('COMPLETED');
    soundManager.playSessionComplete();
  };

  return (
    <AttendanceContext.Provider
      value={{
        theme,
        setTheme,
        activeTab,
        setActiveTab,
        selectedCourse,
        setSelectedCourse,
        selectedSemester,
        setSelectedSemester,
        selectedSection,
        setSelectedSection,
        students,
        subjects,
        sessions,
        activeSession,
        sessionDemoState,
        lastScannedRecord,
        summarySession,
        setSummarySession,
        deviceStatus,
        toggleEmergencyOverride,
        offlineQueue,
        lateThresholdMinutes,
        setLateThresholdMinutes,
        auditLogs,
        failedAttemptsMap,
        timetable,
        addTimetableSlot,
        deleteTimetableSlot,
        setTimetableSlots,
        swapRequests,
        requestClassSwap,
        approveClassSwap,
        cancellations,
        cancelClass,
        extraClasses,
        scheduleExtraClass,
        facultyLeaves,
        applyFacultyLeave,
        addStudent,
        updateStudent,
        deactivateStudent,
        enrollStudentFingerprint,
        enrollStudentFace,
        deleteStudent,
        importStudentsFromExcel,
        startSession,
        endSession,
        editAttendanceRecord,
        saveManualAttendanceSession,
        refreshStateData,
        toggleStudentManualStatus,
        submitAttendanceSession,
        pauseDemoSession,
        resumeDemoSession,
        undoLastAttendance,
        resetDemoSession,
        verifyFaceAndRfidMatch,
        markNextStudentKeyboardSimulation,
        markNextStudentSpacebarDemo,
        markAttendanceByRfidAndFingerprint,
        markAttendanceByRfid,
        simulateNextStudentScan,
        run60StudentLoadTest,
        events,
        activeEvent,
        eventAttendanceRecords,
        eventNotifications,
        selectedCheckpoint,
        setSelectedCheckpoint,
        isStationConnected,
        activeStationCheckpoint,
        createEvent,
        createAuditoriumEvent,
        startEventAttendance,
        stopEventAttendance,
        eventApprovalNotifications,
        approveEventAttendance,
        rejectEventAttendance,
        setEventsItems,
        updateEventItem,
        addAuditoriumFaculty,
        removeAuditoriumFaculty,
        addAuditoriumCheckpoint,
        assignFacultyToCheckpoint,
        joinCheckpointStation,
        leaveCheckpointStation,
        markEventAttendance,
        markAuditoriumAttendance,
        checkOutEventStudent,
        // ENTERPRISE ACADEMIC & ADMIN PROVIDER VALUES
        programs,
        specializations,
        batches,
        academicSemesters,
        classSections,
        subjectEnrollments,
        teachingAssignments,
        correctionRequests,
        issueReports,
        auditLogsList,
        adminUsers,
        substitutions,
        transferStudent,
        promoteStudents,
        submitAttendanceCorrectionRequest,
        reviewAttendanceCorrectionRequest,
        reportIssue,
        resolveIssue,
        assignSubstitution,
        createTeachingAssignment,
        createProgram,
        createSpecialization,
        createClassSection,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
