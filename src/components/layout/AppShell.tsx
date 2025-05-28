import type React from 'react';
import Header from './Header';
import BottomNavigationBar from './BottomNavigationBar';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-16 pb-16 sm:pb-0"> 
        {/* pt-16 for fixed header, pb-16 for fixed bottom nav on mobile */}
        {/* sm:pb-0 removes bottom padding on larger screens where bottom nav might be hidden or different */}
        <div className="container mx-auto px-4 py-4 h-full">
          {children}
        </div>
      </main>
      <BottomNavigationBar />
    </div>
  );
}
