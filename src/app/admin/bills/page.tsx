// src/app/admin/bills/page.tsx
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Container } from '@/components/shared/container';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, ShieldAlert } from 'lucide-react';
import { FEATURED_LIMITS } from '@/lib/constants';
import { fetchEntityData } from '@/lib/data-fetcher';
import type { Bill } from '@/types';
import { BillsAdminListClient } from '@/components/admin/bills-admin-list-client';
import { AdminLayout } from '@/components/layout/admin-layout';
import { ROUTES } from '@/lib/routes';

export default async function AdminBillsPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  if (!supabase) {
    console.error("AdminBillsPage: Supabase client could not be initialized.");
    return (
      <AdminLayout pageTitle="Error" pageDescription="Database Connection Error">
        <Container className="py-8 md:py-12">
          <PageHeader title="Error" description="Failed to initialize database connection." />
        </Container>
      </AdminLayout>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN + `?redirectTo=${ROUTES.ADMIN.BILLS}`);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return (
      <AdminLayout pageTitle="Manage Bills" pageDescription="Access Restricted">
        <Container className="py-8 md:py-12">
          <PageHeader title="Manage Bills" description="Verifying access..." />
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

  const { data, error } = await fetchEntityData(supabase, 'bill', {
    limit: 50, 
    includeRelations: true,
    sortBy: { field: 'title', order: 'asc' }
  });

  const initialBills = data as Bill[] || [];
  const fetchError = error ? error.message : null;

  return (
    <AdminLayout
        pageTitle="Manage Legislative Bills"
        pageDescription={`View, add, or edit bills. Toggle 'Featured' to display on homepage (max ${FEATURED_LIMITS.bills}).`}
    >
      <Container className="py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4 md:gap-0">
          <PageHeader
            title="Manage Legislative Bills"
            description={`View, add, or edit bills. Toggle 'Featured' to display on homepage (max ${FEATURED_LIMITS.bills}).`}
            className="mb-0 flex-grow"
          />
          <Button asChild className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href={ROUTES.BILLS.ADD}>
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Bill
            </Link>
          </Button>
        </div>
        <BillsAdminListClient 
          initialBills={initialBills} 
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
