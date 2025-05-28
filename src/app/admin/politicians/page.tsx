// src/app/admin/politicians/page.tsx
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Container } from '@/components/shared/container';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, ShieldAlert } from 'lucide-react';
import { FEATURED_LIMITS, ITEMS_PER_PAGE } from '@/lib/constants';
import { fetchEntityData } from '@/lib/data-fetcher';
import type { Politician } from '@/types';
import { PoliticiansAdminListClient } from '@/components/admin/politicians-admin-list-client';
import { AdminLayout } from '@/components/layout/admin-layout';
import { ROUTES } from '@/lib/routes';

export default async function AdminPoliticiansPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN + `?redirectTo=${ROUTES.ADMIN.POLITICIANS}`);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return (
      <AdminLayout pageTitle="Manage Politicians" pageDescription="Access Restricted">
        <Container className="py-8 md:py-12">
          <PageHeader title="Manage Politicians" description="Verifying access..." />
          <div className="mt-8 p-6 border border-destructive/50 bg-destructive/10 rounded-lg text-destructive flex items-center">
            <ShieldAlert className="h-8 w-8 mr-4 " />
            <div>
              <h3 className="font-semibold text-lg">Access Restricted</h3>
              <p className="text-sm">
                You must be an administrator to view this page.
              </p>
            </div>
          </div>
        </Container>
      </AdminLayout>
    );
  }

  const { data, error } = await fetchEntityData(supabase, 'politician', {
    limit: 50, 
    includeRelations: true,
    sortBy: { field: 'name', order: 'asc' } 
  });

  const initialPoliticians = data as Politician[] || [];
  const fetchError = error ? error.message : null;

  return (
    <AdminLayout 
        pageTitle="Manage Politicians"
        pageDescription={`View, add, or edit politician profiles. Toggle 'Featured' to display on homepage (max ${FEATURED_LIMITS.politicians}).`}
    >
      <Container className="py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4 md:gap-0">
          <PageHeader
            title="Manage Politicians"
            description={`View, add, or edit politician profiles. Toggle 'Featured' to display on homepage (max ${FEATURED_LIMITS.politicians}).`}
            className="mb-0 flex-grow"
          />
          <Button asChild className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href={ROUTES.POLITICIANS.ADD}>
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Politician
            </Link>
          </Button>
        </div>
        <PoliticiansAdminListClient 
          initialPoliticians={initialPoliticians} 
          fetchError={fetchError}
        />
        <div className="mt-8 p-4 border border-blue-500/50 bg-blue-500/10 rounded-lg text-blue-700 dark:text-blue-300">
          <h3 className="font-semibold">Data Source Note:</h3>
          <p className="text-sm">
            The list above reflects data fetched from the Supabase database. Additions, edits, or featured status changes made here will attempt to update the database via API calls.
          </p>
        </div>
      </Container>
    </AdminLayout>
  );
}
