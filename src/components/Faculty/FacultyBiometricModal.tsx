'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Camera, CreditCard, CheckCircle2, AlertCircle, Lock, RefreshCw, X } from 'lucide-react';
import { EventItem, FacultyUser } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface FacultyBiometricModalProps {
  event: EventItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (verifiedFaculty: FacultyUser) => void;
}

export const FacultyBiometricModal: React.FC<FacultyBiometricModalProps> = ({
  event,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  
  const [step, setStep] = useState<'CARD_TAP' | 'FACE_SCAN' | 'VERIFYING' | 'SUCCESS' | 'FAILED'>('CARD_TAP');
  const [scannedCardUid, setScannedCardUid] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !event) return null;

  // Check if logged in faculty is assigned to this event
  const isAssigned = (event.assignedFaculty || []).some(
    af => (af.facultyEmail || '').toLowerCase() === (user?.email || '').toLowerCase() ||
          (af.facultyName || '').toLowerCase().includes((user?.name || '').toLowerCase())
  );

  const handleCardTapSimulation = () => {
    if (!isAssigned) {
      setStep('FAILED');
      setErrorMessage(`Access Denied: ${user?.name || 'Faculty'} is not assigned to start attendance for "${event.name}". Only assigned faculty can start attendance.`);
      return;
    }

    const cardUid = user?.cardUid || 'FAC-UID-A7B2914C';
    setScannedCardUid(cardUid);
    setStep('FACE_SCAN');
  };

  const handleFaceScanSimulation = () => {
    setStep('VERIFYING');

    setTimeout(() => {
      if (!isAssigned) {
        setStep('FAILED');
        setErrorMessage(`Authorization Failed: Faculty is not explicitly assigned by HOD for this event.`);
        return;
      }

      setStep('SUCCESS');
      setTimeout(() => {
        if (user) {
          onSuccess(user);
        }
      }, 1200);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 text-slate-100 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
            🔒 FACULTY BIOMETRIC AUTHENTICATION REQUIRED
          </span>
          <h2 className="text-xl font-extrabold text-white">Faculty Physical Verification</h2>
          <p className="text-xs text-slate-400">
            Tap ID Card & complete Face Match to start attendance for <strong className="text-indigo-300">{event.name}</strong>
          </p>
        </div>

        {/* STEP 1: CARD TAP */}
        {step === 'CARD_TAP' && (
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/20 animate-pulse">
              <CreditCard className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Step 1: Tap Faculty ID Card</p>
              <p className="text-xs text-slate-400">
                Hold your physical Faculty RFID Card against the sensor
              </p>
            </div>

            <button
              onClick={handleCardTapSimulation}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg transition-all"
            >
              Simulate Faculty ID Card Tap ({user?.name})
            </button>
          </div>
        )}

        {/* STEP 2: FACE SCAN */}
        {step === 'FACE_SCAN' && (
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-4">
            <div className="relative w-28 h-28 mx-auto rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-xl">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt="Faculty"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-emerald-500/10 border-2 border-emerald-400 rounded-2xl animate-pulse flex items-center justify-center">
                <Camera className="w-8 h-8 text-emerald-300 drop-shadow" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-emerald-300">Step 2: Faculty Face Verification</p>
              <p className="text-xs text-slate-400">
                Card UID Verified: <span className="font-mono font-bold text-indigo-300">{scannedCardUid}</span>
              </p>
            </div>

            <button
              onClick={handleFaceScanSimulation}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition-all"
            >
              Verify Faculty Face Identity
            </button>
          </div>
        )}

        {/* STEP 3: VERIFYING */}
        {step === 'VERIFYING' && (
          <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
            <p className="text-sm font-bold text-white">Validating Faculty Authorization...</p>
            <p className="text-xs text-slate-400 font-mono">
              Checking ID • Face Match • Event Assignment • Date & Time
            </p>
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 'SUCCESS' && (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <div>
              <p className="text-base font-extrabold text-emerald-300">Faculty Authentication Granted!</p>
              <p className="text-xs text-slate-300 mt-1">
                Verified: <strong>{user?.name}</strong> ({user?.employeeId})
              </p>
              <p className="text-[10px] text-emerald-400 font-mono mt-1">
                Event Attendance Session Unlocked & Initialized
              </p>
            </div>
          </div>
        )}

        {/* STEP 5: FAILED */}
        {step === 'FAILED' && (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
            <div>
              <p className="text-sm font-extrabold text-rose-300">Authentication Failed</p>
              <p className="text-xs text-rose-200 mt-1">{errorMessage}</p>
            </div>
            <button
              onClick={() => setStep('CARD_TAP')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
            >
              Try Again
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
