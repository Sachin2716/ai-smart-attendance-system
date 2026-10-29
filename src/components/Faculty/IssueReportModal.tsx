'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { IssueReportItem } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string;
  sectionId?: string;
}

export const IssueReportModal: React.FC<Props> = ({ isOpen, onClose, studentId, sectionId }) => {
  const { reportIssue } = useAttendance();
  const [category, setCategory] = useState<IssueReportItem['category']>('STUDENT_MISSING');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    reportIssue(category, description, studentId, sectionId);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setDescription('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
        >
          ✕
        </button>

        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <span className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg text-sm">⚠️</span>
          Report Issue / Missing Data
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Report data discrepancies, missing students, RFID issues, or photo problems to Admin
        </p>

        {submitted ? (
          <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-center font-bold text-xs">
            ✓ Issue reported successfully to Admin!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-300 block mb-1">Issue Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="STUDENT_MISSING">Student Missing in Roster</option>
                <option value="WRONG_INFO">Incorrect Student Name / UUCMS</option>
                <option value="WRONG_PHOTO">Wrong Student Photo / Avatar</option>
                <option value="RFID_PROBLEM">RFID Card Scan Issue / Tag Unassigned</option>
                <option value="WRONG_SUBJECT">Wrong Subject / Language Group</option>
                <option value="TIMETABLE_ISSUE font-sans">Timetable / Slot Discrepancy</option>
                <option value="OTHER">Other Technical Problem</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Detailed Description</label>
              <textarea
                rows={3}
                required
                placeholder="Explain the problem clearly..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-lg"
              >
                Submit Issue Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
