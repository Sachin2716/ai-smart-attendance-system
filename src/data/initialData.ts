import {
  Student,
  Subject,
  AttendanceSession,
  FacultyUser,
  TimetableSlot,
  ClassSwapRequest,
  ClassCancellation,
  FacultyLeave,
  EventItem,
  EventAttendanceRecord,
  Program,
  Specialization,
  Batch,
  AcademicSemester,
  ClassSection,
  SubjectEnrollment,
  TeachingAssignment,
  AdminUserAccount,
  AuditLogItem,
  IssueReportItem,
  AttendanceCorrectionRequest,
  FacultySubstitutionRecord,
} from '@/types';
import { generateDeterministicEmbedding } from '@/utils/faceRecognition';

// --- ACADEMIC HIERARCHY SEED DATA ---

export const initialPrograms: Program[] = [
  { id: 'PROG-BCA', code: 'BCA', name: 'Bachelor of Computer Applications', degreeLevel: 'UG', durationYears: 3, totalSemesters: 6, departmentId: 'DEPT-CS', departmentName: 'Computer Science' },
  { id: 'PROG-BTECH', code: 'BTECH', name: 'Bachelor of Technology (CSE)', degreeLevel: 'UG', durationYears: 4, totalSemesters: 8, departmentId: 'DEPT-CS', departmentName: 'Computer Science' },
  { id: 'PROG-BSC', code: 'BSC', name: 'Bachelor of Science (Data Science)', degreeLevel: 'UG', durationYears: 3, totalSemesters: 6, departmentId: 'DEPT-AI', departmentName: 'AI & Data Science' },
  { id: 'PROG-BBA', code: 'BBA', name: 'Bachelor of Business Administration', degreeLevel: 'UG', durationYears: 3, totalSemesters: 6, departmentId: 'DEPT-MGMT', departmentName: 'Management Studies' },
  { id: 'PROG-BCOM', code: 'BCOM', name: 'Bachelor of Commerce', degreeLevel: 'UG', durationYears: 3, totalSemesters: 6, departmentId: 'DEPT-COMM', departmentName: 'Commerce' },
];

export const initialSpecializations: Specialization[] = [
  { id: 'SPEC-AIML', programId: 'PROG-BCA', code: 'AIML', name: 'Artificial Intelligence & Machine Learning' },
  { id: 'SPEC-DS', programId: 'PROG-BSC', code: 'DS', name: 'Data Science & Big Analytics' },
  { id: 'SPEC-FIN', programId: 'PROG-BBA', code: 'FINANCE', name: 'Finance & Banking' },
  { id: 'SPEC-CYBER', programId: 'PROG-BTECH', code: 'CYBER', name: 'Cyber Security & Forensic' },
];

export const initialBatches: Batch[] = [
  { id: 'BATCH-BCA-2024', programId: 'PROG-BCA', specializationId: 'SPEC-AIML', batchLabel: 'BCA AIML 2024-2027', startYear: 2024, endYear: 2027 },
  { id: 'BATCH-BTECH-2024', programId: 'PROG-BTECH', specializationId: 'SPEC-CYBER', batchLabel: 'B.Tech CSE 2024-2028', startYear: 2024, endYear: 2028 },
  { id: 'BATCH-BBA-2024', programId: 'PROG-BBA', specializationId: 'SPEC-FIN', batchLabel: 'BBA Finance 2024-2027', startYear: 2024, endYear: 2027 },
];

export const initialAcademicSemesters: AcademicSemester[] = [
  { id: 'SEM-BCA-3', batchId: 'BATCH-BCA-2024', semesterNumber: 3, yearLabel: '2024-2025', status: 'ACTIVE', startDate: '2024-08-01', endDate: '2024-12-20' },
  { id: 'SEM-BTECH-1', batchId: 'BATCH-BTECH-2024', semesterNumber: 1, yearLabel: '2024-2025', status: 'ACTIVE', startDate: '2024-08-01', endDate: '2024-12-20' },
  { id: 'SEM-BBA-2', batchId: 'BATCH-BBA-2024', semesterNumber: 2, yearLabel: '2024-2025', status: 'ACTIVE', startDate: '2024-08-01', endDate: '2024-12-20' },
];

