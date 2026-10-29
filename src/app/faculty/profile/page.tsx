'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { UserCheck, School, Mail, Phone, ShieldCheck, Briefcase } from 'lucide-react';

export default function FacultyProfilePage() {
  const [profile, setProfile] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/faculty/dashboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProfile(data.faculty);
      })
      .catch(() => {});
  }, []);

  if (!profile) {
    return <div className="p-8 text-center text-slate-500">Loading faculty profile...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-xl">
            {profile.name.charAt(0)}
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {profile.employeeId}
            </span>
            <h1 className="text-xl font-bold text-white mt-1">{profile.name}</h1>
            <p className="text-xs text-slate-400">{profile.designation}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-1">
            <span className="text-slate-500">Department</span>
            <p className="text-white font-semibold flex items-center gap-2">
              <School className="w-4 h-4 text-emerald-400" />
              {profile.department?.name} ({profile.department?.code})
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-1">
            <span className="text-slate-500">Institutional Email</span>
            <p className="text-white font-semibold flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-400" />
              {profile.email}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-1">
            <span className="text-slate-500">Contact Number</span>
            <p className="text-white font-semibold flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              {profile.phone || 'N/A'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-1">
            <span className="text-slate-500">Account Governance</span>
            <p className="text-emerald-400 font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              {profile.accountStatus} • Verified Faculty
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
