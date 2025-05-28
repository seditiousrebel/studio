
// This component must be a Server Component
// 'use client'; // DO NOT ADD THIS

import { getNewsArticles } from '@/lib/news-utils';
import { NewsCard } from '@/components/news/news-card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Newspaper } from 'lucide-react';
import type { NewsArticle } from '@/types';
import { Container } from '@/components/shared/container';


const MAX_HOMEPAGE_NEWS = 3;

export async function LatestNewsSection() {
  let articles: NewsArticle[] = [];
  let fetchError: string | undefined = undefined;

  try {
    const result = await getNewsArticles();
    // Take only the first few articles for the homepage
    articles = result.articles.slice(0, MAX_HOMEPAGE_NEWS);
    
    // Determine if there was an error significant enough to report
    if (result.error || (result.partialError && articles.length === 0)) {
        fetchError = result.error || result.partialError;
    } else if (result.partialError && articles.length > 0) {
        // Optionally log partial error or display a subtle hint
        console.warn("Partial news load for homepage:", result.partialError);
    }

  } catch (e) {
    console.error("Error fetching news for homepage:", e);
    fetchError = "Could not load latest news at this time.";
  }

  return (
    <section className="py-12 md:py-16 bg-secondary/5">
      <Container>
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl font-bold text-foreground flex items-center">
            <Newspaper className="h-8 w-8 mr-3 text-primary" /> Latest News & Updates
          </h2>
          <Button asChild variant="link" className="text-primary hover:text-primary/80">
            <Link href="/news">View All News <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
        {fetchError && articles.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Could not load latest news. Please try the <Link href="/news" className="text-primary hover:underline">main News page</Link>.
            {/* <span className="text-xs block mt-1">Error: {fetchError}</span> */}
          </p>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
            {articles.map((article) => (
              // NewsCard will render links directly since onCategoryClick/onSourceClick won't be passed
              <NewsCard key={article.id || article.link} article={article} />
            ))}
          </div>
        ) : !fetchError && articles.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No news available at the moment. Check the <Link href="/news" className="text-primary hover:underline">News page</Link> for live updates.
          </p>
        ) : null}
      </Container>
    </section>
  );
}
