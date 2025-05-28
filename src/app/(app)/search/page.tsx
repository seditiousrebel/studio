'use client';

import { useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search as SearchIcon, Filter, Users, User, FileText, ClipboardCheck, Newspaper } from 'lucide-react';
import { placeholderPoliticians, placeholderParties, placeholderBills, placeholderPromises, placeholderNewsArticles } from '@/lib/placeholder-data';
import type { Politician, Party, Bill, PromiseEntity, NewsArticle } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';

type SearchResultItem = (Politician | Party | Bill | PromiseEntity | NewsArticle) & { entityType: string };

const allData: SearchResultItem[] = [
  ...placeholderPoliticians.map(p => ({ ...p, entityType: 'Politician' })),
  ...placeholderParties.map(p => ({ ...p, entityType: 'Party' })),
  ...placeholderBills.map(p => ({ ...p, entityType: 'Bill' })),
  ...placeholderPromises.map(p => ({ ...p, entityType: 'Promise' })),
  ...placeholderNewsArticles.map(n => ({ ...n, name: n.title, entityType: 'News' })),
];


function ResultItemCard({ item }: { item: SearchResultItem }) {
  let linkUrl = '#';
  let icon = Newspaper;
  switch (item.entityType) {
    case 'Politician':
      linkUrl = `/politicians/${item.id}`;
      icon = User;
      break;
    case 'Party':
      linkUrl = `/parties/${item.id}`;
      icon = Users;
      break;
    case 'Bill':
      linkUrl = `/bills/${item.id}`;
      icon = FileText;
      break;
    case 'Promise':
      linkUrl = `/promises/${item.id}`;
      icon = ClipboardCheck;
      break;
    case 'News':
      linkUrl = `/news#${item.id}`; // Or a dedicated news detail page if exists
      icon = Newspaper;
      break;
  }
  const IconComponent = icon;

  return (
    <Link href={linkUrl} passHref>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
          {item.imageUrl && (
            <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0">
              <Image 
                src={item.imageUrl} 
                alt={item.name || ''} 
                layout="fill" 
                objectFit="cover"
                data-ai-hint={(item as Politician).dataAiHint || (item as NewsArticle).dataAiHint || 'icon image'}
              />
            </div>
          )}
          {!item.imageUrl && (
            <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center shrink-0">
              <IconComponent className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex-grow">
            <CardTitle className="text-base mb-1">{item.name}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">{item.entityType}</CardDescription>
            <p className="text-xs text-foreground/80 line-clamp-2 mt-1">{item.description || (item as NewsArticle).summary}</p>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}


export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearched(true);
    if (!searchTerm.trim() && entityTypeFilter === 'all') {
      setResults([]);
      return;
    }

    const filteredData = allData.filter(item => {
      const nameMatch = item.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const descriptionMatch = item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const typeMatch = entityTypeFilter === 'all' || item.entityType.toLowerCase() === entityTypeFilter;
      return (nameMatch || descriptionMatch) && typeMatch;
    });
    setResults(filteredData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Search NetaVerse</h1>
        <Filter className="h-6 w-6 text-muted-foreground" />
      </div>
      
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="search"
            placeholder="Search politicians, parties, bills, promises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
            aria-label="Search term"
          />
          <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filter by entity type">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="politician">Politicians</SelectItem>
              <SelectItem value="party">Parties</SelectItem>
              <SelectItem value="bill">Bills</SelectItem>
              <SelectItem value="promise">Promises</SelectItem>
              <SelectItem value="news">News</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
          <SearchIcon className="mr-2 h-4 w-4" /> Search
        </Button>
      </form>

      {searched && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">
            {results.length} {results.length === 1 ? 'result' : 'results'} found
          </h2>
          {results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((item) => (
                <ResultItemCard key={`${item.entityType}-${item.id}`} item={item} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No results found for your criteria. Try broadening your search.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
       {!searched && (
         <Card className="mt-6">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Enter a search term or select a filter to begin.</p>
            </CardContent>
          </Card>
       )}
    </div>
  );
}
