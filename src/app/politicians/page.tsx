
// src/app/politicians/page.tsx
import { Container } from '@/components/shared/container';
import { PoliticiansListClient } from '@/components/politicians/politicians-list-client';
import type { Politician } from '@/types';
import type { FilterOption } from '@/components/shared/filter-controls';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers'; 
import { ITEMS_PER_PAGE } from '@/lib/constants';
import { fetchEntityData } from '@/lib/data-fetcher';
import { getPartyOptions, getExistingTags } from '@/lib/data/form-options-data';
import { getProvinceFilterOptions, getFilterConfigForEntity } from '@/lib/filtering'; 
import { ROUTES } from '@/lib/routes';

export default async function PoliticiansPage({
  searchParams
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const currentPage = parseInt(searchParams?.page as string || '1', 10);
  
  const filtersFromParams: Record<string, any> = {
      searchTerm: searchParams?.search as string || undefined,
      partyId: searchParams?.party as string || undefined, 
      province: searchParams?.province as string || undefined,
      tag: searchParams?.tag as string || undefined,
      minAge: searchParams?.minAge ? parseInt(searchParams.minAge as string, 10) : undefined,
      maxAge: searchParams?.maxAge ? parseInt(searchParams.maxAge as string, 10) : undefined,
  };
  Object.keys(filtersFromParams).forEach(key => (filtersFromParams[key] === undefined || filtersFromParams[key] === '') && delete filtersFromParams[key]);

  const sortByParam = searchParams?.sortBy as string || 'rating_desc';
  const [sortField, sortOrder] = sortByParam.split('_');
  const sortBy = { field: sortField, order: sortOrder as 'asc' | 'desc' };

  let initialPoliticians: Politician[] = [];
  let initialTotalCount = 0;
  let fetchError: string | null = null;
  
  const filterConfig = getFilterConfigForEntity('politician');
  const allFilterOptions: Record<string, FilterOption[]> = {};
  let derivedMinAgeForSlider = 18;
  let derivedMaxAgeForSlider = 100;

  try {
    const { data, count, error } = await fetchEntityData(supabase, 'politician', {
      filters: filtersFromParams,
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      sortBy,
      includeRelations: true 
    });

    if (error) {
      console.error('Error fetching politicians for page:', error);
      fetchError = error.message || "Failed to load politicians.";
    } else {
      initialPoliticians = data as Politician[] || [];
      initialTotalCount = count || 0;
    }
    
    // Prepare options for FilterControls
    allFilterOptions.partyOptions = await getPartyOptions(supabase);
    allFilterOptions.provinceOptions = getProvinceFilterOptions(); 
    allFilterOptions.politicianTagOptions = (await getExistingTags(supabase, 'Politician')).map(tag => ({ value: tag, label: tag }));
    
    if (initialPoliticians.length > 0) {
        const ages = initialPoliticians.map(p => p.age).filter(age => age !== undefined && age !== null && age >= 0) as number[];
        if (ages.length > 0) {
            derivedMinAgeForSlider = Math.min(...ages, 18); // Ensure min is at least 18
            derivedMaxAgeForSlider = Math.max(...ages, 100); // Ensure max is at least 100
        }
    } else { // Fallback if no politicians are fetched initially
        // Could fetch distinct min/max ages from DB or use wide defaults
        const { data: ageData, error: ageError } = await supabase.from('politicians').select('date_of_birth');
        if (!ageError && ageData) {
            const ages = ageData.map(p => p.date_of_birth ? new Date().getFullYear() - new Date(p.date_of_birth).getFullYear() : undefined)
                                .filter(age => age !== undefined && age >= 18) as number[];
            if (ages.length > 0) {
                derivedMinAgeForSlider = Math.min(...ages, 18);
                derivedMaxAgeForSlider = Math.max(...ages, 100);
            }
        }
    }
    // Ensure min is not greater than max
    if (derivedMinAgeForSlider > derivedMaxAgeForSlider) derivedMinAgeForSlider = derivedMaxAgeForSlider;


  } catch (e: any) {
    console.error('Error in PoliticiansPage data fetching or options preparation:', e);
    fetchError = e.message || "An unexpected error occurred while fetching data.";
  }

  return (
    <PoliticiansListClient 
      initialPoliticians={initialPoliticians} 
      initialTotalCount={initialTotalCount}
      filterConfig={filterConfig}
      allFilterOptions={allFilterOptions}
      fetchError={fetchError}
      sliderMinAge={derivedMinAgeForSlider}
      sliderMaxAge={derivedMaxAgeForSlider}
    />
  );
}
