'use client';

import React, { useState, useEffect } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { Student, Department, CourseClass, Semester, Section } from '@/types';
import { User, Mail, Phone, BookOpen, Layers, Grid, Cpu, ShieldCheck, X, Camera, Fingerprint, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddEditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentToEdit?: Student | null;
}

export const AddEditStudentModal: React.FC<AddEditStudentModalProps> = ({
  isOpen,
  onClose,
  studentToEdit,
}) => {
  const { addStudent, updateStudent } = useAttendance();
  const { isAdmin } = useAuth();

  const [name, setName] = useState('');
  const [uucmsNo, setUucmsNo] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [course, setCourse] = useState<CourseClass>('BCA AIML');
  const [dept, setDept] = useState<Department>('Computer Science');
  const [sem, setSem] = useState<Semester>(3);
  const [sec, setSec] = useState<Section>('B');
  const [cardUid, setCardUid] = useState('A7:B2:91:4C');
  const [fingerprintSlotId, setFingerprintSlotId] = useState<number>(1);
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    setErrorMsg('');
    if (studentToEdit) {
      setName(studentToEdit.name);
      setUucmsNo(studentToEdit.uucmsNo || studentToEdit.rollNo);
      setEmail(studentToEdit.email);
      setPhone(studentToEdit.phone);
      setCourse(studentToEdit.course || 'BCA AIML');
      setDept(studentToEdit.department);
      setSem(studentToEdit.semester);
      setSec(studentToEdit.section);
      setCardUid(studentToEdit.cardUid || studentToEdit.rfidTag);
      setFingerprintSlotId(studentToEdit.fingerprintSlotId || 1);
      setAvatar(studentToEdit.avatar || studentToEdit.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
      setStatus(studentToEdit.status || 'active');
    } else {
      setName('');
      setUucmsNo('');
      setEmail('');
      setPhone('');
      setCourse('BCA AIML');
      setDept('Computer Science');
      setSem(3);
      setSec('B');
      setCardUid(`A7:B2:${Math.floor(Math.random()*89+10)}:${Math.floor(Math.random()*89+10)}`);
      setFingerprintSlotId(Math.floor(Math.random()*50)+1);
      setAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
      setStatus('active');
    }
  }, [studentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isAdmin) {
      setErrorMsg('Access Denied: Action restricted to ADMIN role only.');
      return;
    }

    if (studentToEdit) {
      updateStudent({
        ...studentToEdit,
        name,
        uucmsNo,
        rollNo: uucmsNo,
        email,
        phone,
        course,
        department: dept,
        semester: sem,
        section: sec,
        cardUid,
        rfidTag: cardUid,
        fingerprintSlotId,
        avatar,
        photo: avatar,
        status,
      });
      onClose();
    } else {
      const res = addStudent({
        name,
        uucmsNo,
        rollNo: uucmsNo,
        email: email || `${uucmsNo.toLowerCase()}@caias.edu.in`,
        phone: phone || '+91 98765 43210',
        course,
        department: dept,
        semester: sem,
        section: sec,
        cardUid,
        rfidTag: cardUid,
        fingerprintSlotId,
        avatar,
        photo: avatar,
        status,
        joinedDate: new Date().toISOString().split('T')[0],
      });

      if (!res.success) {
        setErrorMsg(res.message || 'Duplicate student error');
      } else {
        onClose();
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg p-6 rounded-3xl glass-panel border border-indigo-500/40 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto text-slate-100"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-lg font-extrabold text-white mb-2">
            {studentToEdit ? 'Edit Master Student Record (ADMIN)' : 'Enroll New Student (ADMIN)'}
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Required master student metadata and hardware credential mapping
          </p>

          {errorMsg && (
            <div className="p-3 mb-4 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Student Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">UUCMS Register Number</label>
                <input
                  type="text"
                  required
                  value={uucmsNo}
                  onChange={(e) => setUucmsNo(e.target.value)}
                  placeholder="e.g. 24BCA001"
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 font-mono text-indigo-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">RFID Card UID (Hex)</label>
                <input
                  type="text"
                  required
                  value={cardUid}
                  onChange={(e) => setCardUid(e.target.value)}
                  placeholder="e.g. A7:B2:91:4C"
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 font-mono text-amber-300 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Biometric Slot ID</label>
                <input
                  type="number"
                  required
                  value={fingerprintSlotId}
                  onChange={(e) => setFingerprintSlotId(Number(e.target.value))}
                  placeholder="Slot #1"
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 font-mono text-purple-300 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Course / Program</label>
                <select
                  value={course}
                  onChange={(e) => setCourse(e.target.value as CourseClass)}
                  className="w-full px-2 py-2 rounded-xl glass-input text-slate-200 bg-slate-900 font-bold"
                >
                  <option value="BCA AIML">BCA AIML</option>
                  <option value="B.Tech CSE">B.Tech CSE</option>
                  <option value="B.Tech ECE">B.Tech ECE</option>
                  <option value="B.Tech ME">B.Tech ME</option>
                  <option value="B.Sc Data Science">B.Sc Data Science</option>
                  <option value="BBA">BBA</option>
                  <option value="B.Com">B.Com</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Semester</label>
                <select
                  value={sem}
                  onChange={(e) => setSem(Number(e.target.value) as Semester)}
                  className="w-full px-2 py-2 rounded-xl glass-input text-slate-200 bg-slate-900 font-bold"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Section</label>
                <select
                  value={sec}
                  onChange={(e) => setSec(e.target.value as Section)}
                  className="w-full px-2 py-2 rounded-xl glass-input text-slate-200 bg-slate-900 font-bold"
                >
                  {['A', 'B', 'C', 'D'].map(s => (
                    <option key={s} value={s}>Section {s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">College Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@caias.edu.in"
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Account Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 bg-slate-900 font-bold"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive (Deactivated)</option>
                </select>
              </div>
            </div>

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
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg"
              >
                {studentToEdit ? 'Save Changes' : 'Enroll Student'}
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
