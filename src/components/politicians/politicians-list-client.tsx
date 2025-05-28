
// src/components/politicians/politicians-list-client.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback, createContext, useContext } from 'react'; 
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import useSWR from 'swr';
import { Container } from '@/components/shared/container';
import { PageHeader } from '@/components/shared/page-header';
import { PoliticianCard } from '@/components/politicians/politician-card';
import type { Politician } from '@/types';
import { FilterControls, type FilterConfig, type FilterOption } from '@/components/shared/filter-controls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/components/layout/app-providers';
import { Card as SkeletonCard, CardContent as SkeletonCardContent, CardFooter as SkeletonCardFooter } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ITEMS_PER_PAGE } from '@/lib/constants';
import { ROUTES } from '@/lib/routes';
import { apiClient } from '@/lib/api-client';

// Define Context for politician filters
interface PoliticianFilterContextType {
  currentFilters: Record<string, any>;
  handleFilterChange: (filterId: string, value: any) => void;
}
const PoliticianFilterContext = createContext<PoliticianFilterContextType | undefined>(undefined);
export const usePoliticianFilterContext = () => {
  const context = useContext(PoliticianFilterContext);
  if (!context) {
    throw new Error("usePoliticianFilterContext must be used within a PoliticianFilterProvider");
  }
  return context;
};


const SkeletonPoliticianCard = () => (
  <SkeletonCard className="rounded-lg overflow-hidden shadow-md flex flex-col h-full">
    <Skeleton className="relative h-48 w-full" />
    <SkeletonCardContent className="p-4 flex-grow">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-5/6 mb-3" />
      <Skeleton className="h-4 w-1/2 mb-1" />
      <Skeleton className="h-4 w-1/3 mb-1" />
      <Skeleton className="h-4 w-1/4" />
    </SkeletonCardContent>
    <SkeletonCardFooter className="p-4 pt-2 flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:items-center mt-auto">
      <div className="flex-grow space-y-1">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
       <div className="flex gap-2">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </SkeletonCardFooter>
  </SkeletonCard>
);

interface PoliticiansListClientProps {
  initialPoliticians: Politician[];
  initialTotalCount: number;
  filterConfig: FilterConfig[];
  allFilterOptions: Record<string, FilterOption[]>;
  fetchError?: string | null;
  sliderMinAge: number;
  sliderMaxAge: number;
}

const AgeSliderRenderer: React.FC<{ helpers?: Record<string, any> }> = ({ helpers }) => {
  const context = usePoliticianFilterContext();
  const sliderMinVal = helpers?.sliderMinAge || 18;
  const sliderMaxVal = helpers?.sliderMaxAge || 100;
  const isLoadingSlider = helpers?.isLoading || false;

  let currentMin = context.currentFilters.minAge ? parseInt(context.currentFilters.minAge, 10) : sliderMinVal;
  let currentMax = context.currentFilters.maxAge ? parseInt(context.currentFilters.maxAge, 10) : sliderMaxVal;

  currentMin = Math.max(sliderMinVal, Math.min(currentMin, sliderMaxVal));
  currentMax = Math.max(sliderMinVal, Math.min(currentMax, sliderMaxVal));
  if (currentMin > currentMax) currentMin = currentMax;
    
  const sliderCurrentValue: [number, number] = [currentMin, currentMax];

  return (
    <div className="space-y-1.5 w-full">
      <Label htmlFor="ageRangeSliderPoliticians" className="text-sm font-medium text-muted-foreground">
        Age Range: {sliderCurrentValue[0]} - {sliderCurrentValue[1]}
      </Label>
      <Slider
        id="ageRangeSliderPoliticians"
        min={sliderMinVal}
        max={sliderMaxVal}
        step={1}
        value={sliderCurrentValue}
        onValueChange={(newValues: [number,number]) => {
          context.handleFilterChange('minAge', newValues[0].toString());
          context.handleFilterChange('maxAge', newValues[1].toString());
        }}
        className="w-full bg-background"
        disabled={isLoadingSlider || !(sliderMaxVal > sliderMinVal)}
      />
    </div>
  );
};


