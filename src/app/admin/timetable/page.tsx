'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  CalendarDays,
  Plus,
  RefreshCw,
  Clock,
  MapPin,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  User,
  BookOpen,
} from 'lucide-react';

interface TimetableSlot {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  classSectionId: string;
  courseId: string;
  facultyId: string;
  course: {
    id: string;
    code: string;
    name: string;
  };
  faculty: {
    id: string;
    name: string;
    designation: string;
  };
}

export default function AdminTimetablePage() {
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    dayOfWeek: 'Monday',
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    roomNumber: 'Room 201',
    courseId: '',
    facultyId: '',
  });

  const fetchSections = async () => {
    try {
      const res = await fetch('/api/admin/classes');
      const data = await res.json();
      if (data.success && data.sections?.length > 0) {
        setSections(data.sections);
        setSelectedSectionId(data.sections[0].id);
      }
    } catch (e) {
      toast.error('Failed to load class sections');
    }
  };

  const fetchTimetable = async (sectionId: string) => {
    if (!sectionId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/timetable?sectionId=${sectionId}`);
      const data = await res.json();
      if (data.success) {
        setSlots(data.slots || []);
        if (data.courses) setCourses(data.courses);
        if (data.faculty) setFacultyList(data.faculty);
      }
    } catch (e) {
      toast.error('Failed to load timetable');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  useEffect(() => {
    if (selectedSectionId) {
      fetchTimetable(selectedSectionId);
    }
  }, [selectedSectionId]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const openAddModal = (day?: string) => {
    setEditingSlot(null);
    setFormData({
      dayOfWeek: day || 'Monday',
      startTime: '09:00 AM',
      endTime: '10:00 AM',
      roomNumber: 'Room 201',
      courseId: courses[0]?.id || '',
      facultyId: facultyList[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (slot: TimetableSlot) => {
    setEditingSlot(slot);
    setFormData({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      roomNumber: slot.roomNumber,
      courseId: slot.courseId,
      facultyId: slot.facultyId,
    });
    setIsModalOpen(true);
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseId || !formData.facultyId) {
      toast.error('Please select both a course and a faculty member');
      return;
    }

    setIsSaving(true);
    try {
      if (editingSlot) {
        const res = await fetch(`/api/admin/timetable/${editingSlot.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          toast.success('Lecture timing and teacher assignment updated successfully!');
          setIsModalOpen(false);
          fetchTimetable(selectedSectionId);
        } else {
          toast.error(data.error || 'Failed to update slot');
        }
      } else {
        const res = await fetch('/api/admin/timetable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            classSectionId: selectedSectionId,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          toast.success('New lecture slot added to timetable!');
          setIsModalOpen(false);
          fetchTimetable(selectedSectionId);
        } else {
          toast.error(data.error || 'Failed to create slot');
        }
      }
    } catch (e) {
      toast.error('Network error saving timetable slot');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSlot = async (id: string, courseCode: string, day: string) => {
    if (!confirm(`Are you sure you want to delete the ${courseCode} slot on ${day}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/timetable/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Timetable slot deleted');
        fetchTimetable(selectedSectionId);
      } else {
        toast.error(data.error || 'Failed to delete slot');
      }
    } catch (e) {
      toast.error('Network error deleting slot');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#18181B] border border-[#27272A] shadow-xl shadow-black/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent opacity-80" />

        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-950/70 text-[#22D3EE] border border-cyan-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              TIMETABLE SCHEDULE COMMAND
            </span>
            <span className="text-xs text-[#9CA3AF] font-mono">• Weekly Roster</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#F9FAFB] flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-[#3B82F6]" />
            Academic Timetable & Teacher Assignment
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Configure weekly lecture timings, allocate classrooms, and assign faculty directly.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 self-start sm:self-auto">
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="px-3 py-2 bg-[#111318] border border-[#27272A] rounded-xl text-xs text-[#F9FAFB] focus:outline-none focus:border-[#3B82F6] font-semibold"
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullLabel} ({s.department?.name || 'Computer Science'})
              </option>
            ))}
          </select>

          <button
            onClick={() => openAddModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lecture Slot</span>
          </button>

          <button
            onClick={() => fetchTimetable(selectedSectionId)}
            className="p-2 rounded-xl bg-[#111318] hover:bg-[#27272A] text-[#9CA3AF] hover:text-white border border-[#27272A] transition-all cursor-pointer"
            title="Refresh Timetable"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timetable Grid (Monday to Saturday) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {daysOfWeek.map((day) => {
          const daySlots = slots.filter((s) => s.dayOfWeek === day);
          return (
            <div
              key={day}
              className="p-5 rounded-2xl bg-[#18181B] border border-[#27272A] space-y-3 flex flex-col justify-between shadow-xl shadow-black/40 card-hover-effect relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#27272A]">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">{day}</h3>
                    <span className="text-[10px] font-mono bg-blue-950/60 text-[#22D3EE] border border-cyan-500/30 px-2 py-0.5 rounded">
                      {daySlots.length} Lectures
                    </span>
                  </div>

                  <button
                    onClick={() => openAddModal(day)}
                    className="p-1 rounded-lg bg-[#111318] hover:bg-[#27272A] text-[#9CA3AF] hover:text-cyan-400 transition cursor-pointer"
                    title={`Add lecture to ${day}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5 mt-3">
                  {daySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="p-3 rounded-xl bg-[#111318] border border-[#27272A] hover:border-blue-500/30 transition-all space-y-1.5 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/30">
                          {slot.course.code}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[#9CA3AF] flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-[#9CA3AF]" />
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs font-semibold text-white line-clamp-1">{slot.course.name}</p>

                      <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] pt-1 border-t border-[#27272A]">
                        <span className="truncate max-w-[140px] text-slate-300 font-medium">{slot.faculty.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-[#9CA3AF] font-mono text-[10px]">
                            <MapPin className="w-3 h-3 text-cyan-400" />
                            {slot.roomNumber}
                          </span>
                          
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                            <button
                              onClick={() => openEditModal(slot)}
                              className="p-1 rounded bg-[#18181B] hover:bg-blue-600 text-[#9CA3AF] hover:text-white transition cursor-pointer border border-[#27272A]"
                              title="Edit Timings & Faculty"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteSlot(slot.id, slot.course.code, slot.dayOfWeek)}
                              className="p-1 rounded bg-[#18181B] hover:bg-rose-600 text-[#9CA3AF] hover:text-white transition cursor-pointer border border-[#27272A]"
                              title="Delete Slot"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {daySlots.length === 0 && (
                    <div className="py-6 text-center space-y-1">
                      <p className="text-xs text-[#9CA3AF] italic">No scheduled lectures</p>
                      <button
                        onClick={() => openAddModal(day)}
                        className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                      >
                        + Schedule first slot
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Timetable Slot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6 w-full max-w-lg shadow-2xl text-white space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[#3B82F6]" />
                <h3 className="font-bold text-base text-white">
                  {editingSlot ? 'Edit Timetable Slot & Teacher' : 'Add New Timetable Slot'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-[#111318] hover:bg-[#27272A] text-[#9CA3AF] hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#F9FAFB] mb-1.5">Day of Week</label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                  className="w-full bg-[#111318] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3B82F6]"
                >
                  {daysOfWeek.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#F9FAFB] mb-1.5">Start Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 09:00 AM"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full bg-[#111318] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3B82F6] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#F9FAFB] mb-1.5">End Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:00 AM"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full bg-[#111318] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3B82F6] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#F9FAFB] mb-1.5">Classroom / Laboratory</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Room 201 or AI Lab 3"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  className="w-full bg-[#111318] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#F9FAFB] mb-1.5">Curriculum Course</label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full bg-[#111318] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3B82F6]"
                >
                  <option value="">-- Select Course --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#F9FAFB] mb-1.5">Assigned Teacher</label>
                <select
                  value={formData.facultyId}
                  onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                  className="w-full bg-[#111318] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3B82F6]"
                >
                  <option value="">-- Select Faculty --</option>
                  {facultyList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#111318] hover:bg-[#27272A] text-[#9CA3AF] text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingSlot ? 'Update Slot' : 'Save Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
