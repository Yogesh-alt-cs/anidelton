import { Manga, MangaChapter, MangaPage, MangaSearchResult } from '@/types/manga';

const MANGADEX_API = 'https://api.mangadex.org';
const MANGADEX_UPLOADS = 'https://uploads.mangadex.org';

// Image proxy for CORS issues
const IMAGE_PROXIES = [
  'https://wsrv.nl/?url=',
  'https://images.weserv.nl/?url=',
];

// API CORS proxies for fallback
const API_CORS_PROXIES = [
  '', // Try direct first
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
];

// Cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Chapter pages cache (longer duration)
const chapterCache = new Map<string, { data: MangaPage[]; timestamp: number }>();
const CHAPTER_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Proxy image URL to avoid CORS issues
export const proxyImageUrl = (url: string): string => {
  if (!url || url === '/placeholder.svg') return '/placeholder.svg';
  
  // Already proxied
  if (url.startsWith('https://wsrv.nl') || url.startsWith('https://images.weserv.nl')) {
    return url;
  }
  
  // Use wsrv.nl as primary proxy (reliable and fast)
  return `${IMAGE_PROXIES[0]}${encodeURIComponent(url)}&w=512&q=80`;
};

// Proxy full quality image for reader
export const proxyReaderImageUrl = (url: string): string => {
  if (!url || url === '/placeholder.svg') return '/placeholder.svg';
  
  if (url.startsWith('https://wsrv.nl') || url.startsWith('https://images.weserv.nl')) {
    return url;
  }
  
  // Higher quality for reading
  return `${IMAGE_PROXIES[0]}${encodeURIComponent(url)}&q=90`;
};

