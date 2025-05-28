
"use client"; // This page itself remains a client component to use Suspense

import { Suspense } from 'react';
import { Container } from '@/components/shared/container';
import { PageHeader } from '@/components/shared/page-header';
import { LoginClientContent } from '@/components/auth/login-client-content'; // Import the new component
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Fallback UI for Suspense
function LoginPageSkeleton() {
  return (
    <Container className="py-12 md:py-20 flex items-center justify-center min-h-[calc(100vh-10rem)]">
       <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <Skeleton className="mx-auto h-10 w-10 rounded-full mb-2" />
          <Skeleton className="h-6 w-3/4 mx-auto mb-1" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </Container>
  );
}


export default function LoginPage() {
  return (
    // Wrap the component that uses useSearchParams in Suspense
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginClientContent />
    </Suspense>
  );
}
