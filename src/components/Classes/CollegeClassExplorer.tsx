'use client';

import React, { useState, useMemo } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Users, User, Search, Filter, Plus, FileSpreadsheet, ChevronRight, MapPin, Award, Mail, Phone, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { CourseClass, Semester, Section, Student, FacultyUser } from '@/types';
import { initialFaculty, hodFaculty } from '@/data/initialData';
import { exportStudentsToExcel } from '@/utils/exportExcel';

interface ClassSectionItem {
  id: string;
  course: CourseClass;
  semester: Semester;
  section: Section;
  department: string;
  room: string;
  assignedFaculty: FacultyUser;
  studentCount: number;
}

export const CollegeClassExplorer: React.FC<{
  onOpenAddModal: () => void;
  onEditStudent: (student: Student) => void;
  onViewStudent: (student: Student) => void;
}> = ({ onOpenAddModal, onEditStudent, onViewStudent }) => {
  const { students, selectedCourse, setSelectedCourse, selectedSemester, setSelectedSemester, selectedSection, setSelectedSection } = useAttendance();
  const { isAdmin } = useAuth();

  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [selectedClassCard, setSelectedClassCard] = useState<ClassSectionItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Entire College Master Class & Section Catalog
  const collegeClasses: ClassSectionItem[] = useMemo(() => [
    { id: 'BCA-3B', course: 'BCA AIML', semester: 3, section: 'B', department: 'Computer Science', room: 'Room 201', assignedFaculty: initialFaculty, studentCount: 60 },
    { id: 'BCA-3A', course: 'BCA AIML', semester: 3, section: 'A', department: 'Computer Science', room: 'Room 202', assignedFaculty: { ...initialFaculty, name: 'Prof. Charles Babbage', employeeId: 'FAC-102' }, studentCount: 45 },
    { id: 'BCA-5A', course: 'BCA AIML', semester: 5, section: 'A', department: 'Computer Science', room: 'Room 203', assignedFaculty: { ...initialFaculty, name: 'Dr. Grace Hopper', employeeId: 'FAC-103' }, studentCount: 50 },
    { id: 'BTECH-5A', course: 'B.Tech CSE', semester: 5, section: 'A', department: 'Engineering', room: 'Room 301', assignedFaculty: { ...initialFaculty, name: 'Dr. Linus Torvalds', employeeId: 'FAC-104' }, studentCount: 55 },
    { id: 'BTECH-5B', course: 'B.Tech CSE', semester: 5, section: 'B', department: 'Engineering', room: 'Room 302', assignedFaculty: { ...initialFaculty, name: 'Dr. Dennis Ritchie', employeeId: 'FAC-105' }, studentCount: 48 },
    { id: 'BTECH-3A', course: 'B.Tech ECE', semester: 3, section: 'A', department: 'Engineering', room: 'Lab 1', assignedFaculty: { ...initialFaculty, name: 'Dr. Nikola Tesla', employeeId: 'FAC-106' }, studentCount: 42 },
    { id: 'BBA-3A', course: 'BBA', semester: 3, section: 'A', department: 'Management', room: 'Room 101', assignedFaculty: { ...initialFaculty, name: 'Dr. Peter Drucker', employeeId: 'FAC-107' }, studentCount: 40 },
    { id: 'BBA-1A', course: 'BBA', semester: 1, section: 'A', department: 'Management', room: 'Room 103', assignedFaculty: { ...initialFaculty, name: 'Dr. Philip Kotler', employeeId: 'FAC-108' }, studentCount: 38 },
    { id: 'BCOM-3A', course: 'B.Com', semester: 3, section: 'A', department: 'Commerce', room: 'Room 102', assignedFaculty: { ...initialFaculty, name: 'Dr. Adam Smith', employeeId: 'FAC-109' }, studentCount: 52 },
    { id: 'BCOM-5A', course: 'B.Com', semester: 5, section: 'A', department: 'Commerce', room: 'Room 104', assignedFaculty: { ...initialFaculty, name: 'Prof. Warren Buffett', employeeId: 'FAC-110' }, studentCount: 46 },
    { id: 'BSC-1A', course: 'B.Sc Data Science', semester: 1, section: 'A', department: 'Science', room: 'Lab 2', assignedFaculty: { ...initialFaculty, name: 'Dr. John von Neumann', employeeId: 'FAC-111' }, studentCount: 36 },
    { id: 'MCA-1A', course: 'MCA', semester: 1, section: 'A', department: 'Computer Science', room: 'Room 401', assignedFaculty: hodFaculty, studentCount: 32 },
  ], []);

  // Filtered Catalog
  const filteredCollegeClasses = useMemo(() => {
    return collegeClasses.filter(c => {
      const matchesDept = selectedDeptFilter === 'ALL' || c.department === selectedDeptFilter;
      const matchesSearch = c.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.assignedFaculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.room.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDept && matchesSearch;
    });
  }, [collegeClasses, selectedDeptFilter, searchTerm]);

  // Students for currently selected class section
  const currentClassStudents = useMemo(() => {
    if (!selectedClassCard) return students;
    const match = students.filter(s => s.course === selectedClassCard.course && s.semester === selectedClassCard.semester && s.section === selectedClassCard.section);
    return match.length > 0 ? match : students;
  }, [selectedClassCard, students]);

  const handleSelectClass = (item: ClassSectionItem) => {
    setSelectedCourse(item.course);
    setSelectedSemester(item.semester);
    setSelectedSection(item.section);
    setSelectedClassCard(item);
  };

  const handleExportClassExcel = () => {
    if (!selectedClassCard) return;
    exportStudentsToExcel(currentClassStudents, `Class_Roster_${selectedClassCard.course}_Sem${selectedClassCard.semester}_Sec${selectedClassCard.section}.xlsx`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="p-6 rounded-3xl glass-panel bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
            🏛️ COLLEGE-WIDE DIRECTORY
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Entire College Classes & Sections Master Explorer
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Select any class section to view detailed Faculty & Student Data
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenAddModal}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Student to System</span>
          </button>
        </div>
      </div>

      {/* IF A CLASS CARD IS SELECTED BY ADMIN -> DISPLAY FACULTY & STUDENT DATA */}
      {selectedClassCard ? (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedClassCard(null)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-300 text-xs font-bold flex items-center space-x-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Back to All College Classes Grid</span>
          </button>

          {/* FACULTY DATA CARD */}
          <div className="p-6 rounded-3xl glass-panel border border-indigo-500/40 bg-gradient-to-r from-indigo-950/40 to-slate-900/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <img
                  src={selectedClassCard.assignedFaculty.avatar}
                  alt={selectedClassCard.assignedFaculty.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/50 shadow-xl"
                />
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                    ASSIGNED CLASS FACULTY IN-CHARGE
                  </span>
                  <h2 className="text-xl font-extrabold text-white mt-0.5">
                    {selectedClassCard.assignedFaculty.name}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {selectedClassCard.assignedFaculty.designation} • {selectedClassCard.assignedFaculty.department} Department
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <p className="text-[10px] text-slate-400">Employee ID</p>
                  <p className="font-mono font-bold text-indigo-300">{selectedClassCard.assignedFaculty.employeeId}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <p className="text-[10px] text-slate-400">Classroom</p>
                  <p className="font-bold text-purple-300 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-purple-400" />
                    <span>{selectedClassCard.room}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
              <span className="flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>{selectedClassCard.assignedFaculty.email}</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>{selectedClassCard.assignedFaculty.mobile}</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Subjects: {selectedClassCard.assignedFaculty.subjectsHandled.join(', ')}</span>
              </span>
            </div>
          </div>

          {/* STUDENT DATA TABLE FOR SELECTED CLASS */}
          <div className="p-6 rounded-3xl glass-panel space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  Enrolled Students Roster ({selectedClassCard.course} Sem {selectedClassCard.semester} Sec {selectedClassCard.section})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Total Enrolled Strength: {currentClassStudents.length} Students</p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleExportClassExcel}
                  className="px-4 py-2 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center space-x-2 transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export Excel</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">UUCMS / Roll</th>
                    <th className="py-3.5 px-4">RFID Card UID</th>
                    <th className="py-3.5 px-4">Biometric</th>
                    <th className="py-3.5 px-4">Attendance %</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {currentClassStudents.map(s => (
                    <tr key={s.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={s.avatar || s.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                            alt={s.name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
                          />
                          <div>
                            <p className="font-bold text-white">{s.name}</p>
                            <p className="text-[10px] text-slate-400">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-300">
                        {s.uucmsNo || s.rollNo}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {s.cardUid || s.rfidTag || 'UID-UNASSIGNED'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.isFingerprintEnrolled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {s.isFingerprintEnrolled ? 'Enrolled ✓' : 'Not Enrolled'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                          s.attendancePercentage >= 75 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {s.attendancePercentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => onViewStudent(s)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-[11px] font-semibold"
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => onEditStudent(s)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ALL COLLEGE CLASSES GRID VIEW */
        <div className="space-y-6">
          {/* Department Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-indigo-400" />
                <span>Department:</span>
              </span>
              {['ALL', 'Computer Science', 'Engineering', 'Management', 'Commerce', 'Science'].map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDeptFilter(d)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                    selectedDeptFilter === d
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search course, faculty or room..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Master Class Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCollegeClasses.map(c => (
              <div
                key={c.id}
                onClick={() => handleSelectClass(c)}
                className="p-5 rounded-3xl glass-panel border border-slate-800 hover:border-indigo-500/50 cursor-pointer space-y-4 transition-all hover:scale-[1.02] group shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {c.department}
                  </span>
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                    <span>{c.room}</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-white group-hover:text-indigo-300 transition-colors">
                    {c.course} — Sem {c.semester} ({c.section})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Assigned In-Charge: <strong className="text-slate-200">{c.assignedFaculty.name}</strong>
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                  <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>{c.studentCount} Students Enrolled</span>
                  </span>

                  <span className="text-indigo-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Explore Data</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
