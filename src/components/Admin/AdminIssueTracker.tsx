'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';

export const AdminIssueTracker: React.FC = () => {
  const { issueReports, resolveIssue } = useAttendance();
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});

  const openIssues = issueReports.filter(i => i.status === 'OPEN');
  const resolvedIssues = issueReports.filter(i => i.status === 'RESOLVED');

  const handleResolve = (issueId: string) => {
    const notes = resolutionNotes[issueId] || 'Issue inspected and resolved by Admin.';
    resolveIssue(issueId, notes);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="p-2 bg-rose-500/20 text-rose-400 rounded-lg text-lg">🚨</span>
            Faculty Reported Technical & Data Issues
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Track and resolve missing student records, RFID card errors, and timetable discrepancies
          </p>
        </div>
        <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-xs font-bold">
          {openIssues.length} Open Issues
        </span>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-rose-400">🔥 Open Issues ({openIssues.length})</h3>
        {openIssues.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/50 border border-slate-800 rounded-xl text-slate-500 text-xs">
            No open issue reports.
          </div>
        ) : (
          <div className="space-y-3">
            {openIssues.map(issue => (
              <div key={issue.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-xs font-bold">
                      {issue.category}
                    </span>
                    <span className="text-xs text-slate-400">Reported by {issue.reportedByFacultyName}</span>
                  </div>
                  <div className="text-xs text-white mt-1">
                    "{issue.description}"
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {new Date(issue.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex flex-col gap-2 min-w-[220px]">
                  <input
                    type="text"
                    placeholder="Resolution Action / Notes"
                    value={resolutionNotes[issue.id] || ''}
                    onChange={e => setResolutionNotes({ ...resolutionNotes, [issue.id]: e.target.value })}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500"
                  />
                  <button
                    onClick={() => handleResolve(issue.id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-1.5 rounded-lg text-xs transition-colors"
                  >
                    ✓ Mark Resolved
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {resolvedIssues.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h3 className="text-sm font-bold text-slate-400">✅ Resolved History ({resolvedIssues.length})</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {resolvedIssues.map(issue => (
              <div key={issue.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-300">{issue.category}</span> — {issue.description}
                  <div className="text-[10px] text-emerald-400">Resolution: {issue.resolutionNotes}</div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px]">RESOLVED</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
