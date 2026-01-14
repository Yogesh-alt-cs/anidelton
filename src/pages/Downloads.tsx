import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Trash2, Play, HardDrive, AlertCircle, WifiOff, BookOpen, Video, Loader2, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOfflineDownload } from '@/hooks/useOfflineDownload';
import { useMangaOfflineDownload, DownloadedMangaChapter } from '@/hooks/useMangaOfflineDownload';
import { useStorageCleanup } from '@/hooks/useDownloadManager';
import BottomNav from '@/components/BottomNav';
import OfflinePlayer from '@/components/OfflinePlayer';
import OfflineMangaReader from '@/components/OfflineMangaReader';
import { cn } from '@/lib/utils';

const Downloads = () => {
  const navigate = useNavigate();
  const { 
    downloads: animeDownloads, 
    loading: loadingAnime, 
    deleteDownload: deleteAnimeDownload, 
    getDownloadedEpisode,
    getStorageUsage, 
    clearAllDownloads: clearAllAnimeDownloads 
  } = useOfflineDownload();
  
  const {
    downloads: mangaDownloads,
    loading: loadingManga,
    deleteDownload: deleteMangaDownload,
    getDownloadedChapter,
    clearAllDownloads: clearAllMangaDownloads
  } = useMangaOfflineDownload();
  
  const { autoCleanup } = useStorageCleanup();
  
  const [storageInfo, setStorageInfo] = useState<{ used: number; quota: number; percentage: number } | null>(null);
  const [playingEpisode, setPlayingEpisode] = useState<{ blobUrl: string; title: string; subtitle: string } | null>(null);
  const [readingChapter, setReadingChapter] = useState<{ chapter: DownloadedMangaChapter; currentPage: number } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeTab, setActiveTab] = useState<'anime' | 'manga'>('anime');
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const loading = loadingAnime || loadingManga;
  const totalDownloads = animeDownloads.length + mangaDownloads.length;
  const isStorageLow = storageInfo ? storageInfo.percentage >= 90 : false;
  const isStorageCritical = storageInfo ? storageInfo.percentage >= 95 : false;

  useEffect(() => {
    const loadStorage = async () => {
      const info = await getStorageUsage();
      setStorageInfo(info);
    };
    loadStorage();
  }, [getStorageUsage, animeDownloads, mangaDownloads]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handlePlayDownload = async (animeId: number, episodeNumber: number, title: string) => {
    const episode = await getDownloadedEpisode(animeId, episodeNumber);
    if (episode) {
      const blobUrl = URL.createObjectURL(episode.videoBlob);
      setPlayingEpisode({
        blobUrl,
        title: episode.animeTitle,
        subtitle: `Episode ${episode.episodeNumber}`
      });
    }
  };

  const closePlayer = () => {
    if (playingEpisode) {
      URL.revokeObjectURL(playingEpisode.blobUrl);
      setPlayingEpisode(null);
    }
  };

  const handleReadChapter = (chapter: DownloadedMangaChapter) => {
    setReadingChapter({ chapter, currentPage: 1 });
  };

  const closeReader = () => {
    setReadingChapter(null);
  };

  const handleClearAll = async () => {
    if (activeTab === 'anime') {
      await clearAllAnimeDownloads();
    } else {
      await clearAllMangaDownloads();
    }
  };

  // Group anime downloads by anime
  const groupedAnimeDownloads = animeDownloads.reduce((acc, download) => {
    if (!acc[download.animeId]) {
      acc[download.animeId] = {
        animeTitle: download.animeTitle,
        animeId: download.animeId,
        episodes: []
      };
    }
    acc[download.animeId].episodes.push(download);
    return acc;
  }, {} as Record<number, { animeTitle: string; animeId: number; episodes: typeof animeDownloads }>);

  // Group manga downloads by manga
  const groupedMangaDownloads = mangaDownloads.reduce((acc, download) => {
    if (!acc[download.mangaId]) {
      acc[download.mangaId] = {
        mangaTitle: download.mangaTitle,
        mangaId: download.mangaId,
        chapters: []
      };
    }
    acc[download.mangaId].chapters.push(download);
    return acc;
  }, {} as Record<string, { mangaTitle: string; mangaId: string; chapters: DownloadedMangaChapter[] }>);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-inter font-bold text-lg">Downloads</h1>
              <p className="text-xs text-muted-foreground">
                {totalDownloads} items saved
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isOnline && (
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/20 text-yellow-500 text-xs">
                <WifiOff className="w-3 h-3" />
                Offline
              </div>
            )}
            {((activeTab === 'anime' && animeDownloads.length > 0) || 
              (activeTab === 'manga' && mangaDownloads.length > 0)) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleClearAll}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Offline Player Modal */}
      {playingEpisode && (
        <div className="fixed inset-0 z-50 bg-black">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-4 left-4 z-50 text-white"
            onClick={closePlayer}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <OfflinePlayer
            blobUrl={playingEpisode.blobUrl}
            title={playingEpisode.title}
            subtitle={playingEpisode.subtitle}
            className="w-full h-full"
          />
        </div>
      )}

      {/* Offline Manga Reader Modal */}
      {readingChapter && (
        <OfflineMangaReader
          pages={readingChapter.chapter.pages}
          currentPage={readingChapter.currentPage}
          onPageChange={(page) => setReadingChapter(prev => prev ? { ...prev, currentPage: page } : null)}
          onClose={closeReader}
          chapterTitle={`Ch. ${readingChapter.chapter.chapterNumber}`}
          mangaTitle={readingChapter.chapter.mangaTitle}
        />
      )}

      {/* Storage Info */}
      {storageInfo && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm">
              <HardDrive className="w-4 h-4 text-muted-foreground" />
              <span>Storage Used</span>
            </div>
            <span className={cn(
              "text-sm",
              isStorageCritical ? "text-red-500" : isStorageLow ? "text-yellow-500" : "text-muted-foreground"
            )}>
              {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.quota)}
            </span>
          </div>
          <Progress 
            value={storageInfo.percentage} 
            className={cn(
              "h-2",
              isStorageCritical && "[&>div]:bg-red-500",
              isStorageLow && !isStorageCritical && "[&>div]:bg-yellow-500"
            )}
          />
          {isStorageLow && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-3"
              onClick={async () => {
                setIsCleaningUp(true);
                try {
                  await autoCleanup(75);
                  const info = await getStorageUsage();
                  setStorageInfo(info);
                } finally {
                  setIsCleaningUp(false);
                }
              }}
              disabled={isCleaningUp}
            >
              {isCleaningUp ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash className="w-4 h-4 mr-2" />
              )}
              Clean Up Old Downloads
            </Button>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'anime' | 'manga')} className="w-full">
        <div className="px-4 pt-4">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="anime" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Anime ({animeDownloads.length})
            </TabsTrigger>
            <TabsTrigger value="manga" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Manga ({mangaDownloads.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Anime Downloads */}
        <TabsContent value="anime" className="p-4 space-y-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-card shimmer" />
              ))}
            </div>
          ) : animeDownloads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Video className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Anime Downloads</h2>
              <p className="text-muted-foreground max-w-xs">
                Download episodes to watch offline when you don't have internet.
              </p>
              <Button 
                variant="default" 
                className="mt-6"
                onClick={() => navigate('/')}
              >
                Browse Anime
              </Button>
            </div>
          ) : (
            Object.values(groupedAnimeDownloads).map((group) => (
              <div key={group.animeId} className="space-y-3">
                <Link 
                  to={`/anime/${group.animeId}`}
                  className="font-inter font-bold text-lg hover:text-primary transition-colors"
                >
                  {group.animeTitle}
                </Link>
                
                <div className="space-y-1.5">
                  {group.episodes
                    .sort((a, b) => a.episodeNumber - b.episodeNumber)
                    .map((episode) => (
                      <div 
                        key={episode.id}
                        className="flex items-center gap-2.5 p-2 rounded-lg bg-card border border-border/50 group"
                      >
                        {/* Thumbnail */}
                        <div 
                          className="relative w-20 h-14 sm:w-24 sm:h-16 rounded-md overflow-hidden bg-secondary cursor-pointer flex-shrink-0"
                          onClick={() => handlePlayDownload(episode.animeId, episode.episodeNumber, episode.animeTitle)}
                        >
                          {episode.thumbnail ? (
                            <img 
                              src={episode.thumbnail} 
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                              <Play className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-6 h-6 text-white fill-current" />
                          </div>
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            Ep {episode.episodeNumber}
                            {episode.episodeTitle && `: ${episode.episodeTitle}`}
                          </h4>
                          <p className="text-[10px] text-muted-foreground">
                            {formatBytes(episode.size)} • {new Date(episode.downloadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handlePlayDownload(episode.animeId, episode.episodeNumber, episode.animeTitle)}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteAnimeDownload(episode.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* Manga Downloads */}
        <TabsContent value="manga" className="p-4 space-y-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-card shimmer" />
              ))}
            </div>
          ) : mangaDownloads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Manga Downloads</h2>
              <p className="text-muted-foreground max-w-xs">
                Download chapters to read offline when you don't have internet.
              </p>
              <Button 
                variant="default" 
                className="mt-6"
                onClick={() => navigate('/manga')}
              >
                Browse Manga
              </Button>
            </div>
          ) : (
            Object.values(groupedMangaDownloads).map((group) => (
              <div key={group.mangaId} className="space-y-3">
                <Link 
                  to={`/manga/${group.mangaId}`}
                  className="font-inter font-bold text-lg hover:text-primary transition-colors"
                >
                  {group.mangaTitle}
                </Link>
                
                <div className="space-y-1.5">
                  {group.chapters
                    .sort((a, b) => parseFloat(a.chapterNumber) - parseFloat(b.chapterNumber))
                    .map((chapter) => (
                      <div 
                        key={chapter.id}
                        className="flex items-center gap-2.5 p-2 rounded-lg bg-card border border-border/50 group"
                      >
                        {/* Thumbnail */}
                        <div 
                          className="relative w-14 h-20 sm:w-16 sm:h-24 rounded-md overflow-hidden bg-secondary cursor-pointer flex-shrink-0"
                          onClick={() => handleReadChapter(chapter)}
                        >
                          {chapter.coverImage ? (
                            <img 
                              src={chapter.coverImage} 
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                              <BookOpen className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                            <BookOpen className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            Ch. {chapter.chapterNumber}
                            {chapter.chapterTitle && `: ${chapter.chapterTitle}`}
                          </h4>
                          <p className="text-[10px] text-muted-foreground">
                            {chapter.pageCount} pages • {formatBytes(chapter.size)} • {new Date(chapter.downloadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleReadChapter(chapter)}
                          >
                            <BookOpen className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteMangaDownload(chapter.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      <BottomNav />
    </div>
  );
};

export default Downloads;
