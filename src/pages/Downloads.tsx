import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Trash2, Play, HardDrive, AlertCircle, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useOfflineDownload } from '@/hooks/useOfflineDownload';
import BottomNav from '@/components/BottomNav';
import OfflinePlayer from '@/components/OfflinePlayer';
import { cn } from '@/lib/utils';

const Downloads = () => {
  const navigate = useNavigate();
  const { 
    downloads, 
    loading, 
    deleteDownload, 
    getDownloadedEpisode,
    getStorageUsage, 
    clearAllDownloads 
  } = useOfflineDownload();
  
  const [storageInfo, setStorageInfo] = useState<{ used: number; quota: number; percentage: number } | null>(null);
  const [playingEpisode, setPlayingEpisode] = useState<{ blobUrl: string; title: string; subtitle: string } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const loadStorage = async () => {
      const info = await getStorageUsage();
      setStorageInfo(info);
    };
    loadStorage();
  }, [getStorageUsage, downloads]);

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

  // Group downloads by anime
  const groupedDownloads = downloads.reduce((acc, download) => {
    if (!acc[download.animeId]) {
      acc[download.animeId] = {
        animeTitle: download.animeTitle,
        animeId: download.animeId,
        episodes: []
      };
    }
    acc[download.animeId].episodes.push(download);
    return acc;
  }, {} as Record<number, { animeTitle: string; animeId: number; episodes: typeof downloads }>);

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
                {downloads.length} episodes saved
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
            {downloads.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearAllDownloads}
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

      {/* Storage Info */}
      {storageInfo && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm">
              <HardDrive className="w-4 h-4 text-muted-foreground" />
              <span>Storage Used</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.quota)}
            </span>
          </div>
          <Progress value={storageInfo.percentage} className="h-2" />
        </div>
      )}

      {/* Downloads List */}
      <div className="p-4 space-y-6">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-card shimmer" />
            ))}
          </div>
        ) : downloads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Download className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Downloads</h2>
            <p className="text-muted-foreground max-w-xs">
              Download episodes to watch offline when you don't have internet.
            </p>
            <Button 
              variant="gradient" 
              className="mt-6"
              onClick={() => navigate('/')}
            >
              Browse Anime
            </Button>
          </div>
        ) : (
          Object.values(groupedDownloads).map((group) => (
            <div key={group.animeId} className="space-y-3">
              <Link 
                to={`/anime/${group.animeId}`}
                className="font-inter font-bold text-lg hover:text-primary transition-colors"
              >
                {group.animeTitle}
              </Link>
              
              <div className="space-y-2">
                {group.episodes
                  .sort((a, b) => a.episodeNumber - b.episodeNumber)
                  .map((episode) => (
                    <div 
                      key={episode.id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border/50 group"
                    >
                      {/* Thumbnail */}
                      <div 
                        className="relative w-24 h-16 rounded-lg overflow-hidden bg-secondary cursor-pointer"
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
                            <Play className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-8 h-8 text-white fill-current" />
                        </div>
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          Episode {episode.episodeNumber}
                          {episode.episodeTitle && `: ${episode.episodeTitle}`}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(episode.size)} • Downloaded {new Date(episode.downloadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePlayDownload(episode.animeId, episode.episodeNumber, episode.animeTitle)}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteDownload(episode.id)}
                          className="text-destructive"
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
      </div>

      <BottomNav />
    </div>
  );
};

export default Downloads;
