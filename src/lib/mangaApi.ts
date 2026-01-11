import { Manga, MangaChapter, MangaPage, MangaSearchResult } from '@/types/manga';

const MANGADEX_API = 'https://api.mangadex.org';
const MANGADEX_UPLOADS = 'https://uploads.mangadex.org';

// CORS proxies for fallback
const CORS_PROXIES = [
  '', // Try direct first
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
];

// Cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const fetchWithProxy = async (url: string): Promise<any> => {
  for (const proxy of CORS_PROXIES) {
    try {
      const fetchUrl = proxy ? `${proxy}${encodeURIComponent(url)}` : url;
      const response = await fetch(fetchUrl, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log(`Proxy ${proxy || 'direct'} failed, trying next...`);
    }
  }
  throw new Error('All proxies failed');
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

// Get cover art URL from relationships
const getCoverUrl = (manga: any): string => {
  const coverRel = manga.relationships?.find((rel: any) => rel.type === 'cover_art');
  if (coverRel?.attributes?.fileName) {
    return `${MANGADEX_UPLOADS}/covers/${manga.id}/${coverRel.attributes.fileName}.256.jpg`;
  }
  return '/placeholder.svg';
};

// Get author/artist names from relationships
const getCreatorNames = (manga: any, type: 'author' | 'artist'): string[] => {
  return manga.relationships
    ?.filter((rel: any) => rel.type === type)
    ?.map((rel: any) => rel.attributes?.name || 'Unknown') || [];
};

// Parse manga from API response
const parseManga = (manga: any): Manga => {
  const attr = manga.attributes;
  
  return {
    id: manga.id,
    title: attr.title?.en || attr.title?.ja || Object.values(attr.title || {})[0] as string || 'Unknown',
    altTitles: attr.altTitles?.map((t: any) => Object.values(t)[0] as string) || [],
    description: attr.description?.en || Object.values(attr.description || {})[0] as string || '',
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

// Search manga
export const searchManga = async (query: string, limit = 20): Promise<MangaSearchResult[]> => {
  if (!query.trim()) return [];
  
  const url = `${MANGADEX_API}/manga?title=${encodeURIComponent(query)}&limit=${limit}&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&order[relevance]=desc`;
  
  const data = await cachedFetch(url);
  
  return data.data?.map((manga: any) => ({
    id: manga.id,
    title: manga.attributes?.title?.en || manga.attributes?.title?.ja || Object.values(manga.attributes?.title || {})[0] as string || 'Unknown',
    image: getCoverUrl(manga),
    status: manga.attributes?.status || 'unknown',
    contentRating: manga.attributes?.contentRating || 'safe',
  })) || [];
};

// Get popular/trending manga
export const getPopularManga = async (limit = 20): Promise<MangaSearchResult[]> => {
  const url = `${MANGADEX_API}/manga?limit=${limit}&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc`;
  
  const data = await cachedFetch(url);
  
  return data.data?.map((manga: any) => ({
    id: manga.id,
    title: manga.attributes?.title?.en || manga.attributes?.title?.ja || Object.values(manga.attributes?.title || {})[0] as string || 'Unknown',
    image: getCoverUrl(manga),
    status: manga.attributes?.status || 'unknown',
    contentRating: manga.attributes?.contentRating || 'safe',
  })) || [];
};

// Get recently updated manga
export const getRecentManga = async (limit = 20): Promise<MangaSearchResult[]> => {
  const url = `${MANGADEX_API}/manga?limit=${limit}&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&order[latestUploadedChapter]=desc`;
  
  const data = await cachedFetch(url);
  
  return data.data?.map((manga: any) => ({
    id: manga.id,
    title: manga.attributes?.title?.en || manga.attributes?.title?.ja || Object.values(manga.attributes?.title || {})[0] as string || 'Unknown',
    image: getCoverUrl(manga),
    status: manga.attributes?.status || 'unknown',
    contentRating: manga.attributes?.contentRating || 'safe',
  })) || [];
};

// Get manga by genre
export const getMangaByGenre = async (genre: string, limit = 20): Promise<MangaSearchResult[]> => {
  // First get the tag ID for the genre
  const tagsUrl = `${MANGADEX_API}/manga/tag`;
  const tagsData = await cachedFetch(tagsUrl);
  
  const tag = tagsData.data?.find((t: any) => 
    t.attributes?.name?.en?.toLowerCase() === genre.toLowerCase()
  );
  
  if (!tag) return [];
  
  const url = `${MANGADEX_API}/manga?limit=${limit}&includes[]=cover_art&includedTags[]=${tag.id}&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc`;
  
  const data = await cachedFetch(url);
  
  return data.data?.map((manga: any) => ({
    id: manga.id,
    title: manga.attributes?.title?.en || manga.attributes?.title?.ja || Object.values(manga.attributes?.title || {})[0] as string || 'Unknown',
    image: getCoverUrl(manga),
    status: manga.attributes?.status || 'unknown',
    contentRating: manga.attributes?.contentRating || 'safe',
  })) || [];
};

// Get manga details
export const getMangaDetails = async (id: string): Promise<Manga | null> => {
  const url = `${MANGADEX_API}/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist`;
  
  try {
    const data = await cachedFetch(url);
    return data.data ? parseManga(data.data) : null;
  } catch {
    return null;
  }
};

// Get manga chapters
export const getMangaChapters = async (mangaId: string, limit = 100, offset = 0): Promise<MangaChapter[]> => {
  const url = `${MANGADEX_API}/manga/${mangaId}/feed?translatedLanguage[]=en&limit=${limit}&offset=${offset}&order[chapter]=asc&includes[]=scanlation_group`;
  
  const data = await cachedFetch(url);
  
  return data.data?.map((chapter: any) => ({
    id: chapter.id,
    title: chapter.attributes?.title || '',
    chapterNumber: chapter.attributes?.chapter || '0',
    volumeNumber: chapter.attributes?.volume,
    pages: chapter.attributes?.pages || 0,
    translatedLanguage: chapter.attributes?.translatedLanguage || 'en',
    publishAt: chapter.attributes?.publishAt || '',
    readableAt: chapter.attributes?.readableAt || '',
    scanlationGroup: chapter.relationships?.find((r: any) => r.type === 'scanlation_group')?.attributes?.name || null,
  })) || [];
};

// Get chapter pages
export const getChapterPages = async (chapterId: string): Promise<MangaPage[]> => {
  const url = `${MANGADEX_API}/at-home/server/${chapterId}`;
  
  const data = await fetchWithProxy(url);
  
  if (!data.chapter?.data) return [];
  
  const baseUrl = data.baseUrl;
  const hash = data.chapter.hash;
  
  return data.chapter.data.map((filename: string, index: number) => ({
    page: index + 1,
    img: `${baseUrl}/data/${hash}/${filename}`,
  }));
};

// Manga genres list
export const MANGA_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
  'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life',
  'Sports', 'Supernatural', 'Thriller', 'Psychological',
];
