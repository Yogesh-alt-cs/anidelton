import { useState, useCallback } from 'react';
import {
  StreamServer,
  StreamSource,
  getStreamSources,
  getPrimaryEmbedUrl,
  getFallbackEmbedUrls,
  getServerEmbedUrl,
  searchAnimeOnConsumet,
  getAnimeInfoFromConsumet,
  getEpisodeSourcesFromConsumet,
  selectBestQualitySource,
  AVAILABLE_SERVERS,
} from '@/lib/streamingSources';

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

const PROVIDERS: { id: StreamingProvider; name: string }[] = [
  { id: 'gogoanime', name: 'Gogoanime' },
  { id: 'zoro', name: 'Zoro' },
  { id: '9anime', name: '9Anime' },
];

export const useAnimeStreaming = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProvider, setCurrentProvider] = useState<StreamingProvider>('gogoanime');
  const [currentServer, setCurrentServer] = useState<StreamServer>('vidwish');

  // Search for anime
  const searchAnime = useCallback(async (query: string): Promise<SearchResult[]> => {
    setLoading(true);
    setError(null);

    try {
      const results = await searchAnimeOnConsumet(query);
      return results.map((r: any) => ({
        id: r.id,
        title: r.title,
        image: r.image,
        releaseDate: r.releaseDate,
        subOrDub: r.subOrDub,
      }));
    } catch (err) {
      setError('Failed to search anime');
      console.error('Search error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get anime info
  const getAnimeInfo = useCallback(async (animeId: string): Promise<AnimeInfo | null> => {
    setLoading(true);
    setError(null);

    try {
      const info = await getAnimeInfoFromConsumet(animeId);
      if (!info) return null;

      return {
        id: info.id,
        title: info.title,
        image: info.image,
        description: info.description,
        status: info.status,
        releaseDate: info.releaseDate,
        totalEpisodes: info.totalEpisodes,
        genres: info.genres,
        episodes: info.episodes || [],
      };
    } catch (err) {
      setError('Failed to get anime info');
      console.error('Info error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get episode streaming sources (HLS)
  const getEpisodeSources = useCallback(async (episodeId: string): Promise<EpisodeSource | null> => {
    setLoading(true);
    setError(null);

    try {
      const data = await getEpisodeSourcesFromConsumet(episodeId);
      if (!data) return null;

      return {
        sources: data.sources || [],
        subtitles: data.subtitles,
        headers: data.headers,
        download: data.download,
      };
    } catch (err) {
      setError('Failed to get streaming sources');
      console.error('Sources error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get embed URL for current server
  const getEmbedUrl = useCallback((animeTitle: string, episode: number, isDub = false): string => {
    return getServerEmbedUrl(animeTitle, episode, currentServer, isDub);
  }, [currentServer]);

  // Get all embed URLs with fallbacks
  const getAllEmbedUrls = useCallback((animeTitle: string, episode: number, isDub = false): {
    primary: string;
    fallbacks: string[];
  } => {
    return {
      primary: getPrimaryEmbedUrl(animeTitle, episode, isDub),
      fallbacks: getFallbackEmbedUrls(animeTitle, episode, isDub),
    };
  }, []);

  // Get stream sources for server selection
  const getAvailableServers = useCallback((animeTitle: string, episode: number, isDub = false): StreamSource[] => {
    return getStreamSources(animeTitle, episode, isDub);
  }, []);

  // Switch provider
  const switchProvider = useCallback((provider: StreamingProvider) => {
    setCurrentProvider(provider);
    setError(null);
  }, []);

  // Switch server
  const switchServer = useCallback((server: StreamServer) => {
    setCurrentServer(server);
    setError(null);
  }, []);

  return {
    // Search and info
    searchAnime,
    getAnimeInfo,
    getEpisodeSources,
    
    // Embed URLs
    getEmbedUrl,
    getAllEmbedUrls,
    getAvailableServers,
    
    // State
    currentProvider,
    currentServer,
    providers: PROVIDERS,
    servers: AVAILABLE_SERVERS,
    loading,
    error,
    
    // Actions
    switchProvider,
    switchServer,
  };
};
