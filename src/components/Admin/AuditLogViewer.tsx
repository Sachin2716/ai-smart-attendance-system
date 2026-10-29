'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';

export const AuditLogViewer: React.FC = () => {
  const { auditLogsList } = useAttendance();
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');

  const filteredLogs = auditLogsList.filter(log => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchFilter.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesEntity = selectedEntity === 'ALL' || log.entityType === selectedEntity;

    return matchesSearch && matchesEntity;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="p-2 bg-purple-500/20 text-purple-400 rounded-lg text-lg">🛡️</span>
            System-Wide Immutable Audit Log
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Complete tamper-proof audit trail of student transfers, promotions, attendance edits, and admin actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search action or actor..."
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500"
          />
          <select
            value={selectedEntity}
            onChange={e => setSelectedEntity(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
          >
            <option value="ALL">All Entity Types</option>
            <option value="STUDENT">Student Records</option>
            <option value="ATTENDANCE">Attendance</option>
            <option value="TEACHING_ASSIGNMENT">Teaching Assignments</option>
            <option value="CORRECTION">Corrections</option>
            <option value="TIMETABLE">Timetable</option>
            <option value="SYSTEM">System</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="p-3">Timestamp</th>
              <th className="p-3">Actor / User</th>
              <th className="p-3">Action</th>
              <th className="p-3">Entity Type</th>
              <th className="p-3">Entity ID</th>
              <th className="p-3">Details / Changes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-500 font-sans">
                  No audit log entries matched your filter.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3 font-sans">
                    <span className="font-bold text-white">{log.actorName}</span>
                    <span className="text-[10px] text-slate-500 block">({log.actorRole})</span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-[11px] font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 font-sans">{log.entityType}</td>
                  <td className="p-3 text-amber-300 font-mono">{log.entityId}</td>
                  <td className="p-3 text-[11px] font-mono text-slate-300 max-w-xs truncate">
                    {log.newValueJson || log.oldValueJson || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
