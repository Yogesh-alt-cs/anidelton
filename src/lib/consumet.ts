// Consumet API utilities for fetching anime streaming data
// With multiple fallback servers and CORS handling

import {
  fetchFromConsumet,
  searchAnimeOnConsumet,
  getAnimeInfoFromConsumet,
  getEpisodeSourcesFromConsumet,
  selectBestQualitySource,
} from './streamingSources';

export type Provider = 'gogoanime' | 'zoro' | '9anime';

export interface AnimeSearchResult {
  id: string;
  title: string;
  image: string;
  releaseDate?: string;
  subOrDub?: string;
  url?: string;
}

export interface AnimeEpisode {
  id: string;
  number: number;
  title?: string;
  url?: string;
}

export interface AnimeInfo {
  id: string;
  title: string;
  url?: string;
  image: string;
  description?: string;
  type?: string;
  releaseDate?: string;
  status?: string;
  totalEpisodes?: number;
  genres?: string[];
  episodes: AnimeEpisode[];
}

export interface StreamingSource {
  url: string;
  quality: string;
  isM3U8: boolean;
}

export interface EpisodeSource {
  headers?: Record<string, string>;
  sources: StreamingSource[];
  download?: string;
  subtitles?: Array<{
    url: string;
    lang: string;
  }>;
}

const providers: { id: Provider; name: string; path: string }[] = [
  { id: 'gogoanime', name: 'Gogoanime', path: '/anime/gogoanime' },
  { id: 'zoro', name: 'Zoro', path: '/anime/zoro' },
  { id: '9anime', name: '9Anime', path: '/anime/9anime' },
];

// Search anime by title
export async function searchAnime(
  query: string,
  provider: Provider = 'gogoanime'
): Promise<AnimeSearchResult[]> {
  try {
    const results = await searchAnimeOnConsumet(query);
    return results.map((r: any) => ({
      id: r.id,
      title: r.title,
      image: r.image,
      releaseDate: r.releaseDate,
      subOrDub: r.subOrDub,
      url: r.url,
    }));
  } catch (error) {
    console.error(`Search error with ${provider}:`, error);
    return [];
  }
}

// Search with automatic fallback to other providers
export async function searchAnimeWithFallback(query: string): Promise<{
  results: AnimeSearchResult[];
  provider: Provider;
}> {
  for (const provider of providers) {
    try {
      const results = await searchAnime(query, provider.id);
      if (results.length > 0) {
        return { results, provider: provider.id };
      }
    } catch {
      continue;
    }
  }

  return { results: [], provider: 'gogoanime' };
}

// Get anime info and episodes
export async function getAnimeInfo(
  animeId: string,
  provider: Provider = 'gogoanime'
): Promise<AnimeInfo | null> {
  try {
    const info = await getAnimeInfoFromConsumet(animeId);
    if (!info) return null;

    return {
      id: info.id,
      title: info.title,
      url: info.url,
      image: info.image,
      description: info.description,
      type: info.type,
      releaseDate: info.releaseDate,
      status: info.status,
      totalEpisodes: info.totalEpisodes,
      genres: info.genres,
      episodes: info.episodes || [],
    };
  } catch (error) {
    console.error(`Info error with ${provider}:`, error);
    return null;
  }
}

// Get anime info with fallback
export async function getAnimeInfoWithFallback(animeId: string): Promise<{
  info: AnimeInfo | null;
  provider: Provider;
}> {
  for (const provider of providers) {
    try {
      const info = await getAnimeInfo(animeId, provider.id);
      if (info && info.episodes?.length > 0) {
        return { info, provider: provider.id };
      }
    } catch {
      continue;
    }
  }

  return { info: null, provider: 'gogoanime' };
}

// Get episode streaming sources
export async function getEpisodeSources(
  episodeId: string,
  provider: Provider = 'gogoanime'
): Promise<EpisodeSource | null> {
  try {
    const data = await getEpisodeSourcesFromConsumet(episodeId);
    if (!data) return null;

    return {
      sources: data.sources || [],
      subtitles: data.subtitles,
      headers: data.headers,
      download: data.download,
    };
  } catch (error) {
    console.error(`Sources error with ${provider}:`, error);
    return null;
  }
}

// Get episode sources with fallback
export async function getEpisodeSourcesWithFallback(episodeId: string): Promise<{
  sources: EpisodeSource | null;
  provider: Provider;
}> {
  for (const provider of providers) {
    try {
      const sources = await getEpisodeSources(episodeId, provider.id);
      if (sources && sources.sources?.length > 0) {
        return { sources, provider: provider.id };
      }
    } catch {
      continue;
    }
  }

  return { sources: null, provider: 'gogoanime' };
}

// Apply CORS proxy to streaming URL
export function proxyStreamUrl(url: string): string {
  if (url.includes('.m3u8')) {
    return `https://corsproxy.io/?${encodeURIComponent(url)}`;
  }
  return url;
}

// Get the best quality source from available sources
export function selectBestSource(sources: StreamingSource[]): StreamingSource | null {
  return selectBestQualitySource(sources);
}

// Get available providers
export function getProviders() {
  return providers;
}

// Get embed URL (for iframe-based playback)
export function getEmbedUrl(episodeId: string, provider: Provider = 'gogoanime'): string {
  switch (provider) {
    case 'gogoanime':
      return `https://embtaku.pro/streaming.php?id=${encodeURIComponent(episodeId)}`;
    case 'zoro':
      return `https://rapid-cloud.co/embed-6-v2/e-1/${encodeURIComponent(episodeId)}?autoPlay=1&oa=0&asi=1`;
    default:
      return `https://embtaku.pro/streaming.php?id=${encodeURIComponent(episodeId)}`;
  }
}
