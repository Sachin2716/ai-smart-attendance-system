'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface BrandLogoIntroProps {
  onIntroComplete?: () => void;
}

export function BrandLogoIntro({ onIntroComplete }: BrandLogoIntroProps) {
  const [stage, setStage] = useState<'INITIAL' | 'CENTER' | 'MOVING' | 'DONE'>('INITIAL');

  useEffect(() => {
    // Check if session has already seen the intro
    const hasSeen = typeof window !== 'undefined' ? sessionStorage.getItem('caias_logo_intro_seen') : null;
    if (hasSeen === 'true') {
      setStage('DONE');
      if (onIntroComplete) onIntroComplete();
      return;
    }

    // Sequence timing
    // 1. Center fade-in and hold (0 to 600ms)
    setStage('CENTER');

    const moveTimer = setTimeout(() => {
      // 2. Glides smoothly to top-left (600ms to 1600ms)
      setStage('MOVING');
    }, 650);

    const finishTimer = setTimeout(() => {
      // 3. Settle and reveal page
      setStage('DONE');
      try {
        sessionStorage.setItem('caias_logo_intro_seen', 'true');
      } catch (e) {}
      if (onIntroComplete) onIntroComplete();
    }, 1700);

    return () => {
      clearTimeout(moveTimer);
      clearTimeout(finishTimer);
    };
  }, [onIntroComplete]);

  if (stage === 'DONE') {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        key="logo-intro-overlay"
        initial={{ opacity: 1 }}
        animate={{ opacity: stage === 'MOVING' ? 0.95 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        className="fixed inset-0 z-[100] bg-[#09090B] flex items-center justify-center overflow-hidden pointer-events-none select-none"
      >
        {/* Subtle Ambient Orbs in Background during intro */}
        <div className="absolute w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute w-[350px] h-[350px] bg-cyan-500/15 rounded-full blur-[90px] animate-pulse" />

        {/* Flying Brand Logo Element */}
        <motion.div
          layoutId="brand-main-logo"
          initial={{
            scale: 0.8,
            opacity: 0,
            x: 0,
            y: 0,
          }}
          animate={
            stage === 'CENTER'
              ? {
                  scale: 1.25,
                  opacity: 1,
                  x: 0,
                  y: 0,
                }
              : {
                  scale: 0.42,
                  opacity: 1,
                  // Smoothly glide toward top-left corner
                  x: typeof window !== 'undefined' ? -(window.innerWidth / 2) + 64 : -280,
                  y: typeof window !== 'undefined' ? -(window.innerHeight / 2) + 42 : -280,
                }
          }
          transition={{
            duration: stage === 'MOVING' ? 0.95 : 0.55,
            ease: [0.16, 1, 0.3, 1], // Natural cubic-bezier easing
          }}
          className="relative flex flex-col items-center justify-center"
        >
          {/* Logo Graphic Container with Light Sweep Glow */}
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-3xl overflow-hidden animate-logo-glow flex items-center justify-center p-2 bg-[#111318]/80 border border-cyan-500/40 shadow-[0_0_50px_rgba(34,211,238,0.25)]">
            <Image
              src="/logo.png"
              alt="AI Smart Attendance Logo"
              width={208}
              height={208}
              priority
              className="w-full h-full object-contain"
            />
          </div>

          {/* Staggered Brand Text in Center before flight */}
          {stage === 'CENTER' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="mt-4 text-center space-y-1"
            >
              <h2 className="text-xl sm:text-2xl font-black tracking-wider text-white flex items-center justify-center gap-2">
                <span className="text-[#22D3EE]">AI SMART</span>
                <span className="text-white">ATTENDANCE</span>
              </h2>
              <p className="text-xs font-mono text-[#9CA3AF] tracking-widest uppercase">
                Smarter Attendance • Brighter Future
              </p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