export const initialClassSections: ClassSection[] = [
  { id: 'SEC-BCA-3B', semesterId: 'SEM-BCA-3', sectionName: 'B', classroomNumber: 'Room 201', programCode: 'BCA', specializationCode: 'AIML', semesterNumber: 3, fullClassLabel: 'BCA AIML 3B', studentCount: 60 },
  { id: 'SEC-BTECH-1A', semesterId: 'SEM-BTECH-1', sectionName: 'A', classroomNumber: 'Lab 305', programCode: 'BTECH', specializationCode: 'CSE', semesterNumber: 1, fullClassLabel: 'B.Tech CSE 1A', studentCount: 45 },
  { id: 'SEC-BBA-2B', semesterId: 'SEM-BBA-2', sectionName: 'B', classroomNumber: 'Room 104', programCode: 'BBA', specializationCode: 'FINANCE', semesterNumber: 2, fullClassLabel: 'BBA Finance 2B', studentCount: 50 },
];

// --- SUBJECTS (Core + Language + Elective) ---

export const initialSubjects: Subject[] = [
  { id: 'SUB-CS301', code: 'CS301', name: 'Python Programming', department: 'Computer Science', course: 'BCA AIML', semester: 3, credits: 4 },
  { id: 'SUB-CS501', code: 'CS501', name: 'Database Management Systems (DBMS)', department: 'Computer Science', course: 'BCA AIML', semester: 3, credits: 4 },
  { id: 'SUB-MA301', code: 'MA301', name: 'Mathematics & Linear Algebra', department: 'Computer Science', course: 'BCA AIML', semester: 3, credits: 4 },
  { id: 'SUB-AI401', code: 'AI401', name: 'Artificial Intelligence', department: 'AI & Data Science', course: 'BCA AIML', semester: 3, credits: 4 },
  { id: 'SUB-ML301', code: 'ML301', name: 'Machine Learning Fundamentals', department: 'AI & Data Science', course: 'BCA AIML', semester: 3, credits: 4 },
  { id: 'SUB-ST301', code: 'ST301', name: 'Statistics & Probability', department: 'AI & Data Science', course: 'BCA AIML', semester: 3, credits: 3 },
  { id: 'SUB-LAB301', code: 'LAB301', name: 'Programming & AI Lab', department: 'Computer Science', course: 'BCA AIML', semester: 3, credits: 2 },
  
  // Languages
  { id: 'SUB-KAN301', code: 'KAN301', name: 'Kannada Language III', department: 'Computer Science', course: 'BCA AIML', semester: 3, credits: 3 },
  { id: 'SUB-HIN301', code: 'HIN301', name: 'Hindi Language III', department: 'Computer Science', course: 'BCA AIML', semester: 3, credits: 3 },
  { id: 'SUB-TAM301', code: 'TAM301', name: 'Tamil Language III', department: 'Computer Science', course: 'BCA AIML', semester: 3, credits: 3 },
  { id: 'SUB-MAL301', code: 'MAL301', name: 'Malayalam Language III', department: 'Computer Science', course: 'BCA AIML', semester: 3, credits: 3 },
  { id: 'SUB-SAN301', code: 'SAN301', name: 'Sanskrit Language III', department: 'Computer Science', course: 'BCA AIML', semester: 3, credits: 3 },

  // External Courses for Multi-Course Faculty Test
  { id: 'SUB-ARCH101', code: 'ARCH101', name: 'Computer Architecture & Systems', department: 'Computer Science', course: 'B.Tech CSE', semester: 1, credits: 4 },
  { id: 'SUB-BSTAT201', code: 'BSTAT201', name: 'Business Statistics & Analytics', department: 'AI & Data Science', course: 'BBA', semester: 2, credits: 4 },
];

// --- FACULTY USERS ---

