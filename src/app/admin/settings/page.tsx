'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Settings, Save, RefreshCw, Shield, Sliders, School, Bell } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settingsMap, setSettingsMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (res.ok && data.success) {
        const map: Record<string, string> = {};
        data.settings.forEach((s: any) => {
          map[s.key] = s.value;
        });
        setSettingsMap(map);
      }
    } catch (e) {
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettingsMap((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = Object.entries(settingsMap).map(([key, value]) => ({ key, value }));
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('System settings updated successfully');
      } else {
        toast.error(data.error || 'Failed to save settings');
      }
    } catch (e) {
      toast.error('Network error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            Institutional Governance & Biometric Policies
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global system thresholds, AI matching sensitivity, and attendance warning rules.
          </p>
        </div>

        <button
          onClick={fetchSettings}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Institutional Info */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <School className="w-4 h-4 text-indigo-400" />
              Institutional Identity
            </h2>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Institution Full Name</label>
                <input
                  type="text"
                  value={settingsMap.INSTITUTION_NAME || ''}
                  onChange={(e) => handleChange('INSTITUTION_NAME', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Minimum Attendance Threshold (%)</label>
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={settingsMap.MIN_ATTENDANCE_PERCENT || '75'}
                  onChange={(e) => handleChange('MIN_ATTENDANCE_PERCENT', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-500">
                  Students below this percentage will be flagged with low attendance warnings.
                </span>
              </div>
            </div>
          </div>

          {/* AI & Biometric Settings */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              AI Face Biometrics Engine
            </h2>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Face Match Confidence Threshold (0.00 - 1.00)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="0.99"
                  value={settingsMap.FACE_CONFIDENCE_THRESHOLD || '0.75'}
                  onChange={(e) => handleChange('FACE_CONFIDENCE_THRESHOLD', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-500">
                  Minimum cosine similarity score required to mark attendance automatically.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Anti-Spoof Liveness Threshold</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="0.95"
                  value={settingsMap.LIVENESS_THRESHOLD || '0.65'}
                  onChange={(e) => handleChange('LIVENESS_THRESHOLD', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-500">
                  Defends against screen glare, printed photos, and video replay attacks.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
