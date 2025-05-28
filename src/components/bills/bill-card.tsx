// src/components/bills/bill-card.tsx
"use client";

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Bill, BillStatus, Tag } from '@/types';
import { CalendarDays, FileText, UserCircle, Landmark, Star, ThumbsUp, ThumbsDown, TagsIcon } from 'lucide-react';
import { formatDate } from '@/lib/utils'; // Import formatDate
import { cn, getBillStatusBadgeClass } from '@/lib/utils';
import { useAuth } from '@/components/layout/app-providers';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface BillCardProps {
  bill: Bill;
  onTagClick?: (tag: string) => void;
}

export function BillCard({ bill, onTagClick }: BillCardProps) {
  const { isAuthenticated, userVotes, castVote } = useAuth();
  const userVote = userVotes[`bill-${bill.id}`];

  const handleVote = (voteType: 'up' | 'down') => {
    castVote(bill.id, 'bill', voteType);
  };

  const getVoteTooltip = (voteType: 'up' | 'down') => {
    if (!isAuthenticated) return 'Login to vote';
    if (userVote === voteType) return `Retract ${voteType}vote`;
    return `${voteType.charAt(0).toUpperCase() + voteType.slice(1)}vote`;
  };
  
  const handleTagBadgeClick = (e: React.MouseEvent, tagValue: string) => {
    if (onTagClick && tagValue) {
      e.preventDefault();
      e.stopPropagation();
      onTagClick(tagValue);
    }
  };

  const displayDate = bill.registrationDate ? formatDate(bill.registrationDate) : (bill.proposalDate ? formatDate(bill.proposalDate) : 'N/A');

  return (
    <Card className={cn(
      "flex flex-col h-full overflow-hidden shadow-lg rounded-lg bg-card",
      "transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.02]"
    )}>
      <div className="flex flex-col h-full group">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-lg font-semibold leading-snug text-foreground hover:text-primary transition-colors">
              <Link href={`/bills/${bill.id}`} prefetch={true}>
                {bill.title}
              </Link>
            </CardTitle>
            <Badge variant="outline" className={cn("text-xs shrink-0", getBillStatusBadgeClass(bill.status))}>
              {bill.status}
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground pt-1 space-y-0.5">
            {bill.registrationNumber && <p>Reg No: {bill.registrationNumber}</p>}
            <p className="flex items-center">
              <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
              {bill.registrationDate ? "Registered: " : "Proposed: "} {displayDate}
            </p>
            {bill.sponsorPoliticianId && bill.sponsorPoliticianName && (
              <p className="flex items-center">
                <UserCircle className="h-3.5 w-3.5 mr-1.5" />
                Sponsor: 
                <Link href={`/politicians/${bill.sponsorPoliticianId}`} prefetch={true} className="ml-1 text-primary hover:underline">
                    {bill.sponsorPoliticianName}
                </Link>
                 {bill.sponsorPoliticianPartyId && bill.sponsorPoliticianPartyName && (
                  <span className="ml-1">
                    (
                    <Link href={`/parties/${bill.sponsorPoliticianPartyId}`} prefetch={true} className="text-primary hover:underline">
                        {bill.sponsorPoliticianPartyName}
                    </Link>
                    )
                  </span>
                 )}
              </p>
            )}
            {!bill.sponsorPoliticianId && bill.sponsorPartyId && bill.sponsorPartyName && (
               <p className="flex items-center">
                {bill.sponsorPartyLogoUrl ? (
                    <Avatar className="h-4 w-4 mr-1.5 border">
                        <AvatarImage src={bill.sponsorPartyLogoUrl} alt={bill.sponsorPartyName} />
                        <AvatarFallback>{bill.sponsorPartyName.charAt(0)}</AvatarFallback>
                    </Avatar>
                ) : (
                    <Landmark className="h-3.5 w-3.5 mr-1.5" />
                )}
                Sponsor: 
                <Link href={`/parties/${bill.sponsorPartyId}`} prefetch={true} className="ml-1 text-primary hover:underline">
                    {bill.sponsorPartyName}
                </Link>
              </p>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow pt-2">
          <p className="text-sm text-muted-foreground line-clamp-4 mb-3">{bill.summary}</p>
           {bill.tags && bill.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center min-h-[1.75rem]">
               <TagsIcon className="mr-1 h-4 w-4 text-muted-foreground" />
              {bill.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className={cn("text-xs", onTagClick && "cursor-pointer hover:bg-accent/20")}
                  onClick={(e) => handleTagBadgeClick(e, tag.name)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-2 flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-semibold text-foreground">
                {bill.rating?.toFixed(1) || 'N/A'} / 5.0
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {(bill.upvotes || 0)} Upvotes / {(bill.downvotes || 0)} Downvotes
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
