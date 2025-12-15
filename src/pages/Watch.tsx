import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Settings, 
  Maximize, 
  Minimize,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Subtitles,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useAnimeStreaming } from '@/hooks/useAnimeStreaming';
import { useWatchProgress } from '@/hooks/useWatchProgress';
import { useAuth } from '@/contexts/AuthContext';

const Watch = () => {
  const { animeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const episodeParam = searchParams.get('ep') || '1';
  const [currentEpisode, setCurrentEpisode] = useState(parseInt(episodeParam));
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('auto');
  
  const { getAnimeInfo, getEpisodeSources, loading, error } = useAnimeStreaming();
  const { updateProgress, getEpisodeProgress } = useWatchProgress(animeId ? parseInt(animeId) : undefined);
  
  const [animeInfo, setAnimeInfo] = useState<any>(null);
  const [sources, setSources] = useState<any>(null);
  const [streamUrl, setStreamUrl] = useState<string>('');

  // Fetch anime info
  useEffect(() => {
    const fetchInfo = async () => {
      if (!animeId) return;
      
      // Convert MAL ID to gogoanime ID (simplified - in production you'd need a mapping)
      const searchQuery = animeId;
      const info = await getAnimeInfo(searchQuery);
      if (info) {
        setAnimeInfo(info);
      }
    };
    
    fetchInfo();
  }, [animeId, getAnimeInfo]);

  // Fetch episode sources
  useEffect(() => {
    const fetchSources = async () => {
      if (!animeInfo?.episodes?.length) return;
      
      const episode = animeInfo.episodes.find((ep: any) => ep.number === currentEpisode);
      if (!episode) return;
      
      const sourcesData = await getEpisodeSources(episode.id);
      if (sourcesData) {
        setSources(sourcesData);
        
        // Select best quality source
        const qualityOrder = ['1080p', '720p', '480p', '360p', 'default', 'backup'];
        const sortedSources = sourcesData.sources.sort((a: any, b: any) => {
          const aIndex = qualityOrder.findIndex(q => a.quality?.toLowerCase().includes(q));
          const bIndex = qualityOrder.findIndex(q => b.quality?.toLowerCase().includes(q));
          return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
        });
        
        if (sortedSources.length > 0) {
          setStreamUrl(sortedSources[0].url);
        }
      }
    };
    
    fetchSources();
  }, [animeInfo, currentEpisode, getEpisodeSources]);

  // Restore progress
  useEffect(() => {
    if (animeId && user) {
      const progress = getEpisodeProgress(currentEpisode);
      if (progress && videoRef.current) {
        videoRef.current.currentTime = progress.progress_seconds;
      }
    }
  }, [animeId, currentEpisode, user, getEpisodeProgress]);

  // Save progress periodically
  useEffect(() => {
    if (!animeId || !user) return;
    
    const interval = setInterval(() => {
      if (videoRef.current && currentTime > 0) {
        updateProgress(
          parseInt(animeId),
          currentEpisode,
          Math.floor(currentTime),
          Math.floor(duration)
        );
      }
    }, 30000); // Save every 30 seconds
    
    return () => clearInterval(interval);
  }, [animeId, currentEpisode, currentTime, duration, user, updateProgress]);

  // Control visibility timeout
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const hideControls = () => {
      if (isPlaying && !showSettings && !showEpisodes) {
        setShowControls(false);
      }
    };
    
    if (showControls) {
      timeout = setTimeout(hideControls, 3000);
    }
    
    return () => clearTimeout(timeout);
  }, [showControls, isPlaying, showSettings, showEpisodes]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!isFullscreen) {
        containerRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const vol = value[0];
    setVolume(vol);
    setIsMuted(vol === 0);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime += 10;
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime -= 10;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const changeEpisode = (ep: number) => {
    // Save current progress before changing
    if (animeId && user && currentTime > 0) {
      updateProgress(
        parseInt(animeId),
        currentEpisode,
        Math.floor(currentTime),
        Math.floor(duration)
      );
    }
    
    setCurrentEpisode(ep);
    setShowEpisodes(false);
    navigate(`/watch/${animeId}?ep=${ep}`, { replace: true });
  };

  return (
    <div 
      ref={containerRef}
      className="relative min-h-screen bg-black"
      onMouseMove={() => setShowControls(true)}
      onClick={() => setShowControls(true)}
    >
      {/* Video Player */}
      <div className="relative w-full h-screen flex items-center justify-center">
        {loading && !streamUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        )}
        
        {streamUrl && (
          <video
            ref={videoRef}
            src={streamUrl}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={togglePlay}
          />
        )}
        
        {/* Overlay Controls */}
        <div 
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-300",
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            
            <div className="text-center flex-1 px-4">
              <h1 className="text-white font-medium truncate">
                {animeInfo?.title || 'Loading...'}
              </h1>
              <p className="text-white/70 text-sm">Episode {currentEpisode}</p>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-6 h-6" />
            </Button>
          </div>

          {/* Center Play Button */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Button
              variant="ghost"
              size="icon"
              className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 pointer-events-auto"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="w-10 h-10" />
              ) : (
                <Play className="w-10 h-10 ml-1" />
              )}
            </Button>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
            {/* Progress Bar */}
            <div className="flex items-center gap-3">
              <span className="text-white/70 text-sm w-12">{formatTime(currentTime)}</span>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={handleSeek}
                className="flex-1"
              />
              <span className="text-white/70 text-sm w-12">{formatTime(duration)}</span>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
                <div className="w-24 hidden sm:block">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.1}
                    onValueChange={handleVolumeChange}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={skipBackward}
                >
                  <SkipBack className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={skipForward}
                >
                  <SkipForward className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 gap-1"
                  onClick={() => setShowEpisodes(!showEpisodes)}
                >
                  Episodes
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute top-16 right-4 w-64 bg-card/95 backdrop-blur-sm rounded-xl p-4 space-y-4 z-50">
            <h3 className="font-medium">Quality</h3>
            <div className="space-y-2">
              {sources?.sources?.map((source: any, index: number) => (
                <button
                  key={index}
                  onClick={() => {
                    setStreamUrl(source.url);
                    setSelectedQuality(source.quality || 'default');
                    setShowSettings(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    streamUrl === source.url 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-secondary"
                  )}
                >
                  {source.quality || 'Default'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Episodes Panel */}
        {showEpisodes && (
          <div className="absolute bottom-24 right-4 w-64 max-h-80 bg-card/95 backdrop-blur-sm rounded-xl overflow-hidden z-50">
            <div className="p-3 border-b border-border">
              <h3 className="font-medium">Episodes</h3>
            </div>
            <div className="overflow-y-auto max-h-64 p-2 space-y-1">
              {animeInfo?.episodes?.map((ep: any) => (
                <button
                  key={ep.id}
                  onClick={() => changeEpisode(ep.number)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    currentEpisode === ep.number
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary"
                  )}
                >
                  Episode {ep.number}
                  {ep.title && <span className="block text-xs opacity-70 truncate">{ep.title}</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Watch;
