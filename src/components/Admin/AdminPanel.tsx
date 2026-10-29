'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Users, Clock, Radio, Shield, Building2, FileCheck, AlertTriangle, FileText } from 'lucide-react';
import { StudentTable } from '@/components/Students/StudentTable';
import { FixedTimetableBuilder } from '@/components/Timetable/FixedTimetableBuilder';
import { DeviceStatusWidget } from '@/components/Dashboard/DeviceStatusWidget';
import { AcademicStructureManager } from '@/components/Admin/AcademicStructureManager';
import { AdminCorrectionRequests } from '@/components/Admin/AdminCorrectionRequests';
import { AdminIssueTracker } from '@/components/Admin/AdminIssueTracker';
import { AuditLogViewer } from '@/components/Admin/AuditLogViewer';

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const { students, sessions, correctionRequests, issueReports, timetable } = useAttendance();

  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'structure' | 'corrections' | 'issues' | 'students' | 'timetable' | 'audit'>('structure');

  const pendingCorrections = correctionRequests.filter(r => r.status === 'PENDING').length;
  const openIssues = issueReports.filter(i => i.status === 'OPEN').length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl glass-panel bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>CAIAS AMS Academic & Technical Governance</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">College Admin Control Center</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Logged in as <strong className="text-indigo-300">{user?.name || 'Super Admin'}</strong> ({user?.role || 'Admin'})
          </p>
        </div>

        <DeviceStatusWidget />
      </div>

      {/* Admin Sub-Navigation Tabs */}
      <div className="p-2 rounded-2xl glass-panel flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={() => setActiveAdminSubTab('structure')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 ${
            activeAdminSubTab === 'structure'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Academic Architecture & Structure</span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('corrections')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 ${
            activeAdminSubTab === 'corrections'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <FileCheck className="w-4 h-4 text-amber-400" />
          <span>Corrections ({pendingCorrections})</span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('issues')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 ${
            activeAdminSubTab === 'issues'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>Reported Issues ({openIssues})</span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('students')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 ${
            activeAdminSubTab === 'students'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Master Students ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('timetable')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 ${
            activeAdminSubTab === 'timetable'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Timetables ({timetable.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('audit')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 ${
            activeAdminSubTab === 'audit'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit Trail</span>
        </button>
      </div>

      {/* Sub-Tab Content View */}
      {activeAdminSubTab === 'structure' && <AcademicStructureManager />}

      {activeAdminSubTab === 'corrections' && <AdminCorrectionRequests />}

      {activeAdminSubTab === 'issues' && <AdminIssueTracker />}

      {activeAdminSubTab === 'students' && (
        <StudentTable
          onOpenAddModal={() => {}}
          onEditStudent={() => {}}
          onViewStudent={() => {}}
        />
      )}

      {activeAdminSubTab === 'timetable' && <FixedTimetableBuilder />}

      {activeAdminSubTab === 'audit' && <AuditLogViewer />}

    </div>
  );
};
