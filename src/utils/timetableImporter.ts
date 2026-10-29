// Timetable Excel Parser & Comprehensive Pre-Save Validation Engine

import * as XLSX from 'xlsx';
import { TimetableSlot, TimetableValidationError, DayOfWeek, CourseClass, Semester, Section, Department } from '@/types';

export interface TimetableImportPreview {
  totalRows: number;
  validSlotsCount: number;
  errorCount: number;
  slots: TimetableSlot[];
  errors: TimetableValidationError[];
}

/**
 * Convert time string "09:00 AM" / "14:30" to minutes from midnight for overlap comparison
 */
export const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return -1;

  const clean = timeStr.trim().toUpperCase();
  let hours = 0;
  let minutes = 0;

  if (clean.includes('AM') || clean.includes('PM')) {
    const isPM = clean.includes('PM');
    const timeParts = clean.replace(/AM|PM/g, '').trim().split(':');
    hours = parseInt(timeParts[0], 10);
    minutes = parseInt(timeParts[1] || '0', 10);

    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
  } else {
    const parts = clean.split(':');
    hours = parseInt(parts[0], 10);
    minutes = parseInt(parts[1] || '0', 10);
  }

  return hours * 60 + minutes;
};

import { normalizeCourseName, normalizeSemesterNum, normalizeSectionStr } from './excelImporter';

export const normalizeDayOfWeek = (val: string): DayOfWeek => {
  if (!val) return 'Monday';
  const clean = val.trim().toLowerCase();
  if (clean.includes('mon')) return 'Monday';
  if (clean.includes('tue')) return 'Tuesday';
  if (clean.includes('wed')) return 'Wednesday';
  if (clean.includes('thu')) return 'Thursday';
  if (clean.includes('fri')) return 'Friday';
  if (clean.includes('sat')) return 'Saturday';
  if (clean.includes('sun')) return 'Sunday';
  return 'Monday';
};

/**
 * Pre-Save Timetable Validation Engine
 */
export const validateTimetableSlots = (
  newSlots: TimetableSlot[],
  existingSlots: TimetableSlot[] = []
): TimetableValidationError[] => {
  const errors: TimetableValidationError[] = [];
  
  // Filter out existing slots that are being replaced by new slots for the same class/section/day/time
  const filteredExisting = existingSlots.filter(existing => {
    return !newSlots.some(n => 
      n.day === existing.day &&
      n.course === existing.course &&
      n.semester === existing.semester &&
      n.section === existing.section &&
      n.startTime === existing.startTime
    );
  });

  const allSlots = [...filteredExisting, ...newSlots];

  newSlots.forEach((slot, idx) => {
    const rowNum = idx + 1;

    // 1. Missing required fields check
    if (!slot.day || !slot.startTime || !slot.endTime || !slot.subjectCode || !slot.classroom) {
      errors.push({
        rowNumber: rowNum,
        slotId: slot.id,
        errorType: 'MISSING_FIELD',
        message: `Row #${rowNum}: Missing required timetable fields (Day, Time, Subject, or Room).`,
      });
      return;
    }

    // 2. Invalid time range check
    const startMins = parseTimeToMinutes(slot.startTime);
    const endMins = parseTimeToMinutes(slot.endTime);

    if (startMins < 0 || endMins < 0 || endMins <= startMins) {
      errors.push({
        rowNumber: rowNum,
        slotId: slot.id,
        errorType: 'INVALID_RANGE',
        message: `Row #${rowNum} (${slot.subjectCode}): Invalid class time range (${slot.startTime} to ${slot.endTime}). End time must be after start time.`,
      });
    }

    // 3. Overlap & Duplicate check against all other slots
    allSlots.forEach((other) => {
      if (other.id === slot.id || other.day !== slot.day) return;

      const otherStart = parseTimeToMinutes(other.startTime);
      const otherEnd = parseTimeToMinutes(other.endTime);

      const isTimeOverlapping = Math.max(startMins, otherStart) < Math.min(endMins, otherEnd);

      if (isTimeOverlapping) {
        // Room Overlap
        if (other.classroom.trim().toLowerCase() === slot.classroom.trim().toLowerCase()) {
          errors.push({
            rowNumber: rowNum,
            slotId: slot.id,
            errorType: 'OVERLAP',
            message: `Row #${rowNum} (${slot.subjectCode}): Room conflict! ${slot.classroom} is already occupied by ${other.subjectCode} on ${slot.day} (${other.startTime} - ${other.endTime}).`,
          });
        }
      }
    });
  });

  return errors;
};