export const initialFaculty: FacultyUser = {
  id: 'FAC-101',
  name: 'Dr. Alan Turing',
  email: 'alan.turing@college.edu',
  employeeId: 'EMP-CS-4082',
  department: 'Computer Science',
  designation: 'Associate Professor',
  age: 42,
  gender: 'Male',
  mobile: '+91 98765 11223',
  subjectsHandled: ['CS301', 'CS501', 'AI401', 'ARCH101', 'BSTAT201'],
  semesters: [1, 2, 3, 5],
  sections: ['A', 'B'],
  role: 'Faculty',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  isOnboarded: true,
};

export const hodFaculty: FacultyUser = {
  id: 'FAC-100',
  name: 'Prof. Marie Curie',
  email: 'marie.curie@college.edu',
  employeeId: 'EMP-HOD-001',
  department: 'Computer Science',
  designation: 'Head of Department',
  age: 48,
  gender: 'Female',
  mobile: '+91 98765 99887',
  subjectsHandled: ['CS501', 'AI401'],
  semesters: [3, 5],
  sections: ['A', 'B', 'C'],
  role: 'Head of Dept',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  isOnboarded: true,
};

export const languageFacultyKannada: FacultyUser = {
  id: 'FAC-102',
  name: 'Prof. Rajesh Kumar',
  email: 'rajesh.k@college.edu',
  employeeId: 'EMP-LANG-102',
  department: 'Computer Science',
  designation: 'Assistant Professor (Kannada)',
  age: 38,
  gender: 'Male',
  mobile: '+91 98765 33445',
  subjectsHandled: ['KAN301'],
  semesters: [3],
  sections: ['B'],
  role: 'Faculty',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  isOnboarded: true,
};

export const languageFacultyHindi: FacultyUser = {
  id: 'FAC-103',
  name: 'Prof. Anita Sharma',
  email: 'anita.s@college.edu',
  employeeId: 'EMP-LANG-103',
  department: 'Computer Science',
  designation: 'Assistant Professor (Hindi)',
  age: 36,
  gender: 'Female',
  mobile: '+91 98765 55667',
  subjectsHandled: ['HIN301'],
  semesters: [3],
  sections: ['B'],
  role: 'Faculty',
  avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  isOnboarded: true,
};

// --- TEACHING ASSIGNMENTS (FACULTY -> SUBJECT + CLASS + SUBGROUP FILTER) ---

export const initialTeachingAssignments: TeachingAssignment[] = [
  {
    id: 'TA-CS501-3B',
    facultyId: 'FAC-101',
    facultyName: 'Dr. Alan Turing',
    subjectId: 'SUB-CS501',
    subjectCode: 'CS501',
    subjectName: 'Database Management Systems (DBMS)',
    sectionId: 'SEC-BCA-3B',
    fullClassLabel: 'BCA AIML 3B',
    semesterNumber: 3,
    isActive: true,
  },
  {
    id: 'TA-CS301-3B',
    facultyId: 'FAC-101',
    facultyName: 'Dr. Alan Turing',
    subjectId: 'SUB-CS301',
    subjectCode: 'CS301',
    subjectName: 'Python Programming',
    sectionId: 'SEC-BCA-3B',
    fullClassLabel: 'BCA AIML 3B',
    semesterNumber: 3,
    isActive: true,
  },
  {
    id: 'TA-ARCH101-1A',
    facultyId: 'FAC-101',
    facultyName: 'Dr. Alan Turing',
    subjectId: 'SUB-ARCH101',
    subjectCode: 'ARCH101',
    subjectName: 'Computer Architecture & Systems',
    sectionId: 'SEC-BTECH-1A',
    fullClassLabel: 'B.Tech CSE 1A',
    semesterNumber: 1,
    isActive: true,
  },
  {
    id: 'TA-BSTAT201-2B',
    facultyId: 'FAC-101',
    facultyName: 'Dr. Alan Turing',
    subjectId: 'SUB-BSTAT201',
    subjectCode: 'BSTAT201',
    subjectName: 'Business Statistics & Analytics',
    sectionId: 'SEC-BBA-2B',
    fullClassLabel: 'BBA Finance 2B',
    semesterNumber: 2,
    isActive: true,
  },
  {
    id: 'TA-KAN301-3B',
    facultyId: 'FAC-102',
    facultyName: 'Prof. Rajesh Kumar',
    subjectId: 'SUB-KAN301',
    subjectCode: 'KAN301',
    subjectName: 'Kannada Language III',
    sectionId: 'SEC-BCA-3B',
    fullClassLabel: 'BCA AIML 3B',
    semesterNumber: 3,
    subgroupFilter: 'Kannada', // Exactly 30 students!
    isActive: true,
  },
  {
    id: 'TA-HIN301-3B',
    facultyId: 'FAC-103',
    facultyName: 'Prof. Anita Sharma',
    subjectId: 'SUB-HIN301',
    subjectCode: 'HIN301',
    subjectName: 'Hindi Language III',
    sectionId: 'SEC-BCA-3B',
    fullClassLabel: 'BCA AIML 3B',
    semesterNumber: 3,
    subgroupFilter: 'Hindi', // Exactly 20 students!
    isActive: true,
  },
];