export function PoliticiansListClient({
  initialPoliticians,
  initialTotalCount,
  filterConfig,
  allFilterOptions,
  fetchError: ssrFetchError,
  sliderMinAge,
  sliderMaxAge,
}: PoliticiansListClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAdmin, isAuthenticated } = useAuth();

  const getFiltersFromParams = useCallback(() => {
    const initial: Record<string, any> = {};
    filterConfig.forEach(fc => {
      if (fc.renderComponentKey === 'ageSlider') {
        initial['minAge'] = searchParams.get('minAge') || '';
        initial['maxAge'] = searchParams.get('maxAge') || '';
      } else {
        initial[fc.id] = searchParams.get(fc.id === 'searchTerm' ? 'search' : fc.id) || '';
      }
    });
    return initial;
  }, [searchParams, filterConfig]);


  const [currentFilters, setCurrentFilters] = useState(getFiltersFromParams);
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'rating_desc');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  
  const constructApiUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    params.append('limit', ITEMS_PER_PAGE.toString());
    if (currentFilters.searchTerm) params.append('search', currentFilters.searchTerm);
    if (currentFilters.party) params.append('party', currentFilters.party); 
    if (currentFilters.province) params.append('province', currentFilters.province);
    if (currentFilters.tag) params.append('tag', currentFilters.tag);
    if (currentFilters.minAge) params.append('minAge', currentFilters.minAge);
    if (currentFilters.maxAge) params.append('maxAge', currentFilters.maxAge);
    if (sortBy) params.append('sortBy', sortBy);
    return `${ROUTES.API.POLITICIANS}?${params.toString()}`;
  }, [currentPage, currentFilters, sortBy]);

  const { data, error: swrError, isLoading: swrIsLoading } = useSWR(
    constructApiUrl,
    (url: string) => apiClient.get<{ items: Politician[], totalCount: number }>(url.replace(/^\/api/, '')),
    {
      fallbackData: (currentPage === 1 && !Object.values(currentFilters).some(val => val !== '') && sortBy === 'rating_desc')
                      ? { items: initialPoliticians, totalCount: initialTotalCount }
                      : undefined,
      keepPreviousData: true,
    }
  );

  const politiciansToDisplay: Politician[] = data?.items || (currentPage === 1 ? initialPoliticians : []);
  const totalCount: number = data?.totalCount || (currentPage === 1 ? initialTotalCount : 0);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const isLoading = swrIsLoading || (!data && !swrError && !ssrFetchError);

  useEffect(() => {
    const params = new URLSearchParams();
    if (currentFilters.searchTerm) params.set('search', currentFilters.searchTerm);
    if (currentFilters.party) params.set('party', currentFilters.party);
    if (currentFilters.province) params.set('province', currentFilters.province);
    if (currentFilters.tag) params.set('tag', currentFilters.tag);
    if (currentFilters.minAge) params.set('minAge', currentFilters.minAge);
    if (currentFilters.maxAge) params.set('maxAge', currentFilters.maxAge);
    if (sortBy) params.set('sortBy', sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [currentFilters, sortBy, currentPage, pathname, router]);
  

  const handleFilterChange = useCallback((filterId: string, value: any) => {
    setCurrentFilters(prev => ({ ...prev, [filterId]: value }));
    setCurrentPage(1);
  }, []);
  
  const handleSortByChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleTagClick = (tag: string) => { handleFilterChange('tag', tag); };
  const handlePartyClick = (partyId: string) => { handleFilterChange('party', partyId); };
  const handleProvinceClick = (province: string) => { handleFilterChange('province', province); };
  
  const customRenderers = useMemo(() => ({
    ageSlider: (_currentValue: any, _onChange: any, helpers?: Record<string, any>) => <AgeSliderRenderer helpers={helpers} />
  }), []);
  
  const fetchErrorToDisplay = swrError?.message || ssrFetchError;

  const filterContextValue = useMemo(() => ({
    currentFilters,
    handleFilterChange,
  }), [currentFilters, handleFilterChange]);

  const memoizedAllFilterOptions = useMemo(() => allFilterOptions, [allFilterOptions]);


  return (
    <Container className="py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-6 gap-4 md:gap-0">
        <PageHeader
          title="Politician Directory"
          description="Explore profiles and public records of Nepali politicians."
          className="mb-0 flex-grow"
        />
        <Button
          className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white shadow-md"
          onClick={() => {
            const targetPath = ROUTES.POLITICIANS.ADD;
            if (!isAuthenticated) {
              router.push(`${ROUTES.LOGIN}?redirectTo=${targetPath}`);
            } else {
              router.push(targetPath);
            }
          }}
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          {isAdmin ? "Admin: Add New Politician" : "Suggest New Politician"}
        </Button>
      </div>

      {fetchErrorToDisplay && (
         <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Fetching Data</AlertTitle>
          <AlertDescription>
            Could not load politician data from the server: {fetchErrorToDisplay}.
          </AlertDescription>
        </Alert>
      )}
      
      <PoliticianFilterContext.Provider value={filterContextValue}>
        <FilterControls
          filters={filterConfig}
          allOptions={memoizedAllFilterOptions}
          currentFilters={currentFilters} 
          onFilterChange={handleFilterChange} 
          customRenderers={customRenderers}
          customRenderHelpers={{ sliderMinAge, sliderMaxAge, isLoading }}
        >
          <div className="space-y-1.5 w-full sm:w-auto sm:min-w-[200px]">
            <Label htmlFor="sortByPoliticians" className="text-sm font-medium text-muted-foreground">Sort By</Label>
            <Select value={sortBy} onValueChange={handleSortByChange}>
              <SelectTrigger id="sortByPoliticians" className="w-full bg-background">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating_desc">Rating (High to Low)</SelectItem>
                <SelectItem value="rating_asc">Rating (Low to High)</SelectItem>
                <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                <SelectItem value="age_asc">Age (Young to Old)</SelectItem>
                <SelectItem value="age_desc">Age (Old to Young)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </FilterControls>
      </PoliticianFilterContext.Provider>

       {isLoading && politiciansToDisplay.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
            <SkeletonPoliticianCard key={index} />
          ))}
        </div>
      ) : politiciansToDisplay.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
            {politiciansToDisplay.map((politician) => (
              <PoliticianCard
                key={politician.id}
                politician={politician}
                onTagClick={handleTagClick}
                onPartyClick={handlePartyClick}
                onProvinceClick={handleProvinceClick}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || isLoading}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">
            {(!initialPoliticians || initialPoliticians.length === 0) && !ssrFetchError && !swrError
              ? "No politicians available at the moment."
              : "No politicians found matching your criteria."}
          </p>
        </div>
      )}
    </Container>
  );
}

    