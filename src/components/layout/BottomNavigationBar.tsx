'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Newspaper, Edit3, User, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import type React from 'react';

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItemProps[] = [
  { href: '/', label: 'Feed', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/news', label: 'News', icon: Newspaper },
  { href: '/contribute', label: 'Contribute', icon: Edit3 },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomNavigationBar() {
  const pathname = usePathname();

  // Hide on specific entity detail pages on mobile, or adjust logic as needed
  const hideOnRoutes = [
    /^\/politicians\/.+/,
    /^\/parties\/.+/,
    /^\/bills\/.+/,
    /^\/promises\/.+/,
  ];

  const shouldHide = hideOnRoutes.some(routeRegex => routeRegex.test(pathname));

  if (shouldHide) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t border-border shadow-t-sm sm:hidden">
      <div className="container mx-auto px-2 h-16 flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link key={item.label} href={item.href} passHref>
              <div className={cn(
                "flex flex-col items-center justify-center text-muted-foreground hover:text-primary p-2 rounded-md transition-colors",
                isActive && "text-primary"
              )}>
                <item.icon className="h-6 w-6" />
                <span className="text-xs mt-0.5">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