// --- MASTER 60 STUDENTS FOR BCA AIML 3B ---

const firstNames = [
  'Aarav', 'Aditya', 'Akash', 'Ananya', 'Rohan', 'Priya', 'Vikram', 'Diya', 'Kabir', 'Sneha',
  'Arjun', 'Meera', 'Kiran', 'Rohit', 'Manoj', 'Neha', 'Siddharth', 'Ishaan', 'Tanvi', 'Varun',
  'Anil', 'Bhavna', 'Chetan', 'Deepa', 'Gautam', 'Harini', 'Jatin', 'Kavita', 'Lokesh', 'Madhav',
  'Nikhil', 'Omkar', 'Pooja', 'Rahul', 'Ritu', 'Sachin', 'Shreya', 'Tushar', 'Uma', 'Vijay',
  'Yash', 'Zoya', 'Abhinav', 'Bhoomika', 'Chirag', 'Divya', 'Eshwar', 'Gargi', 'Hemant', 'Indira',
  'Jay', 'Karthik', 'Lavanya', 'Manish', 'Naveen', 'Pradeep', 'Rajesh', 'Sanjay', 'Tarun', 'Vivek'
];

const lastNames = [
  'Sharma', 'Kumar', 'R', 'Verma', 'Gupta', 'Iyer', 'Patel', 'Rao', 'Mehta', 'Reddy',
  'Singh', 'Nair', 'Deshmukh', 'Joshi', 'Chawla', 'Saxena', 'Kulkarni', 'Bhat', 'Shetty', 'Pillai',
  'Gowda', 'Mishra', 'Pandey', 'Agarwal', 'Sen', 'Dutta', 'Banerjee', 'Ghosh', 'Chatterjee', 'Roy',
  'Choudhury', 'Bose', 'Das', 'Sengupta', 'Mukherjee', 'Dube', 'Trivedi', 'Shukla', 'Bhatt', 'Vyas',
  'Jha', 'Kashyap', 'Thakur', 'Chauhan', 'Rathore', 'Solanki', 'Parmar', 'Yadav', 'Saini', 'Malhotra',
  'Kapoor', 'Khanna', 'Bhasin', 'Suri', 'Anand', 'Ahluwalia', 'Sethi', 'Grover', 'S', 'K'
];

const avatarUrls = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
];

