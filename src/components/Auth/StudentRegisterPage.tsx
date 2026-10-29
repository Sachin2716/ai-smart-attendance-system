'use client';

import React, { useState } from 'react';
import { smartfaceApi } from '@/adapters/smartfaceApi';
import { User, Mail, Lock, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, Camera, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StudentRegisterPageProps {
  onBackToLogin: () => void;
  onRegistrationSuccess: (studentData: { student_id: string; name: string; email: string }) => void;
}

export const StudentRegisterPage: React.FC<StudentRegisterPageProps> = ({
  onBackToLogin,
  onRegistrationSuccess,
}) => {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [collegeEmail, setCollegeEmail] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [semester, setSemester] = useState(3);
  const [section, setSection] = useState('B');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registeredData, setRegisteredData] = useState<any | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const classLabel = `${department === 'Computer Science' ? 'BCA AIML' : 'B.Tech'} ${semester}${section}`;
      const res = await smartfaceApi.registerStudent({
        name,
        student_id: studentId.toUpperCase(),
        college_email: collegeEmail.toLowerCase(),
        department,
        semester,
        section,
        class_label: classLabel,
        password,
      });

      setRegisteredData({
        student_id: studentId.toUpperCase(),
        name,
        email: collegeEmail.toLowerCase(),
        verification_token: res.verification_token,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateEmailVerification = async () => {
    if (!registeredData?.verification_token) return;
    setLoading(true);
    try {
      const res = await smartfaceApi.verifyEmail(registeredData.verification_token);
      if (res.success) {
        setEmailVerified(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-indigo-500/30 rounded-3xl p-8 shadow-2xl space-y-6 text-white relative">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/20">
            <Sparkles className="w-7 h-7" />
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            STUDENT SELF-REGISTRATION
          </span>
          <h2 className="text-2xl font-extrabold text-white">SmartFace Registration</h2>
          <p className="text-xs text-slate-400">
            Create your student biometric account for college attendance
          </p>
        </div>

        {/* Step 2: Verification View */}
        {registeredData ? (
          <div className="p-6 rounded-2xl bg-slate-950 border border-indigo-500/30 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-white">
                {emailVerified ? 'College Email Verified ✓' : 'Verify Your College Email'}
              </h4>
              <p className="text-xs text-slate-400">
                A verification link has been dispatched to <strong>{registeredData.email}</strong>
              </p>
            </div>

            {!emailVerified ? (
              <button
                onClick={handleSimulateEmailVerification}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg transition-all"
              >
                {loading ? 'Verifying...' : 'Simulate Clicking Verification Link'}
              </button>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                  Email verification complete! Next step: Face Biometric Enrollment.
                </div>
                <button
                  onClick={() => onRegistrationSuccess(registeredData)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center space-x-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>Proceed to Face Enrollment Studio</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Step 1: Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300">USN / Student ID</label>
                <input
                  type="text"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. 24BCA003"
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white uppercase font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300">College Email</label>
              <input
                type="email"
                required
                value={collegeEmail}
                onChange={(e) => setCollegeEmail(e.target.value)}
                placeholder="e.g. rahul.verma@caias.edu.in"
                className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full mt-1 px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="AI & Data Science">AI & Data Science</option>
                  <option value="Electronics & Comm.">Electronics & Comm.</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="w-full mt-1 px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Sem {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300">Section</label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full mt-1 px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Submitting Details...' : 'Register & Verify College Email'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Back to Login */}
        <div className="text-center pt-2 border-t border-slate-800">
          <button
            onClick={onBackToLogin}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
          >
            ← Already have an account? Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
