'use client';

import React from 'react';

export const CardSkeleton: React.FC = () => (
  <div className="p-6 rounded-3xl glass-panel animate-pulse space-y-4">
    <div className="h-4 w-28 bg-slate-800 rounded-lg" />
    <div className="h-8 w-48 bg-slate-800 rounded-xl" />
    <div className="h-4 w-3/4 bg-slate-800/60 rounded-lg" />
  </div>
);

export const TableRowSkeleton: React.FC = () => (
  <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 animate-pulse flex items-center justify-between">
    <div className="flex items-center space-x-3">
      <div className="w-9 h-9 rounded-xl bg-slate-800" />
      <div className="space-y-1.5">
        <div className="h-4 w-32 bg-slate-800 rounded-lg" />
        <div className="h-3 w-20 bg-slate-800/60 rounded-md" />
      </div>
    </div>
    <div className="h-6 w-20 bg-slate-800 rounded-full" />
  </div>
);

export const StatsGridSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map((i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);
