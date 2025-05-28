// src/components/promises/promise-detail-client.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Container } from '@/components/shared/container';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CalendarDays, UserCircle, CheckCircle, XCircle, MessageSquarePlus, Info, TagsIcon, LinkIcon as SourceLinkIcon, Landmark, Edit, Star, XCircle as CancelIcon, ExternalLink // Added ExternalLink
} from 'lucide-react';
import type { UserPromise, EditSuggestion, Tag } from '@/types';
import { formatDate } from '@/lib/utils'; // Import formatDate
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, getPromiseStatusBadgeClass } from '@/lib/utils';
import { useAuth } from '@/components/layout/app-providers';
import { Button } from '@/components/ui/button';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";


interface PromiseDetailClientProps {
  promiseProp: UserPromise | null;
}

export function PromiseDetailClient({
  promiseProp,
}: PromiseDetailClientProps) {
  const { isAdmin, isAuthenticated, userEmail, user, session } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [promise, setPromise] = useState(promiseProp);

  useEffect(() => {
    setPromise(promiseProp);
  }, [promiseProp]);


  const handleSuggestEditClick = () => {
    if (!promise || !promise.id) return;
    const editPath = `/promises/${promise.id}/edit`; 
    
    if (!isAuthenticated) {
      router.push(`/login?redirectTo=${editPath}`);
    } else {
      router.push(editPath); 
    }
  };

  if (!promise) {
    return (
      <Container className="py-12">
        <PageHeader title="Promise Not Found" description="The requested promise could not be located." />
        <Button onClick={() => router.back()} variant="outline" className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transform transition-transform duration-200 hover:scale-[1.03]">Go Back</Button>
      </Container>
    );
  }

  const statusVisuals = getPromiseStatusBadgeClass(promise.status);

  const politicianParty = useMemo(() => {
    if (promise.politicianId && promise.partyId && promise.partyName) {
      return {
        id: promise.partyId,
        name: promise.partyName,
        logoUrl: promise.partyLogoUrl
      };
    }
    return null;
  }, [promise.politicianId, promise.partyId, promise.partyName, promise.partyLogoUrl]);


  return (
    <Container className="py-8 md:py-12">
      <>
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="outline" className={cn("py-1.5 px-3 text-sm inline-flex items-center", statusVisuals)}>
            <span className="font-semibold">{promise.status}</span>
          </Badge>
          {promise.isFeatured && (
            <Badge className="bg-primary text-primary-foreground shadow-md flex items-center gap-1 py-0.5 px-1.5 text-xs w-fit">
              <Star className="h-3.5 w-3.5" /> Featured
            </Badge>
          )}
        </div>
        <PageHeader title={promise.title} className="mb-2" />
        {promise.description && <p className="text-lg text-muted-foreground mb-8">{promise.description}</p>}
      </>

      <div className="grid md:grid-cols-3 gap-8 items-start">
        <div className="space-y-6 md:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><Info className="mr-2 h-5 w-5 text-primary" />Promise Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p><strong className="text-foreground">Category:</strong>
                <Link href={`/promises?category=${encodeURIComponent(promise.category || "")}`} prefetch={true} className="ml-1 text-primary hover:underline">
                  {promise.category || "N/A"}
                </Link>
              </p>
              {promise.deadline && (
                <p><strong className="text-foreground">Deadline:</strong> {formatDate(promise.deadline)}</p>
              )}
              {promise.dateAdded && (
                <p><strong className="text-foreground">Date Added:</strong> {formatDate(promise.dateAdded)}</p>
              )}
              {promise.sourceUrl && (
                <p className="flex items-center">
                  <strong className="text-foreground mr-1">Promise Source:</strong>
                  <Link href={promise.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">
                    View Source <SourceLinkIcon className="ml-1.5 h-4 w-4" />
                  </Link>
                </p>
              )}
              {promise.evidenceUrl && (
                <p className="flex items-center">
                  <strong className="text-foreground mr-1">Evidence:</strong>
                  <Link href={promise.evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">
                    View Evidence <ExternalLink className="ml-1.5 h-4 w-4" />
                  </Link>
                </p>
              )}
              {promise.tags && promise.tags.length > 0 && (
                <div className="pt-2">
                  <h4 className="font-semibold mb-2 text-foreground flex items-center"><TagsIcon className="mr-2 h-5 w-5 text-primary" /> Tags:</h4>
                  <div className="flex flex-wrap gap-2">
                    {promise.tags.map(tag => tag && tag.name ? (
                      <Link key={tag.id} href={`/promises?tag=${encodeURIComponent(tag.name)}`} prefetch={true}>
                        <Badge variant="secondary" className="text-sm hover:bg-accent/30 cursor-pointer">{tag.name}</Badge>
                      </Link>
                    ) : null)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
          {(promise.politicianId || promise.partyId) && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  {promise.politicianId ? <UserCircle className="mr-2 h-5 w-5 text-primary" /> : <Landmark className="mr-2 h-5 w-5 text-primary" />}
                  Promised By
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {promise.politicianId && promise.politicianName && (
                  <div className="space-y-2">
                    <div className="flex items-start space-x-3">
                       <Link href={`/politicians/${promise.politicianId}`} prefetch={true} className="shrink-0">
                        <Avatar className="h-16 w-16 border-2 border-primary hover:border-accent transition-colors">
                          {promise.politicianImageUrl ? <AvatarImage src={promise.politicianImageUrl} alt={promise.politicianName} data-ai-hint={`${promise.politicianName} photo`} /> : <AvatarFallback>{promise.politicianName.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>}
                        </Avatar>
                      </Link>
                      <div className="flex-grow">
                         <Link href={`/politicians/${promise.politicianId}`} prefetch={true}>
                          <h3 className="text-lg font-semibold hover:text-primary transition-colors">
                            {promise.politicianName}
                          </h3>
                        </Link>
                        {politicianParty && (
                          <div className="mt-1">
                            <Link href={`/parties/${politicianParty.id}`} prefetch={true} className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center group/party">
                              <Avatar className="h-5 w-5 mr-1.5 border group-hover/party:border-primary transition-colors">
                                {politicianParty.logoUrl ? <AvatarImage src={politicianParty.logoUrl} alt={politicianParty.name} data-ai-hint={`${politicianParty.name} logo small`} /> : <AvatarFallback>{politicianParty.name.charAt(0)}</AvatarFallback>}
                              </Avatar>
                              {politicianParty.name}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {!promise.politicianId && promise.partyId && promise.partyName && (
                  <Link href={`/parties/${promise.partyId}`} prefetch={true} className="flex items-center space-x-3 group">
                    <Avatar className="h-16 w-16 border-2 border-primary group-hover:border-accent transition-colors">
                      {promise.partyLogoUrl ? <AvatarImage src={promise.partyLogoUrl} alt={promise.partyName} data-ai-hint={`${promise.partyName} logo`} /> : <AvatarFallback>{promise.partyName.charAt(0)}</AvatarFallback>}
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{promise.partyName}</h3>
                      <p className="text-sm text-muted-foreground">Party Platform Promise</p>
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
