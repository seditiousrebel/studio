'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { placeholderBills, placeholderPromises, placeholderNewsArticles } from '@/lib/placeholder-data';
import type { Bill, PromiseEntity, NewsArticle, EntityHistoryEvent } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, Edit3, FileText, User, CalendarDays, CheckSquare, Link2, ClipboardCheck, Rss, History } from 'lucide-react';
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

function HistoryItem({ event }: { event: EntityHistoryEvent }) {
  return (
    <li className="py-2 px-1 border-b border-dashed border-border/50 last:border-b-0">
      <p className="text-xs text-foreground">
        {new Date(event.timestamp).toLocaleString()}: <span className="font-medium">{event.changes}</span> (by {event.editor})
      </p>
    </li>
  );
}


export default function BillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const bill = placeholderBills.find(b => b.id === id);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(bill?.followersCount || 0);

  useEffect(() => {
    if (bill) {
        setIsFollowing(Math.random() > 0.5); 
        setFollowersCount(bill.followersCount || 0);
    }
  }, [bill]);

  if (!bill) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-muted-foreground">Bill not found.</p>
        <Button onClick={() => router.back()} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  const relatedPromises = placeholderPromises.filter(p => bill.relatedPromises?.includes(p.id));
   const relatedNews = placeholderNewsArticles.filter(
    article => article.summary?.toLowerCase().includes(bill.name.toLowerCase()) || article.title?.toLowerCase().includes(bill.name.toLowerCase())
  ).slice(0,3);


  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
    setFollowersCount(prev => isFollowing ? prev -1 : prev + 1);
    toast({
      title: isFollowing ? `Unfollowed ${bill.name}` : `Followed ${bill.name}`,
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
                <FileText className="h-7 w-7"/>{bill.name}
              </CardTitle>
              <CardDescription className="text-md text-accent">
                Status: <Badge variant={bill.status === 'Passed' ? 'default' : 'secondary'} className={bill.status === 'Passed' ? 'bg-green-600 text-white' : bill.status === 'Rejected' ? 'bg-red-600 text-white' : ''}>{bill.status}</Badge>
              </CardDescription>
            </div>
            <div className="flex gap-2 items-center">
              <Button variant={isFollowing ? "secondary" : "default"} onClick={handleFollowToggle} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Heart className={`mr-2 h-4 w-4 ${isFollowing ? 'fill-white' : ''}`} />
                {isFollowing ? 'Following' : 'Follow'} ({followersCount.toLocaleString()})
              </Button>
               <Link href={`/contribute?entityType=bill&entityId=${bill.id}`} passHref>
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
              <h2 className="text-xl font-semibold mb-2 text-foreground/90">Summary</h2>
              <p className="text-foreground/80 leading-relaxed">{bill.summary || bill.description}</p>
            </section>
            
            <Separator/>

            <section className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground/90">Details</h3>
                {bill.proposedBy && (
                    <p className="text-sm flex items-center"><User className="h-4 w-4 mr-2 text-muted-foreground"/> <strong>Proposed By:</strong> &nbsp;{bill.proposedBy}</p>
                )}
                {bill.proposedDate && (
                    <p className="text-sm flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-muted-foreground"/> <strong>Proposed Date:</strong> &nbsp;{new Date(bill.proposedDate).toLocaleDateString()}</p>
                )}
                {bill.status === 'Passed' && bill.passedDate && (
                    <p className="text-sm flex items-center"><CheckSquare className="h-4 w-4 mr-2 text-green-600"/> <strong>Passed Date:</strong> &nbsp;{new Date(bill.passedDate).toLocaleDateString()}</p>
                )}
                 {bill.fullTextUrl && (
                    <p className="text-sm flex items-center"><Link2 className="h-4 w-4 mr-2 text-muted-foreground"/> <strong>Full Text:</strong> &nbsp;
                        <Link href={bill.fullTextUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                            View Official Document
                        </Link>
                    </p>
                )}
            </section>

            {bill.tags && bill.tags.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-1 text-foreground/90">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {bill.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6 md:col-span-1">
             {relatedPromises.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-md flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-accent"/> Related Promises</CardTitle>
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
            {bill.history && bill.history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-md flex items-center gap-2"><History className="h-5 w-5 text-accent"/> Version History</CardTitle>
                </CardHeader>
                <CardContent className="max-h-60 overflow-y-auto">
                  <ul className="text-xs text-muted-foreground">
                    {bill.history.map(event => <HistoryItem key={event.id} event={event} />)}
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
