import { Manga, MangaChapter, MangaPage, MangaSearchResult } from '@/types/manga';
import { supabase } from '@/integrations/supabase/client';

const MANGADEX_UPLOADS = 'https://uploads.mangadex.org';

// Image proxy for hotlink restrictions
const IMAGE_PROXIES = [
  'https://wsrv.nl/?url=',
  'https://images.weserv.nl/?url=',
];

// Cache for API responses (client-side)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Chapter pages cache (longer duration)
const chapterCache = new Map<string, { data: MangaPage[]; timestamp: number }>();
const CHAPTER_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

const logFetchFailure = (context: string, meta: Record<string, unknown>, err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  // Intentionally verbose for future debugging (requested)
  console.error(`[mangaApi] ${context} failed`, { ...meta, message, err });
};

// Proxy image URL to avoid hotlink restrictions
export const proxyImageUrl = (url: string): string => {
  if (!url || url === '/placeholder.svg') return '/placeholder.svg';

  // Already proxied
  if (url.startsWith('https://wsrv.nl') || url.startsWith('https://images.weserv.nl')) {
    return url;
  }

  // Covers: smaller + faster
  return `${IMAGE_PROXIES[0]}${encodeURIComponent(url)}&w=512&q=80`;
};

// Proxy higher quality image for reader
export const proxyReaderImageUrl = (url: string): string => {
  if (!url || url === '/placeholder.svg') return '/placeholder.svg';

  if (url.startsWith('https://wsrv.nl') || url.startsWith('https://images.weserv.nl')) {
    return url;
  }

  return `${IMAGE_PROXIES[0]}${encodeURIComponent(url)}&q=90`;
};

type ProxyParams = Record<string, string | number | boolean | Array<string | number | boolean> | null | undefined>;

type ProxyBody = {
  path: string;
  params?: ProxyParams;
};

