
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Container } from '@/components/shared/container';
import { PageHeader } from '@/components/shared/page-header';
import { NewsCard } from '@/components/news/news-card';
import type { NewsArticle, FilterOption } from '@/types'; // Added FilterOption
import { FilterControls, type FilterConfig } from '@/components/shared/filter-controls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Card as SkeletonCard, CardContent as SkeletonCardContent, CardHeader as SkeletonCardHeader } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, PlusCircle } from 'lucide-react';
import { useAuth } from '@/components/layout/app-providers';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';


interface NewsListClientProps {
  initialArticles: NewsArticle[];
  fetchError?: string;
  partialError?: string;
  initialSourceOptions: FilterOption[];
  initialCategoryOptions: FilterOption[];
}

const SkeletonNewsCard = () => (
    <SkeletonCard className="rounded-lg overflow-hidden flex flex-col h-full">
        <SkeletonCardHeader>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
        </SkeletonCardHeader>
        <SkeletonCardContent className="flex-grow">
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-5/6" />
        </SkeletonCardContent>
        <div className="p-4 flex justify-between items-center">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-24" />
        </div>
    </SkeletonCard>
);


export function NewsListClient({
  initialArticles,
  fetchError,
  partialError,
  initialSourceOptions,
  initialCategoryOptions,
}: NewsListClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const [articles, setArticles] = useState<NewsArticle[]>(initialArticles || []);
  const [isLoading, setIsLoading] = useState(!initialArticles && !fetchError);

  const getFiltersFromParams = useCallback(() => {
    const qSearch = searchParams.get('search') || '';
    const qSource = searchParams.get('source') || '';
    const qCategory = searchParams.get('category') || '';
    return {
      searchTerm: qSearch,
      source: qSource,
      category: qCategory,
    };
  }, [searchParams]);

  const [currentFilters, setCurrentFilters] = useState<Record<string, string>>(getFiltersFromParams);
  const [sortBy, setSortBy] = useState('pubDate_desc');

  useEffect(() => {
    if (initialArticles) {
      setArticles(initialArticles);
      setIsLoading(false);
    }
  }, [initialArticles]);

  useEffect(() => {
    const newFiltersFromParams = getFiltersFromParams();
    let hasChanged = false;
    for (const key in newFiltersFromParams) {
      if (newFiltersFromParams[key as keyof typeof newFiltersFromParams] !== currentFilters[key as keyof typeof currentFilters]) {
        hasChanged = true;
        break;
      }
    }
    if (hasChanged) {
      setCurrentFilters(newFiltersFromParams);
    }
  }, [searchParams, currentFilters, getFiltersFromParams]);

  const initialFiltersConfig: FilterConfig[] = [
    { id: 'searchTerm', label: 'Search News', placeholder: 'Enter keywords...', type: 'search' },
    { id: 'source', label: 'Filter by Source', placeholder: 'All Sources', optionsKey: 'sourceOptionsComputed', type: 'select' },
  ];
  
  const allFilterOptionsForControls = {
    sourceOptionsComputed: initialSourceOptions,
    categoryOptionsComputed: initialCategoryOptions,
  };


  const handleFilterChange = (filterId: string, value: any) => {
    const newParams = new URLSearchParams(searchParams.toString());
    const stringValue = Array.isArray(value) ? value.join(',') : String(value);
    const paramName = filterId === 'searchTerm' ? 'search' : filterId;

    if (stringValue && stringValue !== "__ALL_ITEMS_PLACEHOLDER__") {
      newParams.set(paramName, stringValue);
    } else {
      newParams.delete(paramName);
    }
    // Preserve existing sort order if any, or set default
    const currentSort = searchParams.get('sortBy');
    if (currentSort) newParams.set('sortBy', currentSort);
    else if (sortBy) newParams.set('sortBy', sortBy); // Ensure sortBy is added if not in URL

    router.push(`${ROUTES.NEWS.LIST}?${newParams.toString()}`, { scroll: false });
  };


  const handleCategoryClick = (category: string) => {
    handleFilterChange('category', category);
  };

  const handleSourceClick = (source: string) => {
    handleFilterChange('source', source);
  };

  const filteredAndSortedArticles = useMemo(() => {
    let _articles = [...articles];

    if (currentFilters.searchTerm) {
      _articles = _articles.filter(a =>
        (a.title || "").toLowerCase().includes(currentFilters.searchTerm.toLowerCase()) ||
        (a.summary || "").toLowerCase().includes(currentFilters.searchTerm.toLowerCase())
      );
    }

    if (currentFilters.source) {
      _articles = _articles.filter(a => a.source === currentFilters.source);
    }
    if (currentFilters.category) {
      _articles = _articles.filter(a => (a.category || "General") === currentFilters.category);
    }

    _articles.sort((a, b) => {
      const [field, order] = sortBy.split('_');
      let comparison = 0;
      if (field === 'pubDate') {
        try {
          comparison = new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime();
        } catch (e) {
          comparison = 0;
        }
      } else if (field === 'source') {
        comparison = (a.source || "").localeCompare(b.source || "");
      } else if (field === 'title') {
        comparison = (a.title || "").localeCompare(b.title || "");
      }
      return order === 'asc' ? comparison : -comparison;
    });

    return _articles;
  }, [articles, currentFilters, sortBy]);

  if (fetchError && articles.length === 0 && !isLoading) {
    return (
      <Container className="py-8 md:py-12">
        <PageHeader
          title="Political News & Updates"
          description="Stay informed with the latest news on Nepali politics and governance."
        />
        <Alert variant="destructive" className="mt-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Fetching News</AlertTitle>
          <AlertDescription>
            Could not load news articles at this time. Please try again later.
            <br />
            <span className="text-xs">Details: {fetchError}</span>
          </AlertDescription>
        </Alert>
      </Container>
    );
  }


  return (
    <Container className="py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-6 gap-4 md:gap-0">
        <PageHeader
          title="Political News & Updates"
          description="Stay informed with the latest news on Nepali politics and governance."
          className="mb-0 flex-grow"
        />
        {isAdmin && (
          <Button asChild className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href={ROUTES.ADMIN.NEWS_ADD || '/admin/news/add'} prefetch={true}>
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Article
            </Link>
          </Button>
        )}
      </div>

      {partialError && (
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Partial News Load</AlertTitle>
          <AlertDescription>
            Some news sources failed to load. Displaying available articles.
          </AlertDescription>
        </Alert>
      )}

      <FilterControls
        filters={initialFiltersConfig}
        currentFilters={currentFilters}
        onFilterChange={handleFilterChange}
        allOptions={allFilterOptionsForControls}
      >
        <div className="space-y-1.5 w-full sm:w-auto sm:min-w-[200px]">
          <Label htmlFor="categoryFilterNews" className="text-sm font-medium text-muted-foreground">Filter by Category</Label>
          <Select
            value={currentFilters.category || ""}
            onValueChange={(value) => handleFilterChange('category', value)}
          >
            <SelectTrigger id="categoryFilterNews" className="w-full bg-background" aria-label="Filter by Category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__ALL_ITEMS_PLACEHOLDER__">All Categories</SelectItem>
              {initialCategoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 w-full sm:w-auto sm:min-w-[200px]">
          <Label htmlFor="sortByNews" className="text-sm font-medium text-muted-foreground">Sort By</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger id="sortByNews" className="w-full bg-background">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pubDate_desc">Date (Newest First)</SelectItem>
              <SelectItem value="pubDate_asc">Date (Oldest First)</SelectItem>
              <SelectItem value="source_asc">Source (A-Z)</SelectItem>
              <SelectItem value="source_desc">Source (Z-A)</SelectItem>
              <SelectItem value="title_asc">Title (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FilterControls>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonNewsCard key={index} />
          ))}
        </div>
      ) : filteredAndSortedArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {filteredAndSortedArticles.map((article) => (
            <NewsCard
              key={article.id || article.link}
              article={article}
              onCategoryClick={handleCategoryClick}
              onSourceClick={handleSourceClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">
            No news articles found matching your criteria.
          </p>
        </div>
      )}
    </Container>
  );
}
