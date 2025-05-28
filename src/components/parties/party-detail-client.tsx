// src/components/parties/party-detail-client.tsx
"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link'; 
import Image from 'next/image';
import { formatDate } from '@/lib/utils'; // Import formatDate

import type { Party, UserPromise, Politician, Bill, EditSuggestion, Tag, ElectionHistoryEntry, ControversyEntry } from '@/types'; 
import { useAuth } from '@/components/layout/app-providers';
import { useToast } from "@/hooks/use-toast";

import { Container } from '@/components/shared/container';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from '@/components/ui/separator';
import { PoliticianCard } from '@/components/politicians/politician-card';
import { PromiseCard } from '@/components/promises/promise-card';
import { BillCard } from '@/components/bills/bill-card';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


import {
  CalendarDays, Landmark, Globe, TagsIcon, Edit as EditIcon, Star, ThumbsUp, ThumbsDown, Info, Users, ListChecks,
  FileText as BillIconLucide, MessageSquarePlus, XCircle, BarChart2, Briefcase, UserCircle, Building, ChevronDown, ChevronUp, FileText, ShieldCheck, BookOpen, AlertTriangle as ControversyIcon, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from "@/components/ui/skeleton";

interface PartyDetailClientProps {
  partyProp: Party | null;
}

const INITIAL_ITEMS_TO_DISPLAY = 5;

export function PartyDetailClient({
  partyProp,
}: PartyDetailClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { isAuthenticated, userVotes, castVote, isAdmin, isLoadingAuth, session } = useAuth();

  const [party, setParty] = useState<Party | null>(partyProp);

  const [displayedPlatformPromisesCount, setDisplayedPlatformPromisesCount] = useState(INITIAL_ITEMS_TO_DISPLAY);
  const [displayedMemberPromisesCount, setDisplayedMemberPromisesCount] = useState(INITIAL_ITEMS_TO_DISPLAY);
  const [displayedPartyBillsCount, setDisplayedPartyBillsCount] = useState(INITIAL_ITEMS_TO_DISPLAY);
  const [displayedMemberBillsCount, setDisplayedMemberBillsCount] = useState(INITIAL_ITEMS_TO_DISPLAY);
  const [displayedElectionHistoryCount, setDisplayedElectionHistoryCount] = useState(INITIAL_ITEMS_TO_DISPLAY);
  const [displayedControversiesCount, setDisplayedControversiesCount] = useState(INITIAL_ITEMS_TO_DISPLAY);


  useEffect(() => {
    setParty(partyProp);
  }, [partyProp]);
  
  const partyIdForVote = party?.id;
  const userVoteOnParty = useMemo(() => {
    if (!partyIdForVote) return null;
    return userVotes[`party-${partyIdForVote}`] || null;
  }, [userVotes, partyIdForVote]);


  const partyMembers = useMemo(() => party?.memberPoliticians || [], [party]);
  const sortedMembers = useMemo(() => [...partyMembers].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0)), [partyMembers]);
  
  const platformPromises = useMemo(() => party?.platformPromises || [], [party]);
  const memberPoliticianPromises = useMemo(() => party?.memberPromises || [], [party]);
  const allRelatedPromisesCount = (platformPromises?.length || 0) + (memberPoliticianPromises?.length || 0);

  const partyPlatformBills = useMemo(() => party?.billsSponsoredByParty || [], [party]);
  const memberSponsoredBills = useMemo(() => party?.billsSponsoredByMembers || [], [party]);
  const allRelatedBillsCount = (partyPlatformBills?.length || 0) + (memberSponsoredBills?.length || 0);

  const electionHistory = useMemo(() => (party?.electionHistory || []).sort((a,b) => b.electionYear - a.electionYear), [party?.electionHistory]);
  const controversies = useMemo(() => (party?.controversies || []).sort((a,b) => {
    const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0;
    const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0;
    return dateB - dateA; // Sort by most recent eventDate first
  }), [party?.controversies]);


  const approvalRating = useMemo(() => {
    if (!party || ((party.upvotes || 0) + (party.downvotes || 0) === 0)) {
      return "N/A";
    }
    const totalVotes = (party.upvotes || 0) + (party.downvotes || 0);
    return `${(((party.upvotes || 0) / totalVotes) * 100).toFixed(0)}%`;
  }, [party]);

  const handleVote = useCallback(async (voteType: 'up' | 'down') => {
     if (!partyIdForVote || !isAuthenticated || isLoadingAuth || !partyProp) {
      if (!isAuthenticated) {
        toast({ title: "Login Required", description: "Please log in to vote.", variant: "destructive" });
        router.push(`/login?redirectTo=${pathname}`);
      }
      return;
    }

    const originalPartyData = { ...partyProp }; 
    const previousUserVoteForThisAction = userVoteOnParty;
    
    let newVoteForContext: 'up' | 'down' | null;
    if (previousUserVoteForThisAction === voteType) {
      newVoteForContext = null;
    } else {
      newVoteForContext = voteType;
    }

    castVote(partyIdForVote, 'party', newVoteForContext); 

    setParty(prev => {
        if (!prev || prev.id !== partyIdForVote) return prev;
        let newUpvotesCount = originalPartyData.upvotes ?? 0;
        let newDownvotesCount = originalPartyData.downvotes ?? 0;

        if (newVoteForContext === null) { 
            if (previousUserVoteForThisAction === 'up') newUpvotesCount = Math.max(0, newUpvotesCount - 1);
            else if (previousUserVoteForThisAction === 'down') newDownvotesCount = Math.max(0, newDownvotesCount - 1);
        } else { 
            if (newVoteForContext === 'up') {
                newUpvotesCount = (originalPartyData.upvotes ?? 0) + 1;
                if (previousUserVoteForThisAction === 'down') newDownvotesCount = Math.max(0, (originalPartyData.downvotes ?? 0) - 1);
            } else { 
                newDownvotesCount = (originalPartyData.downvotes ?? 0) + 1;
                if (previousUserVoteForThisAction === 'up') newUpvotesCount = Math.max(0, (originalPartyData.upvotes ?? 0) - 1);
            }
        }
        
        const totalVotes = newUpvotesCount + newDownvotesCount;
        let newRatingValue = 2.5; 
        if (totalVotes > 0) {
            newRatingValue = parseFloat(((((newUpvotesCount / totalVotes) * 4.5) + 0.5).toFixed(1)));
            newRatingValue = Math.max(0.5, Math.min(5, newRatingValue));
        }
        return { ...prev, upvotes: newUpvotesCount, downvotes: newDownvotesCount, rating: newRatingValue };
    });

    try {
      const response = await fetch(`/api/parties/${partyIdForVote}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ vote_type: newVoteForContext }), 
      });
      if (!response.ok) {
        let errorMessage = `Server responded with ${response.status}.`;
        try {
          const errorText = await response.text();
          if (errorText) {
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.error?.message || errorJson.message || errorText.substring(0, 200) || "Error processing server response.";
            } catch (jsonError) {
              errorMessage = `Server returned non-JSON error: ${errorText.substring(0, 200)}`;
            }
          } else {
            errorMessage += " The error response body was empty.";
          }
        } catch (textError: any) {
          errorMessage += ` Failed to read response body: ${textError.message || "details unavailable"}.`;
        }
        if (errorMessage.includes("Unauthorized. User not authenticated.")) {
            toast({ title: "Authentication Failed", description: "Your session might have expired. Please log in again.", variant: "destructive" });
            router.push(`/login?redirectTo=${pathname}`);
        } else {
            throw new Error(errorMessage);
        }
      } else {
        const updatedPartyFromServer: Party = await response.json();
        setParty(updatedPartyFromServer); 
        toast({ title: "Vote Recorded", description: "Your vote has been submitted." });
      }
    } catch (error: any) {
      if (error.message.includes("Unauthorized. User not authenticated.")){
         // Already handled
      } else {
        console.error("Failed to submit party vote:", error);
        toast({ title: "Vote Error", description: error.message, variant: "destructive" });
        castVote(partyIdForVote, 'party', previousUserVoteForThisAction); 
        setParty(originalPartyData); 
      }
    }
  }, [partyIdForVote, partyProp, isAuthenticated, isLoadingAuth, castVote, router, pathname, toast, userVoteOnParty, session]);


  const getVoteTooltip = (voteType: 'up' | 'down'): string => {
    if (isLoadingAuth) return 'Loading...';
    if (!isAuthenticated) return 'Login to vote';
    if (userVoteOnParty === voteType) return `Retract ${voteType}vote`;
    return `${voteType.charAt(0).toUpperCase() + voteType.slice(1)}vote`;
  };

  const handleSuggestEditClick = () => {
    if (!party || !party.id) return;
    const editPath = `/parties/${party.id}/edit`; 
    
    if (!isAuthenticated) {
      router.push(`/login?redirectTo=${editPath}`);
    } else { 
      router.push(editPath); 
    }
  };

  const navItems = useMemo(() => {
    if (!party) return [];
    return [
      { id: "about", label: "About" },
      { id: "history", label: "History" },
      { id: "policy-positions", label: "Policy" }, 
      { id: "election-history", label: `Elections (${electionHistory.length})` }, 
      { id: "controversies", label: `Controversies (${controversies.length})` }, 
      { id: "promises", label: `Promises (${allRelatedPromisesCount})` },
      { id: "bills", label: `Bills (${allRelatedBillsCount})` },
      { id: "members", label: `Members (${partyMembers.length})` },
    ];
  }, [party, allRelatedPromisesCount, allRelatedBillsCount, partyMembers.length, electionHistory.length, controversies.length]);

  const individualIdeologies = useMemo(() => party?.ideology?.split(',').map(ideo => ideo.trim()).filter(Boolean) || [], [party?.ideology]);

  if (isLoadingAuth && !party) {
     return (
      <Container className="py-12">
        <div className="flex flex-col md:flex-row gap-8 items-start mt-8">
          <div className="w-full md:w-1/3 lg:w-1/4 space-y-6">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
          <div className="w-full md:w-2/3 lg:w-3/4 space-y-6">
            <Skeleton className="h-10 w-full rounded-lg mb-6" /> 
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </Container>
    );
  }

  if (!party) {
    return null; 
  }

  const logoPlaceholderSrc = `https://placehold.co/200x200.png`;
  const logoSrc = party.logoUrl || logoPlaceholderSrc;
  const logoAiHint = party.logoUrl ? party.dataAiHint : "party logo";

  const symbolPlaceholderSrc = `https://placehold.co/80x80.png`;
  const symbolSrc = party.electionSymbolUrl || symbolPlaceholderSrc;
  const symbolAiHint = party.electionSymbolUrl ? party.dataAiHintSymbol : "election symbol";

  return (
     <> 
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-full md:w-1/3 lg:w-1/4 space-y-6 md:sticky md:top-24">
            <Card className="shadow-lg">
              <CardHeader className="relative p-0">
                <div className="relative aspect-square w-full rounded-t-lg overflow-hidden border-b bg-slate-50 dark:bg-slate-800">
                  <Image
                    src={logoSrc}
                    alt={`${party.name || 'Party'} logo`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-contain p-2"
                    priority
                    data-ai-hint={logoAiHint || "party logo"}
                  />
                </div>
                 <div className="p-4">
                  <CardTitle className="text-xl">{party.name}</CardTitle>
                  {party.shortName && <CardDescription className="text-sm">({party.shortName})</CardDescription>}
                   {party.isFeatured && (
                    <Badge className="bg-primary text-primary-foreground shadow-md flex items-center gap-1 py-0.5 px-1.5 text-xs w-fit mt-2">
                      <Star className="h-3.5 w-3.5"/> Featured
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="text-sm space-y-2 pt-0 px-4 pb-4">
                {party.chairpersonName && (
                  <p className="text-muted-foreground flex items-center pt-1">
                    <UserCircle className="h-4 w-4 mr-1.5 text-primary" />
                    Chairperson:
                    {party.chairpersonId ? (
                      <Link href={`/politicians/${party.chairpersonId}`} prefetch={true} className="ml-1 text-primary hover:underline">
                        {party.chairpersonName}
                      </Link>
                    ) : (
                       <span className="ml-1">{party.chairpersonName}</span>
                    )}
                  </p>
                )}
                {party.electionSymbolUrl && (
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold mb-1 text-foreground flex items-center">
                      <Building className="mr-1.5 h-3.5 w-3.5 text-primary" /> Election Symbol:
                    </h4>
                    <div className="relative h-20 w-20">
                       <Image
                          src={symbolSrc}
                          alt={`${party.name || 'Party'} Election Symbol`}
                          fill
                          sizes="80px"
                          className="object-contain rounded-sm border border-border"
                          data-ai-hint={symbolAiHint || "election symbol"}
                       />
                    </div>
                  </div>
                )}
                 {individualIdeologies.length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-xs font-semibold mb-1 text-foreground flex items-center"><TagsIcon className="mr-1 h-3.5 w-3.5 text-primary"/> Ideologies:</h4>
                    <div className="flex flex-wrap gap-1">
                      {individualIdeologies.map(ideo => (
                         <Link key={ideo} href={`/parties?ideology=${encodeURIComponent(ideo)}`} prefetch={true}>
                           <Badge variant="secondary" className="text-xs hover:bg-accent/20 cursor-pointer">{ideo}</Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {party.foundingDate && <p className="flex items-center text-muted-foreground"><CalendarDays className="mr-1.5 h-4 w-4 text-primary"/> Founded: {formatDate(party.foundingDate)}</p>}
                {party.headquarters && <p className="flex items-center text-muted-foreground"><Landmark className="mr-1.5 h-4 w-4 text-primary"/> HQ: <Link href={`/parties?search=${encodeURIComponent(party.headquarters)}`} prefetch={true} className="ml-1 text-primary hover:underline">{party.headquarters}</Link></p>}
                {party.website && <p className="flex items-center text-muted-foreground"><Globe className="mr-1.5 h-4 w-4 text-primary"/><Link href={party.website} target="_blank" rel="noopener noreferrer" className="ml-1 text-primary hover:underline truncate">Official Website</Link></p>}
                {party.tags && party.tags.length > 0 && (<div className="pt-3"><h4 className="text-xs font-semibold mb-1 text-foreground flex items-center"><TagsIcon className="mr-1 h-3.5 w-3.5 text-primary"/> Tags:</h4><div className="flex flex-wrap gap-1">{party.tags.map((tag, index) => tag && tag.name ? (<Link key={tag.id || `tag-${index}`} href={`/parties?tag=${encodeURIComponent(tag.name)}`} prefetch={true}><Badge variant="outline" className="text-xs hover:bg-accent/20 cursor-pointer">{tag.name}</Badge></Link>) : null)}</div></div>)}
              </CardContent>
            </Card>

            <Button variant="outline" className="w-full mt-4" onClick={handleSuggestEditClick}>
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                {isAdmin ? "Admin: Edit Directly" : "Suggest Edits"}
            </Button>
          </div>

          <div className="w-full md:w-2/3 lg:w-3/4 space-y-10">
            <div className="flex justify-center">
                <nav className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm py-2 shadow-sm rounded-md mb-8 w-full">
                    <div className="inline-flex flex-wrap items-center justify-center rounded-md bg-muted p-1 text-muted-foreground gap-1">
                    {navItems.map(item => (
                    <a
                        key={item.id}
                        href={`#${item.id}`}
                        className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-sm hover:text-primary hover:bg-background rounded-md transition-colors text-center"
                    >
                        {item.label}
                    </a>
                    ))}
                    </div>
                </nav>
            </div>

            <section id="about" className="space-y-6 scroll-mt-40">
                <Card className="shadow-md">
                <CardHeader><CardTitle className="flex items-center"><Info className="mr-2 h-5 w-5 text-primary"/>About {party.name}</CardTitle></CardHeader>
                <CardContent><MarkdownRenderer content={party.description || "No description available."} className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed"/></CardContent>
                </Card>
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center"><BarChart2 className="mr-2 h-5 w-5 text-primary"/>Party Rating & Engagement</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg bg-muted/30"><div className="space-y-1"><div className="flex items-center gap-2 text-xl font-semibold text-foreground"><Star className="h-6 w-6 text-yellow-500" /><span>{party.rating?.toFixed(1) || 'N/A'} / 5.0</span></div><p className="text-xs text-muted-foreground">Overall Rating</p></div><div className="space-y-1 text-center sm:text-right"><div className="flex items-center justify-center sm:justify-end gap-2 text-xl font-semibold text-foreground"><span>{approvalRating}</span></div><p className="text-xs text-muted-foreground">Approval Rating</p></div><div className="space-y-1 text-center sm:text-right"><p className="text-sm font-medium text-foreground">{(party.upvotes || 0)} Upvotes / {(party.downvotes || 0)} Downvotes</p><p className="text-xs text-muted-foreground">Based on user votes</p></div></div>
                        <TooltipProvider><div className="flex flex-col sm:flex-row gap-2"><Tooltip><TooltipTrigger asChild><Button variant="outline" className={cn("flex-1 transform transition-transform duration-200 hover:scale-[1.03]", userVoteOnParty === 'up' && 'bg-green-100 border-green-400 text-green-700 hover:bg-green-200 dark:bg-green-800/30 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-700/40')} onClick={() => handleVote('up')} disabled={!isAuthenticated || isLoadingAuth}><ThumbsUp className="mr-1.5 h-4 w-4" /> Upvote</Button></TooltipTrigger><TooltipContent><p>{getVoteTooltip('up')}</p></TooltipContent></Tooltip><Tooltip><TooltipTrigger asChild><Button variant="outline" className={cn("flex-1 transform transition-transform duration-200 hover:scale-[1.03]", userVoteOnParty === 'down' && 'bg-red-100 border-red-400 text-red-700 hover:bg-red-200 dark:bg-red-800/30 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-700/40')} onClick={() => handleVote('down')} disabled={!isAuthenticated || isLoadingAuth}><ThumbsDown className="mr-1.5 h-4 w-4" /> Downvote</Button></TooltipTrigger><TooltipContent><p>{getVoteTooltip('down')}</p></TooltipContent></Tooltip></div></TooltipProvider>
                        <p className="text-xs text-muted-foreground pt-2"><Info className="inline h-3.5 w-3.5 mr-1"/>The Overall Rating is influenced by user votes and other platform metrics.</p>
                    </CardContent>
                </Card>
            </section>

            <section id="history" className="space-y-6 scroll-mt-40">
                <Card className="shadow-md">
                <CardHeader><CardTitle className="flex items-center"><Landmark className="mr-2 h-5 w-5 text-primary"/>Party History</CardTitle></CardHeader>
                <CardContent><MarkdownRenderer content={party.history || "No history available."} className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed"/></CardContent>
                </Card>
            </section>

            <section id="policy-positions" className="space-y-6 scroll-mt-40">
                <Card className="shadow-md">
                <CardHeader><CardTitle className="flex items-center"><FileText className="mr-2 h-5 w-5 text-primary"/>Key Policy Positions</CardTitle></CardHeader>
                <CardContent><MarkdownRenderer content={party.keyPolicyPositions || "No key policy positions detailed."} className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed"/></CardContent>
                </Card>
            </section>

            <section id="election-history" className="space-y-6 scroll-mt-40">
                <Card className="shadow-md">
                <CardHeader><CardTitle className="flex items-center"><BarChart2 className="mr-2 h-5 w-5 text-primary"/>Election History ({electionHistory.length})</CardTitle></CardHeader>
                <CardContent>
                    {electionHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table>
                        <TableHeader><TableRow><TableHead>Year</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Contested</TableHead><TableHead className="text-right">Won</TableHead><TableHead className="text-right">Vote %</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {electionHistory.slice(0, displayedElectionHistoryCount).map((entry) => (
                            <TableRow key={entry.id}>
                                <TableCell>{entry.electionYear}</TableCell>
                                <TableCell>{entry.electionType}</TableCell>
                                <TableCell className="text-right">{entry.seatsContested ?? 'N/A'}</TableCell>
                                <TableCell className="text-right">{entry.seatsWon ?? 'N/A'}</TableCell>
                                <TableCell className="text-right">{entry.votePercentage !== null && entry.votePercentage !== undefined ? `${entry.votePercentage.toFixed(2)}%` : 'N/A'}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                        {electionHistory.length > displayedElectionHistoryCount && (
                        <div className="mt-6 text-center">
                            <Button variant="outline" onClick={() => setDisplayedElectionHistoryCount(electionHistory.length)}>
                                <ChevronDown className="mr-2 h-4 w-4" /> Show All {electionHistory.length} Entries
                            </Button>
                        </div>
                        )}
                        {displayedElectionHistoryCount > INITIAL_ITEMS_TO_DISPLAY && electionHistory.length > INITIAL_ITEMS_TO_DISPLAY && (
                             <div className="mt-6 text-center">
                                <Button variant="outline" onClick={() => setDisplayedElectionHistoryCount(INITIAL_ITEMS_TO_DISPLAY)}>
                                    <ChevronUp className="mr-2 h-4 w-4" /> Show Fewer Entries
                                </Button>
                            </div>
                        )}
                    </div>
                    ) : <p className="text-muted-foreground">No election history available for this party.</p>}
                </CardContent>
                </Card>
            </section>

            <section id="controversies" className="space-y-6 scroll-mt-40">
                <Card className="shadow-md">
                <CardHeader><CardTitle className="flex items-center"><ControversyIcon className="mr-2 h-5 w-5 text-primary"/>Controversies ({controversies.length})</CardTitle></CardHeader>
                <CardContent>
                    {controversies.length > 0 ? (
                    <div className="space-y-4">
                        {controversies.slice(0, displayedControversiesCount).map((entry: ControversyEntry) => (
                        <Card key={entry.id} className="p-4 bg-muted/30">
                            <MarkdownRenderer content={entry.description} className="prose dark:prose-invert max-w-none text-sm text-muted-foreground leading-relaxed"/>
                            {entry.eventDate && <p className="text-xs text-muted-foreground mt-1">Date: {formatDate(entry.eventDate)}</p>}
                            {entry.sourceUrls && entry.sourceUrls.length > 0 && (
                            <div className="mt-2">
                                <p className="text-xs font-medium text-foreground mb-1">Sources:</p>
                                <ul className="list-disc list-inside space-y-1">
                                {entry.sourceUrls.map((source, idx) => (
                                    <li key={source.id || `controversy-src-${idx}`} className="text-xs">
                                    <Link href={source.value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                        {source.description || `Source ${idx + 1}`} <ExternalLink className="inline h-3 w-3"/>
                                    </Link>
                                    </li>
                                ))}
                                </ul>
                            </div>
                            )}
                        </Card>
                        ))}
                        {controversies.length > displayedControversiesCount && (
                        <div className="mt-6 text-center">
                            <Button variant="outline" onClick={() => setDisplayedControversiesCount(controversies.length)}>
                                <ChevronDown className="mr-2 h-4 w-4" /> Show All {controversies.length} Entries
                            </Button>
                        </div>
                        )}
                        {displayedControversiesCount > INITIAL_ITEMS_TO_DISPLAY && controversies.length > INITIAL_ITEMS_TO_DISPLAY && (
                            <div className="mt-6 text-center">
                                <Button variant="outline" onClick={() => setDisplayedControversiesCount(INITIAL_ITEMS_TO_DISPLAY)}>
                                    <ChevronUp className="mr-2 h-4 w-4" /> Show Fewer Entries
                                </Button>
                            </div>
                        )}
                    </div>
                    ) : <p className="text-muted-foreground">No notable controversies documented for this party.</p>}
                </CardContent>
                </Card>
            </section>


            <section id="promises" className="space-y-6 scroll-mt-40">
                <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary" />Promises ({allRelatedPromisesCount})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {platformPromises.length > 0 && (
                    <section>
                        <h3 className="text-lg font-semibold mb-4 text-foreground">Party Platform Promises ({platformPromises.length})</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {platformPromises.slice(0, displayedPlatformPromisesCount).map((promise) => (
                            <PromiseCard key={promise.id} promise={promise} />
                        ))}
                        </div>
                        {platformPromises.length > displayedPlatformPromisesCount && (
                        <div className="mt-6 text-center">
                            <Button variant="outline" onClick={() => setDisplayedPlatformPromisesCount(platformPromises.length)}>
                                <ChevronDown className="mr-2 h-4 w-4" /> Show All {platformPromises.length} Platform Promises
                            </Button>
                        </div>
                        )}
                        {displayedPlatformPromisesCount > INITIAL_ITEMS_TO_DISPLAY && platformPromises.length > INITIAL_ITEMS_TO_DISPLAY && (
                            <div className="mt-6 text-center">
                                <Button variant="outline" onClick={() => setDisplayedPlatformPromisesCount(INITIAL_ITEMS_TO_DISPLAY)}>
                                    <ChevronUp className="mr-2 h-4 w-4" /> Show Fewer Platform Promises
                                </Button>
                            </div>
                        )}
                    </section>
                    )}
                    {memberPoliticianPromises.length > 0 && (
                    <section>
                        {platformPromises.length > 0 && <Separator className="my-6" />}
                        <h3 className="text-lg font-semibold mb-4 text-foreground">Promises by Party Members ({memberPoliticianPromises.length})</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {memberPoliticianPromises.slice(0, displayedMemberPromisesCount).map((promise) => (
                            <PromiseCard key={promise.id} promise={promise} />
                        ))}
                        </div>
                        {memberPoliticianPromises.length > displayedMemberPromisesCount && (
                        <div className="mt-6 text-center">
                            <Button variant="outline" onClick={() => setDisplayedMemberPromisesCount(memberPoliticianPromises.length)}>
                                <ChevronDown className="mr-2 h-4 w-4" /> Show All {memberPoliticianPromises.length} Member Promises
                            </Button>
                        </div>
                        )}
                        {displayedMemberPromisesCount > INITIAL_ITEMS_TO_DISPLAY && memberPoliticianPromises.length > INITIAL_ITEMS_TO_DISPLAY && (
                            <div className="mt-6 text-center">
                                <Button variant="outline" onClick={() => setDisplayedMemberPromisesCount(INITIAL_ITEMS_TO_DISPLAY)}>
                                    <ChevronUp className="mr-2 h-4 w-4" /> Show Fewer Member Promises
                                </Button>
                            </div>
                        )}
                    </section>
                    )}
                    {platformPromises.length === 0 && memberPoliticianPromises.length === 0 && (
                    <p className="text-muted-foreground">No promises found for this party or its members.</p>
                    )}
                </CardContent>
                </Card>
            </section>

            <section id="bills" className="space-y-6 scroll-mt-40">
                <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center"><BillIconLucide className="mr-2 h-5 w-5 text-primary" />Bills ({allRelatedBillsCount})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {partyPlatformBills.length > 0 && (
                        <section>
                        <h3 className="text-lg font-semibold mb-3 text-foreground">Party Platform Bills ({partyPlatformBills.length})</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {partyPlatformBills.slice(0, displayedPartyBillsCount).map(bill => ( <BillCard key={bill.id} bill={bill} onTagClick={(tag: string) => router.push(`/bills?tag=${encodeURIComponent(tag)}`)}/> ))}
                        </div>
                        {partyPlatformBills.length > displayedPartyBillsCount && (
                            <div className="mt-6 text-center">
                                <Button variant="outline" onClick={() => setDisplayedPartyBillsCount(partyPlatformBills.length)}>
                                <ChevronDown className="mr-2 h-4 w-4" /> Show All {partyPlatformBills.length} Party Bills
                                </Button>
                            </div>
                        )}
                        {displayedPartyBillsCount > INITIAL_ITEMS_TO_DISPLAY && partyPlatformBills.length > INITIAL_ITEMS_TO_DISPLAY && (
                            <div className="mt-6 text-center">
                                <Button variant="outline" onClick={() => setDisplayedPartyBillsCount(INITIAL_ITEMS_TO_DISPLAY)}>
                                <ChevronUp className="mr-2 h-4 w-4" /> Show Fewer Party Bills
                                </Button>
                            </div>
                        )}
                        </section>
                    )}
                    {memberSponsoredBills.length > 0 && (
                        <section className={partyPlatformBills.length > 0 ? "mt-6 pt-6 border-t" : ""}>
                        <h3 className="text-lg font-semibold mb-3 text-foreground">Bills Sponsored by Party Members ({memberSponsoredBills.length})</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {memberSponsoredBills.slice(0, displayedMemberBillsCount).map(bill => ( <BillCard key={bill.id} bill={bill} onTagClick={(tag: string) => router.push(`/bills?tag=${encodeURIComponent(tag)}`)}/> ))}
                        </div>
                        {memberSponsoredBills.length > displayedMemberBillsCount && (
                            <div className="mt-6 text-center">
                                <Button variant="outline" onClick={() => setDisplayedMemberBillsCount(memberSponsoredBills.length)}>
                                <ChevronDown className="mr-2 h-4 w-4" /> Show All {memberSponsoredBills.length} Member Bills
                                </Button>
                            </div>
                        )}
                        {displayedMemberBillsCount > INITIAL_ITEMS_TO_DISPLAY && memberSponsoredBills.length > INITIAL_ITEMS_TO_DISPLAY && (
                            <div className="mt-6 text-center">
                                <Button variant="outline" onClick={() => setDisplayedMemberBillsCount(INITIAL_ITEMS_TO_DISPLAY)}>
                                <ChevronUp className="mr-2 h-4 w-4" /> Show Fewer Member Bills
                                </Button>
                            </div>
                        )}
                        </section>
                    )}
                    {partyPlatformBills.length === 0 && memberSponsoredBills.length === 0 && (<p className="text-muted-foreground">No bills associated with this party or its members found.</p>)}
                </CardContent>
                </Card>
            </section>

            <section id="members" className="space-y-6 scroll-mt-40">
                <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/>Members ({partyMembers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {sortedMembers.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {sortedMembers.slice(0, INITIAL_ITEMS_TO_DISPLAY).map((member) => (
                            <PoliticianCard key={member.id} politician={member} />
                        ))}
                        </div>
                        {partyMembers.length > INITIAL_ITEMS_TO_DISPLAY && (
                            <div className="mt-6 text-center">
                                <Button asChild variant="outline">
                                    <Link href={`/politicians?party=${party.id}`} prefetch={true}>
                                        <Users className="mr-2 h-4 w-4" /> View All {partyMembers.length} Members
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </>
                    ) : <p className="text-muted-foreground">No members listed for this party on the platform.</p>}
                </CardContent>
                </Card>
            </section>
          </div>
        </div>
      </>
  );
}
