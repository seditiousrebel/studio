// src/components/layout/header.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetClose, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, MountainIcon, UserCircle, LogOut } from 'lucide-react';
import { APP_NAME, NAV_LINKS_PUBLIC, NAV_LINKS_ADMIN, AUTH_LINKS_GUEST } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Container } from '@/components/shared/container';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/layout/app-providers';
import { ROUTES } from '@/lib/routes'; // Import ROUTES

export function Header() {
  const pathname = usePathname();
  const { session, user, isAdmin, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
  };

  const navLinks = isAdmin ? NAV_LINKS_ADMIN.map(link => ({...link, href: (ROUTES.ADMIN as any)[link.key] || link.href})) 
                           : NAV_LINKS_PUBLIC.map(link => ({...link, href: (ROUTES as any)[link.key] || link.href}));
  
  const authLinksGuest = AUTH_LINKS_GUEST.map(link => ({...link, href: (ROUTES as any)[link.key] || link.href}));


  const commonLinkClasses = "transition-colors";
  const activeLinkClasses = "text-primary font-semibold underline underline-offset-4 hover:text-primary/90";
  const inactiveLinkClasses = "text-muted-foreground font-medium hover:text-primary";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <Container className="flex h-16 items-center">
        <Link href={ROUTES.HOME} onClick={() => setIsMobileMenuOpen(false)} prefetch={true}>
          <span className="mr-auto flex items-center space-x-2 shrink-0 cursor-pointer">
            <MountainIcon className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">{APP_NAME}</span>
          </span>
        </Link>

        <div className="hidden lg:flex flex-grow justify-center px-4">
          <nav className="flex items-center space-x-4 lg:space-x-6 text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  commonLinkClasses,
                  pathname === link.href ? activeLinkClasses : inactiveLinkClasses
                )}
                prefetch={true}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4 ml-auto shrink-0">
          {session ? (
            <>
              <Button asChild variant="default" size="sm" className="hidden sm:inline-flex shadow-md">
                <Link href={ROUTES.PROFILE} prefetch={true}>
                  <UserCircle className="mr-2 h-5 w-5" />
                  {isAdmin ? 'Admin Profile' : 'Profile'}
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="hidden sm:inline-flex">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                size="sm"
                className="hidden sm:inline-flex bg-green-600 hover:bg-green-700 text-white shadow-md"
              >
                <Link href={ROUTES.LOGIN} prefetch={true}>Login</Link>
              </Button>
              <Button asChild size="sm" variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
                <Link href={ROUTES.SIGNUP} prefetch={true}>Sign Up</Link>
              </Button>
            </>
          )}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
               <SheetTitle className="sr-only">{APP_NAME} Navigation Menu</SheetTitle>
              <nav className="grid gap-1 text-base font-medium mt-6">
                <SheetClose asChild>
                  <Link href={ROUTES.HOME} className="flex items-center space-x-2 mb-1" onClick={() => setIsMobileMenuOpen(false)} prefetch={true}>
                      <MountainIcon className="h-6 w-6 text-primary" />
                      <span className="font-bold">{APP_NAME}</span>
                  </Link>
                </SheetClose>
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        commonLinkClasses,
                        'py-1.5 px-2 rounded-md',
                        pathname === link.href ? activeLinkClasses : inactiveLinkClasses
                      )}
                      prefetch={true}
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                <hr className="my-2" />
                 {session ? (
                   <>
                    <SheetClose asChild>
                      <Link href={ROUTES.PROFILE} className={cn(commonLinkClasses, 'py-1.5 px-2 rounded-md flex items-center', pathname === ROUTES.PROFILE ? activeLinkClasses : inactiveLinkClasses)} prefetch={true}>
                          <UserCircle className="mr-2 h-5 w-5" /> {isAdmin ? 'Admin Profile' : 'Profile'}
                      </Link>
                    </SheetClose>
                    <Button variant="outline" onClick={handleLogout} className="w-full justify-start text-left font-medium text-base py-1.5 px-2 h-auto">
                        <LogOut className="mr-2 h-5 w-5" /> Logout
                    </Button>
                   </>
                  ) : (
                    authLinksGuest.map((link) => (
                      <SheetClose asChild key={link.href}>
                        <Link
                          href={link.href}
                          className={cn(
                            commonLinkClasses,
                            'py-1.5 px-2 rounded-md',
                            pathname === link.href ? activeLinkClasses : inactiveLinkClasses
                          )}
                          prefetch={true}
                        >
                          {link.label}
                        </Link>
                      </SheetClose>
                    ))
                  )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </header>
  );
}
