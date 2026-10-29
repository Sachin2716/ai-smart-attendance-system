'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FileCheck2, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

export default function StudentCorrectionsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCorrections = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/student/correction-requests');
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests(data.requests);
      }
    } catch (e) {
      toast.error('Failed to load correction history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrections();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-violet-400" />
            My Attendance Disputes & Requests
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track status and faculty review notes for all submitted attendance correction requests.
          </p>
        </div>

        <button
          onClick={fetchCorrections}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {requests.map((req) => (
          <div
            key={req.id}
            className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-violet-400">
                {req.session.course.code}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  req.status === 'APPROVED'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : req.status === 'PENDING'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}
              >
                {req.status}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">{req.session.course.name}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Session Date: {req.session.sessionDate} • Faculty: {req.session.faculty.name}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs text-slate-300 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 block">Your Reason:</span>
              <p className="italic">"{req.reason}"</p>
            </div>

            {req.responseRemarks && (
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
                <span className="text-[10px] font-mono text-emerald-400 block font-bold">
                  Faculty / Admin Response:
                </span>
                <p>{req.responseRemarks}</p>
              </div>
            )}

            <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-800 font-mono">
              <span>Submitted: {new Date(req.createdAt).toLocaleDateString()}</span>
              {req.reviewedAt && (
                <span>Reviewed: {new Date(req.reviewedAt).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">
            You have not filed any attendance disputes.
          </div>
        )}
      </div>
    </div>
  );
}
