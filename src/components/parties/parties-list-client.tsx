
// src/components/parties/parties-list-client.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback, createContext } from 'react'; // Removed useContext as it's not used at this level anymore directly
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import useSWR from 'swr';
import { Container } from '@/components/shared/container';
import { PageHeader } from '@/components/shared/page-header';
import { PartyCard } from '@/components/parties/party-card';
import type { Party } from '@/types';
import { FilterControls, type FilterConfig, type FilterOption } from '@/components/shared/filter-controls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/components/layout/app-providers';
import { Card as SkeletonCard, CardHeader as SkeletonCardHeader, CardContent as SkeletonCardContent, CardFooter as SkeletonCardFooter } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ITEMS_PER_PAGE } from '@/lib/constants';
import { ROUTES } from '@/lib/routes';
import { apiClient } from '@/lib/api-client';

// PartyFilterContext can still be useful if any custom renderers for Party filters need it.
// For FilterControls itself, we'll pass props directly.
interface PartyFilterContextType {
  currentFilters: Record<string, any>;
  handleFilterChange: (filterId: string, value: any) => void;
}
const PartyFilterContext = createContext<PartyFilterContextType | undefined>(undefined);


const SkeletonPartyCard = () => (
  <SkeletonCard className="rounded-lg overflow-hidden shadow-md flex flex-col h-full">
    <SkeletonCardHeader className="flex flex-row items-start gap-4 p-4">
      <Skeleton className="h-20 w-20 rounded-md" />
      <div className="flex-grow space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
       <Skeleton className="h-12 w-12 rounded-sm" />
    </SkeletonCardHeader>
    <SkeletonCardContent className="p-4 pt-0 space-y-2 flex-grow">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3 mb-3" />
      <div className="space-y-1 mt-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
       <div className="mt-3 min-h-[1.75rem]">
        <Skeleton className="h-5 w-1/4" />
      </div>
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

interface PartiesListClientProps {
  initialParties: Party[];
  initialTotalCount: number;
  filterConfig: FilterConfig[];
  allFilterOptions: Record<string, FilterOption[]>;
  fetchError?: string | null;
}

export function PartiesListClient({
  initialParties,
  initialTotalCount,
  filterConfig,
  allFilterOptions,
  fetchError: ssrFetchError,
}: PartiesListClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAdmin, isAuthenticated } = useAuth();

  const getFiltersFromParams = useCallback(() => {
    const initial: Record<string, any> = {};
    filterConfig.forEach(fc => {
      initial[fc.id] = searchParams.get(fc.id === 'searchTerm' ? 'search' : fc.id) || '';
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
    if (currentFilters.ideology) params.append('ideology', currentFilters.ideology);
    if (currentFilters.foundingYear) params.append('foundingYear', currentFilters.foundingYear);
    if (currentFilters.tag) params.append('tag', currentFilters.tag);
    if (sortBy) params.append('sortBy', sortBy);
    return `${ROUTES.API.PARTIES}?${params.toString()}`;
  }, [currentPage, currentFilters, sortBy]);

  const { data, error: swrError, isLoading: swrIsLoading } = useSWR(
    constructApiUrl,
    (url: string) => apiClient.get<{ items: Party[], totalCount: number }>(url.replace(/^\/api/, '')),
    {
      fallbackData: (currentPage === 1 && !Object.values(currentFilters).some(val => val !== '') && sortBy === 'rating_desc') 
                      ? { items: initialParties, totalCount: initialTotalCount } 
                      : undefined,
      keepPreviousData: true,
    }
  );

  const partiesToDisplay: Party[] = data?.items || (currentPage === 1 ? initialParties : []);
  const totalCount: number = data?.totalCount || (currentPage === 1 ? initialTotalCount : 0);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const isLoading = swrIsLoading || (!data && !swrError && !ssrFetchError);

  useEffect(() => {
    const params = new URLSearchParams();
    if (currentFilters.searchTerm) params.set('search', currentFilters.searchTerm);
    if (currentFilters.ideology) params.set('ideology', currentFilters.ideology);
    if (currentFilters.foundingYear) params.set('foundingYear', currentFilters.foundingYear);
    if (currentFilters.tag) params.set('tag', currentFilters.tag);
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

  const handleTagClick = (tag: string) => handleFilterChange('tag', tag);
  const handleIdeologyClick = (ideology: string) => handleFilterChange('ideology', ideology);
  const handleHeadquartersClick = (hq: string) => handleFilterChange('searchTerm', hq);
  
  const fetchErrorToDisplay = swrError?.message || ssrFetchError;

  const filterContextValue = useMemo(() => ({
    currentFilters,
    handleFilterChange,
  }), [currentFilters, handleFilterChange]);

  return (
    <PartyFilterContext.Provider value={filterContextValue}> {/* Context still provided for potential custom renderers */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-6 gap-4 md:gap-0">
        <PageHeader
          title="Political Party Showcase"
          description="Discover Nepali political parties, their ideologies, history, and platforms."
          className="mb-0 flex-grow"
        />
        <Button
            className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white shadow-md"
            onClick={() => {
              const targetPath = ROUTES.PARTIES.ADD;
              if (!isAuthenticated) {
                router.push(`${ROUTES.LOGIN}?redirectTo=${targetPath}`);
              } else {
                router.push(targetPath);
              }
            }}
          >
            <PlusCircle className="mr-2 h-5 w-5" /> 
            {isAdmin ? "Admin: Add New Party" : "Suggest New Party"}
        </Button>
      </div>

      {fetchErrorToDisplay && (
         <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Fetching Data</AlertTitle>
          <AlertDescription>
            Could not load party data from the server: {fetchErrorToDisplay}.
          </AlertDescription>
        </Alert>
      )}

      <FilterControls
        filters={filterConfig}
        allOptions={allFilterOptions}
        currentFilters={currentFilters} // Explicitly pass currentFilters
        onFilterChange={handleFilterChange} // Explicitly pass onFilterChange
      >
        <div className="space-y-1.5 w-full sm:w-auto sm:min-w-[200px]">
          <Label htmlFor="sortByParty" className="text-sm font-medium text-muted-foreground">Sort By</Label>
          <Select value={sortBy} onValueChange={handleSortByChange}>
            <SelectTrigger id="sortByParty" className="w-full bg-background">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating_desc">Rating (High to Low)</SelectItem>
              <SelectItem value="rating_asc">Rating (Low to High)</SelectItem>
              <SelectItem value="name_asc">Name (A-Z)</SelectItem>
              <SelectItem value="name_desc">Name (Z-A)</SelectItem>
              <SelectItem value="foundingDate_asc">Founding Date (Oldest)</SelectItem>
              <SelectItem value="foundingDate_desc">Founding Date (Newest)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FilterControls>

      {isLoading && partiesToDisplay.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => <SkeletonPartyCard key={index} />)}
        </div>
      ) : partiesToDisplay.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
            {partiesToDisplay.map((party) => (
              <PartyCard
                key={party.id}
                party={party}
                onTagClick={handleTagClick}
                onIdeologyClick={handleIdeologyClick}
                onHeadquartersClick={handleHeadquartersClick}
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
            {(initialParties || []).length === 0 && !ssrFetchError ? "No parties available at the moment." : "No parties found matching your criteria."}
          </p>
        </div>
      )}
    </PartyFilterContext.Provider>
  );
}

