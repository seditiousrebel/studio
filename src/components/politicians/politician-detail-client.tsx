// src/components/politicians/politician-detail-client.tsx
"use client";

import { Container } from '@/components/shared/container';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import * as React from "react";
import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/utils'; // Import formatDate

import type { Politician, CriminalRecordEntry, PoliticalCareerEntry, AssetDeclarationEntry, EditSuggestion, CriminalRecordSeverity, SocialMediaLink, AssetDeclarationSource, CriminalRecordSource, UserPromise, Bill, PromiseStatus, BillStatus, Tag } from '@/types';
import { useAuth } from '@/components/layout/app-providers';
import { useToast } from "@/hooks/use-toast";
import { useRouter, usePathname } from 'next/navigation';
import {
  BarChart2, Briefcase, Building, CalendarDays, CheckCircle, Edit as EditIcon, ExternalLink, GraduationCap, Hourglass, Info, Landmark, LinkIcon as SourceLinkIcon, ListChecks, Mail, MapPin, MessageSquarePlus, ShieldAlert, Star, FileText as BillIconLucide, TagsIcon, Target, ThumbsDown, ThumbsUp, User as UserIcon, UserCircle as UserCircleIcon, XCircle, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { cn, getPromiseStatusBadgeClass, getBillStatusBadgeClass } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { Skeleton } from "@/components/ui/skeleton";
import { NONE_CONSTITUENCY_VALUE, ITEMS_PER_PAGE as INITIAL_ITEMS_TO_DISPLAY } from '@/lib/constants';
import { PromiseCard } from '@/components/promises/promise-card';
import { BillCard } from '@/components/bills/bill-card';
import type { PoliticianFormValues } from '@/components/admin/politician-form'; 

interface PoliticianDetailClientProps {
  politicianProp: Politician | null;
}


export function PoliticianDetailClient({ politicianProp }: PoliticianDetailClientProps) {
  const { isAdmin, isAuthenticated, userVotes, castVote, userEmail, user, isLoadingAuth, supabase, session } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [politician, setPolitician] = useState<Politician | null>(politicianProp);

  const [displayedPromisesCount, setDisplayedPromisesCount] = useState(INITIAL_ITEMS_TO_DISPLAY);
  const [displayedDirectBillsCount, setDisplayedDirectBillsCount] = useState(INITIAL_ITEMS_TO_DISPLAY);
  const [displayedPartyBillsCount, setDisplayedPartyBillsCount] = useState(INITIAL_ITEMS_TO_DISPLAY);


  useEffect(() => {
    setPolitician(politicianProp);
  }, [politicianProp]);


  const politicianIdForVote = politician?.id;
  const userVoteOnPolitician = useMemo(() => {
    if (!politicianIdForVote) return null;
    return userVotes[`politician-${politicianIdForVote}`] || null;
  }, [userVotes, politicianIdForVote]);

  const approvalRating = useMemo(() => {
    if (!politician || ((politician.upvotes || 0) + (politician.downvotes || 0) === 0)) {
      return "N/A";
    }
    const totalVotes = (politician.upvotes || 0) + (politician.downvotes || 0);
    return `${(((politician.upvotes || 0) / totalVotes) * 100).toFixed(0)}%`;
  }, [politician]);

  const getVoteTooltip = (voteType: 'up' | 'down'): string => {
    if (isLoadingAuth) return 'Loading...';
    if (!isAuthenticated) return 'Login to vote';
    if (userVoteOnPolitician === voteType) return `Retract ${voteType}vote`;
    return `${voteType.charAt(0).toUpperCase() + voteType.slice(1)}vote`;
  };

  const politicianPromises = useMemo(() => politician?.promises || [], [politician]);
  const directlySponsoredBills = useMemo(() => politician?.directlySponsoredBills || [], [politician]);
  const partySponsoredBills = useMemo(() => politician?.partySponsoredBills || [], [politician]);

  const getHighestConvictedSeverity = (entries?: CriminalRecordEntry[]): CriminalRecordSeverity | null => {
    if (!entries || entries.length === 0) return null;
    const convictedEntries = entries.filter(e => e.status === 'Convicted');
    if (convictedEntries.length === 0) return null;
    if (convictedEntries.some(e => e.severity === 'Significant/Severe')) return 'Significant/Severe';
    if (convictedEntries.some(e => e.severity === 'Moderate')) return 'Moderate';
    if (convictedEntries.some(e => e.severity === 'Minor')) return 'Minor';
    return null;
  };
  const highestConvictedSeverity = useMemo(() => getHighestConvictedSeverity(politician?.criminalRecordEntries), [politician?.criminalRecordEntries]);

  const handleVote = useCallback(async (voteType: 'up' | 'down') => {
    const pId = politicianIdForVote;
    if (!pId || !isAuthenticated || isLoadingAuth || !politicianProp ) {
      if (!isAuthenticated) {
        toast({ title: "Login Required", description: "Please log in to vote.", variant: "destructive" });
        router.push(`/login?redirectTo=${pathname}`);
      }
      return;
    }
    
    const originalUpvotes = politicianProp.upvotes ?? 0;
    const originalDownvotes = politicianProp.downvotes ?? 0;
    const originalRating = politicianProp.rating;
    const previousUserVoteForThisAction = userVoteOnPolitician;

    let newVoteForContext: 'up' | 'down' | null;
    if (previousUserVoteForThisAction === voteType) {
      newVoteForContext = null;
    } else {
      newVoteForContext = voteType;
    }

    castVote(pId, 'politician', newVoteForContext); 

    setPolitician(prev => {
      if (!prev || prev.id !== pId) return prev;
      let newUpvotesCount = originalUpvotes;
      let newDownvotesCount = originalDownvotes;

      if (newVoteForContext === null) { 
        if (previousUserVoteForThisAction === 'up') newUpvotesCount = Math.max(0, originalUpvotes - 1);
        else if (previousUserVoteForThisAction === 'down') newDownvotesCount = Math.max(0, originalDownvotes - 1);
      } else { 
        if (newVoteForContext === 'up') {
          newUpvotesCount = originalUpvotes + 1;
          if (previousUserVoteForThisAction === 'down') newDownvotesCount = Math.max(0, originalDownvotes - 1);
        } else { 
          newDownvotesCount = originalDownvotes + 1;
          if (previousUserVoteForThisAction === 'up') newUpvotesCount = Math.max(0, originalUpvotes - 1);
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
      const response = await fetch(`/api/politicians/${pId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ vote_type: newVoteForContext }),
      });
      if (!response.ok) {
        let errorMessage = `Server responded with ${response.status}.`;
        let errorResponseText = "";
        try {
          errorResponseText = await response.text();
          if (errorResponseText) {
            try {
              const errorJson = JSON.parse(errorResponseText);
              errorMessage = errorJson.error?.message || errorJson.message || errorText.substring(0, 200) || "Error processing server response.";
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
        if (errorMessage.includes("Unauthorized. User not authenticated.")) {
            toast({ title: "Authentication Failed", description: "Your session might have expired. Please log in again.", variant: "destructive" });
            router.push(`/login?redirectTo=${pathname}`);
        } else {
            throw new Error(errorMessage);
        }
      } else {
        const updatedPoliticianFromServer: Politician = await response.json();
        setPolitician(updatedPoliticianFromServer);
        toast({ title: "Vote Recorded", description: "Your vote has been submitted."});
      }
    } catch (error: any) {
      if (error.message.includes("Unauthorized. User not authenticated.")){
         // Already handled by the block above, no need to double toast or revert here.
      } else {
        console.error("Failed to submit vote:", error);
        toast({ title: "Vote Error", description: error.message, variant: "destructive" });
        castVote(pId, 'politician', previousUserVoteForThisAction); 
        setPolitician(prev => prev && prev.id === pId ? { ...prev, upvotes: originalUpvotes, downvotes: originalDownvotes, rating: originalRating } : prev);
      }
    }
  }, [politicianIdForVote, politicianProp, isAuthenticated, isLoadingAuth, castVote, router, pathname, toast, userVoteOnPolitician, session]);

  const handleSuggestEditClick = () => {
    if (!politician || !politician.id) return;
    const editPath = `/politicians/${politician.id}/edit`; 
    
    if (!isAuthenticated) {
      router.push(`/login?redirectTo=${editPath}`);
    } else { 
      router.push(editPath); 
    }
  };

  if (isLoadingAuth && !politician) {
     return (
      <Container className="py-12">
        <div className="mb-6"><Skeleton className="h-10 w-3/4" /><Skeleton className="h-6 w-1/2 mt-2" /></div>
        <div className="flex flex-col md:flex-row gap-8 items-start mt-8">
          <div className="w-full md:w-1/3 lg:w-1/4 space-y-6">
            <Skeleton className="aspect-[3/4] sm:aspect-square w-full rounded-lg" />
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

  if (!politician) {
    return null; 
  }
  
  const navItems = [
    { id: "overview", label: "Overview" },
    { id: "assets", label: `Assets (${politician.assetDeclarations?.length || 0})` },
    { id: "criminal-record", label: `Criminal Record (${politician.criminalRecordEntries?.length || 0})` },
    { id: "contact", label: "Contact" },
    { id: "promises", label: `Promises (${politicianPromises.length})` },
    { id: "bills", label: `Bills (${(politician.directlySponsoredBills?.length || 0) + (politician.partySponsoredBills?.length || 0)})` },
  ];

  const placeholderImageSrc = `https://placehold.co/400x533.png`;
  const imageSrc = politician.imageUrl || placeholderImageSrc;
  const imageAiHint = politician.imageUrl ? politician.data_ai_hint : "politician official photo";

  return (
    <Container className="py-8 md:py-12"> 
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {politician.isFeatured && (
          <Badge className="bg-primary text-primary-foreground shadow-md flex items-center gap-1 py-0.5 px-1.5 text-xs w-fit">
            <Star className="h-3.5 w-3.5"/> Featured
          </Badge>
        )}
        {highestConvictedSeverity && (
          <Badge variant={highestConvictedSeverity === "Significant/Severe" ? "destructive" : highestConvictedSeverity === "Moderate" ? "default": "outline"}
                  className={cn(highestConvictedSeverity === "Moderate" && "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-400", "py-0.5 px-1.5 text-xs shadow-md")}>
            <ShieldAlert className="mr-1 h-3.5 w-3.5"/> {highestConvictedSeverity} Convicted Record
          </Badge>
        )}
      </div>
      <PageHeader
        title={politician.name || "Politician Profile"}
        description={politician.position || "Details about this politician."}
        className="mb-2"
      />
      
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-full md:w-1/3 lg:w-1/4 space-y-6 md:sticky md:top-24">
          <Card className="shadow-lg">
            <CardHeader className="p-0">
              <div className="relative aspect-[3/4] sm:aspect-square w-full rounded-t-lg overflow-hidden border-b bg-slate-50 dark:bg-slate-800">
                <Image
                  src={imageSrc}
                  alt={politician.name || "Politician"}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                  priority
                  data-ai-hint={imageAiHint || "politician official photo"}
                />
              </div>
               <div className="p-4">
                <CardTitle className="text-2xl">{politician.name}</CardTitle>
                {politician.position && <CardDescription className="text-sm">{politician.position}</CardDescription>}
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-2 pt-0 px-4 pb-4">
                {politician.partyName && (
                  <p className="text-muted-foreground flex items-center">
                    <Landmark className="mr-2 h-4 w-4 text-primary" />
                    Party:
                    {politician.party_id ? (
                      <Link href={`/parties/${politician.party_id}`} prefetch={true} className="ml-1 text-primary hover:underline">
                        {politician.partyName}
                      </Link>
                    ) : (
                      <span className="ml-1">{politician.partyName}</span>
                    )}
                  </p>
                )}
                {politician.province && <p className="flex items-center text-muted-foreground"><MapPin className="mr-2 h-4 w-4 text-primary"/> Province: {politician.province}</p>}
                {politician.constituency && politician.constituency !== NONE_CONSTITUENCY_VALUE && <p className="flex items-center text-muted-foreground"><MapPin className="mr-2 h-4 w-4 text-primary"/> Constituency: {politician.constituency}</p>}
                {politician.age !== undefined && <p className="flex items-center text-muted-foreground"><UserIcon className="mr-2 h-4 w-4 text-primary"/> Age: {politician.age}</p>}
                {politician.tags && politician.tags.length > 0 && (
                    <div className="pt-2">
                        <h4 className="text-xs font-semibold mb-1 text-foreground flex items-center"><TagsIcon className="mr-1 h-3.5 w-3.5 text-primary"/> Tags:</h4>
                        <div className="flex flex-wrap gap-1">
                        {politician.tags.map((tag, index) => tag && tag.name ? (
                            <Link key={tag.id || `tag-${index}`} href={`/politicians?tag=${encodeURIComponent(tag.name)}`} prefetch={true}>
                            <Badge variant="secondary" className="text-xs hover:bg-accent/20 cursor-pointer">{tag.name}</Badge>
                            </Link>
                        ) : null)}
                        </div>
                    </div>
                )}
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

          <section id="overview" className="space-y-6 scroll-mt-40">
            {highestConvictedSeverity && (
              <Alert variant="destructive" className="shadow-md">
                <ShieldAlert className="h-5 w-5" />
                <AlertTitle>Significant Criminal Record Noted</AlertTitle>
                <AlertDescription>
                  This politician has a "{highestConvictedSeverity}" severity criminal record that is marked as "Convicted". Please see the "Criminal Record" tab for more details.
                </AlertDescription>
              </Alert>
            )}
            <Card className="shadow-md">
              <CardHeader><CardTitle className="flex items-center"><UserIcon className="mr-2 h-5 w-5 text-primary"/>Biography</CardTitle></CardHeader>
              <CardContent><MarkdownRenderer content={politician.bio || "No biography available."} className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed"/></CardContent>
            </Card>
            <Card className="shadow-md">
              <CardHeader><CardTitle className="flex items-center"><GraduationCap className="mr-2 h-5 w-5 text-primary"/>Education</CardTitle></CardHeader>
              <CardContent><MarkdownRenderer content={politician.education || "No education details available."} className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed"/></CardContent>
            </Card>
            {politician.politicalCareer && politician.politicalCareer.length > 0 && (
                <Card className="shadow-md">
                    <CardHeader><CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary"/>Political Career</CardTitle></CardHeader>
                    <CardContent>
                    <ul className="space-y-3">
                        {politician.politicalCareer.map((entry) => (
                        <li key={entry.id} className="text-sm border-b border-border/70 pb-2">
                            <strong className="font-semibold text-foreground">{entry.year}:</strong> <span className="text-muted-foreground">{entry.role}</span>
                        </li>
                        ))}
                    </ul>
                    </CardContent>
                </Card>
            )}
            <Card className="shadow-md">
              <CardHeader>
                  <CardTitle className="flex items-center"><BarChart2 className="mr-2 h-5 w-5 text-primary"/>Rating & Engagement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg bg-muted/30"><div className="space-y-1"><div className="flex items-center gap-2 text-xl font-semibold text-foreground"><Star className="h-6 w-6 text-yellow-500" /><span>{politician.rating?.toFixed(1) || 'N/A'} / 5.0</span></div><p className="text-xs text-muted-foreground">Overall Rating</p></div><div className="space-y-1 text-center sm:text-right"><div className="flex items-center justify-center sm:justify-end gap-2 text-xl font-semibold text-foreground"><span>{approvalRating}</span></div><p className="text-xs text-muted-foreground">Approval Rating</p></div><div className="space-y-1 text-center sm:text-right"><p className="text-sm font-medium text-foreground">{(politician.upvotes || 0)} Upvotes / {(politician.downvotes || 0)} Downvotes</p><p className="text-xs text-muted-foreground">Based on user votes</p></div></div>
                <TooltipProvider><div className="flex flex-col sm:flex-row gap-2"><Tooltip><TooltipTrigger asChild><Button variant="outline" className={cn("flex-1", userVoteOnPolitician === 'up' && 'bg-green-100 border-green-400 text-green-700 hover:bg-green-200 dark:bg-green-800/30 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-700/40')} onClick={() => handleVote('up')} disabled={!isAuthenticated || isLoadingAuth}><ThumbsUp className="mr-1.5 h-4 w-4" /> Upvote</Button></TooltipTrigger><TooltipContent><p>{getVoteTooltip('up')}</p></TooltipContent></Tooltip><Tooltip><TooltipTrigger asChild><Button variant="outline" className={cn("flex-1", userVoteOnPolitician === 'down' && 'bg-red-100 border-red-400 text-red-700 hover:bg-red-200 dark:bg-red-800/30 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-700/40')} onClick={() => handleVote('down')} disabled={!isAuthenticated || isLoadingAuth}><ThumbsDown className="mr-1.5 h-4 w-4" /> Downvote</Button></TooltipTrigger><TooltipContent><p>{getVoteTooltip('down')}</p></TooltipContent></Tooltip></div></TooltipProvider>
                <p className="text-xs text-muted-foreground pt-2"><Info className="inline h-3.5 w-3.5 mr-1"/>The Overall Rating is influenced by user votes, promise fulfillment, and other factors.</p>
              </CardContent>
            </Card>
          </section>

          <section id="assets" className="space-y-6 scroll-mt-40">
            <Card className="shadow-md">
              <CardHeader><CardTitle className="flex items-center"><Landmark className="mr-2 h-5 w-5 text-primary"/>Asset Declarations ({politician.assetDeclarations?.length || 0})</CardTitle></CardHeader>
              <CardContent>
                {(politician.assetDeclarations && politician.assetDeclarations.length > 0) ? (
                  <div className="space-y-4">
                    {politician.assetDeclarations.map((asset, index) => (
                      <Card key={asset.id || index} className="p-4 bg-muted/30">
                        <MarkdownRenderer content={asset.summary} className="prose dark:prose-invert max-w-none text-sm text-muted-foreground"/>
                        {asset.declarationDate && <p className="text-xs text-muted-foreground mt-1">Declared: {formatDate(asset.declarationDate)}</p>}
                        {asset.sourceUrls && asset.sourceUrls.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-foreground mb-1">Sources:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {asset.sourceUrls.map((source, idx) => (
                                <li key={source.id || idx} className="text-xs">
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
                  </div>
                ) : <p className="text-muted-foreground">No asset declarations available.</p>}
              </CardContent>
            </Card>
          </section>

          <section id="criminal-record" className="space-y-6 scroll-mt-40">
            <Card className="shadow-md">
              <CardHeader><CardTitle className="flex items-center"><ShieldAlert className="mr-2 h-5 w-5 text-primary"/>Criminal Record ({politician.criminalRecordEntries?.length || 0})</CardTitle></CardHeader>
              <CardContent>
                {(politician.criminalRecordEntries && politician.criminalRecordEntries.length > 0) ? (
                  <div className="space-y-4">
                    {politician.criminalRecordEntries.map((entry, idx) => (
                      <Card key={entry.id || idx} className="p-4 bg-muted/30 rounded-lg shadow-sm">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                            <p><strong className="text-foreground">Severity:</strong> <Badge variant={entry.severity === "Significant/Severe" ? "destructive" : entry.severity === "Moderate" ? "default" : "outline"} className={cn(entry.severity === "Moderate" && "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-400")}>{entry.severity}</Badge></p>
                            <p><strong className="text-foreground">Status:</strong> <Badge variant="outline">{entry.status}</Badge></p>
                            <p className="sm:col-span-2"><strong className="text-foreground">Offense Type:</strong> <Badge variant="outline">{entry.offenseType}</Badge></p>
                          </div>
                          <div className="mt-2 text-sm">
                            <strong className="text-foreground">Description:</strong>
                            <MarkdownRenderer content={entry.description} className="inline prose dark:prose-invert text-sm text-muted-foreground"/>
                          </div>
                          {entry.caseDate && <p className="text-xs text-muted-foreground mt-1">Case Date: {formatDate(entry.caseDate)}</p>}
                          {entry.sourceUrls && entry.sourceUrls.length > 0 && (
                            <div className="mt-2">
                            <p className="text-xs font-medium text-foreground mb-1">Sources:</p>
                            <ul className="list-disc list-inside space-y-1">
                                {entry.sourceUrls.map((source, sIdx) => (
                                <li key={source.id || sIdx} className="text-xs">
                                    <Link href={source.value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    {source.description || `Source ${sIdx + 1}`} <ExternalLink className="inline h-3 w-3"/>
                                    </Link>
                                </li>
                                ))}
                            </ul>
                            </div>
                          )}
                      </Card>
                    ))}
                  </div>
                ) : <p className="text-muted-foreground">No criminal record entries available.</p>}
              </CardContent>
            </Card>
          </section>

          <section id="contact" className="space-y-6 scroll-mt-40">
            <Card className="shadow-md">
              <CardHeader><CardTitle className="flex items-center"><Mail className="mr-2 h-5 w-5 text-primary"/>Contact Information</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-muted-foreground">
                {politician.contactEmail && <p><strong className="text-foreground">Email:</strong> <a href={`mailto:${politician.contactEmail}`} className="text-primary hover:underline">{politician.contactEmail}</a></p>}
                {politician.contactPhone && <p><strong className="text-foreground">Phone:</strong> {politician.contactPhone}</p>}
                {politician.socialMediaLinks && politician.socialMediaLinks.length > 0 && (
                  <div>
                    <strong className="text-foreground">Social Media:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      {politician.socialMediaLinks.map(link => (
                        <li key={link.id}><span className="font-medium text-foreground/80">{link.platform}:</span> <Link href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{link.url}</Link></li>
                      ))}
                    </ul>
                  </div>
                )}
                {!politician.contactEmail && !politician.contactPhone && (!politician.socialMediaLinks || politician.socialMediaLinks.length === 0) && <p>No contact information available.</p>}
              </CardContent>
            </Card>
          </section>

          <section id="promises" className="space-y-6 scroll-mt-40">
            <Card className="shadow-md">
              <CardHeader><CardTitle className="flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary"/>Promises ({politicianPromises.length})</CardTitle></CardHeader>
              <CardContent>
                {politicianPromises.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {politicianPromises.slice(0, displayedPromisesCount).map(promise => <PromiseCard key={promise.id} promise={promise} />)}
                    </div>
                    {politicianPromises.length > INITIAL_ITEMS_TO_DISPLAY && (
                      <div className="mt-6 text-center">
                        {displayedPromisesCount < politicianPromises.length ? (
                          <Button variant="outline" onClick={() => setDisplayedPromisesCount(politicianPromises.length)}>
                            <ChevronDown className="mr-2 h-4 w-4" /> Show All {politicianPromises.length} Promises
                          </Button>
                        ) : (
                          <Button variant="outline" onClick={() => setDisplayedPromisesCount(INITIAL_ITEMS_TO_DISPLAY)}>
                            <ChevronUp className="mr-2 h-4 w-4" /> Show Fewer Promises
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                ) : <p className="text-muted-foreground">No promises found for this politician.</p>}
              </CardContent>
            </Card>
          </section>

          <section id="bills" className="space-y-6 scroll-mt-40">
            <Card className="shadow-md">
              <CardHeader>
                  <CardTitle className="flex items-center"><BillIconLucide className="mr-2 h-5 w-5 text-primary" />Bills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {directlySponsoredBills.length > 0 && (
                  <section>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Directly Sponsored Bills ({directlySponsoredBills.length})</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {directlySponsoredBills.slice(0, displayedDirectBillsCount).map(bill => ( <BillCard key={bill.id} bill={bill} onTagClick={(tag: string) => router.push(`/bills?tag=${encodeURIComponent(tag)}`)}/> ))}
                    </div>
                    {directlySponsoredBills.length > INITIAL_ITEMS_TO_DISPLAY && (
                      <div className="mt-6 text-center">
                        {displayedDirectBillsCount < directlySponsoredBills.length ? (
                          <Button variant="outline" onClick={() => setDisplayedDirectBillsCount(directlySponsoredBills.length)}>
                            <ChevronDown className="mr-2 h-4 w-4" /> Show All {directlySponsoredBills.length} Direct Bills
                          </Button>
                        ) : (
                          <Button variant="outline" onClick={() => setDisplayedDirectBillsCount(INITIAL_ITEMS_TO_DISPLAY)}>
                            <ChevronUp className="mr-2 h-4 w-4" /> Show Fewer Direct Bills
                          </Button>
                        )}
                      </div>
                    )}
                  </section>
                )}
                {partySponsoredBills.length > 0 && (
                  <section className={directlySponsoredBills.length > 0 ? "mt-6 pt-6 border-t" : ""}>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Bills Sponsored by {politician.partyName || 'their Party'} ({partySponsoredBills.length})</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {partySponsoredBills.slice(0, displayedPartyBillsCount).map(bill => ( <BillCard key={bill.id} bill={bill} onTagClick={(tag: string) => router.push(`/bills?tag=${encodeURIComponent(tag)}`)}/> ))}
                    </div>
                    {partySponsoredBills.length > INITIAL_ITEMS_TO_DISPLAY && (
                       <div className="mt-6 text-center">
                        {displayedPartyBillsCount < partySponsoredBills.length ? (
                          <Button variant="outline" onClick={() => setDisplayedPartyBillsCount(partySponsoredBills.length)}>
                            <ChevronDown className="mr-2 h-4 w-4" /> Show All {partySponsoredBills.length} Party Bills
                          </Button>
                        ) : (
                          <Button variant="outline" onClick={() => setDisplayedPartyBillsCount(INITIAL_ITEMS_TO_DISPLAY)}>
                            <ChevronUp className="mr-2 h-4 w-4" /> Show Fewer Party Bills
                          </Button>
                        )}
                      </div>
                    )}
                  </section>
                )}
                {directlySponsoredBills.length === 0 && partySponsoredBills.length === 0 && (<p className="text-muted-foreground">No bills associated with this politician found.</p>)}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </Container>
  );
}
