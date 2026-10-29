'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { FileCheck2, Check, X, Clock, AlertCircle, RefreshCw } from 'lucide-react';

export default function AdminCorrectionsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [remarks, setRemarks] = useState('');
  const [updatedStatus, setUpdatedStatus] = useState<'PRESENT' | 'EXCUSED'>('EXCUSED');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/corrections');
      const data = await res.json();
      if (res.ok && data.success) setRequests(data.requests);
    } catch (e) {
      toast.error('Failed to load correction requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openReviewModal = (req: any, dec: 'APPROVED' | 'REJECTED') => {
    setSelectedReq(req);
    setDecision(dec);
    setRemarks(dec === 'APPROVED' ? 'Approved by administration based on submitted documentation.' : 'Insufficient supporting evidence provided.');
    setUpdatedStatus('EXCUSED');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/corrections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedReq.id,
          decision,
          remarks,
          updatedAttendanceStatus: updatedStatus,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Request ${decision.toLowerCase()} successfully`);
        setSelectedReq(null);
        fetchRequests();
      } else {
        toast.error(data.error || 'Review failed');
      }
    } catch (err) {
      toast.error('Network error during review submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-indigo-400" />
            Attendance Correction & Dispute Governance
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review student-submitted attendance disputes, evaluate evidence, and approve retroactive adjustments.
          </p>
        </div>

        <button
          onClick={fetchRequests}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Requests Table */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3">Date</th>
                <th className="pb-3">Student</th>
                <th className="pb-3">Subject & Session</th>
                <th className="pb-3">Student's Reason</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 font-mono text-[11px] text-slate-400">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <p className="font-semibold text-white">{req.student.name}</p>
                    <p className="font-mono text-[11px] text-indigo-400">{req.student.rollNumber}</p>
                  </td>
                  <td className="py-3">
                    <p className="font-medium text-slate-200">{req.session.course.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {req.session.sessionDate} • {req.session.classSection.fullLabel}
                    </p>
                  </td>
                  <td className="py-3 max-w-xs text-slate-300 truncate" title={req.reason}>
                    {req.reason}
                  </td>
                  <td className="py-3">
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
                  </td>
                  <td className="py-3 text-right">
                    {req.status === 'PENDING' ? (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openReviewModal(req, 'APPROVED')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => openReviewModal(req, 'REJECTED')}
                          className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">Reviewed</span>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No correction requests submitted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Action Modal */}
      <AnimatePresence>
        {selectedReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">
                  {decision === 'APPROVED' ? 'Approve Attendance Correction' : 'Reject Correction Request'}
                </h3>
                <button
                  onClick={() => setSelectedReq(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-1">
                <p className="text-white font-semibold">
                  {selectedReq.student.name} ({selectedReq.student.rollNumber})
                </p>
                <p className="text-slate-400">Subject: {selectedReq.session.course.name}</p>
                <p className="text-slate-300 italic pt-1">"{selectedReq.reason}"</p>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
                {decision === 'APPROVED' && (
                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Update Status To</label>
                    <select
                      value={updatedStatus}
                      onChange={(e: any) => setUpdatedStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="EXCUSED">EXCUSED (Medical / Official Leave)</option>
                      <option value="PRESENT">PRESENT (Verified Present)</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Reviewer Remarks / Audit Note</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    required
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedReq(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-5 py-2 rounded-xl font-semibold text-white shadow-lg cursor-pointer disabled:opacity-50 ${
                      decision === 'APPROVED'
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                        : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                    }`}
                  >
                    {isSubmitting ? 'Submitting...' : `Confirm ${decision}`}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
