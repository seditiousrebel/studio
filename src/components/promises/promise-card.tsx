// src/components/promises/promise-card.tsx
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { UserPromise, PromiseStatus, Tag } from '@/types'; // Ensure Tag is imported
import { CalendarDays, UserCircle, CheckCircle, XCircle, Hourglass, Tag as CategoryIconLucide, Target, TagsIcon, LinkIcon, Landmark } from 'lucide-react'; // Renamed Tag to CategoryIconLucide
import { formatDate } from '@/lib/utils'; // Import formatDate
import { cn, getPromiseStatusBadgeClass } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PromiseCardProps {
  promise: UserPromise;
  onTagClick?: (tag: string) => void;
  onCategoryClick?: (category: string) => void;
  // These are less likely to be used directly from the card if names are links, but kept for flexibility
  onPoliticianClick?: (politicianId: string) => void;
  onPartyClick?: (partyId: string) => void;
}

export function PromiseCard({ promise, onTagClick, onCategoryClick, onPoliticianClick, onPartyClick }: PromiseCardProps) {
  const statusVisuals = getPromiseStatusBadgeClass(promise.status); // Returns Tailwind classes

  const handleGenericClick = (e: React.MouseEvent, handler?: () => void) => {
    if (handler) {
      e.preventDefault();
      e.stopPropagation();
      handler();
    }
  };

  const getStatusIcon = (status: PromiseStatus): JSX.Element => {
    switch (status) {
      case 'Fulfilled': return <CheckCircle className="h-4 w-4" />;
      case 'In Progress': return <Hourglass className="h-4 w-4" />;
      case 'Pending': return <CalendarDays className="h-4 w-4" />;
      case 'Broken': return <XCircle className="h-4 w-4" />;
      case 'Overdue': return <CalendarDays className="h-4 w-4 text-orange-500" />; // Example: overdue uses calendar with different color
      default: return <Target className="h-4 w-4" />;
    }
  };

  const formattedDeadline = formatDate(promise.deadline, "N/A");
  const formattedDateAdded = formatDate(promise.dateAdded, "N/A");


  return (
    <Card className={cn(
      "flex flex-col h-full overflow-hidden shadow-lg rounded-lg bg-card",
      "transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.02]"
    )}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-semibold leading-snug text-foreground hover:text-primary transition-colors">
            <Link href={`/promises/${promise.id}`} prefetch={true}>
              {promise.title}
            </Link>
          </CardTitle>
          <Badge variant="outline" className={cn("text-xs shrink-0", statusVisuals)}>
            {getStatusIcon(promise.status)}
            <span className="ml-1.5">{promise.status}</span>
          </Badge>
        </div>
        
        <CardDescription className="text-xs text-muted-foreground pt-1">
          {promise.politicianId && promise.politicianName ? (
            <div className="flex items-center group">
              {promise.politicianImageUrl ? (
                 <Avatar className="h-5 w-5 mr-1.5 border group-hover:border-primary transition-colors">
                    <AvatarImage src={promise.politicianImageUrl} alt={promise.politicianName} data-ai-hint="politician photo small"/>
                    <AvatarFallback>{promise.politicianName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
              ) : (
                <UserCircle className="h-4 w-4 mr-1.5 text-muted-foreground group-hover:text-primary transition-colors" />
              )}
              Promised by: 
              <Link href={`/politicians/${promise.politicianId}`} prefetch={true} className="ml-1 text-primary hover:underline">
                {promise.politicianName}
              </Link>
              {promise.partyId && promise.partyName && (
                <span className="ml-1">
                  (
                  <Link href={`/parties/${promise.partyId}`} prefetch={true} className="text-primary hover:underline">
                    {promise.partyName}
                  </Link>
                  )
                </span>
              )}
            </div>
          ) : promise.partyId && promise.partyName ? (
            <span className="flex items-center group">
              {promise.partyLogoUrl ? (
                  <Avatar className="h-5 w-5 mr-1.5 border group-hover:border-primary transition-colors">
                      <AvatarImage src={promise.partyLogoUrl} alt={promise.partyName} data-ai-hint="party logo small"/>
                      <AvatarFallback>{promise.partyName.charAt(0)}</AvatarFallback>
                  </Avatar>
              ) : (
                  <Landmark className="h-4 w-4 mr-1.5 text-muted-foreground group-hover:text-primary transition-colors" />
              )}
              Party Platform: 
              <Link href={`/parties/${promise.partyId}`} prefetch={true} className="ml-1 text-primary hover:underline">
                 {promise.partyName}
              </Link>
            </span>
          ) : null}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow pt-0">
        <p className="text-sm text-muted-foreground line-clamp-5 mb-3">{promise.description}</p>
        <div className="text-xs text-muted-foreground space-y-1">
          {promise.category && (
            <p className="flex items-center">
              <CategoryIconLucide className="mr-1.5 h-3.5 w-3.5 text-primary" /> Category: 
              <span 
                className={cn(onCategoryClick && "cursor-pointer hover:underline hover:text-primary ml-1")}
                onClick={(e) => handleGenericClick(e, onCategoryClick && promise.category ? () => onCategoryClick(promise.category!) : undefined)}
                role={onCategoryClick ? "button" : undefined}
                tabIndex={onCategoryClick ? 0 : -1}
              >
                {promise.category}
              </span>
            </p>
          )}
          {promise.deadline && (
            <p className="flex items-center">
              <CalendarDays className="mr-1.5 h-3.5 w-3.5 text-primary" /> Deadline: {formattedDeadline}
            </p>
          )}
           <p className="flex items-center">
              <CalendarDays className="mr-1.5 h-3.5 w-3.5 text-primary" /> Added: {formattedDateAdded}
            </p>
        </div>
        {promise.tags && promise.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 items-center min-h-[1.75rem]">
                <TagsIcon className="mr-1 h-4 w-4 text-muted-foreground" />
                {promise.tags.map((tag: Tag, index: number) => (
                <Badge
                    key={tag.id || `tag-${index}`} // Use tag.id if available, otherwise index as fallback
                    variant="outline"
                    className={cn("text-xs", onTagClick && "cursor-pointer hover:bg-accent/20")}
                    onClick={(e) => handleGenericClick(e, onTagClick && tag.name ? () => onTagClick(tag.name) : undefined)}
                    role={onTagClick ? "button" : undefined}
                    tabIndex={onTagClick ? 0 : -1}
                >
                    {tag.name}
                </Badge>
                ))}
            </div>
        )}
      </CardContent>
      <CardFooter className="pt-2 flex flex-wrap gap-x-4 gap-y-2">
        {promise.sourceUrl && (
          <Link
            href={promise.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center"
            onClick={(e) => e.stopPropagation()} 
            prefetch={false}
          >
            <LinkIcon className="mr-1 h-3 w-3" /> Promise Source
          </Link>
        )}
        {promise.evidenceUrl && (
          <Link
            href={promise.evidenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center"
            onClick={(e) => e.stopPropagation()} 
            prefetch={false}
          >
            <LinkIcon className="mr-1 h-3 w-3" /> View Evidence
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}

