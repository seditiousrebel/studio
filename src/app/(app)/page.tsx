import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { placeholderNewsArticles, placeholderPromises, placeholderBills } from '@/lib/placeholder-data';
import type { NewsArticle, PromiseEntity, Bill } from '@/lib/types';
import { ArrowRight } from 'lucide-react';

// Combined feed item type
type FeedItem = (NewsArticle | PromiseEntity | Bill) & { itemType: 'news' | 'promise' | 'bill' };

const combinedFeed: FeedItem[] = [
  ...placeholderNewsArticles.slice(0, 2).map(item => ({ ...item, itemType: 'news' as const })),
  ...placeholderPromises.slice(0, 2).map(item => ({ ...item, itemType: 'promise' as const })),
  ...placeholderBills.slice(0, 1).map(item => ({ ...item, itemType: 'bill' as const })),
].sort(() => Math.random() - 0.5); // Randomize for demo

function FeedItemCard({ item }: { item: FeedItem }) {
  let linkUrl = '#';
  if (item.itemType === 'news') linkUrl = `/news#${item.id}`; // Or a dedicated news detail page if exists
  if (item.itemType === 'promise') linkUrl = `/promises/${item.id}`;
  if (item.itemType === 'bill') linkUrl = `/bills/${item.id}`;

  return (
    <Card className="mb-4 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        {item.imageUrl && (
          <div className="relative w-full h-48 mb-4 rounded-t-lg overflow-hidden">
            <Image 
              src={item.imageUrl} 
              alt={item.name || (item as NewsArticle).title} 
              layout="fill" 
              objectFit="cover" 
              data-ai-hint={(item as NewsArticle).dataAiHint || 'placeholder image'}
            />
          </div>
        )}
        <CardTitle className="text-lg md:text-xl">{item.name || (item as NewsArticle).title}</CardTitle>
        { (item.itemType === 'promise' || item.itemType === 'bill') && (item as (PromiseEntity | Bill)).status &&
          <CardDescription className="text-sm text-muted-foreground">
            Status: <span className="font-semibold">{ (item as (PromiseEntity | Bill)).status }</span>
          </CardDescription>
        }
         { item.itemType === 'news' && (item as NewsArticle).source &&
          <CardDescription className="text-sm text-muted-foreground">
            Source: <span className="font-semibold">{ (item as NewsArticle).source }</span>
          </CardDescription>
        }
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/80 line-clamp-3 mb-3">
          {item.description || (item as NewsArticle).summary}
        </p>
        <Link href={linkUrl} passHref>
          <Button variant="outline" size="sm" className="w-full sm:w-auto group">
            View Details <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-primary">Your Feed</h1>
      <p className="text-muted-foreground">
        Updates from politicians, parties, bills, and promises you follow, plus breaking news.
      </p>
      
      {combinedFeed.length > 0 ? (
        combinedFeed.map(item => <FeedItemCard key={`${item.itemType}-${item.id}`} item={item} />)
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Your feed is empty. Start following entities or check out the news!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
