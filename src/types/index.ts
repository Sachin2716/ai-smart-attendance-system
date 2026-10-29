export type Department = 
  | 'Computer Science' 
  | 'Electronics & Comm.' 
  | 'Mechanical Eng.' 
  | 'Civil Eng.' 
  | 'AI & Data Science';

export type CourseClass = 
  | 'BCA AIML' 
  | 'B.Tech CSE' 
  | 'B.Tech ECE' 
  | 'B.Tech ME' 
  | 'B.Sc Data Science'
  | 'BBA'
  | 'B.Com'
  | 'MCA'
  | 'MBA';

export type Semester = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type Section = 'A' | 'B' | 'C' | 'D';
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export type TabType = 
  | 'dashboard' 
  | 'timetable' 
  | 'calendar' 
  | 'classes' 
  | 'students' 
  | 'attendance' 
  | 'session' 
  | 'history' 
  | 'reports' 
  | 'analytics' 
  | 'settings' 
  | 'workflows' 
  | 'hod'
  | 'audit'
  | 'admin'
  | 'events'
  | 'auditorium';

export type ClassSessionStatus = 
  | 'UPCOMING' 
  | 'READY' 
  | 'AUTHENTICATING' 
  | 'LIVE' 
  | 'CLOSED' 
  | 'CANCELLED';

export interface DeviceStatus {
  cameraConnected: boolean;
  cardReaderConnected: boolean;
  internetConnected: boolean;
  serverOnline: boolean;
  emergencyManualOverride: boolean;
}

export interface Student {
  id: string;
  uucmsNo?: string; // UUCMS Register Number (e.g. 123456)
  rollNo: string; // Legacy alias for UUCMS
  name: string;
  email: string;
  phone: string;
  course?: CourseClass;
  department: Department;
  semester: Semester;
  section: Section;
  cardUid?: string; // Physical RFID Card UID (e.g. A7:B2:91:4C)
  rfidTag: string; // Legacy alias for cardUid
  fingerprintSlotId?: number;
  isFingerprintEnrolled?: boolean;
  avatar: string;
  photo?: string;
  attendancePercentage: number;
  status: 'active' | 'inactive';
  joinedDate: string;
  isFaceEnrolled?: boolean;
  encryptedFaceEmbedding?: number[];
  facialEmbedding?: number[];
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  department: Department;
  course?: CourseClass;
  semester: Semester;
  credits: number;
}

export type VerificationResultState = 
  | 'SUCCESS' 
  | 'FINGERPRINT_FAILED' 
  | 'CARD_UNKNOWN' 
  | 'ALREADY_RECORDED'
  | 'ID_VERIFIED_FACE_FAILED' 
  | 'FACE_DETECTED_ID_FAILED' 
  | 'BOTH_FAILED'
  | 'WRONG_CLASS_REJECTED';

export type VerificationStatus = 'GRANTED' | 'FACE_MISMATCH' | 'RFID_UNKNOWN' | 'LIVENESS_FAILED' | 'WRONG_CLASS' | 'ABSENT' | 'MANUAL';
export type LateStatus = 'PRESENT' | 'LATE' | 'ABSENT';

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  studentUucmsNo?: string;
  studentRollNo: string;
  studentName: string;
  cardUid?: string;
  rfidTag: string;
  fingerprintSlotId?: number;
  fingerprintStatus?: 'MATCH_VERIFIED' | 'MISMATCH' | 'NO_FINGERPRINT';
  timestamp: string; // HH:MM:SS AM/PM
  method: 'CARD_FACE' | 'FACE' | 'RFID_CARD' | 'FACE_AND_RFID' | 'SPACEBAR_DEMO' | 'SPACEBAR' | 'RFID_FINGERPRINT' | 'RFID' | 'MANUAL';
  status: 'PRESENT' | 'REJECTED' | 'LATE' | 'ABSENT' | 'PENDING';
  markedAt?: string;
  markedBy?: string;
  lateStatus: LateStatus;
  dualFactorVerified: boolean;
  verificationStatus: VerificationStatus;
  verificationResult?: VerificationResultState;
  resultMessage?: string;
  attemptsCount?: number;
  faceMatchStatus?: boolean;
  cardMatchStatus?: boolean;
  cardVerified?: boolean;
  faceVerified?: boolean;
  faceStudentName?: string;
  cardStudentName?: string;
  isSynced?: boolean;
  source?: 'REGULAR_CLASS' | 'EVENT' | 'MANUAL_OVERRIDE';
  eventId?: string;
  eventName?: string;
  eventReference?: {
    eventId: string;
    eventName: string;
    eventFacultyName?: string;
    approvedByTeacherName?: string;
    approvedAt?: string;
  };
  // Hardware Timing Metrics (ms)
  rfidTimeMs?: number;
  fingerprintTimeMs?: number;
  esp32TimeMs?: number;
  syncTimeMs?: number;
  totalTimeMs?: number;
}

