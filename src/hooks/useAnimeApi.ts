import { useState, useEffect } from 'react';
import { Anime, AnimeSearchResponse, Episode } from '@/types/anime';

const BASE_URL = 'https://api.jikan.moe/v4';

// Rate limiting helper - Jikan has a rate limit of 3 requests per second
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let lastRequestTime = 0;
const minRequestInterval = 400; // 400ms between requests

const rateLimitedFetch = async (url: string) => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < minRequestInterval) {
    await delay(minRequestInterval - timeSinceLastRequest);
  }
  
  lastRequestTime = Date.now();
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  return response.json();
};

export const useTopAnime = (filter: 'airing' | 'upcoming' | 'bypopularity' | 'favorite' = 'airing', limit = 10) => {
  const [data, setData] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopAnime = async () => {
      try {
        setLoading(true);
        const result = await rateLimitedFetch(`${BASE_URL}/top/anime?filter=${filter}&limit=${limit}`);
        setData(result.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch anime');
      } finally {
        setLoading(false);
      }
    };

    fetchTopAnime();
  }, [filter, limit]);

  return { data, loading, error };
};

export const useSeasonalAnime = (limit = 10) => {
  const [data, setData] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSeasonalAnime = async () => {
      try {
        setLoading(true);
        const result = await rateLimitedFetch(`${BASE_URL}/seasons/now?limit=${limit}`);
        setData(result.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch anime');
      } finally {
        setLoading(false);
      }
    };

    fetchSeasonalAnime();
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

        const result: AnimeSearchResponse = await rateLimitedFetch(url);
        setData(result.data);
        setHasMore(result.pagination.has_next_page);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search anime');
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
        const result = await rateLimitedFetch(`${BASE_URL}/anime/${id}/full`);
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
        const result = await rateLimitedFetch(`${BASE_URL}/anime/${id}/episodes?page=${page}`);
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
        const result = await rateLimitedFetch(`${BASE_URL}/anime/${id}/recommendations`);
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
        const result = await rateLimitedFetch(
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
