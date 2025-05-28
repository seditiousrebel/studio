// src/app/parties/page.tsx
import { Container } from '@/components/shared/container';
import { PartiesListClient } from '@/components/parties/parties-list-client';
import type { Party } from '@/types';
import type { FilterOption, FilterConfig } from '@/components/shared/filter-controls';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { fetchEntityData } from '@/lib/data-fetcher';
import { ITEMS_PER_PAGE } from '@/lib/constants';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { ROUTES } from '@/lib/routes';
import { getFilterConfigForEntity } from '@/lib/filtering';
import { getExistingTags } from '@/lib/data/form-options-data'; // For party tags

// Helper function to derive options that might be based on fetched data
// or could be fetched distinctively from DB in a real app.
async function derivePartyFilterOptions(
  supabase: ReturnType<typeof createClient>,
  fetchedParties: Party[] // Pass initially fetched parties to derive some options
): Promise<{
  ideologyOptions: FilterOption[];
  foundingYearOptions: FilterOption[];
  partyTagOptions: FilterOption[];
}> {
  // Ideologies are often best derived from the data set or a distinct query
  const ideologyOptions: FilterOption[] = Array.from(
    new Set(fetchedParties.flatMap(p => (p.ideology || "").split(',').map(i => i.trim()).filter(Boolean)))
  ).sort().map(ideo => ({ value: ideo, label: ideo }));

  // Founding years can also be derived or fetched distinctly
  const foundingYearOptions: FilterOption[] = Array.from(
    new Set(fetchedParties.map(p => p.foundingDate ? new Date(p.foundingDate).getFullYear().toString() : '').filter(Boolean))
  )
  .sort((a,b) => parseInt(b) - parseInt(a))
  .map(year => ({ value: year, label: year }));

  // Tags can be fetched from the dedicated function
  const rawPartyTags = await getExistingTags(supabase, 'party_tags');
  const partyTagOptions: FilterOption[] = rawPartyTags.map(tag => ({ value: tag, label: tag }));

  return { ideologyOptions, foundingYearOptions, partyTagOptions };
}

export default async function PartiesPage({
  searchParams
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const currentPage = parseInt(searchParams?.page as string || '1', 10);
  const filtersFromParams: Record<string, any> = {
      searchTerm: searchParams?.search as string || undefined,
      ideology: searchParams?.ideology as string || undefined,
      foundingYear: searchParams?.foundingYear as string || undefined,
      tag: searchParams?.tag as string || undefined,
  };
  Object.keys(filtersFromParams).forEach(key => (filtersFromParams[key] === undefined || filtersFromParams[key] === '') && delete filtersFromParams[key]);
  
  const sortByParam = searchParams?.sortBy as string || 'rating_desc';
  const [sortField, sortOrder] = sortByParam.split('_');
  const sortBy = { field: sortField, order: sortOrder as 'asc' | 'desc' };

  let initialParties: Party[] = [];
  let initialTotalCount = 0;
  let fetchError: string | null = null;
  
  const filterConfig = getFilterConfigForEntity('party');
  const allFilterOptions: Record<string, FilterOption[]> = {};

  try {
    const { data, count, error } = await fetchEntityData(supabase, 'party', {
      filters: filtersFromParams,
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      sortBy,
      includeRelations: true 
    });

    if (error) {
      console.error("Error fetching parties for PartiesPage:", error);
      fetchError = error.message || "Failed to load parties.";
    } else {
      initialParties = data as Party[] || [];
      initialTotalCount = count || 0;
      
      // Derive/fetch options for filters
      const derivedOptions = await derivePartyFilterOptions(supabase, initialParties);
      allFilterOptions.ideologyOptions = derivedOptions.ideologyOptions;
      allFilterOptions.foundingYearOptions = derivedOptions.foundingYearOptions;
      allFilterOptions.partyTagOptions = derivedOptions.partyTagOptions;
    }
  } catch (e: any) {
    console.error('Critical error in PartiesPage data fetching:', e);
    fetchError = e.message || "An unexpected error occurred while fetching party data.";
  }

  return (
    <Container className="py-8 md:py-12">
       {fetchError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Fetching Party Data</AlertTitle>
          <AlertDescription>
            Could not load party data from the server: {fetchError}. Please try again later.
          </AlertDescription>
        </Alert>
      )}
      <PartiesListClient 
        initialParties={initialParties} 
        initialTotalCount={initialTotalCount}
        filterConfig={filterConfig}
        allFilterOptions={allFilterOptions}
        fetchError={fetchError}
      />
    </Container>
  );
}
