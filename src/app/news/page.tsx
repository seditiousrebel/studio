
import { Suspense } from 'react'; // Added import for Suspense
import type { NewsArticle, FilterOption } from '@/types';
import { NewsListClient } from '@/components/news/news-list-client';
import { getNewsArticles } from '@/lib/news-utils';
import { Container } from '@/components/shared/container'; // For fallback UI
import { PageHeader } from '@/components/shared/page-header'; // For fallback UI
import { Skeleton } from '@/components/ui/skeleton'; // For fallback UI
import { Card as SkeletonCard, CardContent as SkeletonCardContent, CardHeader as SkeletonCardHeader } from '@/components/ui/card'; // For fallback UI

// Fallback UI for Suspense
function NewsPageSkeleton() {
  return (
    <Container className="py-8 md:py-12">
      <PageHeader
        title="Political News & Updates"
        description="Loading news..."
        className="mb-6"
      />
      <Skeleton className="h-24 w-full mb-8" /> {/* Placeholder for FilterControls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} className="rounded-lg overflow-hidden flex flex-col h-full">
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
        ))}
      </div>
    </Container>
  );
}


export default async function NewsPage() {
  // Fetch initial data on the server
  let initialArticles: NewsArticle[] = [];
  let fetchError: string | undefined;
  let partialError: string | undefined;
  let allSourceOptions: FilterOption[] = [];
  let allCategoryOptions: FilterOption[] = [];

  try {
    const result = await getNewsArticles();
    initialArticles = result.articles;
    fetchError = result.error; // Capture the main error if all sources fail
    partialError = result.partialError; // Capture if some sources fail but others succeed

    // Derive options from the full initial fetch
    if (initialArticles.length > 0) {
      allSourceOptions = Array.from(new Set(initialArticles.map(a => a.source).filter(Boolean)))
        .sort()
        .map(source => ({ value: source as string, label: source as string }));
      allCategoryOptions = Array.from(new Set(initialArticles.map(a => a.category || "General").filter(Boolean)))
        .sort()
        .map(category => ({ value: category as string, label: category as string }));
    }

  } catch (e: any) {
    console.error("Critical error in NewsPage SSR:", e);
    fetchError = "A critical error occurred while fetching news.";
    initialArticles = [];
  }

  return (
    <Suspense fallback={<NewsPageSkeleton />}>
      <NewsListClient
        initialArticles={initialArticles}
        fetchError={fetchError} // Pass main error
        // partialError is implicitly handled by NewsListClient if initialArticles is populated but fetchError isn't critical
        initialSourceOptions={allSourceOptions}
        initialCategoryOptions={allCategoryOptions}
      />
    </Suspense>
  );
}
