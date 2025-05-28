
"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/layout/app-providers';
import { Container } from '@/components/shared/container';
import { PageHeader } from '@/components/shared/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { ADMIN_DASHBOARD_LINKS } from '@/lib/constants';

interface AdminLayoutProps {
  children: ReactNode;
  pageTitle?: string;
  pageDescription?: string;
}

export function AdminLayout({ children, pageTitle, pageDescription }: AdminLayoutProps) {
  const { isAdmin, isAuthenticated, isLoadingAuth, userEmail } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingAuth) {
      if (!isAuthenticated) {
        router.replace('/login?redirectTo=/admin'); // Default redirect to admin dashboard
      } else if (!isAdmin) {
        router.replace('/'); // Or a specific "access denied" page
      }
    }
  }, [isLoadingAuth, isAuthenticated, isAdmin, router]);

  if (isLoadingAuth) {
    return (
      <Container className="py-8 md:py-12">
        <PageHeader
          title={pageTitle || "Admin Section"}
          description={pageDescription || "Loading and verifying access..."}
        />
        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
             <Card key={index} className="shadow-md">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                 <Skeleton className="h-5 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex justify-center items-center py-10 mt-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </Container>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <Container className="py-8 md:py-12">
        <PageHeader
          title="Access Denied"
          description="You do not have permission to view this page."
        />
        <div className="mt-8 p-6 border border-destructive/50 bg-destructive/10 rounded-lg text-destructive flex items-center">
          <ShieldAlert className="h-8 w-8 mr-4" />
          <div>
            <h3 className="font-semibold text-lg">Access Restricted</h3>
            <p className="text-sm">
              {isAuthenticated ? "You must be an administrator to view this page." : "Please log in as an administrator."}
            </p>
          </div>
        </div>
      </Container>
    );
  }

  return <>{children}</>;
}
