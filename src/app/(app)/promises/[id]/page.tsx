'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { placeholderPromises, placeholderPoliticians, placeholderParties, placeholderNewsArticles } from '@/lib/placeholder-data';
import type { PromiseEntity, Politician, Party, NewsArticle, EntityHistoryEvent } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, Edit3, ClipboardCheck, User, Users, CalendarDays, Link2, ListChecks, Rss, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from 'react';
import Image from 'next/image';

function HistoryItem({ event }: { event: EntityHistoryEvent }) {
  return (
    <li className="py-2 px-1 border-b border-dashed border-border/50 last:border-b-0">
      <p className="text-xs text-foreground">
        {new Date(event.timestamp).toLocaleString()}: <span className="font-medium">{event.changes}</span> (by {event.editor})
      </p>
    </li>
  );
}

export default function PromiseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const promise = placeholderPromises.find(p => p.id === id);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(promise?.followersCount || 0);

  useEffect(() => {
    if (promise) {
        setIsFollowing(Math.random() > 0.5); 
        setFollowersCount(promise.followersCount || 0);
    }
  }, [promise]);


  if (!promise) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-muted-foreground">Promise not found.</p>
        <Button onClick={() => router.back()} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  const madeByPolitician = placeholderPoliticians.find(p => p.id === promise.politicianId);
  const madeByParty = placeholderParties.find(p => p.id === promise.partyId);
  const relatedNews = placeholderNewsArticles.filter(
    article => article.summary?.toLowerCase().includes(promise.name.toLowerCase()) || article.title?.toLowerCase().includes(promise.name.toLowerCase())
  ).slice(0,3);


  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
    setFollowersCount(prev => isFollowing ? prev -1 : prev + 1);
    toast({
      title: isFollowing ? `Unfollowed "${promise.name}"` : `Followed "${promise.name}"`,
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
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
                <ClipboardCheck className="h-7 w-7"/>{promise.name}
              </CardTitle>
              <CardDescription className="text-md text-accent">
                Status: <Badge variant={promise.status === 'Fulfilled' ? 'default' : 'secondary'} className={promise.status === 'Fulfilled' ? 'bg-green-600 text-white' : promise.status === 'Broken' ? 'bg-red-600 text-white' : ''}>{promise.status}</Badge>
              </CardDescription>
            </div>
            <div className="flex gap-2 items-center">
              <Button variant={isFollowing ? "secondary" : "default"} onClick={handleFollowToggle} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Heart className={`mr-2 h-4 w-4 ${isFollowing ? 'fill-white' : ''}`} />
                {isFollowing ? 'Following' : 'Follow'} ({followersCount.toLocaleString()})
              </Button>
              <Link href={`/contribute?entityType=promise&entityId=${promise.id}`} passHref>
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
              <h2 className="text-xl font-semibold mb-2 text-foreground/90">Description</h2>
              <p className="text-foreground/80 leading-relaxed">{promise.description}</p>
            </section>
            
            <Separator/>

            <section className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground/90">Details</h3>
                {madeByPolitician && (
                    <p className="text-sm flex items-center"><User className="h-4 w-4 mr-2 text-muted-foreground"/> <strong>Promised by Politician:</strong> &nbsp;
                        <Link href={`/politicians/${madeByPolitician.id}`} className="text-accent hover:underline">{madeByPolitician.name}</Link>
                    </p>
                )}
                {madeByParty && (
                    <p className="text-sm flex items-center"><Users className="h-4 w-4 mr-2 text-muted-foreground"/> <strong>Promised by Party:</strong> &nbsp;
                        <Link href={`/parties/${madeByParty.id}`} className="text-accent hover:underline">{madeByParty.name}</Link>
                    </p>
                )}
                {promise.deadline && (
                    <p className="text-sm flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-muted-foreground"/> <strong>Deadline:</strong> &nbsp;{new Date(promise.deadline).toLocaleDateString()}</p>
                )}
                {promise.sourceUrl && (
                    <p className="text-sm flex items-center"><Link2 className="h-4 w-4 mr-2 text-muted-foreground"/> <strong>Source:</strong> &nbsp;
                        <Link href={promise.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                            View Source
                        </Link>
                    </p>
                )}
            </section>

            {promise.updates && promise.updates.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-2 text-foreground/90 flex items-center gap-2"><ListChecks className="h-5 w-5"/>Updates</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {promise.updates.map((update, index) => (
                    <div key={index} className="p-3 rounded-md border bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">{new Date(update.date).toLocaleDateString()}</p>
                      <p className="text-sm">{update.updateText}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {promise.tags && promise.tags.length > 0 && (
              <section>
                 <h3 className="text-lg font-semibold mb-1 text-foreground/90">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {promise.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
              </section>
            )}
          </div>
          
          <aside className="space-y-6 md:col-span-1">
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
             {promise.history && promise.history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-md flex items-center gap-2"><History className="h-5 w-5 text-accent"/> Version History</CardTitle>
                </CardHeader>
                <CardContent className="max-h-60 overflow-y-auto">
                  <ul className="text-xs text-muted-foreground">
                    {promise.history.map(event => <HistoryItem key={event.id} event={event} />)}
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