export const initialStudents: Student[] = Array.from({ length: 60 }, (_, index) => {
  const seq = (index + 1).toString().padStart(3, '0');
  const uucmsNo = `24BCA${seq}`;
  const name = `${firstNames[index % firstNames.length]} ${lastNames[index % lastNames.length]}`;
  const cardUid = `A7:B2:91:${(index + 1).toString(16).padStart(2, '0').toUpperCase()}`;
  const avatar = avatarUrls[index % avatarUrls.length];
  const studentId = `STU-${uucmsNo}`;

  return {
    id: studentId,
    uucmsNo,
    rollNo: uucmsNo,
    name,
    email: `${uucmsNo.toLowerCase()}@caias.edu.in`,
    phone: `+91 98765 ${(43210 + index).toString()}`,
    course: 'BCA AIML',
    department: 'Computer Science',
    semester: 3,
    section: 'B',
    cardUid,
    rfidTag: cardUid,
    fingerprintSlotId: index + 1,
    isFingerprintEnrolled: true,
    avatar,
    photo: avatar,
    attendancePercentage: 85 + (index % 15),
    status: 'active',
    joinedDate: '2024-08-01',
    isFaceEnrolled: true,
    encryptedFaceEmbedding: generateDeterministicEmbedding(studentId),
    facialEmbedding: generateDeterministicEmbedding(studentId),
  };
});

// --- SUBJECT ENROLLMENTS (30 Kannada, 20 Hindi, 4 Tamil, 3 Malayalam, 3 Sanskrit) ---

export const initialSubjectEnrollments: SubjectEnrollment[] = initialStudents.map((s, index) => {
  let langSubjectId = 'SUB-KAN301';
  let langLabel = 'Kannada';

  if (index >= 30 && index < 50) {
    langSubjectId = 'SUB-HIN301';
    langLabel = 'Hindi';
  } else if (index >= 50 && index < 54) {
    langSubjectId = 'SUB-TAM301';
    langLabel = 'Tamil';
  } else if (index >= 54 && index < 57) {
    langSubjectId = 'SUB-MAL301';
    langLabel = 'Malayalam';
  } else if (index >= 57) {
    langSubjectId = 'SUB-SAN301';
    langLabel = 'Sanskrit';
  }

  return {
    id: `ENROLL-${s.id}-LANG`,
    studentId: s.id,
    subjectId: langSubjectId,
    sectionId: 'SEC-BCA-3B',
    semesterNumber: 3,
    enrollmentType: 'LANGUAGE',
    subgroupLabel: langLabel,
    status: 'ACTIVE',
  };
});

// --- TIMETABLE FOR FACULTY DR. ALAN TURING ---

