'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Users,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  UserX,
  UserCheck,
  Briefcase,
  BookOpen,
  X,
  Phone,
  Mail,
  School,
  CheckCircle2,
  CalendarDays,
  Layers,
} from 'lucide-react';

interface FacultyMember {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  designation: string;
  departmentId: string;
  accountStatus: 'ACTIVE' | 'INACTIVE';
  department: { id: string; name: string; code: string };
  assignments: {
    id: string;
    course: { id: string; code: string; name: string };
    classSection: { id: string; fullLabel: string };
  }[];
  _count: { sessions: number };
}

interface Department {
  id: string;
  code: string;
  name: string;
}

interface Course {
  id: string;
  code: string;
  name: string;
}

interface ClassSection {
  id: string;
  fullLabel: string;
}

export default function AdminFacultyPage() {
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [facultyToEdit, setFacultyToEdit] = useState<FacultyMember | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formEmpId, setFormEmpId] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDesignation, setFormDesignation] = useState('Assistant Professor');
  const [formDeptId, setFormDeptId] = useState('');
  const [formPassword, setFormPassword] = useState('Faculty@123');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [facRes, deptRes, classRes] = await Promise.all([
        fetch('/api/admin/faculty'),
        fetch('/api/admin/departments'),
        fetch('/api/admin/classes'),
      ]);

      const [facData, deptData, classData] = await Promise.all([
        facRes.json(),
        deptRes.json(),
        classRes.json(),
      ]);

      if (facData.success) setFaculty(facData.faculty);
      if (deptData.success) setDepartments(deptData.departments);
      if (classData.success) {
        setSections(classData.sections);
        setCourses(classData.courses);
      }
    } catch (e) {
      toast.error('Failed to load faculty directory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setFacultyToEdit(null);
    setFormName('');
    setFormEmail('');
    setFormEmpId('');
    setFormPhone('');
    setFormDesignation('Assistant Professor');
    setFormDeptId(departments[0]?.id || '');
    setFormPassword('Faculty@123');
    setIsModalOpen(true);
  };

  const openEditModal = (fac: FacultyMember) => {
    setFacultyToEdit(fac);
    setFormName(fac.name);
    setFormEmail(fac.email);
    setFormEmpId(fac.employeeId);
    setFormPhone(fac.phone || '');
    setFormDesignation(fac.designation);
    setFormDeptId(fac.departmentId);
    setIsModalOpen(true);
  };

  const handleSaveFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (facultyToEdit) {
        const res = await fetch(`/api/admin/faculty/${facultyToEdit.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            email: formEmail,
            phone: formPhone,
            designation: formDesignation,
            departmentId: formDeptId,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          toast.success('Faculty profile updated successfully');
          setIsModalOpen(false);
          fetchData();
        } else {
          toast.error(data.error || 'Update failed');
        }
      } else {
        const res = await fetch('/api/admin/faculty', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            email: formEmail,
            employeeId: formEmpId,
            phone: formPhone,
            designation: formDesignation,
            departmentId: formDeptId,
            password: formPassword,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          toast.success(`Faculty ${data.faculty.name} registered successfully`);
          setIsModalOpen(false);
          fetchData();
        } else {
          toast.error(data.error || 'Failed to create faculty account');
        }
      }
    } catch (err) {
      toast.error('Network error during save operation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFacultyStatus = async (fac: FacultyMember) => {
    const nextStatus = fac.accountStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/faculty/${fac.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountStatus: nextStatus,
          reason: `Admin toggled status to ${nextStatus}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Faculty ${fac.name} is now ${nextStatus}`);
        fetchData();
      } else {
        toast.error(data.error || 'Status change failed');
      }
    } catch (e) {
      toast.error('Network error updating status');
    }
  };

  const filteredFaculty = faculty.filter((f) => {
    return (
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.designation.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#18181B] border border-[#27272A] shadow-xl shadow-black/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#22D3EE] to-transparent opacity-80" />

        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/70 text-[#22D3EE] border border-cyan-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              FACULTY DIRECTORY
            </span>
            <span className="text-xs text-[#9CA3AF] font-mono">• Department of Computer Science</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#F9FAFB] flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-[#22D3EE]" />
            Faculty Staff & Course Assignments
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Manage academic instructors, course allocations, lecture permissions, and timetable assignments.
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
            <span>Add Faculty</span>
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] flex flex-col sm:flex-row gap-3 shadow-md shadow-black/20">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search faculty by name, employee ID, designation, or email..."
            className="w-full pl-10 pr-4 py-2 bg-[#111318] border border-[#27272A] rounded-xl text-xs text-[#F9FAFB] placeholder:text-[#9CA3AF]/60 focus:outline-none focus:border-[#3B82F6]"
          />
        </div>
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredFaculty.map((fac) => (
          <div
            key={fac.id}
            className="p-5 rounded-2xl bg-[#18181B] border border-[#27272A] hover:border-cyan-500/40 transition-all duration-200 shadow-xl shadow-black/40 space-y-4 card-hover-effect relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-600/15 border border-cyan-500/30 text-[#22D3EE] flex items-center justify-center font-bold text-sm">
                  {fac.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white line-clamp-1">{fac.name}</h3>
                  <p className="text-[11px] text-[#9CA3AF] font-mono">{fac.designation}</p>
                </div>
              </div>

              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  fac.accountStatus === 'ACTIVE'
                    ? 'bg-emerald-950/60 text-[#22C55E] border-emerald-500/30'
                    : 'bg-rose-950/60 text-[#EF4444] border-rose-500/30'
                }`}
              >
                {fac.accountStatus}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-[#9CA3AF] pt-2 border-t border-[#27272A]">
              <div className="flex items-center justify-between">
                <span>Employee ID:</span>
                <span className="font-mono text-cyan-400 font-bold">{fac.employeeId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Email:</span>
                <span className="text-slate-200 truncate max-w-[180px] font-mono text-[11px]">{fac.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Department:</span>
                <span className="text-slate-200">{fac.department?.name}</span>
              </div>
            </div>

            {/* Assigned Courses */}
            <div className="space-y-1.5 pt-2 border-t border-[#27272A]">
              <span className="text-[10px] font-mono text-[#9CA3AF] uppercase">Assigned Courses & Classes:</span>
              <div className="flex flex-wrap gap-1.5">
                {fac.assignments?.length > 0 ? (
                  fac.assignments.map((a) => (
                    <span
                      key={a.id}
                      className="px-2 py-0.5 rounded-md bg-[#111318] border border-[#27272A] text-[10px] text-cyan-300 font-mono"
                    >
                      {a.course.code} ({a.classSection.fullLabel})
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-[#9CA3AF]/60 italic">5 weekly timetable slots assigned</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-[#27272A] flex items-center justify-between text-xs">
              <span className="text-[11px] font-mono text-[#9CA3AF]">
                Sessions: <strong className="text-white">{fac._count?.sessions || 0}</strong>
              </span>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => openEditModal(fac)}
                  className="p-1.5 rounded-lg bg-[#111318] hover:bg-[#27272A] text-[#9CA3AF] hover:text-white border border-[#27272A] transition-colors cursor-pointer"
                  title="Edit details"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toggleFacultyStatus(fac)}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    fac.accountStatus === 'ACTIVE'
                      ? 'bg-rose-950/40 border-rose-500/30 text-[#EF4444] hover:bg-rose-950/60'
                      : 'bg-emerald-950/40 border-emerald-500/30 text-[#22C55E] hover:bg-emerald-950/60'
                  }`}
                  title={fac.accountStatus === 'ACTIVE' ? 'Deactivate Faculty' : 'Activate Faculty'}
                >
                  {fac.accountStatus === 'ACTIVE' ? (
                    <UserX className="w-3.5 h-3.5" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredFaculty.length === 0 && (
          <div className="col-span-full py-16 text-center bg-[#18181B] border border-[#27272A] rounded-2xl text-[#9CA3AF] text-xs">
            <Users className="w-8 h-8 mx-auto text-[#9CA3AF]/40 mb-2" />
            <p className="font-semibold text-white">No Faculty Members Found</p>
            <p className="text-[11px] text-[#9CA3AF] mt-1">Click "Add Faculty" to register new teaching instructors.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Faculty Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl bg-[#18181B] border border-[#27272A] p-6 space-y-5 shadow-2xl shadow-black overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#22D3EE]" />
                  {facultyToEdit ? 'Edit Faculty Record' : 'Register New Faculty Profile'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-[#9CA3AF] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveFaculty} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-[#F9FAFB] mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Dr. Alan Turing"
                    className="w-full px-3 py-2 bg-[#111318] border border-[#27272A] rounded-xl text-white placeholder:text-[#9CA3AF]/60 focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-[#F9FAFB] mb-1">Employee ID</label>
                    <input
                      type="text"
                      required
                      value={formEmpId}
                      onChange={(e) => setFormEmpId(e.target.value.toUpperCase())}
                      placeholder="e.g. FAC-101"
                      className="w-full px-3 py-2 bg-[#111318] border border-[#27272A] rounded-xl text-white font-mono uppercase placeholder:text-[#9CA3AF]/60 focus:outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#F9FAFB] mb-1">Designation</label>
                    <input
                      type="text"
                      value={formDesignation}
                      onChange={(e) => setFormDesignation(e.target.value)}
                      placeholder="e.g. Professor"
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
                    placeholder="faculty@caias.edu.in"
                    className="w-full px-3 py-2 bg-[#111318] border border-[#27272A] rounded-xl text-white placeholder:text-[#9CA3AF]/60 focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                </div>

                <div className="pt-3 border-t border-[#27272A] flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#111318] hover:bg-[#27272A] border border-[#27272A] text-white font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : facultyToEdit ? 'Save Changes' : 'Register Faculty'}
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