/**
 * Parse Timetable Excel (.xlsx, .xls, .csv) File
 */
export const parseTimetableExcel = async (
  file: File,
  existingSlots: TimetableSlot[] = []
): Promise<TimetableImportPreview> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          throw new Error('Empty file buffer');
        }

        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        const slots: TimetableSlot[] = [];

        rawRows.forEach((row, i) => {
          const keys = Object.keys(row);
          const getKey = (...possibleNames: string[]) => {
            const foundKey = keys.find(k => 
              possibleNames.some(p => k.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === p.toLowerCase().replace(/[^a-z0-9]/g, ''))
            );
            return foundKey ? String(row[foundKey]).trim() : '';
          };

          const rawDay = getKey('Day', 'DayOfWeek', 'Day of Week');
          const day = normalizeDayOfWeek(rawDay);
          const startTime = getKey('Start Time', 'StartTime', 'From Time', 'Start') || '09:00 AM';
          const endTime = getKey('End Time', 'EndTime', 'To Time', 'End') || '10:00 AM';
          const subjectCode = getKey('Subject Code', 'SubjectCode', 'Code', 'Sub Code') || 'CS301';
          const subjectName = getKey('Subject Name', 'SubjectName', 'Subject', 'Title') || 'Data Structures';
          
          const rawCourse = getKey('Course', 'Class', 'Branch', 'Degree');
          const rawSem = getKey('Semester', 'Sem', 'Term');
          const rawSec = getKey('Section', 'Sec');

          const course = normalizeCourseName(rawCourse, 'BCA AIML');
          const semester = normalizeSemesterNum(rawSem, 3);
          const section = normalizeSectionStr(rawSec, 'B');

          const classroom = getKey('Room', 'Classroom', 'Hall', 'Venue') || 'Room 204';
          const facultyName = getKey('Faculty', 'Faculty Name', 'Teacher', 'Lecturer') || 'Dr. Alan Turing';

          const slot: TimetableSlot = {
            id: `SLOT-EXCEL-${Date.now()}-${i}`,
            facultyId: 'FAC-101',
            facultyName,
            subjectCode,
            subjectName,
            course,
            department: 'Computer Science',
            semester,
            section,
            classroom,
            day,
            startTime,
            endTime,
          };

          slots.push(slot);
        });

        const validationErrors = validateTimetableSlots(slots, existingSlots);

        resolve({
          totalRows: slots.length,
          validSlotsCount: Math.max(0, slots.length - validationErrors.length),
          errorCount: validationErrors.length,
          slots,
          errors: validationErrors,
        });
      } catch (err) {
        console.error('Failed to parse timetable Excel file:', err);
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Download Sample Timetable Excel (.xlsx) Template
 */
export const downloadSampleTimetableTemplate = () => {
  const sampleData = [
    {
      'Day': 'Monday',
      'Start Time': '09:00 AM',
      'End Time': '10:00 AM',
      'Subject Code': 'CS301',
      'Subject Name': 'Database Management Systems',
      'Course': 'BCA AIML',
      'Semester': 3,
      'Section': 'B',
      'Room': 'Room 201',
      'Faculty Name': 'Dr. Alan Turing',
    },
    {
      'Day': 'Monday',
      'Start Time': '10:00 AM',
      'End Time': '11:00 AM',
      'Subject Code': 'CS302',
      'Subject Name': 'Artificial Intelligence & Machine Learning',
      'Course': 'BCA AIML',
      'Semester': 3,
      'Section': 'B',
      'Room': 'Room 201',
      'Faculty Name': 'Prof. Marie Curie',
    },
    {
      'Day': 'Tuesday',
      'Start Time': '11:15 AM',
      'End Time': '12:15 PM',
      'Subject Code': 'CS303',
      'Subject Name': 'Data Structures & Algorithms',
      'Course': 'BCA AIML',
      'Semester': 3,
      'Section': 'B',
      'Room': 'Room 201',
      'Faculty Name': 'Prof. Anil',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Timetable_Schedule');

  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 35 },
    { wch: 14 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 20 },
  ];

  XLSX.writeFile(workbook, 'CAIAS_Timetable_Schedule_Template.xlsx');
};
