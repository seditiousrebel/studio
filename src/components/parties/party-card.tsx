// src/components/parties/party-card.tsx
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Party, Tag } from '@/types';
import { CalendarDays, Landmark, UserCircle, TagsIcon, ThumbsUp, ThumbsDown, Star } from 'lucide-react';
import { formatDate } from '@/lib/utils'; // Import formatDate
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/layout/app-providers';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PartyCardProps {
  party: Party;
  onTagClick?: (tag: string) => void;
  onIdeologyClick?: (ideology: string) => void;
  onHeadquartersClick?: (headquarters: string) => void;
}

export function PartyCard({ party, onTagClick, onIdeologyClick, onHeadquartersClick }: PartyCardProps) {
  const { isAuthenticated, userVotes, castVote } = useAuth();
  const userVote = userVotes[`party-${party.id}`];

  const individualIdeologies = party.ideology ? party.ideology.split(',').map(ideo => ideo.trim()).filter(Boolean) : [];

  const handleIdeologyBadgeClick = (e: React.MouseEvent, ideology: string) => {
    if (onIdeologyClick) {
      e.preventDefault();
      e.stopPropagation();
      onIdeologyClick(ideology);
    }
  };

  const handleTagBadgeClick = (e: React.MouseEvent, tagValue: string) => {
    if (onTagClick && tagValue) {
      e.preventDefault();
      e.stopPropagation();
      onTagClick(tagValue);
    }
  };

  const handleHeadquartersClick = (e: React.MouseEvent) => {
    if (party.headquarters && onHeadquartersClick) {
      e.preventDefault();
      e.stopPropagation();
      onHeadquartersClick(party.headquarters);
    }
  };

  const handleVote = (voteType: 'up' | 'down') => {
    if (!party.id) return;
    castVote(party.id, 'party', voteType);
  };

  const getVoteTooltip = (voteType: 'up' | 'down') => {
    if (!isAuthenticated) return 'Login to vote';
    if (userVote === voteType) return `Retract ${voteType}vote`;
    return `${voteType.charAt(0).toUpperCase() + voteType.slice(1)}vote`;
  };

  const formattedFoundingDate = formatDate(party.foundingDate, "N/A");

  const logoPlaceholderSrc = `https://placehold.co/80x80.png`;
  const logoSrc = party.logoUrl || logoPlaceholderSrc;
  const logoAiHint = party.logoUrl ? party.dataAiHint : "party logo";

  const symbolPlaceholderSrc = `https://placehold.co/48x48.png`;
  const symbolSrc = party.electionSymbolUrl || symbolPlaceholderSrc;
  const symbolAiHint = party.electionSymbolUrl ? party.dataAiHintSymbol : "election symbol";


  return (
    <Card className={cn(
      "flex flex-col h-full overflow-hidden shadow-lg rounded-lg bg-card",
      "transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.02]"
    )}>
      <div className="flex flex-col h-full group">
        <CardHeader className="flex flex-row items-start justify-between gap-3 p-4">
          <div className="flex items-start gap-3 flex-grow">
            <Link href={`/parties/${party.id}`} className="shrink-0" prefetch={true}>
              <div className="relative h-16 w-16 sm:h-20 sm:w-20">
                <Image
                  src={logoSrc}
                  alt={`${party.name} logo`}
                  fill
                  sizes="(max-width: 640px) 64px, 80px"
                  className="object-contain rounded-md border border-border group-hover:scale-105 transition-transform duration-300"
                  data-ai-hint={logoAiHint || "party logo"}
                />
              </div>
            </Link>
            <div className="flex-grow min-w-0"> 
              <Link href={`/parties/${party.id}`} prefetch={true}>
                <CardTitle className="text-lg sm:text-xl font-semibold mb-1 text-foreground group-hover:text-primary transition-colors truncate">
                  {party.name} {party.shortName && `(${party.shortName})`}
                </CardTitle>
              </Link>
              {party.chairpersonName && (
                <p className="text-xs text-muted-foreground flex items-center truncate">
                  <UserCircle className="h-3.5 w-3.5 mr-1 text-muted-foreground shrink-0" />
                  Chair:
                  {party.chairpersonId ? (
                    <Link href={`/politicians/${party.chairpersonId}`} prefetch={true} className="ml-1 text-primary hover:underline truncate">
                      {party.chairpersonName}
                    </Link>
                  ) : (
                     <span className="ml-1 truncate">{party.chairpersonName}</span>
                  )}
                </p>
              )}
            </div>
          </div>

          {party.electionSymbolUrl && (
            <div className="relative h-10 w-10 sm:h-12 sm:w-12 shrink-0 ml-2"> 
              <Image
                src={symbolSrc}
                alt={`${party.name} Election Symbol`}
                fill
                sizes="(max-width: 640px) 40px, 48px"
                className="object-contain rounded-sm"
                data-ai-hint={symbolAiHint || "election symbol"}
              />
            </div>
          )}
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-grow">
          {party.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{party.description}</p>}
          <div className="text-xs text-muted-foreground space-y-1.5">
            {individualIdeologies.length > 0 && (
              <div className="flex items-start">
                <TagsIcon className="mr-2 h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <span className="mr-1 font-medium text-foreground">Ideologies:</span>
                <div className="flex flex-wrap gap-1">
                  {individualIdeologies.slice(0, 3).map((ideo) => ( 
                    <Badge
                      key={ideo}
                      variant="secondary" 
                      className={cn("text-xs", onIdeologyClick && "cursor-pointer hover:bg-accent/20")}
                      onClick={onIdeologyClick ? (e) => handleIdeologyBadgeClick(e, ideo) : undefined}
                    >
                      {ideo}
                    </Badge>
                  ))}
                  {individualIdeologies.length > 3 && <Badge variant="secondary" className="text-xs">...</Badge>}
                </div>
              </div>
            )}
            {party.foundingDate && (
              <p className="flex items-center">
                <CalendarDays className="mr-2 h-3.5 w-3.5 text-primary" /> Founded: {formattedFoundingDate}
              </p>
            )}
            {party.headquarters && (
              <p className="flex items-center">
                <Landmark className="mr-2 h-3.5 w-3.5 text-primary" /> HQ:
                <span
                  className={cn("ml-1", onHeadquartersClick && "cursor-pointer hover:underline hover:text-primary")}
                  onClick={onHeadquartersClick ? handleHeadquartersClick : undefined}
                  role={onHeadquartersClick ? "button" : undefined}
                  tabIndex={onHeadquartersClick ? 0 : -1}
                  onKeyDown={onHeadquartersClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleHeadquartersClick(e as any); } : undefined}
                >
                  {party.headquarters}
                </span>
              </p>
            )}
          </div>
          {party.tags && party.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 items-center min-h-[1.75rem]">
              <TagsIcon className="mr-1 h-4 w-4 text-muted-foreground shrink-0" />
              {party.tags.slice(0, 3).map((tag: Tag, index: number) => (
                <Badge
                  key={tag?.id ? `${tag.id}-${index}` : `tag-idx-${index}`}
                  variant="outline"
                  className={cn("text-xs", onTagClick && "cursor-pointer hover:bg-accent/20")}
                  onClick={(e) => tag?.name && onTagClick && handleTagBadgeClick(e, tag.name)}
                  role={onTagClick ? "button" : undefined}
                  tabIndex={onTagClick ? 0 : -1}
                >
                  {tag?.name || 'N/A'}
                </Badge>
              ))}
              {party.tags.length > 3 && <Badge variant="outline" className="text-xs">...</Badge>}
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-2 flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:items-center mt-auto">
            <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-semibold text-foreground">
                      {party.rating?.toFixed(1) || 'N/A'} / 5.0
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {party.upvotes || 0} Upvotes / {party.downvotes || 0} Downvotes
                </span>
            </div>
            <TooltipProvider>
                <div className="flex space-x-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-8 w-8", userVote === 'up' && 'bg-green-100 text-green-600 dark:bg-green-700/20 dark:text-green-400')}
                        onClick={() => handleVote('up')}
                        disabled={!isAuthenticated}
                    >
                        <ThumbsUp className="h-4 w-4" />
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{getVoteTooltip('up')}</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-8 w-8", userVote === 'down' && 'bg-red-100 text-red-600 dark:bg-red-700/20 dark:text-red-400')}
                        onClick={() => handleVote('down')}
                        disabled={!isAuthenticated}
                    >
                        <ThumbsDown className="h-4 w-4" />
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{getVoteTooltip('down')}</p></TooltipContent>
                </Tooltip>
                </div>
            </TooltipProvider>
        </CardFooter>
      </div>
    </Card>
  );
}
