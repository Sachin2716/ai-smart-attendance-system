'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { Program, Specialization, ClassSection, TeachingAssignment, Student, Semester } from '@/types';

export const AcademicStructureManager: React.FC = () => {
  const {
    programs,
    specializations,
    classSections,
    teachingAssignments,
    students,
    subjects,
    transferStudent,
    promoteStudents,
    createProgram,
    createSpecialization,
    createClassSection,
    createTeachingAssignment,
  } = useAttendance();

  const [activeSubTab, setActiveSubTab] = useState<'programs' | 'sections' | 'assignments' | 'transfer' | 'promotion'>('programs');

  // Form States
  const [newProgCode, setNewProgCode] = useState('');
  const [newProgName, setNewProgName] = useState('');
  const [newProgDept, setNewProgDept] = useState('Computer Science');

  const [selectedProgForSpec, setSelectedProgForSpec] = useState(programs[0]?.id || '');
  const [newSpecCode, setNewSpecCode] = useState('');
  const [newSpecName, setNewSpecName] = useState('');

  const [newSecClassroom, setNewSecClassroom] = useState('Room 205');
  const [newSecProgCode, setNewSecProgCode] = useState('BCA');
  const [newSecSem, setNewSecSem] = useState<Semester>(3);
  const [newSecName, setNewSecName] = useState<'A' | 'B' | 'C' | 'D'>('A');

  // Transfer Form State
  const [transferStudentId, setTransferStudentId] = useState('');
  const [transferTargetSectionId, setTransferTargetSectionId] = useState('');
  const [transferSuccessMsg, setTransferSuccessMsg] = useState('');

  // Promotion Form State
  const [promoSourceSectionId, setPromoSourceSectionId] = useState(classSections[0]?.id || '');
  const [promoTargetSem, setPromoTargetSem] = useState<Semester>(4);
  const [promoResultMsg, setPromoResultMsg] = useState('');

  // Teaching Assignment Form
  const [taSubjectId, setTaSubjectId] = useState(subjects[0]?.id || '');
  const [taSectionId, setTaSectionId] = useState(classSections[0]?.id || '');
  const [taFacultyName, setTaFacultyName] = useState('Dr. Alan Turing');
  const [taSubgroupFilter, setTaSubgroupFilter] = useState('');

  const handleAddProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgCode || !newProgName) return;
    createProgram({
      code: newProgCode.toUpperCase(),
      name: newProgName,
      degreeLevel: 'UG',
      durationYears: 3,
      totalSemesters: 6,
      departmentId: `DEPT-${newProgCode}`,
      departmentName: newProgDept,
    });
    setNewProgCode('');
    setNewProgName('');
  };

  const handleAddSpecialization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecCode || !newSpecName || !selectedProgForSpec) return;
    createSpecialization({
      programId: selectedProgForSpec,
      code: newSpecCode.toUpperCase(),
      name: newSpecName,
    });
    setNewSpecCode('');
    setNewSpecName('');
  };

  const handleAddClassSection = (e: React.FormEvent) => {
    e.preventDefault();
    createClassSection({
      semesterId: `SEM-${newSecProgCode}-${newSecSem}`,
      sectionName: newSecName,
      classroomNumber: newSecClassroom,
      programCode: newSecProgCode,
      semesterNumber: newSecSem,
      fullClassLabel: `${newSecProgCode} ${newSecSem}${newSecName}`,
      studentCount: 60,
    });
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const subj = subjects.find(s => s.id === taSubjectId);
    const sec = classSections.find(c => c.id === taSectionId);

    if (!subj || !sec) return;

    createTeachingAssignment({
      facultyId: 'FAC-101',
      facultyName: taFacultyName,
      subjectId: subj.id,
      subjectCode: subj.code,
      subjectName: subj.name,
      sectionId: sec.id,
      fullClassLabel: sec.fullClassLabel,
      semesterNumber: sec.semesterNumber,
      subgroupFilter: taSubgroupFilter.trim() || undefined,
    });
    setTaSubgroupFilter('');
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferStudentId || !transferTargetSectionId) return;
    transferStudent(transferStudentId, transferTargetSectionId);
    setTransferSuccessMsg(`Student transferred successfully!`);
    setTimeout(() => setTransferSuccessMsg(''), 4000);
  };

  const handleExecutePromotion = (e: React.FormEvent) => {
    e.preventDefault();
    const res = promoteStudents(promoSourceSectionId, promoTargetSem);
    setPromoResultMsg(res.message);
    setTimeout(() => setPromoResultMsg(''), 5000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg text-lg">🏛️</span>
            Academic Architecture & College Structure Manager
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Configure Programs, Specializations, Class Sections, Teaching Assignments, Student Transfers, and Batch Promotions
          </p>
        </div>

        {/* Subtab Navigation */}
        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 gap-1">
          {[
            { key: 'programs', label: 'Programs & Specs' },
            { key: 'sections', label: 'Class Sections' },
            { key: 'assignments', label: 'Teaching Assignments' },
            { key: 'transfer', label: 'Student Transfer' },
            { key: 'promotion', label: 'Semester Promotion' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === tab.key
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* --- SUBTAB 1: PROGRAMS & SPECIALIZATIONS --- */}
      {activeSubTab === 'programs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-xl">
            <h3 className="text-md font-bold text-indigo-400 mb-4 flex items-center gap-2">
              🎓 College Degree Programs ({programs.length})
            </h3>
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-1">
              {programs.map(p => (
                <div key={p.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white text-sm">{p.code}</span>
                    <span className="text-xs text-slate-400 ml-2">({p.name})</span>
                    <div className="text-xs text-slate-500 mt-0.5">{p.departmentName} • {p.durationYears} Years ({p.totalSemesters} Semesters)</div>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-xs font-mono">{p.degreeLevel}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddProgram} className="space-y-3 pt-4 border-t border-slate-800">
              <div className="text-xs font-semibold text-slate-300">Add New Academic Program</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Code (e.g. MCA)"
                  value={newProgCode}
                  onChange={e => setNewProgCode(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Program Name"
                  value={newProgName}
                  onChange={e => setNewProgName(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-lg text-xs transition-colors"
              >
                + Add Program
              </button>
            </form>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-xl">
            <h3 className="text-md font-bold text-emerald-400 mb-4 flex items-center gap-2">
              🔬 Program Specializations ({specializations.length})
            </h3>
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-1">
              {specializations.map(s => {
                const prog = programs.find(p => p.id === s.programId);
                return (
                  <div key={s.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-sm">{s.code}</span>
                      <span className="text-xs text-slate-400 ml-2">{s.name}</span>
                      <div className="text-xs text-slate-500 mt-0.5">Program: {prog?.code || 'General'}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleAddSpecialization} className="space-y-3 pt-4 border-t border-slate-800">
              <div className="text-xs font-semibold text-slate-300">Add New Specialization</div>
              <select
                value={selectedProgForSpec}
                onChange={e => setSelectedProgForSpec(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {programs.map(p => (
                  <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Spec Code (e.g. AIML)"
                  value={newSpecCode}
                  onChange={e => setNewSpecCode(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Specialization Name"
                  value={newSpecName}
                  onChange={e => setNewSpecName(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-lg text-xs transition-colors"
              >
                + Add Specialization
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- SUBTAB 2: CLASS SECTIONS --- */}
      {activeSubTab === 'sections' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {classSections.map(cs => (
              <div key={cs.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-indigo-300 text-base">{cs.fullClassLabel}</span>
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded text-xs">{cs.classroomNumber}</span>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <div>Program: <span className="text-white">{cs.programCode}</span></div>
                  <div>Semester: <span className="text-white">{cs.semesterNumber}</span> | Section: <span className="text-white">{cs.sectionName}</span></div>
                  <div>Active Students: <span className="text-emerald-400 font-bold">{students.filter(s => s.semester === cs.semesterNumber && s.section === cs.sectionName).length}</span></div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddClassSection} className="bg-slate-950 border border-slate-800 p-5 rounded-xl max-w-xl space-y-4">
            <h3 className="text-sm font-bold text-white">Create New Class Section</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Program</label>
                <select
                  value={newSecProgCode}
                  onChange={e => setNewSecProgCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  {programs.map(p => (
                    <option key={p.id} value={p.code}>{p.code}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Semester</label>
                <select
                  value={newSecSem}
                  onChange={e => setNewSecSem(Number(e.target.value) as Semester)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Sem {s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Section</label>
                <select
                  value={newSecName}
                  onChange={e => setNewSecName(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  {['A', 'B', 'C', 'D'].map(sec => (
                    <option key={sec} value={sec}>Section {sec}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg"
            >
              + Create Section
            </button>
          </form>
        </div>
      )}

      {/* --- SUBTAB 3: TEACHING ASSIGNMENTS --- */}
      {activeSubTab === 'assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-950 border border-slate-800 p-5 rounded-xl">
            <h3 className="text-sm font-bold text-indigo-400 mb-4">
              👨‍🏫 Active Teaching Assignments ({teachingAssignments.length})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {teachingAssignments.map(ta => (
                <div key={ta.id} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{ta.subjectCode}</span>
                      <span className="text-xs text-slate-300">— {ta.subjectName}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Faculty: <span className="text-amber-400 font-semibold">{ta.facultyName}</span> | Class: <span className="text-emerald-400">{ta.fullClassLabel}</span>
                    </div>
                  </div>
                  <div>
                    {ta.subgroupFilter ? (
                      <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold">
                        Group: {ta.subgroupFilter}
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-slate-800 text-slate-400 rounded-lg text-xs">
                        Full Section
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleCreateAssignment} className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-white">Create Teaching Assignment</h3>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Select Subject</label>
              <select
                value={taSubjectId}
                onChange={e => setTaSubjectId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Select Class Section</label>
              <select
                value={taSectionId}
                onChange={e => setTaSectionId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                {classSections.map(cs => (
                  <option key={cs.id} value={cs.id}>{cs.fullClassLabel}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Faculty Name</label>
              <input
                type="text"
                value={taFacultyName}
                onChange={e => setTaFacultyName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Subgroup Filter (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Kannada, Hindi, Lab Batch A"
                value={taSubgroupFilter}
                onChange={e => setTaSubgroupFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Leave empty for full class. Use for Language / Elective subjects.
              </span>
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-lg text-xs"
            >
              Assign Faculty to Class
            </button>
          </form>
        </div>
      )}

      {/* --- SUBTAB 4: STUDENT TRANSFER --- */}
      {activeSubTab === 'transfer' && (
        <div className="max-w-2xl bg-slate-950 border border-slate-800 p-6 rounded-xl space-y-5">
          <div>
            <h3 className="text-md font-bold text-amber-400 flex items-center gap-2">
              🔀 DB-Safe Student Transfer Between Sections
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Transfers student to a new section while preserving historical attendance session records.
            </p>
          </div>

          {transferSuccessMsg && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-semibold">
              ✓ {transferSuccessMsg}
            </div>
          )}

          <form onSubmit={handleExecuteTransfer} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Select Student</label>
              <select
                value={transferStudentId}
                onChange={e => setTransferStudentId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="">-- Choose Student --</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.uucmsNo} — {s.name} ({s.course} Sem {s.semester}-{s.section})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Target Section</label>
              <select
                value={transferTargetSectionId}
                onChange={e => setTransferTargetSectionId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="">-- Choose Target Section --</option>
                {['A', 'B', 'C', 'D'].map(sec => (
                  <option key={sec} value={sec}>Section {sec}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={!transferStudentId || !transferTargetSectionId}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-xs transition-all"
            >
              Execute Transfer
            </button>
          </form>
        </div>
      )}

      {/* --- SUBTAB 5: SEMESTER PROMOTION --- */}
      {activeSubTab === 'promotion' && (
        <div className="max-w-2xl bg-slate-950 border border-slate-800 p-6 rounded-xl space-y-5">
          <div>
            <h3 className="text-md font-bold text-indigo-400 flex items-center gap-2">
              🚀 Atomic Batch Semester Promotion Engine
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Promotes an entire class section to the next academic semester in a single atomic database transaction.
            </p>
          </div>

          {promoResultMsg && (
            <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-semibold">
              ℹ️ {promoResultMsg}
            </div>
          )}

          <form onSubmit={handleExecutePromotion} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Source Class Section</label>
              <select
                value={promoSourceSectionId}
                onChange={e => setPromoSourceSectionId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                {classSections.map(cs => (
                  <option key={cs.id} value={cs.id}>
                    {cs.fullClassLabel} ({students.filter(s => s.semester === cs.semesterNumber && s.section === cs.sectionName).length} Students)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Promote To Semester</label>
              <select
                value={promoTargetSem}
                onChange={e => setPromoTargetSem(Number(e.target.value) as Semester)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                {[2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-lg text-xs transition-all"
            >
              Promote Batch Students
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