export const initialTimetable: TimetableSlot[] = [
  // Monday
  { id: 'SLOT-MON-1', facultyId: 'FAC-101', facultyName: 'Dr. Alan Turing', subjectCode: 'CS301', subjectName: 'Python Programming', course: 'BCA AIML', department: 'Computer Science', semester: 3, section: 'B', classroom: 'Room 201', day: 'Monday', startTime: '09:00 AM', endTime: '10:00 AM' },
  { id: 'SLOT-MON-2', facultyId: 'FAC-101', facultyName: 'Dr. Alan Turing', subjectCode: 'CS501', subjectName: 'DBMS', course: 'BCA AIML', department: 'Computer Science', semester: 3, section: 'B', classroom: 'Room 201', day: 'Monday', startTime: '10:00 AM', endTime: '11:00 AM' },
  { id: 'SLOT-MON-3', facultyId: 'FAC-101', facultyName: 'Dr. Alan Turing', subjectCode: 'ARCH101', subjectName: 'Computer Architecture', course: 'B.Tech CSE', department: 'Computer Science', semester: 1, section: 'A', classroom: 'Lab 305', day: 'Monday', startTime: '11:30 AM', endTime: '12:30 PM' },
  { id: 'SLOT-MON-4', facultyId: 'FAC-101', facultyName: 'Dr. Alan Turing', subjectCode: 'BSTAT201', subjectName: 'Business Statistics', course: 'BBA', department: 'AI & Data Science', semester: 2, section: 'B', classroom: 'Room 104', day: 'Monday', startTime: '02:05 PM', endTime: '03:05 PM' },

  // Tuesday
  { id: 'SLOT-TUE-1', facultyId: 'FAC-101', facultyName: 'Dr. Alan Turing', subjectCode: 'ARCH101', subjectName: 'Computer Architecture', course: 'B.Tech CSE', department: 'Computer Science', semester: 1, section: 'A', classroom: 'Lab 305', day: 'Tuesday', startTime: '09:00 AM', endTime: '10:00 AM' },
  { id: 'SLOT-TUE-2', facultyId: 'FAC-101', facultyName: 'Dr. Alan Turing', subjectCode: 'CS301', subjectName: 'Python Programming', course: 'BCA AIML', department: 'Computer Science', semester: 3, section: 'B', classroom: 'Room 201', day: 'Tuesday', startTime: '10:00 AM', endTime: '11:00 AM' },
  { id: 'SLOT-TUE-3', facultyId: 'FAC-101', facultyName: 'Dr. Alan Turing', subjectCode: 'CS501', subjectName: 'DBMS', course: 'BCA AIML', department: 'Computer Science', semester: 3, section: 'B', classroom: 'Room 201', day: 'Tuesday', startTime: '11:30 AM', endTime: '12:30 PM' },
  { id: 'SLOT-TUE-4', facultyId: 'FAC-101', facultyName: 'Dr. Alan Turing', subjectCode: 'BSTAT201', subjectName: 'Business Statistics', course: 'BBA', department: 'AI & Data Science', semester: 2, section: 'B', classroom: 'Room 104', day: 'Tuesday', startTime: '02:05 PM', endTime: '03:05 PM' },

  // Wednesday
  { id: 'SLOT-WED-1', facultyId: 'FAC-101', facultyName: 'Dr. Alan Turing', subjectCode: 'CS501', subjectName: 'DBMS', course: 'BCA AIML', department: 'Computer Science', semester: 3, section: 'B', classroom: 'Room 201', day: 'Wednesday', startTime: '09:00 AM', endTime: '10:00 AM' },
  { id: 'SLOT-WED-2', facultyId: 'FAC-101', facultyName: 'Dr. Alan Turing', subjectCode: 'ARCH101', subjectName: 'Computer Architecture', course: 'B.Tech CSE', department: 'Computer Science', semester: 1, section: 'A', classroom: 'Lab 305', day: 'Wednesday', startTime: '10:00 AM', endTime: '11:00 AM' },
  { id: 'SLOT-WED-3', facultyId: 'FAC-101', facultyName: 'Dr. Alan Turing', subjectCode: 'BSTAT201', subjectName: 'Business Statistics', course: 'BBA', department: 'AI & Data Science', semester: 2, section: 'B', classroom: 'Room 104', day: 'Wednesday', startTime: '11:30 AM', endTime: '12:30 PM' },
  { id: 'SLOT-WED-4', facultyId: 'FAC-101', facultyName: 'Dr. Alan Turing', subjectCode: 'CS301', subjectName: 'Python Programming', course: 'BCA AIML', department: 'Computer Science', semester: 3, section: 'B', classroom: 'Room 201', day: 'Wednesday', startTime: '02:05 PM', endTime: '03:05 PM' },

  // Thursday (Today default)
  { id: 'SLOT-THU-1', facultyId: 'FAC-101', facultyName: 'Dr. Alan Turing', subjectCode: 'CS301', subjectName: 'Python Programming', course: 'BCA AIML', department: 'Computer Science', semester: 3, section: 'B', classroom: 'Room 201', day: 'Thursday', startTime: '09:00 AM', endTime: '10:00 AM' },
  { id: 'SLOT-THU-2', facultyId: 'FAC-101', facultyName: 'Dr. Alan Turing', subjectCode: 'CS501', subjectName: 'DBMS', course: 'BCA AIML', department: 'Computer Science', semester: 3, section: 'B', classroom: 'Room 201', day: 'Thursday', startTime: '10:00 AM', endTime: '11:00 AM' },
  { id: 'SLOT-THU-3', facultyId: 'FAC-101', facultyName: 'Dr. Alan Turing', subjectCode: 'ARCH101', subjectName: 'Computer Architecture', course: 'B.Tech CSE', department: 'Computer Science', semester: 1, section: 'A', classroom: 'Lab 305', day: 'Thursday', startTime: '11:30 AM', endTime: '12:30 PM' },
  { id: 'SLOT-THU-4', facultyId: 'FAC-101', facultyName: 'Dr. Alan Turing', subjectCode: 'BSTAT201', subjectName: 'Business Statistics', course: 'BBA', department: 'AI & Data Science', semester: 2, section: 'B', classroom: 'Room 104', day: 'Thursday', startTime: '02:05 PM', endTime: '03:05 PM' },

  // Friday
  { id: 'SLOT-FRI-1', facultyId: 'FAC-101', facultyName: 'Dr. Alan Turing', subjectCode: 'ARCH101', subjectName: 'Computer Architecture', course: 'B.Tech CSE', department: 'Computer Science', semester: 1, section: 'A', classroom: 'Lab 305', day: 'Friday', startTime: '09:00 AM', endTime: '10:00 AM' },
  { id: 'SLOT-FRI-2', facultyId: 'FAC-101', facultyName: 'Dr. Alan Turing', subjectCode: 'CS501', subjectName: 'DBMS', course: 'BCA AIML', department: 'Computer Science', semester: 3, section: 'B', classroom: 'Room 201', day: 'Friday', startTime: '10:00 AM', endTime: '11:00 AM' },
  { id: 'SLOT-FRI-3', facultyId: 'FAC-101', facultyName: 'Dr. Alan Turing', subjectCode: 'BSTAT201', subjectName: 'Business Statistics', course: 'BBA', department: 'AI & Data Science', semester: 2, section: 'B', classroom: 'Room 104', day: 'Friday', startTime: '11:30 AM', endTime: '12:30 PM' },

  // Saturday
  { id: 'SLOT-SAT-1', facultyId: 'FAC-101', facultyName: 'Dr. Alan Turing', subjectCode: 'CS301', subjectName: 'Python Programming', course: 'BCA AIML', department: 'Computer Science', semester: 3, section: 'B', classroom: 'Room 201', day: 'Saturday', startTime: '09:00 AM', endTime: '10:00 AM' },
  { id: 'SLOT-SAT-2', facultyId: 'FAC-101', facultyName: 'Dr. Alan Turing', subjectCode: 'CS501', subjectName: 'DBMS', course: 'BCA AIML', department: 'Computer Science', semester: 3, section: 'B', classroom: 'Room 201', day: 'Saturday', startTime: '10:00 AM', endTime: '11:00 AM' },
];

