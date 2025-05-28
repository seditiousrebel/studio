import type React from 'react';
import AppShell from '@/components/layout/AppShell';

export default function AppPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