export interface AttendanceSession {
  id: string;
  subjectCode: string;
  subjectName: string;
  course?: CourseClass;
  department: Department;
  semester: Semester;
  section: Section;
  classroom?: string;
  facultyName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM AM/PM
  endTime?: string;
  totalStrength: number;
  presentCount: number;
  lateCount?: number;
  absentCount: number;
  status: 'ACTIVE' | 'COMPLETED';
  sessionStatus?: ClassSessionStatus;
  demoState?: 'RUNNING' | 'PAUSED' | 'COMPLETED';
  lateThresholdMinutes?: number;
  records: AttendanceRecord[];
}

export interface FacultyUser {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  department: Department;
  designation: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  mobile: string;
  subjectsHandled: string[];
  semesters: Semester[];
  sections: Section[];
  assignedClasses?: string[];
  role: 'Faculty' | 'Head of Dept' | 'Admin' | 'Student';
  avatar: string;
  isOnboarded: boolean;
  cardUid?: string;
  student_id?: string;
  class_label?: string;
  is_face_enrolled?: boolean;
}

export interface TimetableSlot {
  id: string;
  facultyId: string;
  facultyName?: string;
  subjectCode: string;
  subjectName: string;
  course?: CourseClass;
  department: Department;
  semester: Semester;
  section: Section;
  classroom: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  periodNumber?: number;
  isBreak?: boolean;
  breakLabel?: string;
  isCancelled?: boolean;
  isSwapped?: boolean;
  replacementFacultyId?: string;
  replacementFacultyName?: string;
}

export interface TimetableValidationError {
  rowNumber?: number;
  slotId?: string;
  errorType: 'OVERLAP' | 'INVALID_RANGE' | 'MISSING_FIELD' | 'DUPLICATE';
  message: string;
}

