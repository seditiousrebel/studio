// src/app/promises/page.tsx
import { Container } from '@/components/shared/container';
import { PromisesListClient } from '@/components/promises/promises-list-client';
import type { UserPromise, FilterOption } from '@/types';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { fetchEntityData } from '@/lib/data-fetcher';
import { ITEMS_PER_PAGE, ROUTES } from '@/lib/constants';
import { PROMISE_STATUSES } from '@/types';
import { getPoliticianOptions, getPartyOptions, getExistingPromiseCategories, getExistingTags } from '@/lib/data/form-options-data';
import { getFilterConfigForEntity } from '@/lib/filtering';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default async function PromisesPage({
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
      category: searchParams?.category as string || undefined,
      politicianId: searchParams?.politician as string || undefined,
      partyId: searchParams?.party as string || undefined,
      tag: searchParams?.tag as string || undefined,
  };
  Object.keys(filtersFromParams).forEach(key => (filtersFromParams[key] === undefined || filtersFromParams[key] === '') && delete filtersFromParams[key]);

  const sortByParam = searchParams?.sortBy as string || 'dateAdded_desc';
  const [sortField, sortOrder] = sortByParam.split('_');
  const sortBy = { field: sortField, order: sortOrder as 'asc' | 'desc' };

  let initialPromises: UserPromise[] = [];
  let initialTotalCount = 0;
  let fetchError: string | null = null;
  
  const filterConfig = getFilterConfigForEntity('promise');
  const allFilterOptions: Record<string, FilterOption[]> = {};

  try {
    const { data, count, error } = await fetchEntityData(supabase, 'promise', {
      filters: filtersFromParams,
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      sortBy,
      includeRelations: true
    });

    if (error) {
      console.error('Error fetching promises for page:', error);
      fetchError = error.message || "Failed to load promises.";
    } else {
      initialPromises = data as UserPromise[] || [];
      initialTotalCount = count || 0;
    }

    allFilterOptions.politicianOptions = await getPoliticianOptions(supabase);
    allFilterOptions.partyOptions = await getPartyOptions(supabase);
    allFilterOptions.categoryOptions = (await getExistingPromiseCategories(supabase)).map(cat => ({ value: cat, label: cat }));
    allFilterOptions.promiseTagOptions = (await getExistingTags(supabase, 'promise_tags')).map(tag => ({ value: tag, label: tag }));
    allFilterOptions.promiseStatusOptions = PROMISE_STATUSES.map(status => ({ value: status, label: status }));

  } catch (e: any) {
    console.error('Error in PromisesPage data fetching:', e);
    fetchError = e.message || "An unexpected error occurred while fetching data.";
  }

  return (
    <Container className="py-8 md:py-12">
       {fetchError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Fetching Promise Data</AlertTitle>
          <AlertDescription>
            Could not load promise data from the server: {fetchError}. Please try again later.
          </AlertDescription>
        </Alert>
      )}
      <PromisesListClient 
        initialPromises={initialPromises} 
        initialTotalCount={initialTotalCount}
        filterConfig={filterConfig}
        allFilterOptions={allFilterOptions}
        fetchError={fetchError}
      />
    </Container>
  );
}
