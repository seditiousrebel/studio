// src/components/bills/bill-detail-client.tsx
"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link'; 
import Image from 'next/image';
import { Container } from '@/components/shared/container';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, UserCircle, Landmark, ExternalLink, Info, TagsIcon, MessageSquarePlus, XCircle, LinkIcon as SourceLinkIcon, Edit, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { Bill, BillStatus, EditSuggestion, Politician, Party, Tag } from '@/types';
import { formatDate } from '@/lib/utils'; // Import formatDate
import { cn, getBillStatusBadgeClass } from '@/lib/utils';
import { useAuth } from '@/components/layout/app-providers';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from "@/hooks/use-toast";
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';


interface BillDetailClientProps {
  billProp: Bill | null;
}

export function BillDetailClient({ billProp }: BillDetailClientProps) {
  const { isAdmin, isAuthenticated, userVotes, castVote, userEmail, user, session } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [bill, setBill] = useState(billProp);

  useEffect(() => {
    setBill(billProp);
  }, [billProp]);

  useEffect(() => {
    if (billProp && bill) {
      if (bill.id === billProp.id) {
         if (billProp.upvotes !== bill.upvotes || billProp.downvotes !== bill.downvotes || billProp.rating !== bill.rating) {
           setBill(prevBill => prevBill ? { ...prevBill, upvotes: billProp.upvotes, downvotes: billProp.downvotes, rating: billProp.rating } : null);
         }
      }
    }
  }, [billProp, userVotes, bill]);

  const userVote = bill ? userVotes[`bill-${bill.id}`] : null;

  if (!bill) {
    return (
      <Container className="py-12">
        <PageHeader title="Bill Not Found" description="The requested bill could not be located." />
         <Button onClick={() => router.back()} variant="outline" className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transform transition-transform duration-200 hover:scale-[1.03]">Go Back</Button>
      </Container>
    );
  }

  const statusVisuals = getBillStatusBadgeClass(bill.status);

  const submitVote = async (voteType: 'up' | 'down') => {
    if (!isAuthenticated) {
      toast({ title: "Login Required", description: "Please log in to vote.", variant: "destructive" });
      router.push(`/login?redirectTo=${pathname}`);
      return;
    }
    if (!bill) return;

    const originalUpvotes = bill.upvotes;
    const originalDownvotes = bill.downvotes;
    const originalUserVote = userVote;

    let newUpvotes = bill.upvotes;
    let newDownvotes = bill.downvotes;
    let newUserVote: 'up' | 'down' | null = userVote;

    if (userVote === voteType) { 
      newUserVote = null;
      if (voteType === 'up') newUpvotes = Math.max(0, newUpvotes - 1);
      else newDownvotes = Math.max(0, newDownvotes - 1);
    } else { 
      newUserVote = voteType;
      if (voteType === 'up') {
        newUpvotes++;
        if (userVote === 'down') newDownvotes = Math.max(0, newDownvotes - 1);
      } else { 
        newDownvotes++;
        if (userVote === 'up') newUpvotes = Math.max(0, newUpvotes - 1);
      }
    }

    const newTotalVotes = newUpvotes + newDownvotes;
    let newRating = bill.rating;
    if (newTotalVotes > 0) {
        newRating = parseFloat(((((newUpvotes || 0) / newTotalVotes) * 4.5 + 0.5).toFixed(1)));
        newRating = Math.max(0.5, Math.min(5, newRating || 2.5));
    } else {
        newRating = 2.5; 
    }

    castVote(bill.id, 'bill', newUserVote);

    setBill(prev => prev ? {...prev, upvotes: newUpvotes, downvotes: newDownvotes, rating: newRating } : null);

    try {
      const response = await fetch(`/api/bills/${bill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ vote_type: newUserVote }), 
      });

      if (!response.ok) {
        let errorMessage = `Server responded with ${response.status}.`;
        try {
          const errorText = await response.text();
          if (errorText) {
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.error || errorJson.message || errorText.substring(0, 200) || "Error processing server response.";
            } catch (jsonError) {
              errorMessage = `Server returned non-JSON error: ${errorText.substring(0, 200)}`;
            }
          } else {
            errorMessage += " The error response body was empty.";
          }
        } catch (textError: any) {
          console.error("Failed to read error response text:", textError);
          errorMessage += ` Failed to read response body: ${textError.message || "details unavailable"}.`;
        }
        throw new Error(errorMessage);
      }
      const updatedBillFromServer: Bill = await response.json();
      setBill(updatedBillFromServer); 
      toast({ title: "Vote Recorded", description: "Your vote has been submitted."});

    } catch (error: any) {
      console.error("Failed to submit vote:", error);
      toast({ title: "Vote Error", description: error.message, variant: "destructive" });
      castVote(bill.id, 'bill', originalUserVote); 
      setBill(prev => prev ? {...prev, upvotes: originalUpvotes, downvotes: originalDownvotes, rating: billProp?.rating } : null); 
    }
  };

  const getVoteTooltip = (voteType: 'up' | 'down') => {
    if (!isAuthenticated) return 'Login to vote';
    if (userVote === voteType) return `Retract ${voteType}vote`;
    return `${voteType.charAt(0).toUpperCase() + voteType.slice(1)}vote`;
  };

  const approvalRating = useMemo(() => {
    if (!bill || ((bill.upvotes || 0) + (bill.downvotes || 0) === 0)) {
      return "N/A";
    }
    const totalVotes = (bill.upvotes || 0) + (bill.downvotes || 0);
    return `${(((bill.upvotes || 0) / totalVotes) * 100).toFixed(0)}%`;
  }, [bill]);

  const handleSuggestEditClick = () => {
    if (!bill || !bill.id) return;
    const editPath = `/bills/${bill.id}/edit`; // UPDATED PATH
    
    if (!isAuthenticated) {
      router.push(`/login?redirectTo=${editPath}`);
    } else {
      router.push(editPath); 
    }
  };

  const pageTitle = bill.title || "Bill Details";
  const pageDescription = bill.summary ? bill.summary.substring(0, 150) + (bill.summary.length > 150 ? "..." : "") : "Detailed information about this legislative bill.";

  return (
    <Container className="py-8 md:py-12">
      <>
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="outline" className={cn("py-1.5 px-3 text-sm inline-flex items-center", statusVisuals)}>
            <span className="font-semibold">{bill.status}</span>
          </Badge>
          {bill.isFeatured && (
            <Badge className="bg-primary text-primary-foreground shadow-md flex items-center gap-1 py-0.5 px-1.5 text-xs w-fit mt-1">
              <Star className="h-3.5 w-3.5"/> Featured
            </Badge>
          )}
        </div>
        <PageHeader title={pageTitle} description={pageDescription} className="mb-2" />
      </>

      <div className="grid md:grid-cols-3 gap-8 items-start">
        <div className="space-y-6 md:col-span-2">
          <>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center"><Info className="mr-2 h-5 w-5 text-primary"/>Bill Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-muted-foreground">
                {bill.summary && <MarkdownRenderer content={bill.summary} className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed mb-4" />}
                {bill.registrationNumber && <p><strong className="text-foreground">Registration No.:</strong> {bill.registrationNumber}</p>}
                {bill.registrationDate && <p><strong className="text-foreground">Registration Date:</strong> {formatDate(bill.registrationDate)}</p>}
                {bill.ministry && <p><strong className="text-foreground">Responsible Ministry:</strong> {bill.ministry}</p>}
                {bill.proposalDate && <p><strong className="text-foreground">Proposed/Introduced:</strong> {formatDate(bill.proposalDate)}</p>}
                {bill.parliamentInfoUrl && (
                  <p className="flex items-center">
                    <strong className="text-foreground mr-1">Official Info:</strong>
                    <Link href={bill.parliamentInfoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">
                      View on Parliament Website <ExternalLink className="ml-1.5 h-4 w-4" />
                    </Link>
                  </p>
                )}
                {bill.tags && bill.tags.length > 0 && (
                  <div className="pt-2">
                    <h4 className="font-semibold mb-2 text-foreground flex items-center"><TagsIcon className="mr-2 h-5 w-5 text-primary"/> Tags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {bill.tags.map(tag => (
                        <Link key={tag.id} href={`/bills?tag=${encodeURIComponent(tag.name)}`} prefetch={true}>
                          <Badge variant="secondary" className="text-sm hover:bg-accent/30 cursor-pointer">{tag.name}</Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center"><Star className="mr-2 h-5 w-5 text-primary"/>Bill Rating & Engagement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xl font-semibold text-foreground">
                      <Star className="h-6 w-6 text-yellow-500" />
                      <span>{bill.rating?.toFixed(1) || 'N/A'} / 5.0</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Overall Rating</p>
                  </div>
                    <div className="space-y-1 text-center sm:text-right">
                    <div className="flex items-center justify-center sm:justify-end gap-2 text-xl font-semibold text-foreground">
                      <span>{approvalRating}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Approval Rating</p>
                  </div>
                  <div className="space-y-1 text-center sm:text-right">
                    <p className="text-sm font-medium text-foreground">{(bill.upvotes || 0)} Upvotes / {(bill.downvotes || 0)} Downvotes</p>
                    <p className="text-xs text-muted-foreground">Based on user votes</p>
                  </div>
                </div>
                <TooltipProvider>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("flex-1 transform transition-transform duration-200 hover:scale-[1.03]", userVote === 'up' && 'bg-green-100 border-green-400 text-green-700 hover:bg-green-200 dark:bg-green-800/30 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-700/40')}
                          onClick={() => submitVote('up')}
                          disabled={!isAuthenticated}
                        >
                          <ThumbsUp className="mr-1.5 h-4 w-4" /> Upvote
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>{getVoteTooltip('up')}</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("flex-1 transform transition-transform duration-200 hover:scale-[1.03]", userVote === 'down' && 'bg-red-100 border-red-400 text-red-700 hover:bg-red-200 dark:bg-red-800/30 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-700/40')}
                          onClick={() => submitVote('down')}
                          disabled={!isAuthenticated}
                        >
                          <ThumbsDown className="mr-1.5 h-4 w-4" /> Downvote
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>{getVoteTooltip('down')}</p></TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </CardContent>
            </Card>
          </>
        </div>

        <div className="md:col-span-1 space-y-6 w-full">
          {(bill.sponsorPoliticianId || bill.sponsorPartyId) && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  {bill.sponsorPoliticianId ? <UserCircle className="mr-2 h-5 w-5 text-primary"/> : <Landmark className="mr-2 h-5 w-5 text-primary" />}
                  Sponsored By
                </CardTitle>
              </CardHeader>
              <CardContent>
                 {bill.sponsorPoliticianId && bill.sponsorPoliticianName && (
                    <div className="space-y-2">
                        <Link href={`/politicians/${bill.sponsorPoliticianId}`} prefetch={true} className="flex items-start space-x-3 group">
                          <Avatar className="h-12 w-12 border-2 border-primary group-hover:border-accent transition-colors">
                            <AvatarFallback>{bill.sponsorPoliticianName.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-grow">
                              <h3 className="text-md font-semibold group-hover:text-primary transition-colors">{bill.sponsorPoliticianName}</h3>
                          </div>
                        </Link>
                        {bill.sponsorPoliticianPartyId && bill.sponsorPoliticianPartyName && (
                          <div className="mt-1 pl-[calc(3rem+0.75rem)]"> 
                              <Link href={`/parties/${bill.sponsorPoliticianPartyId}`} prefetch={true} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center group/party">
                              <Avatar className="h-5 w-5 mr-1.5 border group-hover/party:border-primary transition-colors">
                                  {bill.sponsorPoliticianPartyLogoUrl ? <AvatarImage src={bill.sponsorPoliticianPartyLogoUrl} alt={bill.sponsorPoliticianPartyName} data-ai-hint={`${bill.sponsorPoliticianPartyName} logo small`} /> : null}
                                  <AvatarFallback>{bill.sponsorPoliticianPartyName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              {bill.sponsorPoliticianPartyName}
                              </Link>
                          </div>
                        )}
                    </div>
                  )}
                  {!bill.sponsorPoliticianId && bill.sponsorPartyId && bill.sponsorPartyName && (
                    <Link href={`/parties/${bill.sponsorPartyId}`} prefetch={true} className="flex items-center space-x-3 group">
                      <Avatar className="h-12 w-12 border-2 border-primary group-hover:border-accent transition-colors">
                          {bill.sponsorPartyLogoUrl ? <AvatarImage src={bill.sponsorPartyLogoUrl} alt={bill.sponsorPartyName} data-ai-hint={`${bill.sponsorPartyName} logo`}/> : <AvatarFallback>{bill.sponsorPartyName.charAt(0)}</AvatarFallback>}
                      </Avatar>
                      <div>
                      <h3 className="text-md font-semibold group-hover:text-primary transition-colors">{bill.sponsorPartyName}</h3>
                      <p className="text-sm text-muted-foreground">Party Sponsorship</p>
                      </div>
                    </Link>
                  )}
              </CardContent>
            </Card>
          )}
          <Button
            variant="outline"
            className="w-full mt-4 transform transition-transform duration-200 hover:scale-[1.03]"
            onClick={handleSuggestEditClick}
          >
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            {isAdmin ? "Admin: Edit Directly" : "Suggest Edits"}
          </Button>
        </div>
      </div>
    </Container>
  );
}
