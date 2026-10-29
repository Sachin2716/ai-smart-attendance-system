'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';

export const AdminCorrectionRequests: React.FC = () => {
  const { correctionRequests, reviewAttendanceCorrectionRequest } = useAttendance();
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const pendingRequests = correctionRequests.filter(r => r.status === 'PENDING');
  const processedRequests = correctionRequests.filter(r => r.status !== 'PENDING');

  const handleAction = (requestId: string, approve: boolean) => {
    const notes = adminNotes[requestId] || '';
    reviewAttendanceCorrectionRequest(requestId, approve, notes);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="p-2 bg-amber-500/20 text-amber-400 rounded-lg text-lg">📝</span>
            Faculty Attendance Correction Requests
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Review and approve attendance modifications requested by faculty after session lock
          </p>
        </div>
        <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold">
          {pendingRequests.length} Pending Approval
        </span>
      </div>

      {/* Pending Requests Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-amber-400">⏳ Pending Approval ({pendingRequests.length})</h3>
        {pendingRequests.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/50 border border-slate-800 rounded-xl text-slate-500 text-xs">
            No pending attendance correction requests.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map(req => (
              <div key={req.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{req.studentName}</span>
                    <span className="text-xs text-slate-400">({req.studentUucmsNo})</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs">{req.subjectCode}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Current: <span className="font-semibold text-rose-400">{req.currentStatus}</span> → Requested: <span className="font-semibold text-emerald-400">{req.requestedStatus}</span>
                  </div>
                  <div className="text-xs text-slate-300 italic">
                    Reason: "{req.reason}"
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Requested by <span className="text-amber-300">{req.requestedByFacultyName}</span> on {new Date(req.requestedAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex flex-col gap-2 min-w-[220px]">
                  <input
                    type="text"
                    placeholder="Admin Notes (Optional)"
                    value={adminNotes[req.id] || ''}
                    onChange={e => setAdminNotes({ ...adminNotes, [req.id]: e.target.value })}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(req.id, true)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-1.5 rounded-lg text-xs transition-colors"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleAction(req.id, false)}
                      className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold py-1.5 rounded-lg text-xs transition-colors"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Processed History */}
      {processedRequests.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h3 className="text-sm font-bold text-slate-400">📜 History ({processedRequests.length})</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {processedRequests.map(req => (
              <div key={req.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-200">{req.studentName}</span> ({req.subjectCode}) — Change to <span className="text-white font-semibold">{req.requestedStatus}</span>
                  <div className="text-[10px] text-slate-500">Reason: {req.reason}</div>
                </div>
                <span className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                  req.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
