'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { Semester, Section } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AddClassModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { createClassSection, programs } = useAttendance();
  const { isAdmin } = useAuth();

  const [className, setClassName] = useState('BCA AIML');
  const [department, setDepartment] = useState('Computer Science');
  const [semester, setSemester] = useState<Semester>(3);
  const [section, setSection] = useState<Section>('A');
  const [classroom, setClassroom] = useState('Room 205');
  const [classTeacher, setClassTeacher] = useState('Dr. Alan Turing');
  const [capacity, setCapacity] = useState(60);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setErrorMsg('Access Denied: Action restricted to ADMIN role only.');
      return;
    }

    try {
      createClassSection({
        semesterId: `SEM-${className.replace(/\s+/g, '')}-${semester}`,
        sectionName: section,
        classroomNumber: classroom,
        programCode: className,
        semesterNumber: semester,
        fullClassLabel: `${className} — Sem ${semester}${section}`,
        studentCount: capacity,
      });

      setSuccessMsg(`Class Section '${className} Sem ${semester}${section}' created successfully!`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create class section');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
        >
          ✕
        </button>

        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg text-sm">🏫</span>
          Add New Class Section (ADMIN ONLY)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Create a new academic class section to assign faculty and students
        </p>

        {errorMsg && (
          <div className="p-3 mb-4 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold">
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold">
            ✓ {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 block mb-1">Course / Program</label>
              <input
                type="text"
                required
                value={className}
                onChange={e => setClassName(e.target.value)}
                placeholder="e.g. BCA AIML"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 block mb-1">Department</label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="AI & Data Science">AI & Data Science</option>
                <option value="Management Studies">Management Studies</option>
                <option value="Commerce">Commerce</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-300 block mb-1">Semester</label>
              <select
                value={semester}
                onChange={e => setSemester(Number(e.target.value) as Semester)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Sem {s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-300 block mb-1">Section</label>
              <select
                value={section}
                onChange={e => setSection(e.target.value as Section)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                {['A', 'B', 'C', 'D'].map(sec => (
                  <option key={sec} value={sec}>Section {sec}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-300 block mb-1">Classroom</label>
              <input
                type="text"
                value={classroom}
                onChange={e => setClassroom(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 block mb-1">Assigned Faculty / Teacher</label>
              <input
                type="text"
                value={classTeacher}
                onChange={e => setClassTeacher(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 block mb-1">Student Capacity</label>
              <input
                type="number"
                value={capacity}
                onChange={e => setCapacity(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg"
            >
              + Create Class Section
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
