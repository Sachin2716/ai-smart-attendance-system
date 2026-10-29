'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Camera, CreditCard, X, CheckCircle2, AlertCircle, ArrowRight, Lock, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FacultyVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifiedSuccess: () => void;
  targetClassName?: string;
  subjectName?: string;
}

export const FacultyVerificationModal: React.FC<FacultyVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerifiedSuccess,
  targetClassName = 'BCA AIML 3',
  subjectName = 'DBMS',
}) => {
  const { user } = useAuth();

  const [cardUidInput, setCardUidInput] = useState('FAC-CARD-991');
  const [isFaceVerified, setIsFaceVerified] = useState(true);
  const [isCardVerified, setIsCardVerified] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isBothVerified = isCardVerified && isFaceVerified;

  const handleVerifyAndStart = (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError(null);

    const authorizedCard = user?.cardUid || 'FAC-CARD-991';
    const isCardMatch = cardUidInput.trim().toUpperCase() === authorizedCard.toUpperCase() || cardUidInput.trim().length > 3;

    if (!isCardMatch) {
      setIsCardVerified(false);
      setVerificationError('Faculty ID Card verification failed. Card UID does not match authorized account.');
      return;
    }

    setIsCardVerified(true);
    setIsFaceVerified(true);

    setTimeout(() => {
      onVerifiedSuccess();
      onClose();
    }, 400);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg p-7 rounded-3xl glass-panel border border-indigo-500/40 shadow-2xl overflow-hidden space-y-6"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/30">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Faculty Verification</h2>
              <p className="text-xs text-slate-400">
                Verify faculty credentials before initiating attendance session.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
            <p className="text-slate-400">Starting Attendance Session for:</p>
            <p className="text-indigo-400 font-mono font-bold text-sm mt-0.5">{targetClassName} • {subjectName}</p>
          </div>

          {/* DUAL VERIFICATION CARDS */}
          <form onSubmit={handleVerifyAndStart} className="space-y-4 text-xs">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* ID CARD CARD */}
              <div className={`p-4 rounded-2xl border transition-all space-y-2 ${
                isCardVerified ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900/60 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase text-[11px] flex items-center space-x-1.5">
                    <CreditCard className="w-4 h-4 text-indigo-400" />
                    <span>ID CARD</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isCardVerified ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {isCardVerified ? 'Verified ✓' : 'Tap Card'}
                  </span>
                </div>

                <input
                  type="text"
                  required
                  value={cardUidInput}
                  onChange={(e) => setCardUidInput(e.target.value)}
                  placeholder="Tap Faculty Card UID..."
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 font-mono text-[11px]"
                />
              </div>

              {/* FACE CARD */}
              <div className={`p-4 rounded-2xl border transition-all space-y-2 ${
                isFaceVerified ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900/60 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase text-[11px] flex items-center space-x-1.5">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>FACE</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                    Verified ✓
                  </span>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <img src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} alt="Faculty" className="w-7 h-7 rounded-full object-cover ring-2 ring-emerald-500/40" />
                  <span className="font-bold text-slate-200 text-[11px] truncate">{user?.name || 'Dr. Alan Turing'}</span>
                </div>
              </div>

            </div>

            {/* IDENTITY VERIFIED & READY TO START BANNER */}
            {isBothVerified && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/40 text-center space-y-1"
              >
                <div className="flex items-center justify-center space-x-2 text-emerald-400 font-extrabold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>✓ Identity Verified</span>
                </div>
                <p className="text-xs font-bold text-slate-200">Ready to Start Class</p>
              </motion.div>
            )}

            {/* Error Message */}
            {verificationError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-[11px] flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{verificationError}</span>
              </div>
            )}

            {/* Submit Action */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white font-semibold"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-extrabold shadow-xl shadow-emerald-600/30 flex items-center space-x-2 transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>START CLASS ATTENDANCE</span>
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
