import { useState, useEffect, useCallback } from 'react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { toast } from 'sonner';
import { MangaPage } from '@/types/manga';

export interface DownloadedMangaChapter {
  id: string; // chapterId
  mangaId: string;
  mangaTitle: string;
  chapterNumber: string;
  chapterTitle?: string;
  pages: MangaPage[];
  coverImage?: string;
  downloadedAt: number;
  size: number;
  pageCount: number;
}

export interface MangaDownloadProgress {
  chapterId: string;
  progress: number;
  status: 'downloading' | 'completed' | 'error' | 'paused';
  currentPage: number;
  totalPages: number;
}

interface MangaDownloadDB extends DBSchema {
  chapters: {
    key: string;
    value: DownloadedMangaChapter;
    indexes: { 'by-manga': string };
  };
}

let db: IDBPDatabase<MangaDownloadDB> | null = null;

const getDB = async () => {
  if (db) return db;
  
  db = await openDB<MangaDownloadDB>('anidel-manga-offline', 1, {
    upgrade(database) {
      const chapterStore = database.createObjectStore('chapters', { keyPath: 'id' });
      chapterStore.createIndex('by-manga', 'mangaId');
    },
  });
  
  return db;
};

// Convert image URL to blob
const fetchImageAsBlob = async (url: string): Promise<Blob | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.blob();
  } catch (error) {
    console.error('Failed to fetch image:', url, error);
    return null;
  }
};

// Convert blob to base64 for storage
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const useMangaOfflineDownload = () => {
  const [downloads, setDownloads] = useState<DownloadedMangaChapter[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Map<string, MangaDownloadProgress>>(new Map());
  const [loading, setLoading] = useState(true);

  // Load downloaded chapters on mount
  useEffect(() => {
    const loadDownloads = async () => {
      try {
        const database = await getDB();
        const allChapters = await database.getAll('chapters');
        setDownloads(allChapters);
      } catch (error) {
        console.error('Failed to load manga downloads:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDownloads();
  }, []);

  const downloadChapter = useCallback(async (
    mangaId: string,
    mangaTitle: string,
    chapterId: string,
    chapterNumber: string,
    pages: MangaPage[],
    chapterTitle?: string,
    coverImage?: string
  ) => {
    // Check if already downloaded
    const database = await getDB();
    const existing = await database.get('chapters', chapterId);
    if (existing) {
      toast.info('Chapter already downloaded');
      return existing;
    }

    if (pages.length === 0) {
      toast.error('No pages to download');
      return null;
    }

    // Start download
    setDownloadProgress(prev => new Map(prev).set(chapterId, {
      chapterId,
      progress: 0,
      status: 'downloading',
      currentPage: 0,
      totalPages: pages.length
    }));

    try {
      toast.loading(`Downloading Chapter ${chapterNumber}...`, { id: chapterId });
      
      const downloadedPages: MangaPage[] = [];
      let totalSize = 0;
      
      // Download each page
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        
        try {
          const blob = await fetchImageAsBlob(page.img);
          
          if (blob) {
            const base64 = await blobToBase64(blob);
            downloadedPages.push({
              page: page.page,
              img: base64 // Store as base64 data URL
            });
            totalSize += blob.size;
          } else {
            // Still add the page with original URL as fallback
            downloadedPages.push(page);
          }
        } catch (pageError) {
          console.error(`Failed to download page ${i + 1}:`, pageError);
          // Add page with original URL
          downloadedPages.push(page);
        }
        
        const progress = ((i + 1) / pages.length) * 100;
        setDownloadProgress(prev => new Map(prev).set(chapterId, {
          chapterId,
          progress,
          status: 'downloading',
          currentPage: i + 1,
          totalPages: pages.length
        }));
      }
      
      const downloadedChapter: DownloadedMangaChapter = {
        id: chapterId,
        mangaId,
        mangaTitle,
        chapterNumber,
        chapterTitle,
        pages: downloadedPages,
        coverImage,
        downloadedAt: Date.now(),
        size: totalSize,
        pageCount: downloadedPages.length
      };
      
      await database.put('chapters', downloadedChapter);
      
      setDownloads(prev => [...prev, downloadedChapter]);
      setDownloadProgress(prev => new Map(prev).set(chapterId, {
        chapterId,
        progress: 100,
        status: 'completed',
        currentPage: pages.length,
        totalPages: pages.length
      }));
      
      toast.success(`Chapter ${chapterNumber} downloaded!`, { id: chapterId });
      
      return downloadedChapter;
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadProgress(prev => new Map(prev).set(chapterId, {
        chapterId,
        progress: 0,
        status: 'error',
        currentPage: 0,
        totalPages: pages.length
      }));
      toast.error(`Failed to download Chapter ${chapterNumber}`, { id: chapterId });
      return null;
    }
  }, []);

  const deleteDownload = useCallback(async (chapterId: string) => {
    try {
      const database = await getDB();
      await database.delete('chapters', chapterId);
      setDownloads(prev => prev.filter(d => d.id !== chapterId));
      setDownloadProgress(prev => {
        const next = new Map(prev);
        next.delete(chapterId);
        return next;
      });
      toast.success('Chapter removed');
    } catch (error) {
      console.error('Failed to delete download:', error);
      toast.error('Failed to remove chapter');
    }
  }, []);

  const getDownloadedChapter = useCallback(async (chapterId: string) => {
    const database = await getDB();
    return database.get('chapters', chapterId);
  }, []);

  const getDownloadsByManga = useCallback(async (mangaId: string) => {
    const database = await getDB();
    return database.getAllFromIndex('chapters', 'by-manga', mangaId);
  }, []);

  const isDownloaded = useCallback((chapterId: string) => {
    return downloads.some(d => d.id === chapterId);
  }, [downloads]);

  const getStorageUsage = useCallback(async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
        percentage: estimate.quota ? ((estimate.usage || 0) / estimate.quota) * 100 : 0
      };
    }
    return null;
  }, []);

  const clearAllDownloads = useCallback(async () => {
    try {
      const database = await getDB();
      await database.clear('chapters');
      setDownloads([]);
      setDownloadProgress(new Map());
      toast.success('All manga downloads cleared');
    } catch (error) {
      console.error('Failed to clear downloads:', error);
      toast.error('Failed to clear downloads');
    }
  }, []);

  const getTotalDownloadSize = useCallback(() => {
    return downloads.reduce((total, chapter) => total + chapter.size, 0);
  }, [downloads]);

  return {
    downloads,
    downloadProgress,
    loading,
    downloadChapter,
    deleteDownload,
    getDownloadedChapter,
    getDownloadsByManga,
    isDownloaded,
    getStorageUsage,
    clearAllDownloads,
    getTotalDownloadSize
  };
};