export interface ClassSwapRequest {
  id: string;
  requesterFacultyId: string;
  requesterFacultyName: string;
  targetFacultyId: string;
  targetFacultyName: string;
  slotId: string;
  requestedDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface ClassCancellation {
  id: string;
  facultyId: string;
  facultyName: string;
  subjectCode: string;
  subjectName: string;
  date: string;
  reason: string;
  slotId?: string;
}

export interface ExtraClass {
  id: string;
  facultyId: string;
  facultyName: string;
  subjectCode: string;
  subjectName: string;
  course?: CourseClass;
  department: Department;
  semester: Semester;
  section: Section;
  classroom: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface FacultyLeave {
  id: string;
  facultyId: string;
  facultyName: string;
  startDate: string;
  endDate: string;
  reason: string;
  substituteFacultyId?: string;
  substituteFacultyName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface ExcelImportRow {
  slNo?: number;
  uucmsNo: string;
  name: string;
  course: CourseClass;
  section: Section;
  semester: Semester;
  cardUid: string;
  rfidTag?: string;
  photo?: string;
  email?: string;
  phone?: string;
  isValid: boolean;
  isDuplicate: boolean;
  validationError?: string;
}

export interface ExcelImportPreview {
  totalRows: number;
  validRowsCount: number;
  duplicateCount: number;
  invalidCount: number;
  rows: ExcelImportRow[];
}

export interface AuditLogEntry {
  id: string;
  studentName: string;
  uucmsNo: string;
  cardUid: string;
  fingerprintSlotId?: number;
  date: string;
  time: string;
  course: CourseClass;
  section: Section;
  facultyName: string;
  verificationResult: VerificationResultState;
  resultMessage: string;
  failedAttempts: number;
  deviceId: string;
  modifiedBy?: string;
  oldStatus?: string;
  newStatus?: string;
  reason?: string;
}

export interface AuditoriumCheckpoint {
  id: string;
  name: string; // e.g. AUD-GATE-01
  locationDescription?: string;
  assignedFacultyEmail?: string;
  assignedFacultyName?: string;
  status: 'ONLINE' | 'OFFLINE';
  attendanceCount: number;
}

export interface AuditoriumFacultyAssignment {
  id: string;
  eventId: string;
  facultyName: string;
  facultyEmail: string;
  role: 'EVENT_COORDINATOR' | 'CHECKPOINT_FACULTY';
  assignedCheckpointName?: string;
  isConnected: boolean;
}

export type EventRoleType = 'COORDINATOR' | 'ATTENDANCE_FACULTY' | 'VIEWER' | 'EVENT_COORDINATOR' | 'CHECKPOINT_FACULTY';

export interface EventFacultyAssignment {
  facultyId: string;
  facultyName: string;
  facultyEmail: string;
  roleInEvent: EventRoleType;
  stationName?: string;
  isBiometricVerified?: boolean;
  verifiedAt?: string;
}

export interface EventItem {
  id: string;
  name: string;
  eventType?: 'REGULAR' | 'AUDITORIUM';
  description?: string;
  department?: Department;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM AM/PM
  endTime: string;
  venue: string;
  coordinatorName: string;
  coordinatorEmail: string;
  eventCoordinator?: { name: string; email: string };
  instructions?: string;
  status: 'UPCOMING' | 'LIVE' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'PAUSED';
  allowCheckOut?: boolean;
  mode?: 'EVENT' | 'AUDITORIUM';
  expectedStrength?: number;
  participatingClasses?: string[];
  registeredStudentIds?: string[];
  verifiedFacultySessions?: { facultyId: string; facultyName: string; verifiedAt: string; cardUid: string }[];
  activeCheckpointsCount?: number;
  checkpoints?: AuditoriumCheckpoint[];
  facultyAssignments?: AuditoriumFacultyAssignment[];
  assignedFaculty?: EventFacultyAssignment[];
  records?: AttendanceRecord[];
  faceRecognitionEnabled?: boolean;
  cardRfidEnabled?: boolean;
  spacebarDemoEnabled?: boolean;
}

export interface EventAttendanceRecord {
  id: string;
  eventId: string;
  eventName: string;
  studentId: string;
  studentName: string;
  studentUucmsNo: string;
  department: Department;
  course: CourseClass;
  semester: Semester;
  section: Section;
  permanentClassTeacher: string;
  classTeacherEmail?: string;
  currentClassSubject: string;
  currentFacultyName: string;
  startedByFacultyId?: string;
  startedByFacultyName?: string;
  checkInTime: string;
  checkOutTime?: string;
  durationMinutes?: number;
  status: 'PRESENT' | 'CHECKED_OUT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  approvalStatus: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  approvedByTeacherName?: string;
  approvedByTeacherEmail?: string;
  approvalTimestamp?: string;
  rejectionReason?: string;
  verificationMethod: 'FACE_AND_RFID' | 'RFID_CARD' | 'MANUAL';
  verificationResult: 'SUCCESS';
  mode?: 'EVENT' | 'AUDITORIUM';
  checkpointName?: string; // e.g. AUD-GATE-01
  facultyDeviceName?: string; // e.g. Faculty 1 — Checkpoint 01
  firstCheckInTime?: string;
  firstCheckpointName?: string;
}

export interface EventApprovalNotification {
  id: string;
  eventAttendanceRecordId: string;
  studentId: string;
  studentName: string;
  studentRegisterNo: string;
  classSection: string;
  classTeacherEmail: string;
  classTeacherName: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  attendanceTime: string;
  eventFacultyName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface Program {
  id: string;
  code: string; // e.g. 'BCA', 'BBA', 'BCOM', 'BSC', 'BTECH', 'MCA', 'MBA'
  name: string; // e.g. 'Bachelor of Computer Applications'
  degreeLevel: 'UG' | 'PG' | 'DIPLOMA' | 'DOCTORAL';
  durationYears: number;
  totalSemesters: number;
  departmentId: string;
  departmentName: string;
}

export interface Specialization {
  id: string;
  programId: string;
  code: string; // e.g. 'AIML', 'DS', 'CYBER', 'FINANCE'
  name: string; // e.g. 'Artificial Intelligence & Machine Learning'
}

export interface Batch {
  id: string;
  programId: string;
  specializationId?: string;
  batchLabel: string; // e.g. 'BCA AIML 2024-2027'
  startYear: number;
  endYear: number;
}

export interface AcademicSemester {
  id: string;
  batchId: string;
  semesterNumber: Semester;
  yearLabel: string; // e.g. '2024-2025'
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  startDate?: string;
  endDate?: string;
}

export interface ClassSection {
  id: string;
  semesterId: string;
  sectionName: Section; // 'A', 'B', 'C', 'D'
  classroomNumber: string;
  programCode: string;
  specializationCode?: string;
  semesterNumber: Semester;
  fullClassLabel: string; // e.g. 'BCA AIML 3B'
  studentCount?: number;
}

export interface SubjectEnrollment {
  id: string;
  studentId: string;
  subjectId: string;
  sectionId: string;
  semesterNumber: Semester;
  enrollmentType: 'CORE' | 'LANGUAGE' | 'ELECTIVE' | 'OPEN_ELECTIVE' | 'LAB_BATCH';
  subgroupLabel?: string; // e.g. 'Kannada', 'Hindi', 'Lab Batch A'
  status: 'ACTIVE' | 'DROPPED' | 'COMPLETED';
}

export interface TeachingAssignment {
  id: string;
  facultyId: string;
  subjectId: string;
  sectionId: string;
  semesterNumber: Semester;
  subgroupFilter?: string; // e.g. 'Kannada' for language, NULL for full class
  isActive: boolean;
  subjectCode: string;
  subjectName: string;
  fullClassLabel: string;
  facultyName: string;
}

export interface AttendanceCorrectionRequest {
  id: string;
  attendanceRecordId: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  studentUucmsNo: string;
  subjectCode: string;
  requestedStatus: 'PRESENT' | 'ABSENT' | 'LATE';
  currentStatus: 'PRESENT' | 'ABSENT' | 'LATE' | 'PENDING';
  reason: string;
  requestedByFacultyId: string;
  requestedByFacultyName: string;
  requestedAt: string;
  reviewedByAdminId?: string;
  reviewedAt?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
}

export interface IssueReportItem {
  id: string;
  reportedByFacultyId: string;
  reportedByFacultyName: string;
  category: 'STUDENT_MISSING' | 'WRONG_INFO' | 'WRONG_PHOTO' | 'RFID_PROBLEM' | 'WRONG_SUBJECT' | 'WRONG_CLASS' | 'TIMETABLE_ISSUE' | 'ATTENDANCE_ISSUE' | 'OTHER';
  description: string;
  studentId?: string;
  sectionId?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  resolutionNotes?: string;
  resolvedByAdminId?: string;
  createdAt: string;
}

export interface AdminUserAccount {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ACADEMIC_ADMIN' | 'IT_MAINTENANCE_ADMIN';
  department?: string;
  avatar?: string;
}

export interface AuditLogItem {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: 'STUDENT' | 'ATTENDANCE' | 'TIMETABLE' | 'TEACHING_ASSIGNMENT' | 'CORRECTION' | 'SYSTEM';
  entityId: string;
  oldValueJson?: string;
  newValueJson?: string;
  timestamp: string;
  ipAddress?: string;
}

export interface FacultySubstitutionRecord {
  id: string;
  timetableId: string;
  originalFacultyId: string;
  originalFacultyName: string;
  substituteFacultyId: string;
  substituteFacultyName: string;
  date: string;
  reason: string;
  approvedByAdminId?: string;
}

export interface EventNotification {
  id: string;
  recipientFacultyEmail: string;
  recipientFacultyName: string;
  recipientRole: 'CURRENT_FACULTY' | 'PERMANENT_CLASS_TEACHER';
  eventId: string;
  eventName: string;
  studentName: string;
  studentClass: string;
  currentClassSubject?: string;
  checkInTime: string;
  message: string;
  isGrouped?: boolean;
  studentCount?: number;
  timestamp: string;
}


