'use client';

import React from 'react';
import { CreditCard, Wifi, ShieldCheck, CheckCircle2, Sparkles, RefreshCw, Zap, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface RfidCardTapCardProps {
  onTapCard?: () => void;
  lastScannedCardUid?: string;
  lastScannedStudentName?: string;
  isVerifying?: boolean;
  statusText?: string;
  mode?: 'CLASS' | 'EVENT' | 'AUDITORIUM';
}

export const RfidCardTapCard: React.FC<RfidCardTapCardProps> = ({
  onTapCard,
  lastScannedCardUid = 'A7:B2:91:4C',
  lastScannedStudentName = 'Rahul Kumar (BCA AIML 3)',
  isVerifying = false,
  statusText = 'READY FOR RFID CARD TAP',
  mode = 'CLASS',
}) => {
  return (
    <div className="rounded-2xl glass-panel border border-indigo-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/60 p-4 shadow-xl space-y-3">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
              RFID Smart Card Reader
              <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
            </h4>
            <p className="text-[10px] text-slate-400">13.56 MHz High-Frequency NFC Sensor</p>
          </div>
        </div>

        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          ● {statusText}
        </span>
      </div>

      {/* RFID Card Tap Interface Visualizer */}
      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
        
        {/* Smart Card Graphic */}
        <div className="flex items-center space-x-3">
          <div className="relative w-12 h-8 rounded-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-teal-500 p-1 shadow-md border border-white/20 flex flex-col justify-between overflow-hidden">
            <div className="w-2.5 h-2 rounded bg-amber-300/80 border border-amber-400/60" />
            <div className="flex items-center justify-between text-[7px] font-mono text-white/90">
              <span>CAIAS</span>
              <Wifi className="w-2.5 h-2.5" />
            </div>
          </div>

          <div className="space-y-0.5">
            <p className="text-[10px] font-mono text-slate-400">
              CARD UID: <strong className="text-indigo-300 font-mono">{lastScannedCardUid}</strong>
            </p>
            <p className="text-xs font-bold text-white line-clamp-1">{lastScannedStudentName}</p>
          </div>
        </div>

        {/* Verification Method Status Badge */}
        <div className="text-right space-y-0.5">
          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-end gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Dual-Factor Match
          </span>
          <p className="text-[9px] text-slate-400">Face + RFID Combined</p>
        </div>

      </div>

      {/* Action Button */}
      {onTapCard && (
        <button
          onClick={onTapCard}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all transform active:scale-98"
        >
          <CreditCard className="w-4 h-4" />
          <span>TAP RFID CARD (Simulate Sensor Scan)</span>
        </button>
      )}

    </div>
  );
};
