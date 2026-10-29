import * as XLSX from 'xlsx';
import { Student, AttendanceSession } from '@/types';

export const exportStudentsToExcel = (students: Student[], filename = 'Student_Master_Roster.xlsx') => {
  const data = students.map((s, index) => ({
    'S.No': index + 1,
    'Roll Number': s.rollNo,
    'Student Name': s.name,
    'RFID Tag ID': s.rfidTag,
    'Department': s.department,
    'Semester': `Sem ${s.semester}`,
    'Section': s.section,
    'Email Address': s.email,
    'Phone': s.phone,
    'Attendance %': `${s.attendancePercentage}%`,
    'Status': s.status.toUpperCase(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Custom column widths
  worksheet['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 14 }, // Roll
    { wch: 22 }, // Name
    { wch: 16 }, // RFID
    { wch: 24 }, // Dept
    { wch: 8 },  // Sem
    { wch: 8 },  // Sec
    { wch: 26 }, // Email
    { wch: 15 }, // Phone
    { wch: 14 }, // Att %
    { wch: 10 }, // Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
  XLSX.writeFile(workbook, filename);
};

export const exportSessionToExcel = (
  session: AttendanceSession, 
  allStudents: Student[], 
  filename?: string
) => {
  const presentStudentIds = new Set(session.records.map(r => r.studentId));
  
  // Filter class students
  const classStudents = allStudents.filter(
    s => s.department === session.department && 
         s.semester === session.semester && 
         s.section === session.section
  );

  const data = classStudents.map((s, idx) => {
    const record = session.records.find(r => r.studentId === s.id);
    const isPresent = presentStudentIds.has(s.id);
    
    return {
      'S.No': idx + 1,
      'Roll Number': s.rollNo,
      'Student Name': s.name,
      'RFID Tag ID': s.rfidTag,
      'Department': s.department,
      'Section': `${s.department} - Sem ${s.semester} (${s.section})`,
      'Subject': `${session.subjectCode} - ${session.subjectName}`,
      'Attendance Status': isPresent ? 'PRESENT' : 'ABSENT',
      'Time In': record ? record.timestamp : 'N/A',
      'Verification Method': record ? record.method : 'N/A',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');

  const defaultName = `${session.subjectCode}_Sem${session.semester}_Sec${session.section}_${session.date}.xlsx`;
  XLSX.writeFile(workbook, filename || defaultName);
};

export const exportEventAttendanceToExcel = (
  eventName: string,
  records: any[],
  filename = 'Event_Attendance_Report.xlsx'
) => {
  const data = records.map((r, idx) => ({
    'S.No': idx + 1,
    'Student Name': r.studentName,
    'Student ID / USN': r.studentUucmsNo,
    'Department': r.department,
    'Class & Section': `${r.course} Sem ${r.semester} (${r.section})`,
    'Event Name': r.eventName,
    'Date': r.date || new Date().toISOString().split('T')[0],
    'Check-In Time': r.checkInTime,
    'Check-Out Time': r.checkOutTime || 'N/A',
    'Duration (Mins)': r.durationMinutes || 'N/A',
    'Verification Method': r.verificationMethod,
    'Status': r.status,
    'Current Faculty': r.currentFacultyName || 'N/A',
    'Permanent Class Teacher': r.permanentClassTeacher,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Event Attendance');
  XLSX.writeFile(workbook, filename);
};

export const exportAuditoriumAttendanceToExcel = (
  eventName: string,
  records: any[],
  filename = 'Auditorium_Attendance_Report.xlsx'
) => {
  const data = records.map((r, idx) => ({
    'S.No': idx + 1,
    'Student Name': r.studentName,
    'Student ID / USN': r.studentUucmsNo,
    'Department': r.department,
    'Class & Section': `${r.course} Sem ${r.semester} (${r.section})`,
    'Event Name': r.eventName,
    'Date': r.date || new Date().toISOString().split('T')[0],
    'Check-In Time': r.checkInTime,
    'Check-Out Time': r.checkOutTime || 'N/A',
    'Checkpoint Gate': r.checkpointName || 'AUD-GATE-01',
    'Faculty / Device': r.facultyDeviceName || 'Faculty Checkpoint',
    'Verification Method': r.verificationMethod,
    'Current Faculty': r.currentFacultyName || 'N/A',
    'Permanent Class Teacher': r.permanentClassTeacher,
    'Status': r.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Auditorium Attendance');
  XLSX.writeFile(workbook, filename);
};

export const exportManualClassAttendanceToExcel = (
  courseInfo: {
    course: string;
    semester: number;
    section: string;
    subjectName: string;
    facultyName: string;
    date: string;
    period: string;
  },
  studentRows: Array<{
    slNo: number;
    name: string;
    uucmsNo: string;
    course: string;
    section: string;
    status: 'PRESENT' | 'ABSENT' | 'PENDING';
    timeMarked: string;
    method?: string;
  }>,
  filename?: string
) => {
  const data = studentRows.map((s) => ({
    'SL NO': s.slNo,
    'STUDENT ID': s.uucmsNo,
    'STUDENT NAME': s.name,
    'CLASS': s.course,
    'SECTION': s.section,
    'SUBJECT': courseInfo.subjectName,
    'DATE': courseInfo.date,
    'TIME': s.timeMarked || courseInfo.period,
    'STATUS': s.status,
    'METHOD': s.method || (s.status === 'PRESENT' ? 'Card + Face' : 'Manual'),
    'FACULTY': courseInfo.facultyName,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet['!cols'] = [
    { wch: 8 },  // SL NO
    { wch: 16 }, // STUDENT ID
    { wch: 22 }, // STUDENT NAME
    { wch: 14 }, // CLASS
    { wch: 10 }, // SECTION
    { wch: 30 }, // SUBJECT
    { wch: 12 }, // DATE
    { wch: 14 }, // TIME
    { wch: 12 }, // STATUS
    { wch: 16 }, // METHOD
    { wch: 20 }, // FACULTY
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');

  const defaultFilename = `${courseInfo.course.replace(/\s+/g, '_')}_Sem${courseInfo.semester}_Sec${courseInfo.section}_Attendance_${courseInfo.date}.xlsx`;
  XLSX.writeFile(workbook, filename || defaultFilename);
};

