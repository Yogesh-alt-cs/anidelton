import { useState, useEffect, useCallback, useRef } from 'react';
import { Manga, MangaChapter, MangaPage, MangaSearchResult, ReadingProgress } from '@/types/manga';
import * as mangaApi from '@/lib/mangaApi';

// Local storage keys
const READING_PROGRESS_KEY = 'manga_reading_progress';
const BOOKMARKS_KEY = 'manga_bookmarks';
const RECENT_SEARCHES_KEY = 'manga_recent_searches';

// Hook for searching manga
export const useMangaSearch = (query: string) => {
  const [data, setData] = useState<MangaSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setData([]);
      setLoading(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const searchManga = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await mangaApi.searchManga(query);
        setData(results);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Search failed');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchManga, 400);
    return () => {
      clearTimeout(debounce);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query]);

  return { data, loading, error };
};

// Hook for popular manga
export const usePopularManga = (limit = 20) => {
  const [data, setData] = useState<MangaSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const results = await mangaApi.getPopularManga(limit);
        if (mounted) setData(results);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to fetch popular manga');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [limit]);

  return { data, loading, error };
};

// Hook for recent manga
export const useRecentManga = (limit = 20) => {
  const [data, setData] = useState<MangaSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const results = await mangaApi.getRecentManga(limit);
        if (mounted) setData(results);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to fetch recent manga');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Stagger the request slightly
    const timeout = setTimeout(fetchData, 200);
    return () => { 
      mounted = false;
      clearTimeout(timeout);
    };
  }, [limit]);

  return { data, loading, error };
};

// Hook for trending manga
export const useTrendingManga = (limit = 20) => {
  const [data, setData] = useState<MangaSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const results = await mangaApi.getTrendingManga(limit);
        if (mounted) setData(results);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to fetch trending manga');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const timeout = setTimeout(fetchData, 400);
    return () => { 
      mounted = false;
      clearTimeout(timeout);
    };
  }, [limit]);

  return { data, loading, error };
};

// Hook for manga by genre
export const useMangaByGenre = (genre: string, limit = 20) => {
  const [data, setData] = useState<MangaSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!genre) {
      setData([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const results = await mangaApi.getMangaByGenre(genre, limit);
        if (mounted) setData(results);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to fetch manga');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [genre, limit]);

  return { data, loading, error };
};

// Hook for manga details
export const useMangaDetails = (id: string | null) => {
  const [data, setData] = useState<Manga | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await mangaApi.getMangaDetails(id);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch manga details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    refetch();
  }, [id, refetch]);

  return { data, loading, error, refetch };
};

// Hook for manga chapters
export const useMangaChapters = (mangaId: string | null) => {
  const [data, setData] = useState<MangaChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!mangaId) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await mangaApi.getMangaChapters(mangaId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chapters');
    } finally {
      setLoading(false);
    }
  }, [mangaId]);

  useEffect(() => {
    if (!mangaId) {
      setData([]);
      setLoading(false);
      return;
    }

    refetch();
  }, [mangaId, refetch]);

  return { data, loading, error, refetch };
};

// Hook for chapter pages with retry capability
export const useChapterPages = (chapterId: string | null) => {
  const [data, setData] = useState<MangaPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPages = useCallback(async () => {
    if (!chapterId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await mangaApi.getChapterPages(chapterId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pages');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const retry = useCallback(() => {
    fetchPages();
  }, [fetchPages]);

  return { data, loading, error, retry };
};

// Hook for reading progress
export const useReadingProgress = () => {
  const [progress, setProgress] = useState<Record<string, ReadingProgress>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(READING_PROGRESS_KEY);
      if (saved) {
        setProgress(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load reading progress:', e);
    }
  }, []);

  const saveProgress = useCallback((mangaId: string, chapterId: string, page: number) => {
    setProgress(prev => {
      const updated = {
        ...prev,
        [mangaId]: { mangaId, chapterId, page, timestamp: Date.now() },
      };
      try {
        localStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save reading progress:', e);
      }
      return updated;
    });
  }, []);

  const getProgress = useCallback((mangaId: string): ReadingProgress | null => {
    return progress[mangaId] || null;
  }, [progress]);

  const clearProgress = useCallback((mangaId: string) => {
    setProgress(prev => {
      const updated = { ...prev };
      delete updated[mangaId];
      try {
        localStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to clear reading progress:', e);
      }
      return updated;
    });
  }, []);

  return { progress, saveProgress, getProgress, clearProgress };
};

// Hook for bookmarks
export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<MangaSearchResult[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(BOOKMARKS_KEY);
      if (saved) {
        setBookmarks(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load bookmarks:', e);
    }
  }, []);

  const addBookmark = useCallback((manga: MangaSearchResult) => {
    setBookmarks(prev => {
      if (prev.some(b => b.id === manga.id)) return prev;
      const updated = [manga, ...prev];
      try {
        localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save bookmark:', e);
      }
      return updated;
    });
  }, []);

  const removeBookmark = useCallback((mangaId: string) => {
    setBookmarks(prev => {
      const updated = prev.filter(b => b.id !== mangaId);
      try {
        localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to remove bookmark:', e);
      }
      return updated;
    });
  }, []);

  const isBookmarked = useCallback((mangaId: string): boolean => {
    return bookmarks.some(b => b.id === mangaId);
  }, [bookmarks]);

  return { bookmarks, addBookmark, removeBookmark, isBookmarked };
};

// Hook for recent searches
export const useRecentSearches = () => {
  const [searches, setSearches] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        setSearches(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load recent searches:', e);
    }
  }, []);

  const addSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    setSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== query.toLowerCase());
      const updated = [query, ...filtered].slice(0, 10);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save search:', e);
      }
      return updated;
    });
  }, []);

  const clearSearches = useCallback(() => {
    setSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      console.error('Failed to clear searches:', e);
    }
  }, []);

  return { searches, addSearch, clearSearches };
};

// Hook for continue reading
export const useContinueReading = () => {
  const { progress } = useReadingProgress();
  const [continueItems, setContinueItems] = useState<Array<{
    mangaId: string;
    chapterId: string;
    page: number;
    timestamp: number;
    manga?: MangaSearchResult;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const items = Object.values(progress)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
    
    setContinueItems(items);
    setLoading(false);
  }, [progress]);

  return { items: continueItems, loading };
};