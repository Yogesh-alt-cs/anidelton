// Consumet API utilities for fetching anime streaming data

const CONSUMET_BASE_URL = 'https://api.consumet.org';
const CORS_PROXY = 'https://corsproxy.io/?';

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
  const providerInfo = providers.find(p => p.id === provider) || providers[0];
  
  try {
    const response = await fetch(
      `${CONSUMET_BASE_URL}${providerInfo.path}/${encodeURIComponent(query)}`
    );
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error(`Search error with ${provider}:`, error);
    throw error;
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
  const providerInfo = providers.find(p => p.id === provider) || providers[0];
  
  try {
    const response = await fetch(
      `${CONSUMET_BASE_URL}${providerInfo.path}/info/${encodeURIComponent(animeId)}`
    );
    
    if (!response.ok) {
      throw new Error(`Info fetch failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Info error with ${provider}:`, error);
    throw error;
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
  const providerInfo = providers.find(p => p.id === provider) || providers[0];
  
  try {
    const response = await fetch(
      `${CONSUMET_BASE_URL}${providerInfo.path}/watch/${encodeURIComponent(episodeId)}`
    );
    
    if (!response.ok) {
      throw new Error(`Watch fetch failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Sources error with ${provider}:`, error);
    throw error;
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
    return `${CORS_PROXY}${encodeURIComponent(url)}`;
  }
  return url;
}

// Get the best quality source from available sources
export function selectBestSource(sources: StreamingSource[]): StreamingSource | null {
  if (!sources || sources.length === 0) return null;
  
  const qualityOrder = ['1080p', '720p', '480p', '360p', 'default', 'backup', 'auto'];
  
  const sorted = [...sources].sort((a, b) => {
    const aIndex = qualityOrder.findIndex(q => 
      a.quality?.toLowerCase().includes(q.toLowerCase())
    );
    const bIndex = qualityOrder.findIndex(q => 
      b.quality?.toLowerCase().includes(q.toLowerCase())
    );
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });
  
  return sorted[0];
}

// Get available providers
export function getProviders() {
  return providers;
}

// Get embed URL (for iframe-based playback)
export function getEmbedUrl(episodeId: string, provider: Provider = 'gogoanime'): string {
  // Some providers offer direct embed URLs
  switch (provider) {
    case 'gogoanime':
      return `https://gogoanime.tel/streaming.php?id=${episodeId}`;
    case 'zoro':
      return `https://zoro.to/watch/${episodeId}`;
    default:
      return '';
  }
}
