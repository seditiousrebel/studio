
import type { NewsArticle } from '@/types';
import { generateId } from '@/lib/utils';
import Parser from 'rss-parser';

export const RSS_FEED_URLS = [
  { name: "Telegraph Nepal", url: "https://www.telegraphnepal.com/feed/" },
  { name: "English Ratopati", url: "https://english.ratopati.com/rss/" },
  { name: "OnlineKhabar English", url: "https://english.onlinekhabar.com/feed/" },
];

export const MAX_ARTICLES_PER_FEED = 10;
export const MAX_ARTICLES_TOTAL = 30;

// Define CustomFeedItem to help rss-parser with media tags
export type CustomFeedItem = Parser.Item & {
    'media:thumbnail'?: { $: { url: string } };
    'media:content'?: { $: { url: string, medium?: string } };
};

export async function getNewsArticles(): Promise<{ articles: NewsArticle[]; error?: string; partialError?: string }> {
  let allArticles: NewsArticle[] = [];
  let fetchErrors: string[] = [];

  const parser = new Parser<any, CustomFeedItem>({
    customFields: {
      item: [['media:thumbnail', 'mediaThumbnail', { keepArray: false }]]
    }
  });

  const feedPromises = RSS_FEED_URLS.map(async (feedSource) => {
    try {
      console.log(`Fetching news from: ${feedSource.name} (${feedSource.url})`);
      const feed = await parser.parseURL(feedSource.url);
      let itemCount = 0;
      const parsedArticles: NewsArticle[] = [];

      if (feed.items) {
        for (const item of feed.items) {
          if (itemCount >= MAX_ARTICLES_PER_FEED) break;

          let summary = (item.contentSnippet || item.content || item.description || 'No summary available.').replace(/<[^>]+>/g, '').substring(0, 200) + '...';
          
          let imageUrl: string | undefined = undefined;
          if (item.enclosure?.url && item.enclosure.type?.startsWith('image')) {
            imageUrl = item.enclosure.url;
          } else if (item.mediaThumbnail?.url) { // From customFields
            imageUrl = item.mediaThumbnail.url;
          } else if (item['media:content']?.$?.url && item['media:content']?.$?.medium === 'image') {
            imageUrl = item['media:content'].$.url;
          } else if (item.content) { // Fallback regex for img in content
            const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch && imgMatch[1]) {
              imageUrl = imgMatch[1];
            }
          }


          const article: NewsArticle = {
            id: item.guid || item.link || generateId(),
            title: item.title || 'Untitled Article',
            link: item.link || `urn:uuid:${generateId()}`, // Ensure link is always present
            source: feedSource.name,
            pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            summary: summary,
            category: Array.isArray(item.categories) && item.categories.length > 0 ? item.categories[0] : 'General',
            tags: Array.isArray(item.categories) ? item.categories.map(c => typeof c === 'string' ? c : (c._ || 'Unknown Tag')) : undefined,
            // imageUrl: imageUrl, // Removed as per user request
          };
          parsedArticles.push(article);
          itemCount++;
        }
      }
      console.log(`Fetched ${parsedArticles.length} articles from ${feedSource.name}`);
      return parsedArticles;
    } catch (error) {
      console.error(`Error fetching or parsing RSS feed from ${feedSource.name} (${feedSource.url}):`, error);
      let errorMessage = `An unknown error occurred with ${feedSource.name}.`;
      if (error instanceof Error) {
        // Check for common redirect-related messages or call stack issues
        if (error.message.toLowerCase().includes("redirect") || 
            error.message.toLowerCase().includes("maximum call stack size exceeded") ||
            error.message.toLowerCase().includes("too many redirects")) {
          errorMessage = `${feedSource.name}: Possible redirect loop or too many redirects. Details: ${error.message.substring(0, 200)}`;
        } else {
          errorMessage = `${feedSource.name}: ${error.message.substring(0, 200)}`;
        }
      }
      fetchErrors.push(errorMessage);
      return [];
    }
  });

  const results = await Promise.allSettled(feedPromises);

  results.forEach(result => {
    if (result.status === 'fulfilled' && result.value) {
      allArticles.push(...result.value);
    }
  });

  allArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  allArticles = allArticles.slice(0, MAX_ARTICLES_TOTAL);

  console.log(`Total articles after aggregation and slicing: ${allArticles.length}`);

  const currentPartialError = fetchErrors.length > 0 && fetchErrors.length < RSS_FEED_URLS.length ? `Some news sources failed to load: ${fetchErrors.join("; ")}` : undefined;
  const currentFullError = allArticles.length === 0 && fetchErrors.length === RSS_FEED_URLS.length ? `Failed to fetch news from all sources. ${fetchErrors.join("; ")}` : undefined;
  
  if (currentFullError) return { articles: [], error: currentFullError };
  if (currentPartialError && allArticles.length === 0) return { articles: [], error: currentPartialError }; // If partial error led to 0 articles, treat as error
  
  return { articles: allArticles, partialError: currentPartialError };
}
