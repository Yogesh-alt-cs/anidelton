import { useState, useEffect, useRef } from 'react';
import { Anime, AnimeSearchResponse, Episode } from '@/types/anime';
import { queuedFetch } from '@/lib/apiQueue';

const BASE_URL = 'https://api.jikan.moe/v4';

// Staggered initialization delays for different hook types
// This prevents all hooks from firing simultaneously on page load
const STAGGER_DELAYS: Record<string, number> = {
  'featured': 0,
  'airing': 100,
  'seasonal': 500,
  'favorite': 900,
  'bypopularity': 1300,
  'upcoming': 1700,
  'movies': 2100,
  'tv': 2500,
  'newreleases': 2900,
};

export const useTopAnime = (filter: 'airing' | 'upcoming' | 'bypopularity' | 'favorite' = 'airing', limit = 10) => {
  const [data, setData] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    const fetchTopAnime = async () => {
      const delay = STAGGER_DELAYS[filter] || 0;
      
      // Stagger the request
      await new Promise(resolve => setTimeout(resolve, delay));
      
      if (!mountedRef.current) return;
      
      try {
        setLoading(true);
        const result = await queuedFetch(`${BASE_URL}/top/anime?filter=${filter}&limit=${limit}`);
        if (mountedRef.current) {
          setData(result.data || []);
          setError(null);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to fetch anime');
          setData([]);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchTopAnime();
    
    return () => {
      mountedRef.current = false;
    };
  }, [filter, limit]);

  return { data, loading, error };
};

export const useSeasonalAnime = (limit = 10) => {
  const [data, setData] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    const fetchSeasonalAnime = async () => {
      // Stagger this request
      await new Promise(resolve => setTimeout(resolve, STAGGER_DELAYS['seasonal']));
      
      if (!mountedRef.current) return;
      
      try {
        setLoading(true);
        const result = await queuedFetch(`${BASE_URL}/seasons/now?limit=${limit}`);
        if (mountedRef.current) {
          setData(result.data || []);
          setError(null);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to fetch anime');
          setData([]);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchSeasonalAnime();
    
    return () => {
      mountedRef.current = false;
    };
  }, [limit]);

  return { data, loading, error };
};

export const useTopMovies = (limit = 10) => {
  const [data, setData] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    const fetchTopMovies = async () => {
      await new Promise(resolve => setTimeout(resolve, STAGGER_DELAYS['movies']));
      
      if (!mountedRef.current) return;
      
      try {
        setLoading(true);
        const result = await queuedFetch(`${BASE_URL}/top/anime?type=movie&limit=${limit}`);
        if (mountedRef.current) {
          setData(result.data || []);
          setError(null);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to fetch movies');
          setData([]);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchTopMovies();
    
    return () => {
      mountedRef.current = false;
    };
  }, [limit]);

  return { data, loading, error };
};

export const useTopTV = (limit = 10) => {
  const [data, setData] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    const fetchTopTV = async () => {
      await new Promise(resolve => setTimeout(resolve, STAGGER_DELAYS['tv']));
      
      if (!mountedRef.current) return;
      
      try {
        setLoading(true);
        const result = await queuedFetch(`${BASE_URL}/top/anime?type=tv&limit=${limit}`);
        if (mountedRef.current) {
          setData(result.data || []);
          setError(null);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to fetch TV series');
          setData([]);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchTopTV();
    
    return () => {
      mountedRef.current = false;
    };
  }, [limit]);

  return { data, loading, error };
};

export const useAnimeSearch = (query: string, genres?: number[], page = 1) => {
  const [data, setData] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!query && !genres?.length) {
      setData([]);
      return;
    }

    const searchAnime = async () => {
      try {
        setLoading(true);
        let url = `${BASE_URL}/anime?page=${page}&limit=20`;
        
        if (query) {
          url += `&q=${encodeURIComponent(query)}`;
        }
        
        if (genres?.length) {
          url += `&genres=${genres.join(',')}`;
        }

        const result: AnimeSearchResponse = await queuedFetch(url);
        setData(result.data || []);
        setHasMore(result.pagination?.has_next_page || false);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search anime');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchAnime, 500);
    return () => clearTimeout(debounceTimer);
  }, [query, genres, page]);

  return { data, loading, error, hasMore };
};

export const useAnimeDetails = (id: number | null) => {
  const [data, setData] = useState<Anime | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    const fetchAnimeDetails = async () => {
      try {
        setLoading(true);
        const result = await queuedFetch(`${BASE_URL}/anime/${id}/full`);
        setData(result.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch anime details');
      } finally {
        setLoading(false);
      }
    };

    fetchAnimeDetails();
  }, [id]);

  return { data, loading, error };
};

export const useAnimeEpisodes = (id: number | null, page = 1) => {
  const [data, setData] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!id) {
      setData([]);
      setLoading(false);
      return;
    }

    const fetchEpisodes = async () => {
      try {
        setLoading(true);
        const result = await queuedFetch(`${BASE_URL}/anime/${id}/episodes?page=${page}`);
        setData(result.data || []);
        setHasMore(result.pagination?.has_next_page || false);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch episodes');
      } finally {
        setLoading(false);
      }
    };

    fetchEpisodes();
  }, [id, page]);

  return { data, loading, error, hasMore };
};

export const useRecommendations = (id: number | null) => {
  const [data, setData] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setData([]);
      setLoading(false);
      return;
    }

    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const result = await queuedFetch(`${BASE_URL}/anime/${id}/recommendations`);
        const recommendations = result.data?.slice(0, 10).map((rec: any) => rec.entry) || [];
        setData(recommendations);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [id]);

  return { data, loading, error };
};

export const useAnimeByGenre = (genreId: number, limit: number = 24) => {
  const [data, setData] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await queuedFetch(
          `${BASE_URL}/anime?genres=${genreId}&order_by=popularity&limit=${limit}&sfw=true`
        );
        setData(result.data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch anime by genre');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [genreId, limit]);

  return { data, loading, error };
};

export const useNewReleases = (limit = 10) => {
  const [data, setData] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    const fetchNewReleases = async () => {
      await new Promise(resolve => setTimeout(resolve, STAGGER_DELAYS['newreleases']));
      
      if (!mountedRef.current) return;
      
      try {
        setLoading(true);
        const result = await queuedFetch(`${BASE_URL}/seasons/now?filter=tv&limit=${limit}&order_by=start_date&sort=desc`);
        if (mountedRef.current) {
          setData(result.data || []);
          setError(null);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to fetch new releases');
          setData([]);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchNewReleases();
    
    return () => {
      mountedRef.current = false;
    };
  }, [limit]);

  return { data, loading, error };
};

// Hook for featured anime (used in carousel)
export const useFeaturedAnime = (limit = 5) => {
  const [data, setData] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        // Get currently airing popular anime for featured section
        const result = await queuedFetch(`${BASE_URL}/top/anime?filter=airing&limit=${limit}`);
        setData(result.data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch featured anime');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, [limit]);

  return { data, loading, error };
};
