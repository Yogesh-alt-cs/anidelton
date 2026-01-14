import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export type DownloadType = 'anime' | 'manga';
export type DownloadStatus = 'queued' | 'downloading' | 'paused' | 'completed' | 'error';

export interface QueuedDownload {
  id: string;
  type: DownloadType;
  title: string;
  subtitle: string;
  status: DownloadStatus;
  progress: number;
  size: number;
  addedAt: number;
  // Anime specific
  animeId?: number;
  episodeNumber?: number;
  videoUrl?: string;
  thumbnail?: string;
  // Manga specific
  mangaId?: string;
  chapterId?: string;
  chapterNumber?: string;
  pages?: Array<{ page: number; img: string }>;
  coverImage?: string;
  currentPage?: number;
  totalPages?: number;
}

export interface StorageInfo {
  used: number;
  quota: number;
  percentage: number;
  isLow: boolean; // Below 10% remaining
  isCritical: boolean; // Below 5% remaining
}

// Storage thresholds
const LOW_STORAGE_THRESHOLD = 90; // 90% used
const CRITICAL_STORAGE_THRESHOLD = 95; // 95% used
const AUTO_CLEANUP_THRESHOLD = 85; // Start cleanup when 85% used

// Max concurrent downloads
const MAX_CONCURRENT_DOWNLOADS = 2;

// Global download queue state (shared across hook instances)
let globalQueue: QueuedDownload[] = [];
let globalListeners: Set<() => void> = new Set();
let isProcessing = false;
let isPaused = false;
let activeDownloads = 0;
let abortControllers: Map<string, AbortController> = new Map();

const notifyListeners = () => {
  globalListeners.forEach(listener => listener());
};

export const useDownloadManager = () => {
  const [queue, setQueue] = useState<QueuedDownload[]>(globalQueue);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [globalPaused, setGlobalPaused] = useState(isPaused);

  // Subscribe to global queue changes
  useEffect(() => {
    const listener = () => {
      setQueue([...globalQueue]);
      setGlobalPaused(isPaused);
    };
    globalListeners.add(listener);
    return () => {
      globalListeners.delete(listener);
    };
  }, []);

  // Load storage info
  const refreshStorageInfo = useCallback(async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota ? (used / quota) * 100 : 0;
      
      const info: StorageInfo = {
        used,
        quota,
        percentage,
        isLow: percentage >= LOW_STORAGE_THRESHOLD,
        isCritical: percentage >= CRITICAL_STORAGE_THRESHOLD
      };
      setStorageInfo(info);
      return info;
    }
    return null;
  }, []);

  useEffect(() => {
    refreshStorageInfo();
    const interval = setInterval(refreshStorageInfo, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [refreshStorageInfo]);

  // Add to queue
  const addToQueue = useCallback((download: Omit<QueuedDownload, 'status' | 'progress' | 'size' | 'addedAt'>) => {
    // Check if already in queue or downloaded
    const exists = globalQueue.some(d => d.id === download.id);
    if (exists) {
      toast.info('Already in download queue');
      return;
    }

    const queueItem: QueuedDownload = {
      ...download,
      status: 'queued',
      progress: 0,
      size: 0,
      addedAt: Date.now()
    };

    globalQueue.push(queueItem);
    notifyListeners();
    
    // Start processing if not already
    processQueue();
  }, []);

  // Add multiple items to queue (batch)
  const addBatchToQueue = useCallback((downloads: Array<Omit<QueuedDownload, 'status' | 'progress' | 'size' | 'addedAt'>>) => {
    let added = 0;
    
    downloads.forEach(download => {
      const exists = globalQueue.some(d => d.id === download.id);
      if (!exists) {
        globalQueue.push({
          ...download,
          status: 'queued',
          progress: 0,
          size: 0,
          addedAt: Date.now()
        });
        added++;
      }
    });

    if (added > 0) {
      notifyListeners();
      toast.success(`Added ${added} items to download queue`);
      processQueue();
    } else {
      toast.info('All items already in queue');
    }
  }, []);

  // Remove from queue
  const removeFromQueue = useCallback((id: string) => {
    // Abort if downloading
    const controller = abortControllers.get(id);
    if (controller) {
      controller.abort();
      abortControllers.delete(id);
    }

    globalQueue = globalQueue.filter(d => d.id !== id);
    notifyListeners();
  }, []);

  // Clear completed downloads from queue
  const clearCompleted = useCallback(() => {
    globalQueue = globalQueue.filter(d => d.status !== 'completed' && d.status !== 'error');
    notifyListeners();
  }, []);

  // Pause a download
  const pauseDownload = useCallback((id: string) => {
    const download = globalQueue.find(d => d.id === id);
    if (download && download.status === 'downloading') {
      const controller = abortControllers.get(id);
      if (controller) {
        controller.abort();
        abortControllers.delete(id);
      }
      download.status = 'paused';
      activeDownloads = Math.max(0, activeDownloads - 1);
      notifyListeners();
    }
  }, []);

  // Resume a download
  const resumeDownload = useCallback((id: string) => {
    const download = globalQueue.find(d => d.id === id);
    if (download && (download.status === 'paused' || download.status === 'error')) {
      download.status = 'queued';
      download.progress = 0; // Reset progress for retry
      notifyListeners();
      processQueue();
    }
  }, []);

  // Pause all downloads
  const pauseAll = useCallback(() => {
    isPaused = true;
    // Abort all active downloads
    abortControllers.forEach((controller, id) => {
      controller.abort();
      const download = globalQueue.find(d => d.id === id);
      if (download) {
        download.status = 'paused';
      }
    });
    abortControllers.clear();
    activeDownloads = 0;
    notifyListeners();
  }, []);

  // Resume all downloads
  const resumeAll = useCallback(() => {
    isPaused = false;
    // Reset paused downloads to queued
    globalQueue.forEach(download => {
      if (download.status === 'paused') {
        download.status = 'queued';
      }
    });
    notifyListeners();
    processQueue();
  }, []);

  // Retry failed download
  const retryDownload = useCallback((id: string) => {
    const download = globalQueue.find(d => d.id === id);
    if (download && download.status === 'error') {
      download.status = 'queued';
      download.progress = 0;
      notifyListeners();
      processQueue();
    }
  }, []);

  // Reorder queue
  const moveInQueue = useCallback((id: string, direction: 'up' | 'down') => {
    const index = globalQueue.findIndex(d => d.id === id);
    if (index === -1) return;

    const download = globalQueue[index];
    if (download.status !== 'queued') return; // Only move queued items

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= globalQueue.length) return;

    // Swap
    globalQueue[index] = globalQueue[newIndex];
    globalQueue[newIndex] = download;
    notifyListeners();
  }, []);

  // Get queue stats
  const getQueueStats = useCallback(() => {
    const queued = globalQueue.filter(d => d.status === 'queued').length;
    const downloading = globalQueue.filter(d => d.status === 'downloading').length;
    const paused = globalQueue.filter(d => d.status === 'paused').length;
    const completed = globalQueue.filter(d => d.status === 'completed').length;
    const failed = globalQueue.filter(d => d.status === 'error').length;
    const total = globalQueue.length;

    return { queued, downloading, paused, completed, failed, total };
  }, []);

  return {
    queue,
    storageInfo,
    globalPaused,
    addToQueue,
    addBatchToQueue,
    removeFromQueue,
    clearCompleted,
    pauseDownload,
    resumeDownload,
    pauseAll,
    resumeAll,
    retryDownload,
    moveInQueue,
    getQueueStats,
    refreshStorageInfo
  };
};

// Process the download queue
const processQueue = async () => {
  if (isProcessing || isPaused) return;
  isProcessing = true;

  while (!isPaused) {
    // Check if we can start more downloads
    if (activeDownloads >= MAX_CONCURRENT_DOWNLOADS) {
      break;
    }

    // Find next queued download
    const nextDownload = globalQueue.find(d => d.status === 'queued');
    if (!nextDownload) {
      break;
    }

    // Start download
    activeDownloads++;
    nextDownload.status = 'downloading';
    notifyListeners();

    // Create abort controller
    const controller = new AbortController();
    abortControllers.set(nextDownload.id, controller);

    try {
      if (nextDownload.type === 'anime') {
        await downloadAnimeEpisode(nextDownload, controller.signal);
      } else {
        await downloadMangaChapter(nextDownload, controller.signal);
      }
      
      nextDownload.status = 'completed';
      nextDownload.progress = 100;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Download was paused/cancelled - only set paused if not already set
        if (nextDownload.status === 'downloading') {
          nextDownload.status = 'paused';
        }
      } else {
        console.error('Download error:', error);
        nextDownload.status = 'error';
      }
    } finally {
      abortControllers.delete(nextDownload.id);
      activeDownloads = Math.max(0, activeDownloads - 1);
      notifyListeners();
    }
  }

  isProcessing = false;
  
  // Continue processing if there are more items
  const hasMore = globalQueue.some(d => d.status === 'queued');
  if (hasMore && !isPaused && activeDownloads < MAX_CONCURRENT_DOWNLOADS) {
    setTimeout(processQueue, 100);
  }
};

// Download anime episode
const downloadAnimeEpisode = async (download: QueuedDownload, signal: AbortSignal) => {
  const { openDB } = await import('idb');
  
  if (!download.videoUrl) {
    throw new Error('No video URL');
  }

  const response = await fetch(download.videoUrl, { signal });
  if (!response.ok) throw new Error('Failed to fetch video');

  const contentLength = response.headers.get('content-length');
  const totalSize = contentLength ? parseInt(contentLength) : 0;

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const chunks: BlobPart[] = [];
  let receivedLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    if (signal.aborted) {
      reader.cancel();
      throw new DOMException('Aborted', 'AbortError');
    }

    chunks.push(value);
    receivedLength += value.length;

    download.progress = totalSize > 0 ? (receivedLength / totalSize) * 100 : 0;
    download.size = receivedLength;
    notifyListeners();
  }

  const blob = new Blob(chunks, { type: 'video/mp4' });

  // Save to IndexedDB
  const db = await openDB('anidel-offline', 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('episodes')) {
        const store = database.createObjectStore('episodes', { keyPath: 'id' });
        store.createIndex('by-anime', 'animeId');
      }
    }
  });

  await db.put('episodes', {
    id: download.id,
    animeId: download.animeId,
    animeTitle: download.title,
    episodeNumber: download.episodeNumber,
    episodeTitle: download.subtitle,
    videoBlob: blob,
    thumbnail: download.thumbnail,
    downloadedAt: Date.now(),
    size: blob.size
  });

  download.size = blob.size;
  toast.success(`Downloaded: ${download.title} - ${download.subtitle}`);
};

