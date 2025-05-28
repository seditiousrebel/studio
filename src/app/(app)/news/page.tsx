import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { placeholderNewsArticles } from '@/lib/placeholder-data';
import type { NewsArticle } from '@/lib/types';
import { ExternalLink } from 'lucide-react';

function NewsArticleCard({ article }: { article: NewsArticle }) {
  return (
    <Card id={article.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      {article.imageUrl && (
        <div className="relative w-full h-48 rounded-t-lg overflow-hidden">
          <Image 
            src={article.imageUrl} 
            alt={article.title} 
            layout="fill" 
            objectFit="cover"
            data-ai-hint={article.dataAiHint || 'news image'}
          />
        </div>
      )}
      <CardHeader className="flex-grow">
        <CardTitle className="text-lg md:text-xl mb-1">{article.title}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {article.source} - {new Date(article.publishedDate).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/80 line-clamp-3 mb-4">{article.summary}</p>
        <Button asChild variant="outline" size="sm" className="w-full group">
          <Link href={article.url} target="_blank" rel="noopener noreferrer">
            Read Full Article <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function NewsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-primary">News Hub</h1>
      <p className="text-muted-foreground">
        Aggregated news from curated Nepali sources.
      </p>
      
      {placeholderNewsArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {placeholderNewsArticles.map(article => (
            <NewsArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No news articles available at the moment.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
