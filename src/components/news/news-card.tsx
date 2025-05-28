
"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { NewsArticle } from '@/types';
import { ExternalLink, CalendarDays } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns'; // Added parseISO and isValid
import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react'; // Added React, useState, useEffect
import { ROUTES } from '@/lib/routes';

interface NewsCardProps {
  article: NewsArticle;
  onCategoryClick?: (category: string) => void;
  onSourceClick?: (source: string) => void;
}

export function NewsCard({ article, onCategoryClick, onSourceClick }: NewsCardProps) {
  const [clientDisplayDate, setClientDisplayDate] = useState<string | null>(null);

  useEffect(() => {
    let formattedDate = 'Date unavailable';
    try {
      if (article.pubDate) {
        const dateObj = parseISO(article.pubDate); // Parse the ISO string
        if (isValid(dateObj)) {
          formattedDate = format(dateObj, 'PPP');
        }
      }
    } catch (e) {
      console.warn("Error formatting date for news article:", article.pubDate, e);
    }
    setClientDisplayDate(formattedDate);
  }, [article.pubDate]);


  const handleCategoryBadgeClick = (e: React.MouseEvent) => {
    if (article.category && onCategoryClick) {
      e.preventDefault(); 
      e.stopPropagation();
      onCategoryClick(article.category);
    }
  };

  const handleSourceTextClick = (e: React.MouseEvent) => {
    if (article.source && onSourceClick) {
      e.preventDefault();
      e.stopPropagation();
      onSourceClick(article.source);
    }
  };

  return (
    <Card className={cn(
      "flex flex-col h-full overflow-hidden shadow-lg rounded-lg bg-card",
      "transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.02]"
    )}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold leading-snug hover:text-primary transition-colors">
          <Link href={article.link || '#'} target="_blank" rel="noopener noreferrer" prefetch={false}>
            {article.title || "Untitled Article"}
          </Link>
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground flex items-center pt-1">
          <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
          {clientDisplayDate === null ? 'Loading date...' : clientDisplayDate} -
          {onSourceClick && article.source ? (
            <span 
              className="ml-1 cursor-pointer hover:underline text-primary"
              onClick={handleSourceTextClick}
              role="button"
              tabIndex={0}
            >
              {article.source}
            </span>
          ) : article.source ? (
             <Link href={`${ROUTES.NEWS.LIST}?source=${encodeURIComponent(article.source)}`} prefetch={true} className="ml-1 hover:underline text-primary">
                {article.source}
            </Link>
          ) : (
            <span className="ml-1">Unknown Source</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-5">{article.summary || "No summary available."}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-2">
        {article.category ? (
          onCategoryClick ? (
            <Badge 
              variant="outline"
              className="cursor-pointer hover:bg-accent/20"
              onClick={handleCategoryBadgeClick}
              role="button"
              tabIndex={0}
            >
              {article.category}
            </Badge>
          ) : (
            <Link href={`${ROUTES.NEWS.LIST}?category=${encodeURIComponent(article.category)}`} prefetch={true}>
                <Badge variant="outline" className="hover:bg-accent/20">
                    {article.category}
                </Badge>
            </Link>
          )
        ) : (
          <span /> 
        )}
        <Link
          href={article.link || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline flex items-center"
          prefetch={false}
        >
          Read More <ExternalLink className="ml-1 h-3 w-3" />
        </Link>
      </CardFooter>
    </Card>
  );
}
