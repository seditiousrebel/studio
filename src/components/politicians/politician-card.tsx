// src/components/politicians/politician-card.tsx
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Politician, Tag } from '@/types'; 
import { Building, MapPin, User, TagsIcon, ThumbsUp, ThumbsDown, Star, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/layout/app-providers';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PoliticianCardProps {
  politician: Politician;
  onTagClick?: (tag: string) => void;
  onPartyClick?: (partyId: string, partyName: string) => void;
  onProvinceClick?: (province: string) => void;
}

export function PoliticianCard({ politician, onTagClick, onPartyClick, onProvinceClick }: PoliticianCardProps) {
  const { isAuthenticated, userVotes, castVote } = useAuth();
  const userVote = userVotes[`politician-${politician.id}`];

  const handleVote = (voteType: 'up' | 'down') => {
    castVote(politician.id, 'politician', voteType);
  };

  const handlePartyClick = (e: React.MouseEvent) => {
    if (onPartyClick && politician.party_id && politician.partyName) {
      e.preventDefault();
      e.stopPropagation();
      onPartyClick(politician.party_id, politician.partyName);
    }
  };

  const handleProvinceClick = (e: React.MouseEvent) => {
    if (onProvinceClick && politician.province) {
      e.preventDefault();
      e.stopPropagation();
      onProvinceClick(politician.province);
    }
  };

  const getVoteTooltip = (voteType: 'up' | 'down') => {
    if (!isAuthenticated) return 'Login to vote';
    if (userVote === voteType) return `Retract ${voteType}vote`;
    return `${voteType.charAt(0).toUpperCase() + voteType.slice(1)}vote`;
  };

  const getCriminalRecordIconColor = (severity: Politician['highestConvictedSeverity']) => {
    if (!severity) return 'text-muted-foreground';
    switch (severity) {
      case 'Significant/Severe': return 'text-red-500 dark:text-red-400';
      case 'Moderate': return 'text-orange-500 dark:text-orange-400';
      case 'Minor': return 'text-yellow-500 dark:text-yellow-400';
      default: return 'text-muted-foreground';
    }
  };
  
  const getCriminalRecordIcon = () => {
    if (!politician.highestConvictedSeverity) return null;
    const iconColor = getCriminalRecordIconColor(politician.highestConvictedSeverity);
    const tooltipText = `${politician.highestConvictedSeverity} Convicted Record`;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <ShieldAlert className={cn("h-5 w-5", iconColor)} />
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const handleTagBadgeClick = (e: React.MouseEvent, tagValue: string) => {
    if (onTagClick) {
      e.preventDefault();
      e.stopPropagation();
      onTagClick(tagValue);
    }
  };

  const placeholderImageSrc = `https://placehold.co/400x300.png`;
  const imageSrc = politician.imageUrl || placeholderImageSrc;
  const imageAiHint = politician.imageUrl ? politician.data_ai_hint : "politician photo";


  return (
    <Card className={cn(
      "flex flex-col h-full overflow-hidden shadow-lg rounded-lg bg-card",
      "transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.02]"
    )}>
      <div className="flex flex-col h-full group">
        <CardHeader className="p-0 relative">
          <Link href={`/politicians/${politician.id}`} prefetch={true}>
            <div className="relative h-48 w-full"> 
              <Image
                src={imageSrc}
                alt={politician.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                data-ai-hint={imageAiHint || "politician photo"}
              />
              <div className="absolute top-3 left-3">
                {getCriminalRecordIcon()}
              </div>
              {politician.position && (
                <Badge variant="default" className="absolute top-3 right-3 bg-primary text-primary-foreground shadow py-0.5 px-1.5 text-xs">
                  {politician.position}
                </Badge>
              )}
            </div>
          </Link>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
           <Link href={`/politicians/${politician.id}`} className="block" prefetch={true}>
            <CardTitle className="text-xl font-semibold mb-1 text-foreground group-hover:text-primary transition-colors">
              {politician.name}
            </CardTitle>
          </Link>
          {politician.bio && <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{politician.bio}</p>}
          <div className="text-xs text-muted-foreground space-y-1.5">
            {politician.partyName && (
              <p className="flex items-center">
                <Building className="mr-2 h-4 w-4 text-primary" />
                <span
                  className={cn('font-medium', onPartyClick && politician.party_id && 'cursor-pointer hover:underline hover:text-primary')}
                  onClick={handlePartyClick}
                  role={onPartyClick && politician.party_id ? "button" : undefined}
                  tabIndex={onPartyClick && politician.party_id ? 0 : -1}
                >
                  {politician.partyName}
                </span>
              </p>
            )}
            {politician.province && (
              <p className="flex items-center">
                <MapPin className="mr-2 h-4 w-4 text-primary" />
                <span
                  className={cn(onProvinceClick && 'cursor-pointer hover:underline hover:text-primary')}
                  onClick={handleProvinceClick}
                  role={onProvinceClick ? "button" : undefined}
                  tabIndex={onProvinceClick ? 0 : -1}
                >
                  {politician.province}
                </span>
                {politician.constituency && <span className="ml-1">({politician.constituency})</span>}
              </p>
            )}
            {politician.age !== undefined && politician.age > 0 && 
                <p className="flex items-center">
                <User className="mr-2 h-4 w-4 text-primary" /> Age: {politician.age}
                </p>
            }
          </div>
          <div className="mt-2 space-y-0.5 text-xs">
            {politician.promiseFulfillmentRate !== undefined && (
                <p className="text-muted-foreground">Promise Fulfillment: <span className="font-semibold text-foreground">{politician.promiseFulfillmentRate.toFixed(0)}%</span></p>
            )}
          </div>

          {politician.tags && politician.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 items-center min-h-[1.75rem]">
              <TagsIcon className="mr-1 h-4 w-4 text-muted-foreground" />
              {politician.tags.map((tag, index) => (
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
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-2 flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:items-center mt-auto">
            <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-semibold text-foreground">
                      {politician.rating?.toFixed(1) || 'N/A'} / 5.0
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {politician.upvotes || 0} Upvotes / {politician.downvotes || 0} Downvotes
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
