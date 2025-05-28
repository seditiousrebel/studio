'use client';
import Link from 'next/link';
import { Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { usePathname } from 'next/navigation'; // Import usePathname

// Re-define NavItemProps here or import from BottomNavigationBar if modularized
interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
}

// Simplified navItems for mobile sheet menu, can be expanded
const navItems: NavItemProps[] = [
  { href: '/', label: 'Feed', icon: require('lucide-react').Home },
  { href: '/search', label: 'Search', icon: require('lucide-react').Search },
  { href: '/news', label: 'News', icon: require('lucide-react').Newspaper },
  { href: '/contribute', label: 'Contribute', icon: require('lucide-react').Edit3 },
  { href: '/profile', label: 'Profile', icon: require('lucide-react').User },
  { href: '/notifications', label: 'Notifications', icon: require('lucide-react').Bell },
];


export default function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-primary">
          NetaVerse
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/search" passHref>
            <Button variant="ghost" size="icon" aria-label="Search">
              <Search className="h-5 w-5" />
            </Button>
          </Link>
          <div className="sm:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[250px] bg-background p-4">
                <nav className="flex flex-col gap-2 mt-8">
                  {navItems.map((item) => (
                    <Link key={item.label} href={item.href} passHref>
                      <Button
                        variant={pathname === item.href ? 'secondary' : 'ghost'}
                        className="w-full justify-start"
                        asChild
                      >
                        <a>
                          <item.icon className="mr-2 h-5 w-5" />
                          {item.label}
                        </a>
                      </Button>
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
