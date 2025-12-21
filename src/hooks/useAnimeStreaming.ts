import React, { useState, useCallback } from 'react';

export type StreamingProvider = 'gogoanime' | 'zoro' | '9anime';

interface StreamingSource {
  url: string;
  quality: string;
  isM3U8: boolean;
}

interface Subtitle {
  url: string;
  lang: string;
}

export interface EpisodeSource {
  headers?: Record<string, string>;
  sources: StreamingSource[];
  subtitles?: Subtitle[];
  download?: string;
}

interface SearchResult {
  id: string;
  title: string;
  image: string;
  releaseDate?: string;
  subOrDub?: string;
}

export interface AnimeInfo {
  id: string;
  title: string;
  image: string;
  description?: string;
  status?: string;
  releaseDate?: string;
  totalEpisodes?: number;
  genres?: string[];
  episodes: Array<{
    id: string;
    number: number;
    title?: string;
  }>;
}

// Multiple CORS proxies for fallback
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.org/?',
  'https://api.codetabs.com/v1/proxy?quest=',
];

const PROVIDERS: { id: StreamingProvider; name: string; baseUrl: string }[] = [
  { id: 'gogoanime', name: 'Gogoanime', baseUrl: 'https://api.consumet.org/anime/gogoanime' },
  { id: 'zoro', name: 'Zoro', baseUrl: 'https://api.consumet.org/anime/zoro' },
  { id: '9anime', name: '9Anime', baseUrl: 'https://api.consumet.org/anime/9anime' },
];

// Helper to fetch with CORS proxy fallbacks
const fetchWithProxy = async (url: string) => {
  let lastError: Error | null = null;
  
  // First try direct fetch (might work for some APIs)
  try {
    const directResponse = await fetch(url);
    if (directResponse.ok) {
      return directResponse.json();
    }
  } catch {
    // Direct fetch failed, try proxies
  }
  
  // Try each CORS proxy
  for (const proxy of CORS_PROXIES) {
    try {
      const proxiedUrl = `${proxy}${encodeURIComponent(url)}`;
      const response = await fetch(proxiedUrl);
      if (response.ok) {
        const text = await response.text();
        try {
          return JSON.parse(text);
        } catch {
          // Some proxies return the response wrapped, try extracting
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        }
      }
    } catch (err) {
      lastError = err as Error;
      continue;
    }
  }
  
  throw lastError || new Error('All CORS proxies failed');
};

export const useAnimeStreaming = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProvider, setCurrentProvider] = useState<StreamingProvider>('gogoanime');

  const getProviderUrl = (provider: StreamingProvider) => {
    return PROVIDERS.find(p => p.id === provider)?.baseUrl || PROVIDERS[0].baseUrl;
  };

  const searchAnime = useCallback(async (query: string, provider?: StreamingProvider): Promise<SearchResult[]> => {
    setLoading(true);
    setError(null);
    
    const providerToUse = provider || currentProvider;
    const baseUrl = getProviderUrl(providerToUse);
    
    try {
      const data = await fetchWithProxy(`${baseUrl}/${encodeURIComponent(query)}`);
      return data.results || [];
    } catch (err) {
      // Try fallback providers
      for (const fallback of PROVIDERS.filter(p => p.id !== providerToUse)) {
        try {
          const data = await fetchWithProxy(`${fallback.baseUrl}/${encodeURIComponent(query)}`);
          if (data.results?.length > 0) {
            setCurrentProvider(fallback.id);
            return data.results;
          }
        } catch {
          continue;
        }
      }
      
      setError('Failed to search anime from all sources');
      console.error('Search error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentProvider]);

  const getAnimeInfo = useCallback(async (animeId: string, provider?: StreamingProvider): Promise<AnimeInfo | null> => {
    setLoading(true);
    setError(null);
    
    const providerToUse = provider || currentProvider;
    const baseUrl = getProviderUrl(providerToUse);
    
    try {
      const data = await fetchWithProxy(`${baseUrl}/info/${encodeURIComponent(animeId)}`);
      return data;
    } catch (err) {
      // Try fallback providers
      for (const fallback of PROVIDERS.filter(p => p.id !== providerToUse)) {
        try {
          const data = await fetchWithProxy(`${fallback.baseUrl}/info/${encodeURIComponent(animeId)}`);
          if (data) {
            setCurrentProvider(fallback.id);
            return data;
          }
        } catch {
          continue;
        }
      }
      
      setError('Failed to get anime info from all sources');
      console.error('Info error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentProvider]);

  const getEpisodeSources = useCallback(async (episodeId: string, provider?: StreamingProvider): Promise<EpisodeSource | null> => {
    setLoading(true);
    setError(null);
    
    const providerToUse = provider || currentProvider;
    const baseUrl = getProviderUrl(providerToUse);
    
    try {
      const data = await fetchWithProxy(`${baseUrl}/watch/${encodeURIComponent(episodeId)}`);
      return data;
    } catch (err) {
      // Try fallback providers  
      for (const fallback of PROVIDERS.filter(p => p.id !== providerToUse)) {
        try {
          const data = await fetchWithProxy(`${fallback.baseUrl}/watch/${encodeURIComponent(episodeId)}`);
          if (data?.sources?.length > 0) {
            setCurrentProvider(fallback.id);
            return data;
          }
        } catch {
          continue;
        }
      }
      
      setError('Failed to get streaming sources from all providers');
      console.error('Streaming error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentProvider]);

  const getEmbedUrl = useCallback((episodeId: string, provider?: StreamingProvider): string => {
    // Use embed URLs that work with Consumet episode IDs
    const encodedId = encodeURIComponent(episodeId);
    const providerToUse = provider || currentProvider;
    switch (providerToUse) {
      case 'gogoanime':
        return `https://embtaku.pro/streaming.php?id=${encodedId}`;
      case 'zoro':
        return `https://rapid-cloud.co/embed-6-v2/e-1/${encodedId}?autoPlay=1&oa=0&asi=1`;
      case '9anime':
        return `https://vidstream.pro/embed/${encodedId}`;
      default:
        return `https://embtaku.pro/streaming.php?id=${encodedId}`;
    }
  }, [currentProvider]);

  const switchProvider = (provider: StreamingProvider) => {
    setCurrentProvider(provider);
  };

  return {
    searchAnime,
    getAnimeInfo,
    getEpisodeSources,
    getEmbedUrl,
    switchProvider,
    currentProvider,
    providers: PROVIDERS,
    loading,
    error
  };
};