const fetchWithProxy = async (url: string): Promise<any> => {
  const errors: string[] = [];
  
  for (const proxy of API_CORS_PROXIES) {
    try {
      const fetchUrl = proxy ? `${proxy}${encodeURIComponent(url)}` : url;
      const response = await fetch(fetchUrl, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        errors.push(`${proxy || 'direct'}: ${response.status}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${proxy || 'direct'}: ${message}`);
      console.log(`Proxy ${proxy || 'direct'} failed, trying next...`);
    }
  }
  
  console.error('All proxies failed:', errors);
  throw new Error('All proxies failed: ' + errors.join(', '));
};

const cachedFetch = async (url: string): Promise<any> => {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const data = await fetchWithProxy(url);
  cache.set(url, { data, timestamp: Date.now() });
  return data;
};

// Get cover art URL from relationships - with proxy
const getCoverUrl = (manga: any): string => {
  const coverRel = manga.relationships?.find((rel: any) => rel.type === 'cover_art');
  if (coverRel?.attributes?.fileName) {
    const originalUrl = `${MANGADEX_UPLOADS}/covers/${manga.id}/${coverRel.attributes.fileName}.512.jpg`;
    return proxyImageUrl(originalUrl);
  }
  return '/placeholder.svg';
};

// Get author/artist names from relationships
const getCreatorNames = (manga: any, type: 'author' | 'artist'): string[] => {
  return manga.relationships
    ?.filter((rel: any) => rel.type === type)
    ?.map((rel: any) => rel.attributes?.name || 'Unknown') || [];
};

// Get the best available title
const getBestTitle = (attributes: any): string => {
  if (attributes.title?.en) return attributes.title.en;
  if (attributes.title?.['ja-ro']) return attributes.title['ja-ro'];
  if (attributes.title?.ja) return attributes.title.ja;
  
  // Fallback to first available title
  const titles = Object.values(attributes.title || {});
  return (titles[0] as string) || 'Unknown Title';
};

// Parse manga from API response
const parseManga = (manga: any): Manga => {
  const attr = manga.attributes;
  
  return {
    id: manga.id,
    title: getBestTitle(attr),
    altTitles: attr.altTitles?.map((t: any) => Object.values(t)[0] as string).filter(Boolean) || [],
    description: attr.description?.en || attr.description?.['ja-ro'] || Object.values(attr.description || {})[0] as string || '',
    status: attr.status || 'unknown',
    releaseDate: attr.year,
    contentRating: attr.contentRating || 'safe',
    lastVolume: attr.lastVolume,
    lastChapter: attr.lastChapter,
    image: getCoverUrl(manga),
    genres: attr.tags?.filter((t: any) => t.attributes?.group === 'genre')
      .map((t: any) => t.attributes?.name?.en || '') || [],
    themes: attr.tags?.filter((t: any) => t.attributes?.group === 'theme')
      .map((t: any) => t.attributes?.name?.en || '') || [],
    authors: getCreatorNames(manga, 'author'),
    artists: getCreatorNames(manga, 'artist'),
  };
};

// Parse search result
const parseSearchResult = (manga: any): MangaSearchResult => {
  const attr = manga.attributes;
  return {
    id: manga.id,
    title: getBestTitle(attr),
    image: getCoverUrl(manga),
    status: attr.status || 'unknown',
    contentRating: attr.contentRating || 'safe',
  };
};

// Search manga
export const searchManga = async (query: string, limit = 20): Promise<MangaSearchResult[]> => {
  if (!query.trim()) return [];
  
  const url = `${MANGADEX_API}/manga?title=${encodeURIComponent(query)}&limit=${limit}&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&order[relevance]=desc`;
  
  try {
    const data = await cachedFetch(url);
    return data.data?.map(parseSearchResult) || [];
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
};

// Get popular/trending manga
export const getPopularManga = async (limit = 20): Promise<MangaSearchResult[]> => {
  const url = `${MANGADEX_API}/manga?limit=${limit}&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc`;
  
  try {
    const data = await cachedFetch(url);
    return data.data?.map(parseSearchResult) || [];
  } catch (error) {
    console.error('Failed to fetch popular manga:', error);
    return [];
  }
};

// Get recently updated manga
export const getRecentManga = async (limit = 20): Promise<MangaSearchResult[]> => {
  const url = `${MANGADEX_API}/manga?limit=${limit}&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&order[latestUploadedChapter]=desc`;
  
  try {
    const data = await cachedFetch(url);
    return data.data?.map(parseSearchResult) || [];
  } catch (error) {
    console.error('Failed to fetch recent manga:', error);
    return [];
  }
};

// Get trending manga (high rating + recently updated)
export const getTrendingManga = async (limit = 20): Promise<MangaSearchResult[]> => {
  const url = `${MANGADEX_API}/manga?limit=${limit}&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&order[rating]=desc&hasAvailableChapters=true`;
  
  try {
    const data = await cachedFetch(url);
    return data.data?.map(parseSearchResult) || [];
  } catch (error) {
    console.error('Failed to fetch trending manga:', error);
    return [];
  }
};

// Get manga by genre
export const getMangaByGenre = async (genre: string, limit = 20): Promise<MangaSearchResult[]> => {
  // First get the tag ID for the genre
  const tagsUrl = `${MANGADEX_API}/manga/tag`;
  
  try {
    const tagsData = await cachedFetch(tagsUrl);
    
    const tag = tagsData.data?.find((t: any) => 
      t.attributes?.name?.en?.toLowerCase() === genre.toLowerCase()
    );
    
    if (!tag) {
      console.warn(`Genre "${genre}" not found`);
      return [];
    }
    
    const url = `${MANGADEX_API}/manga?limit=${limit}&includes[]=cover_art&includedTags[]=${tag.id}&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc`;
    
    const data = await cachedFetch(url);
    return data.data?.map(parseSearchResult) || [];
  } catch (error) {
    console.error('Failed to fetch manga by genre:', error);
    return [];
  }
};

// Get manga details
export const getMangaDetails = async (id: string): Promise<Manga | null> => {
  const url = `${MANGADEX_API}/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist`;
  
  try {
    const data = await cachedFetch(url);
    return data.data ? parseManga(data.data) : null;
  } catch (error) {
    console.error('Failed to fetch manga details:', error);
    return null;
  }
};

// Get manga chapters with better sorting and deduplication
export const getMangaChapters = async (mangaId: string, limit = 500, offset = 0): Promise<MangaChapter[]> => {
  const url = `${MANGADEX_API}/manga/${mangaId}/feed?translatedLanguage[]=en&limit=${limit}&offset=${offset}&order[chapter]=asc&includes[]=scanlation_group`;
  
  try {
    const data = await cachedFetch(url);
    
    if (!data.data) return [];
    
    // Parse and deduplicate chapters (keep first occurrence of each chapter number)
    const chaptersMap = new Map<string, MangaChapter>();
    
    data.data.forEach((chapter: any) => {
      const chapterNumber = chapter.attributes?.chapter || '0';
      
      // Skip if we already have this chapter number (keeps first/best quality)
      if (chaptersMap.has(chapterNumber)) return;
      
      chaptersMap.set(chapterNumber, {
        id: chapter.id,
        title: chapter.attributes?.title || '',
        chapterNumber,
        volumeNumber: chapter.attributes?.volume,
        pages: chapter.attributes?.pages || 0,
        translatedLanguage: chapter.attributes?.translatedLanguage || 'en',
        publishAt: chapter.attributes?.publishAt || '',
        readableAt: chapter.attributes?.readableAt || '',
        scanlationGroup: chapter.relationships?.find((r: any) => r.type === 'scanlation_group')?.attributes?.name || null,
      });
    });
    
    // Sort by chapter number
    return Array.from(chaptersMap.values()).sort((a, b) => {
      const numA = parseFloat(a.chapterNumber) || 0;
      const numB = parseFloat(b.chapterNumber) || 0;
      return numA - numB;
    });
  } catch (error) {
    console.error('Failed to fetch chapters:', error);
    return [];
  }
};

// Get chapter pages with proper image proxying
export const getChapterPages = async (chapterId: string): Promise<MangaPage[]> => {
  // Check cache first
  const cached = chapterCache.get(chapterId);
  if (cached && Date.now() - cached.timestamp < CHAPTER_CACHE_DURATION) {
    return cached.data;
  }
  
  const url = `${MANGADEX_API}/at-home/server/${chapterId}`;
  
  try {
    const data = await fetchWithProxy(url);
    
    if (!data.chapter?.data || !data.baseUrl) {
      console.error('Invalid chapter data:', data);
      return [];
    }
    
    const baseUrl = data.baseUrl;
    const hash = data.chapter.hash;
    
    // Use data-saver images for faster loading, fallback to full quality
    const images = data.chapter.dataSaver || data.chapter.data;
    const quality = data.chapter.dataSaver ? 'data-saver' : 'data';
    
    const pages = images.map((filename: string, index: number) => ({
      page: index + 1,
      img: proxyReaderImageUrl(`${baseUrl}/${quality}/${hash}/${filename}`),
    }));
    
    // Cache the result
    chapterCache.set(chapterId, { data: pages, timestamp: Date.now() });
    
    return pages;
  } catch (error) {
    console.error('Failed to fetch chapter pages:', error);
    throw error;
  }
};

// Prefetch next chapter
export const prefetchChapterPages = async (chapterId: string): Promise<void> => {
  try {
    await getChapterPages(chapterId);
  } catch {
    // Silently fail for prefetch
  }
};

// Clear cache
export const clearCache = (): void => {
  cache.clear();
  chapterCache.clear();
};

// Manga genres list
export const MANGA_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
  'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life',
  'Sports', 'Supernatural', 'Thriller', 'Psychological',
  'Isekai', 'Mecha', 'Music', 'School Life'
];
