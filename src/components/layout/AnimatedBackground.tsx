'use client';

import React from 'react';

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Deep Cyber Matrix Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#27272A_1px,transparent_1px)] [background-size:28px_28px] opacity-20" />

      {/* Floating Gradient Ambient Orb 1 (Electric Blue) */}
      <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-blue-600/10 rounded-full blur-[140px] animate-orb-1" />

      {/* Floating Gradient Ambient Orb 2 (Cyan AI) */}
      <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[130px] animate-orb-2" />

      {/* Floating Gradient Ambient Orb 3 (Violet/Indigo Accent) */}
      <div className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-indigo-600/8 rounded-full blur-[150px] animate-orb-1" />

      {/* Ultra-subtle Horizontal Laser Scanning Beam */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent animate-laser-scan opacity-40" />
    </div>
  );
}
