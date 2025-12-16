import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronDown,
  Loader2,
  AlertCircle,
  Server,
  Settings,
  Tv,
  Film,
  Download,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAnimeStreaming, StreamingProvider, EpisodeSource } from '@/hooks/useAnimeStreaming';
import { useAnimeDetails } from '@/hooks/useAnimeApi';
import { useWatchProgress } from '@/hooks/useWatchProgress';
import { useAuth } from '@/contexts/AuthContext';
import VideoPlayer from '@/components/VideoPlayer';
import EmbedPlayer from '@/components/EmbedPlayer';
import DownloadButton from '@/components/DownloadButton';
import { selectBestSource } from '@/lib/consumet';
import { toast } from 'sonner';

type PlayerMode = 'hls' | 'embed';

const StreamPlayer = () => {
  const { animeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const episodeParam = searchParams.get('ep') || '1';
  const [currentEpisode, setCurrentEpisode] = useState(parseInt(episodeParam));
  
  const [showSettings, setShowSettings] = useState(false);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [showProviders, setShowProviders] = useState(false);
  const [playerMode, setPlayerMode] = useState<PlayerMode>('embed');
  const [isSearching, setIsSearching] = useState(false);
  
  const { searchAnime, getAnimeInfo, getEpisodeSources, getEmbedUrl, switchProvider, currentProvider, providers, loading, error } = useAnimeStreaming();
  const { data: jikanAnime, loading: jikanLoading } = useAnimeDetails(animeId ? parseInt(animeId) : null);
  const { updateProgress } = useWatchProgress();
  
  const [consumetAnimeId, setConsumetAnimeId] = useState<string | null>(null);
  const [animeInfo, setAnimeInfo] = useState<any>(null);
  const [sources, setSources] = useState<EpisodeSource | null>(null);
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [embedUrl, setEmbedUrl] = useState<string>('');
  const [loadError, setLoadError] = useState<string>('');

  // Search for anime on Consumet using Jikan title
  useEffect(() => {
    const findAnime = async () => {
      if (!jikanAnime) return;
      
      setIsSearching(true);
      setLoadError('');
      
      const searchTerms = [
        jikanAnime.title_english,
        jikanAnime.title,
        jikanAnime.title_japanese
      ].filter(Boolean);
      
      for (const term of searchTerms) {
        if (!term) continue;
        
        try {
          const results = await searchAnime(term);
          if (results.length > 0) {
            // Find best match
            const exactMatch = results.find(r => 
              r.title.toLowerCase() === term.toLowerCase()
            );
            const match = exactMatch || results[0];
            setConsumetAnimeId(match.id);
            setIsSearching(false);
            return;
          }
        } catch (err) {
          console.error('Search failed for:', term, err);
        }
      }
      
      // If search fails, try direct gogoanime slug
      const slug = jikanAnime.title_english?.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-') || 
        jikanAnime.title?.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      
      if (slug) {
        setConsumetAnimeId(slug);
      }
      
      setIsSearching(false);
    };
    
    findAnime();
  }, [jikanAnime, searchAnime]);

  // Fetch anime info from Consumet
  useEffect(() => {
    const fetchInfo = async () => {
      if (!consumetAnimeId) return;
      setLoadError('');
      
      try {
        const info = await getAnimeInfo(consumetAnimeId);
        if (info) {
          setAnimeInfo(info);
        } else {
          // Generate embed URL as fallback
          const embed = `https://gogoanime.gg/videos/${consumetAnimeId}-episode-${currentEpisode}`;
          setEmbedUrl(embed);
          setPlayerMode('embed');
        }
      } catch (err) {
        console.error('Failed to get anime info:', err);
        setLoadError('Could not find streaming sources');
        setPlayerMode('embed');
      }
    };
    
    fetchInfo();
  }, [consumetAnimeId, getAnimeInfo, currentEpisode]);

  // Fetch episode sources
  useEffect(() => {
    const fetchSources = async () => {
      if (!animeInfo?.episodes?.length) {
        // Generate direct embed URL if no episode info
        if (consumetAnimeId) {
          const embed = getEmbedUrl(`${consumetAnimeId}-episode-${currentEpisode}`);
          setEmbedUrl(embed);
        }
        return;
      }
      
      setLoadError('');
      
      const episode = animeInfo.episodes.find((ep: any) => ep.number === currentEpisode);
      if (!episode) {
        const firstEp = animeInfo.episodes[0];
        if (firstEp) {
          setCurrentEpisode(firstEp.number);
        }
        return;
      }
      
      // Set embed URL
      const embed = getEmbedUrl(episode.id);
      setEmbedUrl(embed);
      
      // Fetch HLS sources
      try {
        const sourcesData = await getEpisodeSources(episode.id);
        if (sourcesData && sourcesData.sources?.length > 0) {
          setSources(sourcesData);
          const best = selectBestSource(sourcesData.sources);
          if (best) {
            setStreamUrl(best.url);
          }
        } else {
          setPlayerMode('embed');
        }
      } catch (err) {
        console.error('Failed to get episode sources:', err);
        setPlayerMode('embed');
      }
    };
    
    fetchSources();
  }, [animeInfo, currentEpisode, getEpisodeSources, getEmbedUrl, consumetAnimeId]);

  const handleTimeUpdate = (currentTime: number, duration: number) => {
    if (user && animeId && duration > 0) {
      updateProgress(
        parseInt(animeId), 
        currentEpisode, 
        Math.floor(currentTime), 
        Math.floor(duration)
      );
    }
  };

  const changeEpisode = (ep: number) => {
    setCurrentEpisode(ep);
    setShowEpisodes(false);
    setStreamUrl('');
    setEmbedUrl('');
    setSources(null);
    navigate(`/stream/${animeId}?ep=${ep}`, { replace: true });
  };

  const handleProviderChange = (providerId: StreamingProvider) => {
    switchProvider(providerId);
    setShowProviders(false);
    setStreamUrl('');
    setEmbedUrl('');
    setSources(null);
    setAnimeInfo(null);
    setConsumetAnimeId(null);
  };

  const selectQuality = (url: string) => {
    setStreamUrl(url);
    setShowSettings(false);
  };

  const togglePlayerMode = () => {
    setPlayerMode(prev => prev === 'hls' ? 'embed' : 'hls');
  };

  const retryLoad = () => {
    setConsumetAnimeId(null);
    setAnimeInfo(null);
    setSources(null);
    setStreamUrl('');
    setEmbedUrl('');
    setLoadError('');
  };

  const canPlayHLS = streamUrl && playerMode === 'hls';
  const canPlayEmbed = embedUrl && playerMode === 'embed';
  const isLoading = loading || jikanLoading || isSearching;
  const displayTitle = animeInfo?.title || jikanAnime?.title_english || jikanAnime?.title || 'Loading...';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="text-center flex-1 px-4">
            <h1 className="font-medium truncate">{displayTitle}</h1>
            <p className="text-muted-foreground text-sm">Episode {currentEpisode}</p>
          </div>
          
          <div className="flex gap-1">
            {/* Player Mode Toggle */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={togglePlayerMode}
              title={playerMode === 'hls' ? 'Switch to Embed Player' : 'Switch to HLS Player'}
            >
              {playerMode === 'hls' ? <Tv className="w-5 h-5" /> : <Film className="w-5 h-5" />}
            </Button>
            
            {/* Download Button */}
            {animeId && streamUrl && (
              <DownloadButton
                animeId={parseInt(animeId)}
                animeTitle={displayTitle}
                episodeNumber={currentEpisode}
                videoUrl={streamUrl}
              />
            )}
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                setShowProviders(!showProviders);
                setShowSettings(false);
                setShowEpisodes(false);
              }}
            >
              <Server className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                setShowSettings(!showSettings);
                setShowProviders(false);
                setShowEpisodes(false);
              }}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="relative">
        {isLoading && !streamUrl && !embedUrl && (
          <div className="aspect-video flex flex-col items-center justify-center bg-secondary gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-muted-foreground">
              {isSearching ? 'Finding streams...' : 'Loading...'}
            </p>
          </div>
        )}
        
        {(error || loadError) && !canPlayHLS && !canPlayEmbed && !isLoading && (
          <div className="aspect-video flex flex-col items-center justify-center bg-secondary gap-4 p-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <p className="text-destructive text-center">{error || loadError}</p>
            <div className="flex gap-2">
              <Button onClick={() => navigate(-1)}>Go Back</Button>
              <Button variant="outline" onClick={retryLoad}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        )}
        
        {/* HLS Player */}
        {canPlayHLS && (
          <VideoPlayer
            src={streamUrl}
            title={displayTitle}
            subtitle={`Episode ${currentEpisode}`}
            onTimeUpdate={handleTimeUpdate}
            autoPlay
            className="aspect-video w-full"
            headers={sources?.headers}
            subtitles={sources?.subtitles}
          />
        )}
        
        {/* Embed Player */}
        {canPlayEmbed && (
          <EmbedPlayer
            embedUrl={embedUrl}
            title={`${displayTitle} - Episode ${currentEpisode}`}
            className="w-full"
          />
        )}
        
        {/* No player available message */}
        {!isLoading && !canPlayHLS && !canPlayEmbed && !error && !loadError && (
          <div className="aspect-video flex flex-col items-center justify-center bg-secondary gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Preparing video...</p>
          </div>
        )}

        {/* Provider Selection Panel */}
        {showProviders && (
          <div className="absolute top-2 right-2 w-48 bg-card/95 backdrop-blur-sm rounded-xl overflow-hidden z-50 shadow-lg border border-border">
            <div className="p-3 border-b border-border">
              <h3 className="font-medium text-sm">Streaming Source</h3>
            </div>
            <div className="p-2 space-y-1">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleProviderChange(provider.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    currentProvider === provider.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary"
                  )}
                >
                  {provider.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute top-2 right-2 w-48 bg-card/95 backdrop-blur-sm rounded-xl overflow-hidden z-50 shadow-lg border border-border">
            <div className="p-3 border-b border-border">
              <h3 className="font-medium text-sm">Settings</h3>
            </div>
            <div className="p-2 space-y-2">
              {/* Player Mode */}
              <div>
                <p className="text-xs text-muted-foreground px-2 mb-1">Player Mode</p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPlayerMode('hls')}
                    className={cn(
                      "flex-1 px-2 py-1.5 rounded text-xs transition-colors",
                      playerMode === 'hls'
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                    disabled={!streamUrl}
                  >
                    HLS
                  </button>
                  <button
                    onClick={() => setPlayerMode('embed')}
                    className={cn(
                      "flex-1 px-2 py-1.5 rounded text-xs transition-colors",
                      playerMode === 'embed'
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                    disabled={!embedUrl}
                  >
                    Embed
                  </button>
                </div>
              </div>
              
              {/* Quality (HLS only) */}
              {playerMode === 'hls' && sources?.sources && (
                <div>
                  <p className="text-xs text-muted-foreground px-2 mb-1">Quality</p>
                  <div className="space-y-1">
                    {sources.sources.map((source, index) => (
                      <button
                        key={index}
                        onClick={() => selectQuality(source.url)}
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
            </div>
          </div>
        )}
      </div>

      {/* Episode List */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Episodes</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEpisodes(!showEpisodes)}
            className="gap-1"
          >
            Episode {currentEpisode}
            <ChevronDown className={cn("w-4 h-4 transition-transform", showEpisodes && "rotate-180")} />
          </Button>
        </div>

        {animeInfo?.episodes ? (
          <div className={cn(
            "grid gap-2 transition-all",
            showEpisodes ? "grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10" : "grid-cols-4 sm:grid-cols-6"
          )}>
            {(showEpisodes ? animeInfo.episodes : animeInfo.episodes.slice(0, 12)).map((ep: any) => (
              <button
                key={ep.id}
                onClick={() => changeEpisode(ep.number)}
                className={cn(
                  "aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-colors",
                  currentEpisode === ep.number
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80"
                )}
              >
                {ep.number}
              </button>
            ))}
          </div>
        ) : (
          // Generate episode buttons based on Jikan data
          jikanAnime?.episodes && (
            <div className={cn(
              "grid gap-2 transition-all",
              showEpisodes ? "grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10" : "grid-cols-4 sm:grid-cols-6"
            )}>
              {Array.from({ length: showEpisodes ? jikanAnime.episodes : Math.min(12, jikanAnime.episodes) }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => changeEpisode(i + 1)}
                  className={cn(
                    "aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-colors",
                    currentEpisode === i + 1
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )
        )}
        
        {!showEpisodes && (animeInfo?.episodes?.length > 12 || (jikanAnime?.episodes && jikanAnime.episodes > 12)) && (
          <Button
            variant="ghost"
            className="w-full mt-2"
            onClick={() => setShowEpisodes(true)}
          >
            Show all {animeInfo?.episodes?.length || jikanAnime?.episodes} episodes
          </Button>
        )}
      </div>

      {/* Anime Info */}
      {(animeInfo || jikanAnime) && (
        <div className="p-4 border-t border-border">
          <div className="flex gap-4">
            {(animeInfo?.image || jikanAnime?.images?.jpg?.image_url) && (
              <img
                src={animeInfo?.image || jikanAnime?.images?.jpg?.image_url}
                alt={displayTitle}
                className="w-24 h-36 object-cover rounded-lg"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg">{displayTitle}</h3>
              {(animeInfo?.status || jikanAnime?.status) && (
                <p className="text-sm text-primary">{animeInfo?.status || jikanAnime?.status}</p>
              )}
              {(animeInfo?.totalEpisodes || jikanAnime?.episodes) && (
                <p className="text-sm text-muted-foreground">
                  {animeInfo?.totalEpisodes || jikanAnime?.episodes} Episodes
                </p>
              )}
              {(animeInfo?.description || jikanAnime?.synopsis) && (
                <p className="text-muted-foreground text-sm line-clamp-3 mt-2">
                  {animeInfo?.description || jikanAnime?.synopsis}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreamPlayer;