import { useState, useCallback } from 'react';

export type StreamingProvider = 'gogoanime' | 'zoro' | '9anime';

interface StreamingSource {
  url: string;
  quality: string;
  isM3U8: boolean;
}

interface EpisodeSource {
  headers?: Record<string, string>;
  sources: StreamingSource[];
  subtitles?: Array<{
    url: string;
    lang: string;
  }>;
}

interface SearchResult {
  id: string;
  title: string;
  image: string;
  releaseDate?: string;
  subOrDub?: string;
}

interface AnimeInfo {
  id: string;
  title: string;
  image: string;
  description?: string;
  episodes: Array<{
    id: string;
    number: number;
    title?: string;
  }>;
}

const PROVIDERS: { id: StreamingProvider; name: string; baseUrl: string }[] = [
  { id: 'gogoanime', name: 'Gogoanime', baseUrl: 'https://api.consumet.org/anime/gogoanime' },
  { id: 'zoro', name: 'Zoro', baseUrl: 'https://api.consumet.org/anime/zoro' },
  { id: '9anime', name: '9Anime', baseUrl: 'https://api.consumet.org/anime/9anime' },
];

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
      const response = await fetch(
        `${baseUrl}/${encodeURIComponent(query)}`
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      return data.results || [];
    } catch (err) {
      // Try fallback providers
      for (const fallback of PROVIDERS.filter(p => p.id !== providerToUse)) {
        try {
          const response = await fetch(
            `${fallback.baseUrl}/${encodeURIComponent(query)}`
          );
          if (response.ok) {
            const data = await response.json();
            setCurrentProvider(fallback.id);
            return data.results || [];
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
      const response = await fetch(
        `${baseUrl}/info/${encodeURIComponent(animeId)}`
      );
      
      if (!response.ok) throw new Error('Failed to get anime info');
      
      const data = await response.json();
      return data;
    } catch (err) {
      // Try fallback providers
      for (const fallback of PROVIDERS.filter(p => p.id !== providerToUse)) {
        try {
          const response = await fetch(
            `${fallback.baseUrl}/info/${encodeURIComponent(animeId)}`
          );
          if (response.ok) {
            const data = await response.json();
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
      const response = await fetch(
        `${baseUrl}/watch/${encodeURIComponent(episodeId)}`
      );
      
      if (!response.ok) throw new Error('Failed to get episode sources');
      
      const data = await response.json();
      return data;
    } catch (err) {
      // Try fallback providers  
      for (const fallback of PROVIDERS.filter(p => p.id !== providerToUse)) {
        try {
          const response = await fetch(
            `${fallback.baseUrl}/watch/${encodeURIComponent(episodeId)}`
          );
          if (response.ok) {
            const data = await response.json();
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

  const switchProvider = (provider: StreamingProvider) => {
    setCurrentProvider(provider);
  };

  return {
    searchAnime,
    getAnimeInfo,
    getEpisodeSources,
    switchProvider,
    currentProvider,
    providers: PROVIDERS,
    loading,
    error
  };
};
