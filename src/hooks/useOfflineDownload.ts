import React, { useState, useEffect, useCallback } from 'react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { toast } from 'sonner';

interface DownloadedEpisode {
  id: string;
  animeId: number;
  animeTitle: string;
  episodeNumber: number;
  episodeTitle?: string;
  videoBlob: Blob;
  thumbnail?: string;
  downloadedAt: number;
  size: number;
}

interface DownloadProgress {
  episodeId: string;
  progress: number;
  status: 'downloading' | 'completed' | 'error' | 'paused';
}

interface AnimeDownloadDB extends DBSchema {
  episodes: {
    key: string;
    value: DownloadedEpisode;
    indexes: { 'by-anime': number };
  };
}

let db: IDBPDatabase<AnimeDownloadDB> | null = null;

const getDB = async () => {
  if (db) return db;
  
  db = await openDB<AnimeDownloadDB>('anidel-offline', 1, {
    upgrade(database) {
      const episodeStore = database.createObjectStore('episodes', { keyPath: 'id' });
      episodeStore.createIndex('by-anime', 'animeId');
    },
  });
  
  return db;
};

export const useOfflineDownload = () => {
  const [downloads, setDownloads] = useState<DownloadedEpisode[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Map<string, DownloadProgress>>(new Map());
  const [loading, setLoading] = useState(true);

  // Load downloaded episodes on mount
  useEffect(() => {
    const loadDownloads = async () => {
      try {
        const database = await getDB();
        const allEpisodes = await database.getAll('episodes');
        setDownloads(allEpisodes);
      } catch (error) {
        console.error('Failed to load downloads:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDownloads();
  }, []);

  const downloadEpisode = useCallback(async (
    animeId: number,
    animeTitle: string,
    episodeNumber: number,
    videoUrl: string,
    episodeTitle?: string,
    thumbnail?: string
  ) => {
    const episodeId = `${animeId}-${episodeNumber}`;
    
    // Check if already downloaded
    const database = await getDB();
    const existing = await database.get('episodes', episodeId);
    if (existing) {
      toast.info('Episode already downloaded');
      return existing;
    }

    // Start download
    setDownloadProgress(prev => new Map(prev).set(episodeId, {
      episodeId,
      progress: 0,
      status: 'downloading'
    }));

    try {
      toast.loading(`Downloading Episode ${episodeNumber}...`, { id: episodeId });
      
      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error('Failed to fetch video');
      
      const contentLength = response.headers.get('content-length');
      const totalSize = contentLength ? parseInt(contentLength) : 0;
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');
      
      const chunks: Uint8Array[] = [];
      let receivedLength = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        receivedLength += value.length;
        
        const progress = totalSize > 0 ? (receivedLength / totalSize) * 100 : 0;
        setDownloadProgress(prev => new Map(prev).set(episodeId, {
          episodeId,
          progress,
          status: 'downloading'
        }));
      }
      
      const blob = new Blob(chunks as BlobPart[], { type: 'video/mp4' });
      
      const downloadedEpisode: DownloadedEpisode = {
        id: episodeId,
        animeId,
        animeTitle,
        episodeNumber,
        episodeTitle,
        videoBlob: blob,
        thumbnail,
        downloadedAt: Date.now(),
        size: blob.size
      };
      
      await database.put('episodes', downloadedEpisode);
      
      setDownloads(prev => [...prev, downloadedEpisode]);
      setDownloadProgress(prev => new Map(prev).set(episodeId, {
        episodeId,
        progress: 100,
        status: 'completed'
      }));
      
      toast.success(`Episode ${episodeNumber} downloaded!`, { id: episodeId });
      
      return downloadedEpisode;
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadProgress(prev => new Map(prev).set(episodeId, {
        episodeId,
        progress: 0,
        status: 'error'
      }));
      toast.error(`Failed to download Episode ${episodeNumber}`, { id: episodeId });
      return null;
    }
  }, []);

  const deleteDownload = useCallback(async (episodeId: string) => {
    try {
      const database = await getDB();
      await database.delete('episodes', episodeId);
      setDownloads(prev => prev.filter(d => d.id !== episodeId));
      toast.success('Download removed');
    } catch (error) {
      console.error('Failed to delete download:', error);
      toast.error('Failed to remove download');
    }
  }, []);

  const getDownloadedEpisode = useCallback(async (animeId: number, episodeNumber: number) => {
    const episodeId = `${animeId}-${episodeNumber}`;
    const database = await getDB();
    return database.get('episodes', episodeId);
  }, []);

  const getDownloadsByAnime = useCallback(async (animeId: number) => {
    const database = await getDB();
    return database.getAllFromIndex('episodes', 'by-anime', animeId);
  }, []);

  const isDownloaded = useCallback((animeId: number, episodeNumber: number) => {
    const episodeId = `${animeId}-${episodeNumber}`;
    return downloads.some(d => d.id === episodeId);
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
      await database.clear('episodes');
      setDownloads([]);
      toast.success('All downloads cleared');
    } catch (error) {
      console.error('Failed to clear downloads:', error);
      toast.error('Failed to clear downloads');
    }
  }, []);

  return {
    downloads,
    downloadProgress,
    loading,
    downloadEpisode,
    deleteDownload,
    getDownloadedEpisode,
    getDownloadsByAnime,
    isDownloaded,
    getStorageUsage,
    clearAllDownloads
  };
};
