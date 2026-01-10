import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  Video,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAnimeStreaming, StreamingProvider, EpisodeSource } from '@/hooks/useAnimeStreaming';
import { useAnimeDetails } from '@/hooks/useAnimeApi';
import { useWatchProgress } from '@/hooks/useWatchProgress';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { useAuth } from '@/contexts/AuthContext';
import VideoPlayer from '@/components/VideoPlayer';
import EmbedPlayer from '@/components/EmbedPlayer';
import DownloadButton from '@/components/DownloadButton';
import TrailerModal from '@/components/TrailerModal';
import SocialShare from '@/components/SocialShare';
import ReportIssueModal from '@/components/ReportIssueModal';
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
  const [showTrailer, setShowTrailer] = useState(false);
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [playerMode, setPlayerMode] = useState<PlayerMode>('embed');
  const [isSearching, setIsSearching] = useState(false);
  const [audioType, setAudioType] = useState<'sub' | 'dub'>('sub');
  
  const { searchAnime, getAnimeInfo, getEpisodeSources, getEmbedUrl, getAllEmbedUrls, switchProvider, switchServer, currentProvider, currentServer, providers, servers, loading, error } = useAnimeStreaming();
  const { data: jikanAnime, loading: jikanLoading } = useAnimeDetails(animeId ? parseInt(animeId) : null);
  const { updateProgress } = useWatchProgress();
  const { addToHistory } = useWatchHistory();
  
  const [consumetAnimeId, setConsumetAnimeId] = useState<string | null>(null);
  const [animeInfo, setAnimeInfo] = useState<any>(null);
  const [sources, setSources] = useState<EpisodeSource | null>(null);
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [embedUrl, setEmbedUrl] = useState<string>('');
  const [fallbackEmbedUrls, setFallbackEmbedUrls] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string>('');

  // Generate slug for embed URL fallback
  const generateSlug = (title: string) => {
    return title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Primary video sources - Vidwish and Megaplay with HLS support
  const getEmbedUrls = (slug: string, episode: number, type: 'sub' | 'dub' = 'sub') => {
    const dubSuffix = type === 'dub' ? '-dub' : '';
    const cleanSlug = slug.replace(/[^a-z0-9-]/g, '');
    const episodeId = `${cleanSlug}${dubSuffix}-episode-${episode}`;
    return {
      // Primary - Vidwish (Streamwish) HLS player
      vidwish: `https://streamwish.to/e/${episodeId}`,
      vidwish2: `https://swdyu.com/e/${episodeId}`,
      // Megaplay sources
      megaplay: `https://megacloud.tv/embed-2/e-1/${episodeId}?autoPlay=1`,
      megaplay2: `https://megacloud.club/embed/${episodeId}`,
      // Backup HLS-compatible sources
      filemoon: `https://filemoon.sx/e/${episodeId}`,
      doodstream: `https://doodstream.com/e/${episodeId}`,
      // Fallback embeds
      embtaku: `https://embtaku.pro/streaming.php?id=${episodeId}`,
    };
  };

  // Search for anime on Consumet using Jikan title  
  useEffect(() => {
    const findAnime = async () => {
      if (!jikanAnime) return;
      
      setIsSearching(true);
      setLoadError('');
      
      // Generate slug for fallback embed URL immediately
      const slug = generateSlug(jikanAnime.title_english || jikanAnime.title);
      const embedUrls = getEmbedUrls(slug, currentEpisode, audioType);
      
      // Set embed URL and fallbacks immediately
      const urlValues = Object.values(embedUrls);
      setEmbedUrl(urlValues[0]);
      setFallbackEmbedUrls(urlValues.slice(1));
      
      const searchTerms = [
        jikanAnime.title_english,
        jikanAnime.title,
      ].filter(Boolean);
      
      // Try to search for better streaming sources
      for (const term of searchTerms) {
        if (!term) continue;
        
        try {
          const results = await searchAnime(term);
          if (results.length > 0) {
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
      
      // If search fails, use the slug
      if (slug) {
        setConsumetAnimeId(slug);
      }
      
      setIsSearching(false);
    };
    
    findAnime();
  }, [jikanAnime, searchAnime, currentEpisode, audioType]);

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
      const animeTitle = jikanAnime?.title_english || jikanAnime?.title || '';
      const isDub = audioType === 'dub';
      
      if (!animeInfo?.episodes?.length) {
        // Generate direct embed URL if no episode info from Consumet
        if (animeTitle) {
          const embedUrls = getAllEmbedUrls(animeTitle, currentEpisode, isDub);
          setEmbedUrl(embedUrls.primary);
          setFallbackEmbedUrls(embedUrls.fallbacks);
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
      
      // Set embed URLs using anime title
      if (animeTitle) {
        const embedUrls = getAllEmbedUrls(animeTitle, currentEpisode, isDub);
        setEmbedUrl(embedUrls.primary);
        setFallbackEmbedUrls(embedUrls.fallbacks);
      }
      
      // Fetch HLS sources from Consumet
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
  }, [animeInfo, currentEpisode, getEpisodeSources, getAllEmbedUrls, jikanAnime, audioType]);

  const handleTimeUpdate = (currentTime: number, duration: number) => {
    if (user && animeId && duration > 0) {
      updateProgress(
        parseInt(animeId), 
        currentEpisode, 
        Math.floor(currentTime), 
        Math.floor(duration)
      );
      
      // Also update watch history
      addToHistory(
        parseInt(animeId),
        displayTitle,
        jikanAnime?.images?.jpg?.image_url || null,
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

  const handleServerChange = (serverId: string) => {
    switchServer(serverId as any);
    setShowProviders(false);
    // Regenerate embed URLs with new server
    const animeTitle = jikanAnime?.title_english || jikanAnime?.title || '';
    if (animeTitle) {
      const embedUrls = getAllEmbedUrls(animeTitle, currentEpisode, audioType === 'dub');
      setEmbedUrl(embedUrls.primary);
      setFallbackEmbedUrls(embedUrls.fallbacks);
    }
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
            {/* Trailer Button */}
            {jikanAnime?.trailer?.youtube_id && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowTrailer(true)}
                title="Watch Trailer"
              >
                <Video className="w-5 h-5" />
              </Button>
            )}
            
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
            
            {/* Report Issue Button */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowReportIssue(true)}
              title="Report Issue"
            >
              <AlertTriangle className="w-5 h-5" />
            </Button>
            
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
            
            {/* Social Share */}
            <SocialShare
              title={`Watch ${displayTitle} - Episode ${currentEpisode}`}
              description={jikanAnime?.synopsis?.slice(0, 100)}
              image={jikanAnime?.images?.jpg?.large_image_url}
            />
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="relative max-h-[50vh] sm:max-h-[55vh] lg:max-h-[60vh]">
        {isLoading && !streamUrl && !embedUrl && (
          <div className="aspect-video max-h-[50vh] sm:max-h-[55vh] lg:max-h-[60vh] flex flex-col items-center justify-center bg-secondary gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">
              {isSearching ? 'Finding streams...' : 'Loading...'}
            </p>
          </div>
        )}
        
        {(error || loadError) && !canPlayHLS && !canPlayEmbed && !isLoading && (
          <div className="aspect-video max-h-[50vh] sm:max-h-[55vh] lg:max-h-[60vh] flex flex-col items-center justify-center bg-secondary gap-3 p-4">
            <AlertCircle className="w-10 h-10 text-destructive" />
            <p className="text-destructive text-center text-sm">{error || loadError}</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => navigate(-1)}>Go Back</Button>
              <Button variant="outline" size="sm" onClick={retryLoad}>
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
            className="aspect-video w-full max-h-[50vh] sm:max-h-[55vh] lg:max-h-[60vh]"
            headers={sources?.headers}
            subtitles={sources?.subtitles}
            qualities={sources?.sources?.map(s => ({ quality: s.quality || 'Auto', url: s.url })) || []}
            onQualityChange={(url) => setStreamUrl(url)}
          />
        )}
        
        {/* Embed Player */}
        {canPlayEmbed && (
          <EmbedPlayer
            embedUrl={embedUrl}
            fallbackUrls={fallbackEmbedUrls}
            title={`${displayTitle} - Episode ${currentEpisode}`}
            className="w-full max-h-[50vh] sm:max-h-[55vh] lg:max-h-[60vh]"
          />
        )}
        
        {/* No player available message */}
        {!isLoading && !canPlayHLS && !canPlayEmbed && !error && !loadError && (
          <div className="aspect-video max-h-[50vh] sm:max-h-[55vh] lg:max-h-[60vh] flex flex-col items-center justify-center bg-secondary gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Preparing video...</p>
          </div>
        )}

        {/* Server Selection Panel */}
        {showProviders && (
          <div className="absolute top-2 right-2 w-56 bg-card/95 backdrop-blur-sm rounded-xl overflow-hidden z-50 shadow-lg border border-border max-h-80 overflow-y-auto">
            <div className="p-3 border-b border-border">
              <h3 className="font-medium text-sm">Video Servers</h3>
            </div>
            <div className="p-2 space-y-1">
              {servers.map((server) => (
                <button
                  key={server.id}
                  onClick={() => handleServerChange(server.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    currentServer === server.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary"
                  )}
                >
                  <div className="font-medium">{server.name}</div>
                  <div className="text-xs opacity-70">{server.description}</div>
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
              {/* Audio Type - Sub/Dub */}
              <div>
                <p className="text-xs text-muted-foreground px-2 mb-1">Audio</p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setAudioType('sub')}
                    className={cn(
                      "flex-1 px-2 py-1.5 rounded text-xs transition-colors",
                      audioType === 'sub'
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    Sub
                  </button>
                  <button
                    onClick={() => setAudioType('dub')}
                    className={cn(
                      "flex-1 px-2 py-1.5 rounded text-xs transition-colors",
                      audioType === 'dub'
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    Dub
                  </button>
                </div>
              </div>
              
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
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">Episodes</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEpisodes(!showEpisodes)}
            className="gap-1 h-7 text-xs px-2"
          >
            Ep {currentEpisode}
            <ChevronDown className={cn("w-3 h-3 transition-transform", showEpisodes && "rotate-180")} />
          </Button>
        </div>

        {animeInfo?.episodes ? (
          <div className={cn(
            "grid gap-1.5 transition-all",
            showEpisodes ? "grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12" : "grid-cols-6 sm:grid-cols-8"
          )}>
            {(showEpisodes ? animeInfo.episodes : animeInfo.episodes.slice(0, 16)).map((ep: any) => (
              <button
                key={ep.id}
                onClick={() => changeEpisode(ep.number)}
                className={cn(
                  "aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-colors",
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
              "grid gap-1.5 transition-all",
              showEpisodes ? "grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12" : "grid-cols-6 sm:grid-cols-8"
            )}>
              {Array.from({ length: showEpisodes ? jikanAnime.episodes : Math.min(16, jikanAnime.episodes) }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => changeEpisode(i + 1)}
                  className={cn(
                    "aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-colors",
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
        
        {!showEpisodes && (animeInfo?.episodes?.length > 16 || (jikanAnime?.episodes && jikanAnime.episodes > 16)) && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-1.5 h-7 text-xs"
            onClick={() => setShowEpisodes(true)}
          >
            Show all {animeInfo?.episodes?.length || jikanAnime?.episodes} episodes
          </Button>
        )}
      </div>

      {/* Anime Info */}
      {(animeInfo || jikanAnime) && (
        <div className="p-3 border-t border-border">
          <div className="flex gap-3">
            {(animeInfo?.image || jikanAnime?.images?.jpg?.image_url) && (
              <img
                src={animeInfo?.image || jikanAnime?.images?.jpg?.image_url}
                alt={displayTitle}
                className="w-16 h-24 object-cover rounded-md"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">{displayTitle}</h3>
              {(animeInfo?.status || jikanAnime?.status) && (
                <p className="text-xs text-primary">{animeInfo?.status || jikanAnime?.status}</p>
              )}
              {(animeInfo?.totalEpisodes || jikanAnime?.episodes) && (
                <p className="text-xs text-muted-foreground">
                  {animeInfo?.totalEpisodes || jikanAnime?.episodes} Episodes
                </p>
              )}
              {(animeInfo?.description || jikanAnime?.synopsis) && (
                <p className="text-muted-foreground text-xs line-clamp-2 mt-1">
                  {animeInfo?.description || jikanAnime?.synopsis}
                </p>
              )}
            </div>
          </div>
          
          {/* Social Share Panel */}
          <SocialShare
            title={displayTitle}
            description={`Watch ${displayTitle} Episode ${currentEpisode} on AniDel`}
            image={jikanAnime?.images?.jpg?.large_image_url}
            variant="panel"
            className="mt-3"
          />
        </div>
      )}

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={showTrailer}
        onClose={() => setShowTrailer(false)}
        trailerYoutubeId={jikanAnime?.trailer?.youtube_id}
        animeTitle={displayTitle}
      />

      {/* Report Issue Modal */}
      <ReportIssueModal
        open={showReportIssue}
        onClose={() => setShowReportIssue(false)}
        animeId={animeId ? parseInt(animeId) : undefined}
        animeTitle={displayTitle}
        episodeNumber={currentEpisode}
      />
    </div>
  );
};

export default StreamPlayer;