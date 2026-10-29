'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { Student, CourseClass, Semester, Section } from '@/types';
import { Search, Filter, Plus, FileSpreadsheet, Fingerprint, Eye, Edit3, UserX, ChevronLeft, ChevronRight, CheckCircle2, ShieldCheck, Sparkles, Building2, UserPlus, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { RefreshButton } from '@/components/Common/RefreshButton';
import { AddClassModal } from '@/components/Admin/AddClassModal';
import { ExcelImportModal } from '@/components/Students/ExcelImportModal';

interface StudentTableProps {
  onOpenAddModal: () => void;
  onEditStudent: (student: Student) => void;
  onViewStudent: (student: Student) => void;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  onOpenAddModal,
  onEditStudent,
  onViewStudent,
}) => {
  const { students, selectedCourse, setSelectedCourse, selectedSemester, setSelectedSemester, selectedSection, setSelectedSection, deactivateStudent } = useAttendance();
  const { isAdmin, user } = useAuth();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const itemsPerPage = 10;

  // Filtered Students
  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.uucmsNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.rollNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.cardUid || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCourse = s.course === selectedCourse;
    const matchesSem = s.semester === selectedSemester;
    const matchesSec = s.section === selectedSection;

    const currentStatus = s.status || 'active';
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && currentStatus === 'active') ||
      (statusFilter === 'INACTIVE' && currentStatus === 'inactive');

    return matchesSearch && matchesCourse && matchesSem && matchesSec && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-6 rounded-3xl glass-panel space-y-6">
      
      {/* HEADER BANNER & TOP ACTIONS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
              isAdmin ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-800 text-slate-400'
            }`}>
              {isAdmin ? '🛡️ ADMIN GOVERNANCE MODE' : '👁️ FACULTY READ-ONLY MODE'}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Student Management & Roster
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAdmin ? 'Admin controls to add, edit, deactivate students and manage classes.' : 'View assigned students for taking class attendance.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <RefreshButton />

          {/* ADMIN ONLY BUTTONS */}
          {isAdmin ? (
            <>
              <button
                onClick={onOpenAddModal}
                className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Student</span>
              </button>

              <button
                onClick={() => setIsAddClassOpen(true)}
                className="px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-indigo-300 font-bold text-xs flex items-center space-x-1.5 transition-all"
              >
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>+ Add Class</span>
              </button>

              <button
                onClick={() => setIsExcelImportOpen(true)}
                className="px-3.5 py-2 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center space-x-1.5 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Import Students</span>
              </button>
            </>
          ) : (
            <div className="px-3.5 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 font-bold text-xs flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Student Editing Restricted to Admin</span>
            </div>
          )}
        </div>
      </div>

      {/* SEARCH, FILTERS & ACTIVE/INACTIVE DROPDOWN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
        {/* Search */}
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, UUCMS, Card UID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl glass-input text-slate-200"
          />
        </div>

        {/* Course Filter */}
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value as CourseClass)}
          className="px-4 py-2.5 rounded-2xl glass-input text-slate-200 bg-slate-900 font-bold"
        >
          <option value="BCA AIML">BCA AIML</option>
          <option value="B.Tech CSE">B.Tech CSE</option>
          <option value="B.Tech ECE">B.Tech ECE</option>
          <option value="B.Tech ME">B.Tech ME</option>
          <option value="B.Sc Data Science">B.Sc Data Science</option>
          <option value="BBA">BBA</option>
          <option value="B.Com">B.Com</option>
        </select>

        {/* Semester Filter */}
        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(Number(e.target.value) as Semester)}
          className="px-4 py-2.5 rounded-2xl glass-input text-slate-200 bg-slate-900 font-bold"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
            <option key={s} value={s}>Semester {s}</option>
          ))}
        </select>

        {/* Section Filter */}
        <select
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value as Section)}
          className="px-4 py-2.5 rounded-2xl glass-input text-slate-200 bg-slate-900 font-bold"
        >
          {['A', 'B', 'C', 'D'].map(s => (
            <option key={s} value={s}>Section {s}</option>
          ))}
        </select>

        {/* Active / Inactive Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2.5 rounded-2xl glass-input text-slate-200 bg-slate-900 font-bold"
        >
          <option value="ACTIVE">Status: Active Only</option>
          <option value="INACTIVE">Status: Inactive Only</option>
          <option value="ALL">Status: All Records</option>
        </select>
      </div>

      {/* MODERN STUDENT DATA TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Student</th>
              <th className="py-3.5 px-4">UUCMS / Roll</th>
              <th className="py-3.5 px-4">Class & Sec</th>
              <th className="py-3.5 px-4">Card UID</th>
              <th className="py-3.5 px-4">Biometric Slot</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {paginatedStudents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500 text-xs space-y-2">
                  <p className="font-bold text-slate-300">No students found</p>
                  <p>Try changing your search or active status filters.</p>
                </td>
              </tr>
            ) : (
              paginatedStudents.map((s) => {
                const isActive = s.status !== 'inactive';

                return (
                  <tr key={s.id} className="hover:bg-slate-900/60 transition-colors">
                    
                    {/* Student */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onViewStudent(s)}>
                        <img
                          src={s.avatar || s.photo || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`}
                          alt={s.name}
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700"
                        />
                        <div>
                          <p className="font-bold text-white text-xs hover:text-indigo-400 transition-colors">{s.name}</p>
                          <p className="text-[10px] text-slate-400">{s.email || `${s.rollNo}@caias.edu.in`}</p>
                        </div>
                      </div>
                    </td>

                    {/* UUCMS */}
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">
                      {s.uucmsNo || s.rollNo}
                    </td>

                    {/* Class */}
                    <td className="py-3.5 px-4 font-semibold text-slate-300">
                      {s.course || 'BCA AIML'} Sem {s.semester} ({s.section})
                    </td>

                    {/* Card UID */}
                    <td className="py-3.5 px-4 font-mono text-amber-300 text-[11px]">
                      {s.cardUid || s.rfidTag || 'A7:B2:91:01'}
                    </td>

                    {/* Biometric Slot */}
                    <td className="py-3.5 px-4 font-mono text-purple-300 text-[11px]">
                      Slot #{s.fingerprintSlotId || 1}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => onViewStudent(s)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-all"
                        title="View Student Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {isAdmin ? (
                        <>
                          <button
                            onClick={() => onEditStudent(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-slate-800 transition-all"
                            title="Edit Student (ADMIN)"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {isActive && (
                            <button
                              onClick={() => deactivateStudent(s.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all"
                              title="Deactivate Student (Preserves Attendance History)"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-600 italic">Read-only</span>
                      )}
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
        <span>Showing {paginatedStudents.length} of {filteredStudents.length} Students</span>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono font-bold text-slate-200">Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ADMIN MODALS */}
      <AddClassModal
        isOpen={isAddClassOpen}
        onClose={() => setIsAddClassOpen(false)}
      />

      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
      />

    </div>
  );
};
