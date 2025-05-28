// src/app/bills/page.tsx
import { Container } from '@/components/shared/container';
import { BillsListClient } from '@/components/bills/bills-list-client';
import type { Bill, FilterOption as AppFilterOption } from '@/types'; 
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { fetchEntityData } from '@/lib/data-fetcher';
import { getPoliticianOptions, getPartyOptions, getExistingTags } from '@/lib/data/form-options-data';
import { ITEMS_PER_PAGE, ROUTES } from '@/lib/constants';
import { getFilterConfigForEntity } from '@/lib/filtering';
import { BILL_STATUSES } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default async function BillsPage({
  searchParams
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const currentPage = parseInt(searchParams?.page as string || '1', 10);
  const filtersFromParams: Record<string, any> = {
      searchTerm: searchParams?.search as string || undefined,
      status: searchParams?.status as string || undefined,
      sponsorPoliticianId: searchParams?.politician as string || undefined, // Mapped to sponsorPoliticianId in API
      sponsorPartyId: searchParams?.party as string || undefined, // Mapped to sponsorPartyId in API
      tag: searchParams?.tag as string || undefined,
  };
  Object.keys(filtersFromParams).forEach(key => (filtersFromParams[key] === undefined || filtersFromParams[key] === '') && delete filtersFromParams[key]);
  
  const sortByParam = searchParams?.sortBy as string || 'proposalDate_desc';
  const [sortField, sortOrder] = sortByParam.split('_');
  const sortBy = { field: sortField, order: sortOrder as 'asc' | 'desc' };

  let initialBills: Bill[] = [];
  let initialTotalCount = 0;
  let fetchError: string | null = null;

  const filterConfig = getFilterConfigForEntity('bill');
  const allFilterOptions: Record<string, AppFilterOption[]> = {};

  if (!supabase) {
     console.error("BillsPage: Supabase client could not be initialized.");
     fetchError = "Failed to initialize database connection.";
  } else {
    try {
      const { data, count, error } = await fetchEntityData(supabase, 'bill', {
        filters: filtersFromParams,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        sortBy,
        includeRelations: true
      }); 
      if (error) {
        console.error('Error fetching bills for page:', error);
        fetchError = error.message || "Failed to load bills.";
      } else {
        initialBills = data as Bill[] || [];
        initialTotalCount = count || 0;
      }

      allFilterOptions.politicianOptions = await getPoliticianOptions(supabase);
      allFilterOptions.partyOptions = await getPartyOptions(supabase);
      allFilterOptions.billTagOptions = (await getExistingTags(supabase, 'bill_tags')).map(tag => ({ value: tag, label: tag }));
      allFilterOptions.billStatusOptions = BILL_STATUSES.map(status => ({ value: status, label: status }));

    } catch (e: any) {
      console.error('Error in BillsPage data fetching:', e);
      fetchError = e.message || "An unexpected error occurred while fetching bill data.";
    }
  }

  return (
    <Container className="py-8 md:py-12">
      {fetchError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Fetching Bill Data</AlertTitle>
          <AlertDescription>
            Could not load bill data from the server: {fetchError}. Please try again later.
          </AlertDescription>
        </Alert>
      )}
      <BillsListClient 
        initialBills={initialBills} 
        initialTotalCount={initialTotalCount}
        filterConfig={filterConfig}
        allFilterOptions={allFilterOptions}
        fetchError={fetchError}
      />
    </Container>
  );
}
