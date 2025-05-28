'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { placeholderPoliticians, placeholderPromises, placeholderNewsArticles } from '@/lib/placeholder-data';
import type { Politician, PromiseEntity, NewsArticle, EntityHistoryEvent } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, Edit3, History, Rss, Users, MapPin, GraduationCap, Briefcase, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from 'react';

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

function MiniNewsCard({ article }: { article: NewsArticle }) {
 return (
    <Link href={article.url} target="_blank" rel="noopener noreferrer" passHref>
      <Card className="hover:bg-muted/50 transition-colors">
        <CardContent className="p-3">
          <p className="text-sm font-medium text-primary group-hover:underline">{article.title}</p>
          <p className="text-xs text-muted-foreground">{article.source} - {new Date(article.publishedDate).toLocaleDateString()}</p>
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


export default function PoliticianDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const politician = placeholderPoliticians.find(p => p.id === id);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(politician?.followersCount || 0);

   // Avoid hydration mismatch for Math.random based initial state
  useEffect(() => {
    if (politician) {
        // In a real app, fetch initial follow status from backend
        setIsFollowing(Math.random() > 0.5); 
        setFollowersCount(politician.followersCount || 0);
    }
  }, [politician]);


  if (!politician) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-muted-foreground">Politician not found.</p>
        <Button onClick={() => router.back()} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  const relatedPromises = placeholderPromises.filter(p => p.politicianId === id);
  const relatedNews = placeholderNewsArticles.filter(
    article => article.summary?.toLowerCase().includes(politician.name.toLowerCase()) || article.title?.toLowerCase().includes(politician.name.toLowerCase())
  ).slice(0,3); // Show few related news

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
    setFollowersCount(prev => isFollowing ? prev -1 : prev + 1);
    toast({
      title: isFollowing ? `Unfollowed ${politician.name}` : `Followed ${politician.name}`,
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
        {politician.imageUrl && (
          <div className="relative w-full h-48 sm:h-64 bg-muted">
            <Image 
                src={politician.imageUrl} 
                alt={politician.name} 
                layout="fill" 
                objectFit="cover" 
                className="object-top"
                data-ai-hint={politician.dataAiHint || "politician banner"}
            />
          </div>
        )}
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">{politician.name}</CardTitle>
              {politician.partyName && (
                <CardDescription className="text-md text-accent">
                  <Link href={`/parties/${placeholderParties.find(p=>p.name === politician.partyName)?.id || '#'}`} className="hover:underline flex items-center gap-1">
                    <Users className="h-4 w-4"/>{politician.partyName}
                  </Link>
                </CardDescription>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <Button variant={isFollowing ? "secondary" : "default"} onClick={handleFollowToggle} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Heart className={`mr-2 h-4 w-4 ${isFollowing ? 'fill-white' : ''}`} />
                {isFollowing ? 'Following' : 'Follow'} ({followersCount.toLocaleString()})
              </Button>
              <Link href={`/contribute?entityType=politician&entityId=${politician.id}`} passHref>
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
              <h2 className="text-xl font-semibold mb-2 text-foreground/90">About</h2>
              <p className="text-foreground/80 leading-relaxed">{politician.description}</p>
            </section>
            
            <Separator />

            <section className="space-y-3">
                 <h3 className="text-lg font-semibold text-foreground/90">Details</h3>
                {politician.constituency && (
                    <p className="text-sm flex items-center"><MapPin className="h-4 w-4 mr-2 text-muted-foreground"/> <strong>Constituency:</strong> &nbsp;{politician.constituency}</p>
                )}
                {politician.dateOfBirth && (
                    <p className="text-sm flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-muted-foreground"/> <strong>Born:</strong> &nbsp;{new Date(politician.dateOfBirth).toLocaleDateString()}</p>
                )}
                {politician.education && (
                    <p className="text-sm flex items-center"><GraduationCap className="h-4 w-4 mr-2 text-muted-foreground"/> <strong>Education:</strong> &nbsp;{politician.education}</p>
                )}
                 {politician.politicalCareer && politician.politicalCareer.length > 0 && (
                    <div className="text-sm">
                        <p className="flex items-center"><Briefcase className="h-4 w-4 mr-2 text-muted-foreground"/> <strong>Career:</strong></p>
                        <ul className="list-disc list-inside pl-6 space-y-1 mt-1">
                            {politician.politicalCareer.map(role => <li key={role.position}>{role.position} ({role.period})</li>)}
                        </ul>
                    </div>
                )}
            </section>

            {politician.tags && politician.tags.length > 0 && (
              <section>
                 <h3 className="text-lg font-semibold mb-1 text-foreground/90">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {politician.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6 md:col-span-1">
            {relatedPromises.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-md flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-accent"/> Promises</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-60 overflow-y-auto">
                  {relatedPromises.map(promise => <MiniPromiseCard key={promise.id} promise={promise} />)}
                </CardContent>
              </Card>
            )}

            {relatedNews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-md flex items-center gap-2"><Rss className="h-5 w-5 text-accent"/> Related News</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-60 overflow-y-auto">
                  {relatedNews.map(news => <MiniNewsCard key={news.id} article={news} />)}
                </CardContent>
              </Card>
            )}
             {politician.history && politician.history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-md flex items-center gap-2"><History className="h-5 w-5 text-accent"/> Version History</CardTitle>
                </CardHeader>
                <CardContent className="max-h-60 overflow-y-auto">
                  <ul className="text-xs text-muted-foreground">
                    {politician.history.map(event => <HistoryItem key={event.id} event={event} />)}
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
