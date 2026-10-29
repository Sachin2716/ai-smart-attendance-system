'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { BookOpen, Building2, Plus, RefreshCw, X, GraduationCap, Users } from 'lucide-react';

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDepts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/departments');
      const data = await res.json();
      if (res.ok && data.success) setDepartments(data.departments);
    } catch (e) {
      toast.error('Failed to load departments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Department ${data.department.name} created`);
        setIsAddOpen(false);
        setCode('');
        setName('');
        fetchDepts();
      } else {
        toast.error(data.error || 'Failed to create department');
      }
    } catch (e) {
      toast.error('Network error creating department');
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
            <Building2 className="w-5 h-5 text-indigo-400" />
            Institutional Departments & Course Curricula
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure academic departments, degree programs, and course catalogs.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDepts}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-bold text-xs">
                  {dept.code}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {dept.courses?.length || 0} Courses
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{dept.name}</h3>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                  <span>{dept._count?.students || 0} Students</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>{dept._count?.faculty || 0} Faculty</span>
                </div>
              </div>

              {/* Course Catalog Preview */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold block">
                  Course Offerings:
                </span>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1 text-xs">
                  {dept.courses?.map((c: any) => (
                    <div
                      key={c.id}
                      className="p-2 rounded-xl bg-slate-800/60 border border-slate-800 flex items-center justify-between"
                    >
                      <span className="font-mono text-indigo-400 font-bold">{c.code}</span>
                      <span className="text-slate-300 truncate max-w-[150px]">{c.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{c.credits} Cr</span>
                    </div>
                  ))}
                  {(!dept.courses || dept.courses.length === 0) && (
                    <span className="text-[11px] text-slate-500 italic">No courses recorded yet</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  Add Academic Department
                </h3>
                <button onClick={() => setIsAddOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateDept} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Department Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. MECH"
                    required
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Department Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mechanical Engineering"
                    required
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Department'}
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
