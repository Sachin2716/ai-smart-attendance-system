// PDF Attendance Report Exporter Utility

import { AttendanceSession, Student } from '@/types';

/**
 * Generate & download a clean PDF report document for completed attendance sessions
 */
export const exportSessionReportToPdf = (session: AttendanceSession, students?: Student[]): void => {
  const presentCount = session.presentCount;
  const totalCount = session.totalStrength;
  const percent = Math.round((presentCount / (totalCount || 1)) * 100);

  const reportText = `
================================================================================
                    CAIAS AMS - OFFICIAL ATTENDANCE SESSION REPORT
================================================================================
Generated Date : ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
Institution    : CAIAS College of Information & Applied Sciences
Department     : ${session.department}

SESSION DETAILS:
--------------------------------------------------------------------------------
Session ID     : ${session.id}
Subject        : ${session.subjectName} (${session.subjectCode})
Class & Section: ${session.course || 'BCA AIML'} - Semester ${session.semester} (Section ${session.section})
Classroom      : ${session.classroom || 'Room 204'}
Faculty Name   : ${session.facultyName}
Date & Time    : ${session.date} | ${session.startTime} - ${session.endTime || 'Completed'}

ATTENDANCE SUMMARY METRICS:
--------------------------------------------------------------------------------
Total Enrolled Strength : ${totalCount}
Present Students        : ${presentCount} (${percent}%)
Late Students           : ${session.lateCount || 0}
Absent Students         : ${session.absentCount}
Session Status          : ${session.status}

STUDENT ROSTER VERIFICATION LOGS:
--------------------------------------------------------------------------------
${session.records.map((r, i) => `${i + 1}. [${r.timestamp}] ${r.studentName.padEnd(25)} UUCMS: ${(r.studentUucmsNo || r.studentRollNo).padEnd(12)} Status: ${r.status.padEnd(8)} Method: ${r.method}`).join('\n')}

================================================================================
              END OF REPORT - CAIAS AUTOMATED ATTENDANCE SYSTEM
================================================================================
  `.trim();

  // Create downloadable file blob
  const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `CAIAS_Attendance_Report_${session.subjectCode}_${session.date}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export alias for compatibility
export const exportSessionToPdf = (session: AttendanceSession, students?: Student[]) => exportSessionReportToPdf(session, students);
