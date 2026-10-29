import * as XLSX from 'xlsx';
import { Student, CourseClass, Semester, Section, Department, ExcelImportPreview, ExcelImportRow } from '@/types';

export const normalizeCourseName = (val: string, fallback: CourseClass): CourseClass => {
  if (!val) return fallback;
  const clean = val.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.includes('aiml') || clean.includes('ai') || clean.includes('ml') || clean.includes('bca')) return 'BCA AIML';
  if (clean.includes('data') || clean.includes('ds')) return 'B.Sc Data Science';
  if (clean.includes('ece') || clean.includes('elec')) return 'B.Tech ECE';
  if (clean.includes('me') || clean.includes('mech')) return 'B.Tech ME';
  if (clean.includes('cse') || clean.includes('cs') || clean.includes('tech')) return 'B.Tech CSE';
  return fallback;
};

export const normalizeSemesterNum = (val: unknown, fallback: Semester): Semester => {
  if (!val) return fallback;
  const str = String(val).replace(/[^0-9]/g, '');
  const num = parseInt(str, 10);
  if ([1, 2, 3, 4, 5, 6, 7, 8].includes(num)) {
    return num as Semester;
  }
  return fallback;
};

export const normalizeSectionStr = (val: string, fallback: Section): Section => {
  if (!val) return fallback;
  const clean = val.trim().toUpperCase().replace(/[^A-D]/g, '');
  if (['A', 'B', 'C', 'D'].includes(clean)) {
    return clean as Section;
  }
  return fallback;
};

/**
 * Parse Student Roster Excel (.xlsx, .xls, .csv) File
 */
