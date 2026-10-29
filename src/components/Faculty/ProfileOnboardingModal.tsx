'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Department, Semester, Section } from '@/types';
import { UserCheck, ShieldCheck, Mail, Phone, IdCard, Briefcase, Award, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileOnboardingModal: React.FC<ProfileOnboardingModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUserProfile } = useAuth();

  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState<Department>('Computer Science');
  const [designation, setDesignation] = useState('Associate Professor');
  const [age, setAge] = useState(42);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [subjectsStr, setSubjectsStr] = useState('CS301, CS302');
  const [selectedSems, setSelectedSems] = useState<Semester[]>([3, 5]);
  const [selectedSecs, setSelectedSecs] = useState<Section[]>(['A', 'B']);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmployeeId(user.employeeId || `EMP-${Date.now().toString().slice(-4)}`);
      setDepartment(user.department);
      setDesignation(user.designation || 'Associate Professor');
      setAge(user.age || 42);
      setGender(user.gender || 'Male');
      setMobile(user.mobile || '+91 98765 11223');
      setEmail(user.email);
      setSubjectsStr(user.subjectsHandled ? user.subjectsHandled.join(', ') : 'CS301, CS302');
      setSelectedSems(user.semesters || [3, 5]);
      setSelectedSecs(user.sections || ['A', 'B']);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const subjectsHandled = subjectsStr.split(',').map(s => s.trim()).filter(Boolean);

    updateUserProfile({
      ...user,
      name,
      employeeId,
      department,
      designation,
      age: Number(age),
      gender,
      mobile,
      email,
      subjectsHandled,
      semesters: selectedSems,
      sections: selectedSecs,
      isOnboarded: true,
    });

    onClose();
  };

  const toggleSem = (sem: Semester) => {
    if (selectedSems.includes(sem)) {
      setSelectedSems(selectedSems.filter(s => s !== sem));
    } else {
      setSelectedSems([...selectedSems, sem]);
    }
  };

  const toggleSec = (sec: Section) => {
    if (selectedSecs.includes(sec)) {
      setSelectedSecs(selectedSecs.filter(s => s !== sec));
    } else {
      setSelectedSecs([...selectedSecs, sec]);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-xl p-6 rounded-3xl glass-panel border border-slate-700/60 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center space-x-3 mb-5">
            <div className="p-3 rounded-2xl bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/30">
              <IdCard className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Faculty Profile Setup & Onboarding
              </h2>
              <p className="text-xs text-slate-400">
                Complete your faculty profile to enable personalized timetables & smart attendance
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Faculty Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Employee ID</label>
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. EMP-CS-4082"
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as Department)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 bg-slate-900"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="AI & Data Science">AI & Data Science</option>
                  <option value="Electronics & Comm.">Electronics & Comm.</option>
                  <option value="Mechanical Eng.">Mechanical Eng.</option>
                  <option value="Civil Eng.">Civil Eng.</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Designation</label>
                <input
                  type="text"
                  required
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Associate Professor"
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'Male' | 'Female' | 'Other')}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 bg-slate-900"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+91 98765 11223"
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Subjects Handled (Comma Separated)
              </label>
              <input
                type="text"
                value={subjectsStr}
                onChange={(e) => setSubjectsStr(e.target.value)}
                placeholder="e.g. CS301, CS302, CS501"
                className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 font-mono"
              />
            </div>

            {/* Semester & Section Selector */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Assigned Semester(s)</label>
                <div className="flex flex-wrap gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSem(s as Semester)}
                      className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-all ${
                        selectedSems.includes(s as Semester)
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Sem {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Assigned Section(s)</label>
                <div className="flex flex-wrap gap-1.5">
                  {(['A', 'B', 'C', 'D'] as Section[]).map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => toggleSec(sec)}
                      className={`px-3 py-1 rounded-lg font-mono font-bold transition-all ${
                        selectedSecs.includes(sec)
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Sec {sec}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-semibold"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Save Profile Information</span>
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
