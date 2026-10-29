import React from 'react';
import { AppShell } from '@/components/layout/AppShell';

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="FACULTY">{children}</AppShell>;
}