export const parseExcelStudentFile = async (
  file: File,
  targetCourse: CourseClass,
  targetSemester: Semester,
  targetSection: Section,
  existingStudents: Student[]
): Promise<ExcelImportPreview> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          throw new Error('File buffer is empty');
        }

        // Read as ArrayBuffer for 100% browser binary compatibility
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Raw JSON rows from worksheet
        const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const existingUucmsSet = new Set(
          existingStudents.map(s => (s.uucmsNo || s.rollNo || '').trim().toLowerCase()).filter(Boolean)
        );
        const existingCardUidSet = new Set(
          existingStudents.map(s => (s.cardUid || s.rfidTag || '').trim().toLowerCase()).filter(Boolean)
        );

        const parsedRows: ExcelImportRow[] = [];
        let validCount = 0;
        let duplicateCount = 0;
        let invalidCount = 0;

        rawRows.forEach((row, idx) => {
          const keys = Object.keys(row);

          // Flexible header column key matching
          const getKey = (...possibleNames: string[]) => {
            const foundKey = keys.find(k => 
              possibleNames.some(p => k.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === p.toLowerCase().replace(/[^a-z0-9]/g, ''))
            );
            return foundKey ? String(row[foundKey]).trim() : '';
          };

          const slNo = Number(getKey('Sl No', 'SlNo', 'SNo', 'ID', 'Index')) || (idx + 1);
          const uucmsNo = getKey('UUCMS No', 'UUCMS', 'Register Number', 'Register No', 'Reg No', 'RegNo', 'USN', 'Roll Number', 'Roll No', 'RollNo', 'Student ID');
          const name = getKey('Student Name', 'Name', 'Full Name', 'Name of Student', 'StudentName', 'Candidate Name');
          
          const rawClass = getKey('Class', 'Course', 'Branch', 'Degree');
          const rawSem = getKey('Semester', 'Sem', 'Term');
          const rawSec = getKey('Section', 'Sec');

          const finalCourse = normalizeCourseName(rawClass, targetCourse);
          const finalSem = normalizeSemesterNum(rawSem, targetSemester);
          const finalSec = normalizeSectionStr(rawSec, targetSection);

          let cardUidVal = getKey('Card UID', 'CardUID', 'RFID Tag', 'RFID', 'Card ID', 'Smart Card UID', 'Tag ID', 'CardNo', 'Card No', 'NFC UID');
          if (!cardUidVal) {
            // Generate deterministic mock RFID tag if omitted in Excel
            const hexParts = [
              (0xA7 + (idx % 50)).toString(16).toUpperCase(),
              (0xB2 + (idx % 30)).toString(16).toUpperCase(),
              (0x91 + (idx % 40)).toString(16).toUpperCase(),
              (0x4C + (idx % 20)).toString(16).toUpperCase(),
            ];
            cardUidVal = hexParts.join(':');
          }

          const photoVal = getKey('Photo', 'Student Photo', 'Image', 'Avatar', 'Photo URL');

          let isValid = true;
          let isDuplicate = false;
          let validationError = '';

          if (!name || !uucmsNo) {
            isValid = false;
            validationError = 'Missing Student Name or UUCMS Register Number';
            invalidCount++;
          } else if (existingUucmsSet.has(uucmsNo.toLowerCase())) {
            isValid = false;
            isDuplicate = true;
            validationError = `Duplicate UUCMS No: ${uucmsNo} already exists in database`;
            duplicateCount++;
          } else if (existingCardUidSet.has(cardUidVal.toLowerCase())) {
            isValid = false;
            isDuplicate = true;
            validationError = `Duplicate Card UID: ${cardUidVal} already assigned to another student`;
            duplicateCount++;
          } else {
            validCount++;
            existingUucmsSet.add(uucmsNo.toLowerCase());
            existingCardUidSet.add(cardUidVal.toLowerCase());
          }

          parsedRows.push({
            slNo,
            uucmsNo: uucmsNo || `UUCMS-ERR-${idx + 1}`,
            name: name || `Student ${idx + 1}`,
            course: finalCourse,
            section: finalSec,
            semester: finalSem,
            cardUid: cardUidVal,
            rfidTag: cardUidVal,
            photo: photoVal || undefined,
            email: `${(uucmsNo || 'student').toLowerCase()}@caias.edu.in`,
            phone: '+91 98765 43210',
            isValid,
            isDuplicate,
            validationError,
          });
        });

        resolve({
          totalRows: rawRows.length,
          validRowsCount: validCount,
          duplicateCount,
          invalidCount,
          rows: parsedRows,
        });

      } catch (err) {
        console.error('Error parsing Excel student file:', err);
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Generate and Download Sample BCAAIMLB Student Roster Excel (.xlsx) Template
 */
export const downloadSampleStudentExcelTemplate = () => {
  const sampleData = [
    {
      'Sl No': 1,
      'UUCMS No': 'U18AI23S001',
      'Student Name': 'Aarav Sharma',
      'Class': 'BCA AIML',
      'Section': 'B',
      'Card UID': 'A7:B2:91:4C',
    },
    {
      'Sl No': 2,
      'UUCMS No': 'U18AI23S002',
      'Student Name': 'Ananya Rao',
      'Class': 'BCA AIML',
      'Section': 'B',
      'Card UID': 'C4:D8:12:9E',
    },
    {
      'Sl No': 3,
      'UUCMS No': 'U18AI23S003',
      'Student Name': 'Rohan Gupta',
      'Class': 'BCA AIML',
      'Section': 'B',
      'Card UID': 'E5:F1:43:8B',
    },
    {
      'Sl No': 4,
      'UUCMS No': 'U18AI23S004',
      'Student Name': 'Sneha Reddy',
      'Class': 'BCA AIML',
      'Section': 'B',
      'Card UID': 'F9:A3:77:2D',
    },
    {
      'Sl No': 5,
      'UUCMS No': 'U18AI23S005',
      'Student Name': 'Vikram Singh',
      'Class': 'BCA AIML',
      'Section': 'B',
      'Card UID': 'B2:C9:88:1A',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students_Roster');

  // Auto-fit column widths
  worksheet['!cols'] = [
    { wch: 8 },
    { wch: 16 },
    { wch: 22 },
    { wch: 14 },
    { wch: 10 },
    { wch: 16 },
  ];

  XLSX.writeFile(workbook, 'CAIAS_Student_Roster_Template.xlsx');
};
