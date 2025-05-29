
// src/components/bills/bills-list-client.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback, createContext } from 'react'; // Removed useContext
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import useSWR from 'swr';
import { Container } from '@/components/shared/container';
import { PageHeader } from '@/components/shared/page-header';
import { BillCard } from '@/components/bills/bill-card';
import type { Bill } from '@/types';
import { FilterControls, type FilterConfig, type FilterOption } from '@/components/shared/filter-controls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Card as SkeletonCard, CardContent as SkeletonCardContent, CardHeader as SkeletonCardHeader, CardFooter as SkeletonCardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/components/layout/app-providers';
import { ITEMS_PER_PAGE } from '@/lib/constants';
import { ROUTES } from '@/lib/routes';
import { apiClient } from '@/lib/api-client';

// Context can be kept if custom renderers within this list client need it.
interface BillFilterContextType {
  currentFilters: Record<string, any>;
  handleFilterChange: (filterId: string, value: any) => void;
}
const BillFilterContext = createContext<BillFilterContextType | undefined>(undefined);


const SkeletonBillCard = () => (
    <SkeletonCard className="rounded-lg overflow-hidden shadow-md flex flex-col h-full">
        <SkeletonCardHeader className="pb-3">
            <div className="flex justify-between items-start gap-2">
                <Skeleton className="h-6 w-3/4 mb-1" />
                <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-1/2 mb-1" />
            <Skeleton className="h-4 w-1/3" />
        </SkeletonCardHeader>
        <SkeletonCardContent className="pt-0 flex-grow">
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-5/6 mb-3" />
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

interface BillsListClientProps {
  initialBills: Bill[];
  initialTotalCount: number;
  filterConfig: FilterConfig[];
  allFilterOptions: Record<string, FilterOption[]>;
  fetchError?: string | null;
}

export function BillsListClient({
  initialBills,
  initialTotalCount,
  filterConfig,
  allFilterOptions,
  fetchError: ssrFetchError,
}: BillsListClientProps) {
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
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'proposalDate_desc');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  const constructApiUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    params.append('limit', ITEMS_PER_PAGE.toString());
    if (currentFilters.searchTerm) params.append('search', currentFilters.searchTerm);
    if (currentFilters.status) params.append('status', currentFilters.status);
    if (currentFilters.politician) params.append('politician', currentFilters.politician);
    if (currentFilters.party) params.append('party', currentFilters.party);
    if (currentFilters.tag) params.append('tag', currentFilters.tag);
    if (sortBy) params.append('sortBy', sortBy);
    return `${ROUTES.API.BILLS}?${params.toString()}`;
  }, [currentPage, currentFilters, sortBy]);

  const { data, error: swrError, isLoading: swrIsLoading } = useSWR(
    constructApiUrl,
    (url: string) => apiClient.get<{ items: Bill[], totalCount: number }>(url.replace(/^\/api/, '')),
    {
      fallbackData: (currentPage === 1 && !Object.values(currentFilters).some(val => val !== '') && sortBy === 'proposalDate_desc')
                      ? { items: initialBills, totalCount: initialTotalCount }
                      : undefined,
      keepPreviousData: true,
    }
  );

  const billsToDisplay: Bill[] = data?.items || (currentPage === 1 ? initialBills : []);
  const totalCount: number = data?.totalCount || (currentPage === 1 ? initialTotalCount : 0);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const isLoading = swrIsLoading || (!data && !swrError && !ssrFetchError);

  useEffect(() => {
    const params = new URLSearchParams();
    if (currentFilters.searchTerm) params.set('search', currentFilters.searchTerm);
    if (currentFilters.status) params.set('status', currentFilters.status);
    if (currentFilters.politician) params.set('politician', currentFilters.politician);
    if (currentFilters.party) params.set('party', currentFilters.party);
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

  const handleTagClick = (tagValue: string) => handleFilterChange('tag', tagValue);

  const fetchErrorToDisplay = swrError?.message || ssrFetchError;

  const filterContextValue = useMemo(() => ({
    currentFilters,
    handleFilterChange,
  }), [currentFilters, handleFilterChange]);

  return (
    <BillFilterContext.Provider value={filterContextValue}>
       <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-6 gap-4 md:gap-0">
        <PageHeader
          title="Legislative Bills"
          description="Explore proposed and active bills in the Nepali parliament."
          className="mb-0 flex-grow"
        />
        <Button
            className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white shadow-md"
            onClick={() => {
              const targetPath = ROUTES.BILLS.ADD;
              if (!isAuthenticated) {
                router.push(`${ROUTES.LOGIN}?redirectTo=${targetPath}`);
              } else {
                router.push(targetPath);
              }
            }}
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            {isAdmin ? "Admin: Add New Bill" : "Suggest New Bill"}
        </Button>
      </div>

      {fetchErrorToDisplay && (
         <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Fetching Data</AlertTitle>
          <AlertDescription>
            Could not load bill data from the server: {fetchErrorToDisplay}.
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
          <Label htmlFor="sortByBills" className="text-sm font-medium text-muted-foreground">Sort By</Label>
          <Select value={sortBy} onValueChange={handleSortByChange}>
            <SelectTrigger id="sortByBills" className="w-full bg-background">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating_desc">Rating (High to Low)</SelectItem>
              <SelectItem value="rating_asc">Rating (Low to High)</SelectItem>
              <SelectItem value="proposalDate_desc">Proposal Date (Newest)</SelectItem>
              <SelectItem value="proposalDate_asc">Proposal Date (Oldest)</SelectItem>
              <SelectItem value="title_asc">Title (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FilterControls>

       {isLoading && billsToDisplay.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => <SkeletonBillCard key={index} />)}
        </div>
      ) : billsToDisplay.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
            {billsToDisplay.map((bill) => (
              <BillCard
                key={bill.id}
                bill={bill}
                onTagClick={handleTagClick}
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
             {(initialBills || []).length === 0 && !ssrFetchError ? "No bills available in the database." : "No bills found matching your criteria."}
          </p>
        </div>
      )}
    </BillFilterContext.Provider>
  );
}