const invokeProxy = async (body: ProxyBody, attempts = 3): Promise<any> => {
  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      const { data, error } = await supabase.functions.invoke('mangadex-proxy', {
        body,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (e) {
      lastError = e;
      const delay = 250 * Math.pow(2, i);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Proxy request failed');
};

const cachedCall = async (cacheKey: string, body: ProxyBody): Promise<any> => {
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const data = await invokeProxy(body);
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
};

// Get cover art URL from relationships - with proxy
const getCoverUrl = (manga: any): string => {
  const coverRel = manga.relationships?.find((rel: any) => rel.type === 'cover_art');
  const fileName = coverRel?.attributes?.fileName;

  if (fileName) {
    const originalUrl = `${MANGADEX_UPLOADS}/covers/${manga.id}/${fileName}.512.jpg`;
    return proxyImageUrl(originalUrl);
  }

  return '/placeholder.svg';
};

// Get author/artist names from relationships
const getCreatorNames = (manga: any, type: 'author' | 'artist'): string[] => {
  return (
    manga.relationships
      ?.filter((rel: any) => rel.type === type)
      ?.map((rel: any) => rel.attributes?.name || 'Unknown') || []
  );
};

// Get the best available title
const getBestTitle = (attributes: any): string => {
  if (attributes.title?.en) return attributes.title.en;
  if (attributes.title?.['ja-ro']) return attributes.title['ja-ro'];
  if (attributes.title?.ja) return attributes.title.ja;

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
    description:
      attr.description?.en ||
      attr.description?.['ja-ro'] ||
      (Object.values(attr.description || {})[0] as string) ||
      '',
    status: attr.status || 'unknown',
    releaseDate: attr.year,
    contentRating: attr.contentRating || 'safe',
    lastVolume: attr.lastVolume,
    lastChapter: attr.lastChapter,
    image: getCoverUrl(manga),
    genres:
      attr.tags
        ?.filter((t: any) => t.attributes?.group === 'genre')
        .map((t: any) => t.attributes?.name?.en || '') || [],
    themes:
      attr.tags
        ?.filter((t: any) => t.attributes?.group === 'theme')
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

export type MangaGenre = { id: string; name: string };

export const getMangaGenres = async (): Promise<MangaGenre[]> => {
  try {
    const data = await cachedCall('tags', {
      path: '/manga/tag',
    });

    const genres = (data?.data || [])
      .filter((t: any) => t?.attributes?.group === 'genre')
      .map((t: any) => ({
        id: t.id,
        name: t.attributes?.name?.en || '',
      }))
      .filter((t: MangaGenre) => t.name)
      .sort((a: MangaGenre, b: MangaGenre) => a.name.localeCompare(b.name));

    return genres;
  } catch (err) {
    logFetchFailure('getMangaGenres', {}, err);
    return [];
  }
};

// Search manga
export const searchManga = async (query: string, limit = 20): Promise<MangaSearchResult[]> => {
  if (!query.trim()) return [];

  const cacheKey = `search:${query}:${limit}`;

  try {
    const data = await cachedCall(cacheKey, {
      path: '/manga',
      params: {
        title: query,
        limit,
        'includes[]': ['cover_art'],
        'contentRating[]': ['safe', 'suggestive'],
        'order[relevance]': 'desc',
      },
    });

    return data?.data?.map(parseSearchResult) || [];
  } catch (err) {
    logFetchFailure('searchManga', { query, limit }, err);
    return [];
  }
};

export const getPopularManga = async (limit = 20): Promise<MangaSearchResult[]> => {
  const cacheKey = `popular:${limit}`;

  try {
    const data = await cachedCall(cacheKey, {
      path: '/manga',
      params: {
        limit,
        'includes[]': ['cover_art'],
        'contentRating[]': ['safe', 'suggestive'],
        'order[followedCount]': 'desc',
        hasAvailableChapters: true,
      },
    });

    return data?.data?.map(parseSearchResult) || [];
  } catch (err) {
    logFetchFailure('getPopularManga', { limit }, err);
    return [];
  }
};

export const getRecentManga = async (limit = 20): Promise<MangaSearchResult[]> => {
  const cacheKey = `recent:${limit}`;

  try {
    const data = await cachedCall(cacheKey, {
      path: '/manga',
      params: {
        limit,
        'includes[]': ['cover_art'],
        'contentRating[]': ['safe', 'suggestive'],
        'order[latestUploadedChapter]': 'desc',
        hasAvailableChapters: true,
      },
    });

    return data?.data?.map(parseSearchResult) || [];
  } catch (err) {
    logFetchFailure('getRecentManga', { limit }, err);
    return [];
  }
};

export const getTrendingManga = async (limit = 20): Promise<MangaSearchResult[]> => {
  const cacheKey = `trending:${limit}`;

  try {
    const data = await cachedCall(cacheKey, {
      path: '/manga',
      params: {
        limit,
        'includes[]': ['cover_art'],
        'contentRating[]': ['safe', 'suggestive'],
        'order[rating]': 'desc',
        hasAvailableChapters: true,
      },
    });

    return data?.data?.map(parseSearchResult) || [];
  } catch (err) {
    logFetchFailure('getTrendingManga', { limit }, err);
    return [];
  }
};

// Get manga by genre (tag id)
export const getMangaByGenreTag = async (tagId: string, limit = 20): Promise<MangaSearchResult[]> => {
  if (!tagId) return [];

  const cacheKey = `genre:${tagId}:${limit}`;

  try {
    const data = await cachedCall(cacheKey, {
      path: '/manga',
      params: {
        limit,
        'includes[]': ['cover_art'],
        'includedTags[]': [tagId],
        'contentRating[]': ['safe', 'suggestive'],
        'order[followedCount]': 'desc',
        hasAvailableChapters: true,
      },
    });

    return data?.data?.map(parseSearchResult) || [];
  } catch (err) {
    logFetchFailure('getMangaByGenreTag', { tagId, limit }, err);
    return [];
  }
};

export const getMangaDetails = async (id: string): Promise<Manga | null> => {
  if (!id) return null;

  const cacheKey = `details:${id}`;

  try {
    const data = await cachedCall(cacheKey, {
      path: `/manga/${id}`,
      params: {
        'includes[]': ['cover_art', 'author', 'artist'],
      },
    });

    return data?.data ? parseManga(data.data) : null;
  } catch (err) {
    logFetchFailure('getMangaDetails', { id }, err);
    return null;
  }
};

export const getMangaChapters = async (mangaId: string, limit = 500, offset = 0): Promise<MangaChapter[]> => {
  if (!mangaId) return [];

  const cacheKey = `chapters:${mangaId}:${limit}:${offset}`;

  try {
    const data = await cachedCall(cacheKey, {
      path: `/manga/${mangaId}/feed`,
      params: {
        'translatedLanguage[]': ['en'],
        limit,
        offset,
        'order[chapter]': 'asc',
        'includes[]': ['scanlation_group'],
      },
    });

    if (!data?.data) return [];

    const chaptersMap = new Map<string, MangaChapter>();

    data.data.forEach((chapter: any) => {
      const chapterNumber = chapter.attributes?.chapter || '0';
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
        scanlationGroup:
          chapter.relationships?.find((r: any) => r.type === 'scanlation_group')?.attributes?.name || null,
      });
    });

    return Array.from(chaptersMap.values()).sort((a, b) => {
      const numA = parseFloat(a.chapterNumber) || 0;
      const numB = parseFloat(b.chapterNumber) || 0;
      return numA - numB;
    });
  } catch (err) {
    logFetchFailure('getMangaChapters', { mangaId, limit, offset }, err);
    return [];
  }
};

export const getChapterPages = async (chapterId: string): Promise<MangaPage[]> => {
  if (!chapterId) return [];

  const cached = chapterCache.get(chapterId);
  if (cached && Date.now() - cached.timestamp < CHAPTER_CACHE_DURATION) {
    return cached.data;
  }

  try {
    const data = await invokeProxy(
      {
        path: `/at-home/server/${chapterId}`,
      },
      3
    );

    const baseUrl = data?.baseUrl;
    const hash = data?.chapter?.hash;
    const saver = data?.chapter?.dataSaver;
    const full = data?.chapter?.data;

    const images: string[] = Array.isArray(saver) && saver.length > 0 ? saver : Array.isArray(full) ? full : [];
    const quality = Array.isArray(saver) && saver.length > 0 ? 'data-saver' : 'data';

    if (!baseUrl || !hash || images.length === 0) {
      console.warn('[mangaApi] No pages available', { chapterId, baseUrl: !!baseUrl, hash: !!hash, images: images.length });
      return [];
    }

    const pages = images.map((filename, index) => ({
      page: index + 1,
      img: proxyReaderImageUrl(`${baseUrl}/${quality}/${hash}/${filename}`),
    }));

    chapterCache.set(chapterId, { data: pages, timestamp: Date.now() });
    return pages;
  } catch (err) {
    logFetchFailure('getChapterPages', { chapterId }, err);
    throw err;
  }
};

export const prefetchChapterPages = async (chapterId: string): Promise<void> => {
  try {
    await getChapterPages(chapterId);
  } catch {
    // silently fail
  }
};

export const clearCache = (): void => {
  cache.clear();
  chapterCache.clear();
};