// Download manga chapter
const downloadMangaChapter = async (download: QueuedDownload, signal: AbortSignal) => {
  const { openDB } = await import('idb');
  
  if (!download.pages || download.pages.length === 0) {
    throw new Error('No pages to download');
  }

  const downloadedPages: Array<{ page: number; img: string }> = [];
  let totalSize = 0;

  for (let i = 0; i < download.pages.length; i++) {
    if (signal.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const page = download.pages[i];
    
    try {
      const response = await fetch(page.img, { signal });
      if (response.ok) {
        const blob = await response.blob();
        const base64 = await blobToBase64(blob);
        downloadedPages.push({ page: page.page, img: base64 });
        totalSize += blob.size;
      } else {
        downloadedPages.push(page);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') throw error;
      downloadedPages.push(page);
    }

    download.progress = ((i + 1) / download.pages.length) * 100;
    download.currentPage = i + 1;
    download.size = totalSize;
    notifyListeners();
  }

  // Save to IndexedDB
  const db = await openDB('anidel-manga-offline', 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('chapters')) {
        const store = database.createObjectStore('chapters', { keyPath: 'id' });
        store.createIndex('by-manga', 'mangaId');
      }
    }
  });

  await db.put('chapters', {
    id: download.chapterId,
    mangaId: download.mangaId,
    mangaTitle: download.title,
    chapterNumber: download.chapterNumber,
    chapterTitle: download.subtitle,
    pages: downloadedPages,
    coverImage: download.coverImage,
    downloadedAt: Date.now(),
    size: totalSize,
    pageCount: downloadedPages.length
  });

  download.size = totalSize;
  toast.success(`Downloaded: ${download.title} - Ch. ${download.chapterNumber}`);
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Storage cleanup utilities
export const useStorageCleanup = () => {
  const { refreshStorageInfo } = useDownloadManager();

  const getOldestDownloads = useCallback(async (count: number) => {
    const { openDB } = await import('idb');
    
    const items: Array<{ id: string; type: DownloadType; title: string; downloadedAt: number; size: number }> = [];

    // Get anime downloads
    try {
      const animeDb = await openDB('anidel-offline', 1);
      const episodes = await animeDb.getAll('episodes');
      episodes.forEach(ep => {
        items.push({
          id: ep.id,
          type: 'anime',
          title: `${ep.animeTitle} - Ep ${ep.episodeNumber}`,
          downloadedAt: ep.downloadedAt,
          size: ep.size
        });
      });
    } catch {}

    // Get manga downloads
    try {
      const mangaDb = await openDB('anidel-manga-offline', 1);
      const chapters = await mangaDb.getAll('chapters');
      chapters.forEach(ch => {
        items.push({
          id: ch.id,
          type: 'manga',
          title: `${ch.mangaTitle} - Ch. ${ch.chapterNumber}`,
          downloadedAt: ch.downloadedAt,
          size: ch.size
        });
      });
    } catch {}

    // Sort by oldest first
    items.sort((a, b) => a.downloadedAt - b.downloadedAt);
    
    return items.slice(0, count);
  }, []);

  const deleteDownload = useCallback(async (id: string, type: DownloadType) => {
    const { openDB } = await import('idb');
    
    if (type === 'anime') {
      const db = await openDB('anidel-offline', 1);
      await db.delete('episodes', id);
    } else {
      const db = await openDB('anidel-manga-offline', 1);
      await db.delete('chapters', id);
    }
  }, []);

  const autoCleanup = useCallback(async (targetPercentage: number = 80) => {
    const storageInfo = await refreshStorageInfo();
    if (!storageInfo || storageInfo.percentage < AUTO_CLEANUP_THRESHOLD) {
      return { deleted: 0, freedSpace: 0 };
    }

    let deleted = 0;
    let freedSpace = 0;
    const targetUsed = (targetPercentage / 100) * storageInfo.quota;
    const toFree = storageInfo.used - targetUsed;

    if (toFree <= 0) {
      return { deleted: 0, freedSpace: 0 };
    }

    const oldest = await getOldestDownloads(20);
    
    for (const item of oldest) {
      if (freedSpace >= toFree) break;
      
      await deleteDownload(item.id, item.type);
      deleted++;
      freedSpace += item.size;
    }

    if (deleted > 0) {
      toast.info(`Cleaned up ${deleted} old downloads to free space`);
    }

    await refreshStorageInfo();
    return { deleted, freedSpace };
  }, [getOldestDownloads, deleteDownload, refreshStorageInfo]);

  return {
    getOldestDownloads,
    deleteDownload,
    autoCleanup
  };
};
