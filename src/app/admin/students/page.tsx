'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  UserX,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Mail,
  School,
  Fingerprint,
  Camera,
  Layers,
} from 'lucide-react';
import { MultiAngleFaceEnrollment } from '@/components/biometrics/MultiAngleFaceEnrollment';

interface Student {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  phone?: string;
  departmentId: string;
  currentSemester: number;
  currentSectionId: string;
  accountStatus: 'ACTIVE' | 'INACTIVE';
  isFaceEnrolled: boolean;
  department: { id: string; name: string; code: string };
  currentSection: { id: string; fullLabel: string };
}

interface Department {
  id: string;
  code: string;
  name: string;
}

interface ClassSection {
  id: string;
  fullLabel: string;
  semester: number;
  departmentId: string;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRoll, setFormRoll] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDeptId, setFormDeptId] = useState('');
  const [formSemester, setFormSemester] = useState<number>(3);
  const [formSectionId, setFormSectionId] = useState('');
  const [formPassword, setFormPassword] = useState('Student@123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminBiometricSamples, setAdminBiometricSamples] = useState<any[]>([]);
  const [showCameraModal, setShowCameraModal] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [stuRes, deptRes, classRes] = await Promise.all([
        fetch('/api/admin/students'),
        fetch('/api/admin/departments'),
        fetch('/api/admin/classes'),
      ]);

      const [stuData, deptData, classData] = await Promise.all([
        stuRes.json(),
        deptRes.json(),
        classRes.json(),
      ]);

      if (stuData.success) setStudents(stuData.students);
      if (deptData.success) setDepartments(deptData.departments);
      if (classData.success) setSections(classData.sections);
    } catch (e) {
      toast.error('Failed to load student roster');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setStudentToEdit(null);
    setFormName('');
    setFormEmail('');
    setFormRoll('');
    setFormPhone('');
    setFormDeptId(departments[0]?.id || '');
    setFormSemester(3);
    setFormSectionId(sections[0]?.id || '');
    setFormPassword('Student@123');
    setAdminBiometricSamples([]);
    setShowCameraModal(false);
    setIsAddOpen(true);
  };

  const openEditModal = (stu: Student) => {
    setStudentToEdit(stu);
    setFormName(stu.name);
    setFormEmail(stu.email);
    setFormRoll(stu.rollNumber);
    setFormPhone(stu.phone || '');
    setFormDeptId(stu.departmentId);
    setFormSemester(stu.currentSemester);
    setFormSectionId(stu.currentSectionId);
    setIsAddOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (studentToEdit) {
        // Edit PATCH
        const res = await fetch(`/api/admin/students/${studentToEdit.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            email: formEmail,
            rollNumber: formRoll,
            phone: formPhone,
            departmentId: formDeptId,
            currentSemester: Number(formSemester),
            currentSectionId: formSectionId,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          toast.success('Student profile updated successfully');
          setIsAddOpen(false);
          fetchData();
        } else {
          toast.error(data.error || 'Update failed');
        }
      } else {
        // Create POST
        const res = await fetch('/api/admin/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            email: formEmail,
            rollNumber: formRoll,
            phone: formPhone,
            departmentId: formDeptId,
            semester: Number(formSemester),
            classSectionId: formSectionId,
            password: formPassword,
            biometricSamples: adminBiometricSamples.length >= 3 ? adminBiometricSamples : undefined,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          toast.success(`Student ${data.student.name} registered successfully`);
          setIsAddOpen(false);
          fetchData();
        } else {
          toast.error(data.error || 'Failed to create student account');
        }
      }
    } catch (err) {
      toast.error('Network error during save operation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStudentStatus = async (stu: Student) => {
    const nextStatus = stu.accountStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/students/${stu.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountStatus: nextStatus,
          reason: `Admin toggled status to ${nextStatus}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Student ${stu.name} is now ${nextStatus}`);
        fetchData();
      } else {
        toast.error(data.error || 'Status change failed');
      }
    } catch (e) {
      toast.error('Network error updating status');
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDeptFilter ? s.departmentId === selectedDeptFilter : true;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#18181B] border border-[#27272A] shadow-xl shadow-black/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent opacity-80" />

        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-950/70 text-[#22D3EE] border border-cyan-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              CENTRAL ROSTER
            </span>
            <span className="text-xs text-[#9CA3AF] font-mono">• BCA AIML Section B</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#F9FAFB] flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-[#3B82F6]" />
            Student Identity & Biometric Registry
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Authoritative master records synchronized with faculty roll-calls, SFace templates, and RFID sensors.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-[#111318] hover:bg-[#27272A] text-[#9CA3AF] hover:text-[#F9FAFB] border border-[#27272A] transition-all duration-200 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 flex items-center space-x-2 transition-all duration-200 cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll Student</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] flex flex-col sm:flex-row gap-3 shadow-md shadow-black/20">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, roll number, or institutional email..."
            className="w-full pl-10 pr-4 py-2 bg-[#111318] border border-[#27272A] rounded-xl text-xs text-[#F9FAFB] placeholder:text-[#9CA3AF]/60 focus:outline-none focus:border-[#3B82F6]"
          />
        </div>

        <select
          value={selectedDeptFilter}
          onChange={(e) => setSelectedDeptFilter(e.target.value)}
          className="px-3 py-2 bg-[#111318] border border-[#27272A] rounded-xl text-xs text-[#F9FAFB] focus:outline-none focus:border-[#3B82F6]"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.code} — {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Students Table */}
      <div className="p-6 rounded-2xl bg-[#18181B] border border-[#27272A] overflow-hidden shadow-xl shadow-black/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#27272A] text-[#9CA3AF] font-mono text-[11px]">
                <th className="pb-3">Roll Number</th>
                <th className="pb-3">Student Name</th>
                <th className="pb-3">Class & Dept</th>
                <th className="pb-3">Contact</th>
                <th className="pb-3">Biometrics</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272A] text-slate-300">
              {filteredStudents.map((stu) => (
                <tr key={stu.id} className="hover:bg-[#111318]/60 transition-colors">
                  <td className="py-3 font-mono font-bold text-cyan-400">{stu.rollNumber}</td>
                  <td className="py-3">
                    <p className="font-semibold text-white">{stu.name}</p>
                    <p className="text-[11px] text-[#9CA3AF] font-mono">{stu.email}</p>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-md bg-[#111318] text-[#F9FAFB] text-[11px] font-mono border border-[#27272A]">
                      {stu.currentSection?.fullLabel || 'Unassigned'}
                    </span>
                    <span className="text-[10px] text-[#9CA3AF] block mt-0.5">{stu.department?.name}</span>
                  </td>
                  <td className="py-3 text-[#9CA3AF]">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Phone className="w-3 h-3 text-[#9CA3AF]" />
                      {stu.phone || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3">
                    {stu.isFaceEnrolled ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-[#22C55E] border border-emerald-500/30">
                        <Fingerprint className="w-3 h-3" />
                        Enrolled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/60 text-[#F59E0B] border border-amber-500/30">
                        <AlertCircle className="w-3 h-3" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                        stu.accountStatus === 'ACTIVE'
                          ? 'bg-emerald-950/60 text-[#22C55E] border-emerald-500/30'
                          : 'bg-rose-950/60 text-[#EF4444] border-rose-500/30'
                      }`}
                    >
                      {stu.accountStatus}
                    </span>
                  </td>
                  <td className="py-3 text-right space-x-1.5">
                    <button
                      onClick={() => openEditModal(stu)}
                      className="p-1.5 rounded-lg bg-[#111318] hover:bg-[#27272A] text-[#9CA3AF] hover:text-white border border-[#27272A] transition-all cursor-pointer"
                      title="Edit student details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleStudentStatus(stu)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        stu.accountStatus === 'ACTIVE'
                          ? 'bg-rose-950/40 border-rose-500/30 text-[#EF4444] hover:bg-rose-950/60'
                          : 'bg-emerald-950/40 border-emerald-500/30 text-[#22C55E] hover:bg-emerald-950/60'
                      }`}
                      title={stu.accountStatus === 'ACTIVE' ? 'Deactivate Student' : 'Activate Student'}
                    >
                      {stu.accountStatus === 'ACTIVE' ? (
                        <UserX className="w-3.5 h-3.5" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#9CA3AF]">
                    No student records found. Click "Enroll Student" to register accounts.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl bg-[#18181B] border border-[#27272A] p-6 space-y-5 shadow-2xl shadow-black overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#3B82F6]" />
                  {studentToEdit ? 'Edit Student Master Record' : 'Register New Student Profile'}
                </h3>
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="p-1 rounded-lg text-[#9CA3AF] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-[#F9FAFB] mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full px-3 py-2 bg-[#111318] border border-[#27272A] rounded-xl text-white placeholder:text-[#9CA3AF]/60 focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-[#F9FAFB] mb-1">Roll Number / USN</label>
                    <input
                      type="text"
                      required
                      value={formRoll}
                      onChange={(e) => setFormRoll(e.target.value.toUpperCase())}
                      placeholder="e.g. 24BCA101"
                      className="w-full px-3 py-2 bg-[#111318] border border-[#27272A] rounded-xl text-white font-mono uppercase placeholder:text-[#9CA3AF]/60 focus:outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#F9FAFB] mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 bg-[#111318] border border-[#27272A] rounded-xl text-white placeholder:text-[#9CA3AF]/60 focus:outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-[#F9FAFB] mb-1">Institutional Email</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="student@caias.edu.in"
                    className="w-full px-3 py-2 bg-[#111318] border border-[#27272A] rounded-xl text-white placeholder:text-[#9CA3AF]/60 focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-[#F9FAFB] mb-1">Department</label>
                    <select
                      value={formDeptId}
                      onChange={(e) => setFormDeptId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#111318] border border-[#27272A] rounded-xl text-white focus:outline-none focus:border-[#3B82F6]"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-[#F9FAFB] mb-1">Class Section</label>
                    <select
                      value={formSectionId}
                      onChange={(e) => setFormSectionId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#111318] border border-[#27272A] rounded-xl text-white focus:outline-none focus:border-[#3B82F6]"
                    >
                      {sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullLabel}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {!studentToEdit && (
                  <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 text-[11px] text-[#9CA3AF]">
                    <span>Default student login password will be set to: </span>
                    <strong className="text-cyan-400 font-mono">Student@123</strong>
                  </div>
                )}

                <div className="pt-3 border-t border-[#27272A] flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#111318] hover:bg-[#27272A] border border-[#27272A] text-white font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : studentToEdit ? 'Save Changes' : 'Register Student'}
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