// --- ADMIN USERS & SYSTEM DATA ---

export const initialAdminUsers: AdminUserAccount[] = [
  { id: 'ADM-101', name: 'Super Admin', email: 'admin@caias.edu.in', role: 'SUPER_ADMIN', department: 'Administration' },
  { id: 'ADM-102', name: 'Dr. Academic Director', email: 'academic@caias.edu.in', role: 'ACADEMIC_ADMIN', department: 'Academic Affairs' },
  { id: 'ADM-103', name: 'IT Support Manager', email: 'support@caias.edu.in', role: 'IT_MAINTENANCE_ADMIN', department: 'IT Services' },
];

export const initialAuditLogs: AuditLogItem[] = [
  { id: 'AUD-001', actorId: 'ADM-101', actorName: 'Super Admin', actorRole: 'SUPER_ADMIN', action: 'SYSTEM_INITIALIZED', entityType: 'SYSTEM', entityId: 'CAIAS-CORE', timestamp: new Date().toISOString() },
];

export const initialIssueReports: IssueReportItem[] = [];
export const initialCorrectionRequests: AttendanceCorrectionRequest[] = [];
export const initialSubstitutions: FacultySubstitutionRecord[] = [];

export const initialSessions: AttendanceSession[] = [];
export const initialSwapRequests: ClassSwapRequest[] = [];
export const initialCancellations: ClassCancellation[] = [];
export const initialLeaves: FacultyLeave[] = [];
export const initialEvents: EventItem[] = [];
export const initialEventRecords: EventAttendanceRecord[] = [];
