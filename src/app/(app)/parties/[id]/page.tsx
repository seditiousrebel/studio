'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { placeholderParties, placeholderPoliticians, placeholderPromises, placeholderNewsArticles } from '@/lib/placeholder-data';
import type { Party, Politician, PromiseEntity, NewsArticle, EntityHistoryEvent } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, Edit3, Users, User, Flag, CalendarDays, MapPin, ClipboardCheck, Rss, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from 'react';

function MiniPoliticianCard({ politician }: { politician: Politician }) {
  return (
    <Link href={`/politicians/${politician.id}`} passHref>
      <Card className="hover:bg-muted/50 transition-colors">
        <CardContent className="p-3 flex items-center gap-2">
          {politician.imageUrl && <Image src={politician.imageUrl} alt={politician.name} width={32} height={32} className="rounded-full" data-ai-hint={politician.dataAiHint || 'avatar'} />}
          {!politician.imageUrl && <User className="h-6 w-6 text-muted-foreground"/>}
          <div>
            <p className="text-sm font-medium text-primary group-hover:underline">{politician.name}</p>
            <p className="text-xs text-muted-foreground">{politician.constituency || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function MiniPromiseCard({ promise }: { promise: PromiseEntity }) {
  return (
    <Link href={`/promises/${promise.id}`} passHref>
      <Card className="hover:bg-muted/50 transition-colors">
        <CardContent className="p-3">
          <p className="text-sm font-medium text-primary group-hover:underline">{promise.name}</p>
          <p className="text-xs text-muted-foreground">Status: {promise.status}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function HistoryItem({ event }: { event: EntityHistoryEvent }) {
  return (
    <li className="py-2 px-1 border-b border-dashed border-border/50 last:border-b-0">
      <p className="text-xs text-foreground">
        {new Date(event.timestamp).toLocaleString()}: <span className="font-medium">{event.changes}</span> (by {event.editor})
      </p>
    </li>
  );
}


export default function PartyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const party = placeholderParties.find(p => p.id === id);
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(party?.followersCount || 0);

  useEffect(() => {
    if (party) {
        setIsFollowing(Math.random() > 0.5); 
        setFollowersCount(party.followersCount || 0);
    }
  }, [party]);


  if (!party) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-muted-foreground">Party not found.</p>
        <Button onClick={() => router.back()} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  const partyMembers = placeholderPoliticians.filter(p => p.partyId === id || p.partyName === party.name); // Assuming partyId or name match
  const partyPromises = placeholderPromises.filter(p => p.partyId === id);
  const relatedNews = placeholderNewsArticles.filter(
    article => article.summary?.toLowerCase().includes(party.name.toLowerCase()) || article.title?.toLowerCase().includes(party.name.toLowerCase())
  ).slice(0,3);

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
    setFollowersCount(prev => isFollowing ? prev -1 : prev + 1);
    toast({
      title: isFollowing ? `Unfollowed ${party.name}` : `Followed ${party.name}`,
      description: isFollowing ? `You will no longer receive updates.` : `You'll now receive updates.`,
    });
    // API call to update follow status
  };

  return (
    <div className="space-y-6">
       <Button onClick={() => router.back()} variant="outline" size="sm" className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
      </Button>

      <Card className="overflow-hidden shadow-xl">
         {party.imageUrl && (
          <div className="relative w-full h-48 sm:h-64 bg-muted">
            <Image 
                src={party.imageUrl} 
                alt={party.name} 
                layout="fill" 
                objectFit="cover" 
                className="object-center"
                data-ai-hint={party.dataAiHint || "party banner"}
            />
          </div>
        )}
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
                <Users className="h-7 w-7"/>{party.name}
              </CardTitle>
              {party.ideology && <CardDescription className="text-md text-accent">{party.ideology}</CardDescription>}
            </div>
             <div className="flex gap-2 items-center">
               <Button variant={isFollowing ? "secondary" : "default"} onClick={handleFollowToggle} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Heart className={`mr-2 h-4 w-4 ${isFollowing ? 'fill-white' : ''}`} />
                {isFollowing ? 'Following' : 'Follow'} ({followersCount.toLocaleString()})
              </Button>
              <Link href={`/contribute?entityType=party&entityId=${party.id}`} passHref>
                <Button variant="outline" size="icon" aria-label="Suggest Edit">
                  <Edit3 className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-2 text-foreground/90">About Party</h2>
              <p className="text-foreground/80 leading-relaxed">{party.description}</p>
            </section>

            <Separator/>

            <section className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground/90">Details</h3>
                {party.chairperson && (
                    <p className="text-sm flex items-center"><User className="h-4 w-4 mr-2 text-muted-foreground"/> <strong>Chairperson:</strong> &nbsp;{party.chairperson}</p>
                )}
                {party.foundedDate && (
                    <p className="text-sm flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-muted-foreground"/> <strong>Founded:</strong> &nbsp;{new Date(party.foundedDate).toLocaleDateString()}</p>
                )}
                {party.memberCount && (
                    <p className="text-sm flex items-center"><Users className="h-4 w-4 mr-2 text-muted-foreground"/> <strong>Members:</strong> &nbsp;{party.memberCount.toLocaleString()}</p>
                )}
                {party.headquarters && (
                    <p className="text-sm flex items-center"><MapPin className="h-4 w-4 mr-2 text-muted-foreground"/> <strong>Headquarters:</strong> &nbsp;{party.headquarters}</p>
                )}
            </section>

            {party.tags && party.tags.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-1 text-foreground/90">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {party.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6 md:col-span-1">
            {partyMembers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-md flex items-center gap-2"><User className="h-5 w-5 text-accent"/> Key Members</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-60 overflow-y-auto">
                  {partyMembers.map(politician => <MiniPoliticianCard key={politician.id} politician={politician} />)}
                </CardContent>
              </Card>
            )}
            {partyPromises.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-md flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-accent"/> Promises</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-60 overflow-y-auto">
                  {partyPromises.map(promise => <MiniPromiseCard key={promise.id} promise={promise} />)}
                </CardContent>
              </Card>
            )}
             {relatedNews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-md flex items-center gap-2"><Rss className="h-5 w-5 text-accent"/> Related News</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-60 overflow-y-auto">
                  {relatedNews.map(news => (
                     <Link key={news.id} href={news.url} target="_blank" rel="noopener noreferrer" passHref>
                        <Card className="hover:bg-muted/50 transition-colors">
                            <CardContent className="p-3">
                            <p className="text-sm font-medium text-primary group-hover:underline">{news.title}</p>
                            <p className="text-xs text-muted-foreground">{news.source} - {new Date(news.publishedDate).toLocaleDateString()}</p>
                            </CardContent>
                        </Card>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
             {party.history && party.history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-md flex items-center gap-2"><History className="h-5 w-5 text-accent"/> Version History</CardTitle>
                </CardHeader>
                <CardContent className="max-h-60 overflow-y-auto">
                  <ul className="text-xs text-muted-foreground">
                    {party.history.map(event => <HistoryItem key={event.id} event={event} />)}
                  </ul>
                </CardContent>
              </Card>
            )}
          </aside>
        </CardContent>
      </Card>
    </div>
  );
}
