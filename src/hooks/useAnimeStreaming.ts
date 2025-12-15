import { useState, useCallback } from 'react';

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

const CONSUMET_BASE_URL = 'https://api.consumet.org';

export const useAnimeStreaming = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchAnime = useCallback(async (query: string): Promise<SearchResult[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${CONSUMET_BASE_URL}/anime/gogoanime/${encodeURIComponent(query)}`
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      return data.results || [];
    } catch (err) {
      setError('Failed to search anime');
      console.error('Search error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getAnimeInfo = useCallback(async (animeId: string): Promise<AnimeInfo | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${CONSUMET_BASE_URL}/anime/gogoanime/info/${encodeURIComponent(animeId)}`
      );
      
      if (!response.ok) throw new Error('Failed to get anime info');
      
      const data = await response.json();
      return data;
    } catch (err) {
      setError('Failed to get anime info');
      console.error('Info error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getEpisodeSources = useCallback(async (episodeId: string): Promise<EpisodeSource | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${CONSUMET_BASE_URL}/anime/gogoanime/watch/${encodeURIComponent(episodeId)}`
      );
      
      if (!response.ok) throw new Error('Failed to get episode sources');
      
      const data = await response.json();
      return data;
    } catch (err) {
      setError('Failed to get streaming sources');
      console.error('Streaming error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    searchAnime,
    getAnimeInfo,
    getEpisodeSources,
    loading,
    error
  };
};
