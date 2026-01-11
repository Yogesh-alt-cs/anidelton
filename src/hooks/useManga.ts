import { useState, useEffect, useCallback } from 'react';
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

  useEffect(() => {
    if (!query.trim()) {
      setData([]);
      return;
    }

    const searchManga = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await mangaApi.searchManga(query);
        setData(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchManga, 500);
    return () => clearTimeout(debounce);
  }, [query]);

  return { data, loading, error };
};

// Hook for popular manga
export const usePopularManga = (limit = 20) => {
  const [data, setData] = useState<MangaSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const results = await mangaApi.getPopularManga(limit);
        setData(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch popular manga');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [limit]);

  return { data, loading, error };
};

// Hook for recent manga
export const useRecentManga = (limit = 20) => {
  const [data, setData] = useState<MangaSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const results = await mangaApi.getRecentManga(limit);
        setData(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch recent manga');
      } finally {
        setLoading(false);
      }
    };

    // Stagger the request
    const timeout = setTimeout(fetchData, 300);
    return () => clearTimeout(timeout);
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

    const fetchData = async () => {
      try {
        setLoading(true);
        const results = await mangaApi.getMangaByGenre(genre, limit);
        setData(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch manga');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [genre, limit]);

  return { data, loading, error };
};

// Hook for manga details
export const useMangaDetails = (id: string | null) => {
  const [data, setData] = useState<Manga | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await mangaApi.getMangaDetails(id);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch manga details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { data, loading, error };
};

// Hook for manga chapters
export const useMangaChapters = (mangaId: string | null) => {
  const [data, setData] = useState<MangaChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mangaId) {
      setData([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await mangaApi.getMangaChapters(mangaId);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch chapters');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mangaId]);

  return { data, loading, error };
};

// Hook for chapter pages
export const useChapterPages = (chapterId: string | null) => {
  const [data, setData] = useState<MangaPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chapterId) {
      setData([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await mangaApi.getChapterPages(chapterId);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch pages');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [chapterId]);

  return { data, loading, error };
};

// Hook for reading progress
export const useReadingProgress = () => {
  const [progress, setProgress] = useState<Record<string, ReadingProgress>>({});

  useEffect(() => {
    const saved = localStorage.getItem(READING_PROGRESS_KEY);
    if (saved) {
      setProgress(JSON.parse(saved));
    }
  }, []);

  const saveProgress = useCallback((mangaId: string, chapterId: string, page: number) => {
    setProgress(prev => {
      const updated = {
        ...prev,
        [mangaId]: { mangaId, chapterId, page, timestamp: Date.now() },
      };
      localStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getProgress = useCallback((mangaId: string): ReadingProgress | null => {
    return progress[mangaId] || null;
  }, [progress]);

  return { progress, saveProgress, getProgress };
};

// Hook for bookmarks
export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<MangaSearchResult[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(BOOKMARKS_KEY);
    if (saved) {
      setBookmarks(JSON.parse(saved));
    }
  }, []);

  const addBookmark = useCallback((manga: MangaSearchResult) => {
    setBookmarks(prev => {
      if (prev.some(b => b.id === manga.id)) return prev;
      const updated = [...prev, manga];
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeBookmark = useCallback((mangaId: string) => {
    setBookmarks(prev => {
      const updated = prev.filter(b => b.id !== mangaId);
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
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
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      setSearches(JSON.parse(saved));
    }
  }, []);

  const addSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    setSearches(prev => {
      const filtered = prev.filter(s => s !== query);
      const updated = [query, ...filtered].slice(0, 10);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearSearches = useCallback(() => {
    setSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  return { searches, addSearch, clearSearches };
};
