import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  SkipBack,
  SkipForward,
  Loader2,
  AlertCircle,
  Lock,
  Unlock,
  Settings,
  Subtitles,
  Gauge,
  Layers,
  Keyboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

const CORS_PROXY = 'https://corsproxy.io/?';

interface Subtitle {
  url: string;
  lang: string;
}

interface QualityOption {
  quality: string;
  url: string;
}

interface VideoPlayerProps {
  src: string;
  title?: string;
  subtitle?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  autoPlay?: boolean;
  className?: string;
  headers?: Record<string, string>;
  subtitles?: Subtitle[];
  qualities?: QualityOption[];
  onQualityChange?: (url: string) => void;
}

export interface VideoPlayerRef {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
}

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({
  src,
  title,
  subtitle,
  onTimeUpdate,
  onEnded,
  autoPlay = false,
  className,
  headers,
  subtitles = [],
  qualities = [],
  onQualityChange
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buffered, setBuffered] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState<string | null>(null);
  const [currentQuality, setCurrentQuality] = useState<string>(src);

  useImperativeHandle(ref, () => ({
    play: () => videoRef.current?.play(),
    pause: () => videoRef.current?.pause(),
    seek: (time: number) => {
      if (videoRef.current) videoRef.current.currentTime = time;
    }
  }));

  // Initialize HLS or native playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setIsLoading(true);
    setError(null);

    const isHLS = src.includes('.m3u8');
    const streamUrl = isHLS ? `${CORS_PROXY}${encodeURIComponent(src)}` : src;

    if (isHLS && Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        xhrSetup: (xhr) => {
          if (headers) {
            Object.entries(headers).forEach(([key, value]) => {
              xhr.setRequestHeader(key, value);
            });
          }
        },
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        if (autoPlay) {
          video.play().catch(console.error);
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('HLS network error, trying to recover...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('HLS media error, trying to recover...');
              hls.recoverMediaError();
              break;
            default:
              setError('Failed to load video. Please try another source.');
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        if (autoPlay) {
          video.play().catch(console.error);
        }
      });
    } else {
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        if (autoPlay) {
          video.play().catch(console.error);
        }
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, autoPlay, headers]);

  // Control visibility timeout
  useEffect(() => {
    const resetTimeout = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (!isLocked) {
        setShowControls(true);
        controlsTimeoutRef.current = setTimeout(() => {
          if (isPlaying) {
            setShowControls(false);
          }
        }, 3000);
      }
    };

    resetTimeout();

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, isLocked]);

  // Playback speed effect
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Subtitle track effect
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Remove existing tracks
    while (video.firstChild) {
      if (video.firstChild.nodeName === 'TRACK') {
        video.removeChild(video.firstChild);
      } else {
        break;
      }
    }

    // Add subtitle tracks
    subtitles.forEach((sub, index) => {
      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.label = sub.lang;
      track.srclang = sub.lang.substring(0, 2).toLowerCase();
      track.src = sub.url;
      if (currentSubtitle === sub.lang) {
        track.default = true;
      }
      video.appendChild(track);
    });

    // Set active track
    if (video.textTracks) {
      for (let i = 0; i < video.textTracks.length; i++) {
        video.textTracks[i].mode = video.textTracks[i].label === currentSubtitle ? 'showing' : 'hidden';
      }
    }
  }, [subtitles, currentSubtitle]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLocked) return;
      
      // Don't capture keyboard when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          skip(-10);
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          skip(10);
          break;
        case 'arrowup':
          e.preventDefault();
          increaseVolume();
          break;
        case 'arrowdown':
          e.preventDefault();
          decreaseVolume();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'escape':
          if (isFullscreen) {
            e.preventDefault();
            toggleFullscreen();
          }
          break;
        case ',':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, currentTime - 1/30);
          }
          break;
        case '.':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.min(duration, currentTime + 1/30);
          }
          break;
        case '<':
          e.preventDefault();
          setPlaybackSpeed(prev => Math.max(0.25, prev - 0.25));
          break;
        case '>':
          e.preventDefault();
          setPlaybackSpeed(prev => Math.min(2, prev + 0.25));
          break;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          e.preventDefault();
          if (videoRef.current && duration) {
            const percent = parseInt(e.key) / 10;
            videoRef.current.currentTime = duration * percent;
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, currentTime, duration, isFullscreen]);

  const handleQualityChange = (quality: QualityOption) => {
    setCurrentQuality(quality.url);
    onQualityChange?.(quality.url);
    setShowQualityMenu(false);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      setDuration(total);
      onTimeUpdate?.(current, total);

      if (videoRef.current.buffered.length > 0) {
        const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
        setBuffered((bufferedEnd / total) * 100);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    if (isLocked) return;
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const handleSeek = (value: number[]) => {
    if (isLocked) return;
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (isLocked) return;
    const vol = value[0];
    setVolume(vol);
    setIsMuted(vol === 0);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted = vol === 0;
    }
  };

  const increaseVolume = () => {
    const newVol = Math.min(1, volume + 0.1);
    handleVolumeChange([newVol]);
  };

  const decreaseVolume = () => {
    const newVol = Math.max(0, volume - 0.1);
    handleVolumeChange([newVol]);
  };

  const toggleMute = () => {
    if (isLocked) return;
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const skip = (seconds: number) => {
    if (isLocked) return;
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  const toggleLock = () => {
    setIsLocked(!isLocked);
    setShowControls(true);
    setShowSpeedMenu(false);
    setShowSubtitleMenu(false);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    if (!isLocked) {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-black rounded-lg overflow-hidden group",
        isFullscreen && "fixed inset-0 z-50 rounded-none",
        className
      )}
      onMouseMove={handleMouseMove}
      onClick={() => !isLocked && setShowControls(true)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={onEnded}
        onError={() => setError('Failed to load video')}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        playsInline
        crossOrigin="anonymous"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-destructive text-sm text-center px-4">{error}</p>
        </div>
      )}

      {/* Lock Button (Always Visible) */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 h-10 w-10"
        onClick={toggleLock}
      >
        {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
      </Button>

      {/* Controls Overlay */}
      {!isLocked && (
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-300",
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-14 p-4">
            {title && <h2 className="text-white font-medium truncate">{title}</h2>}
            {subtitle && <p className="text-white/70 text-sm">{subtitle}</p>}
          </div>

          {/* Center Play Button */}
          {!isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Button
                variant="ghost"
                size="icon"
                className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 pointer-events-auto"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8 ml-1" />
                )}
              </Button>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
            {/* Progress Bar */}
            <div className="relative w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-white/30"
                style={{ width: `${buffered}%` }}
              />
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="absolute inset-0"
              />
            </div>

            {/* Time and Controls */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-8 w-8"
                  onClick={togglePlay}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-8 w-8"
                  onClick={() => skip(-10)}
                >
                  <SkipBack className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-8 w-8"
                  onClick={() => skip(10)}
                >
                  <SkipForward className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 h-8 w-8"
                    onClick={toggleMute}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <div className="w-20 hidden sm:block">
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      max={1}
                      step={0.05}
                      onValueChange={handleVolumeChange}
                    />
                  </div>
                </div>

                <span className="text-white/80 text-xs ml-2">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {/* Speed Control */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 h-8 w-8"
                    onClick={() => {
                      setShowSpeedMenu(!showSpeedMenu);
                      setShowSubtitleMenu(false);
                    }}
                  >
                    <Gauge className="w-4 h-4" />
                  </Button>
                  {showSpeedMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-card/95 backdrop-blur-sm rounded-lg p-2 min-w-[100px] shadow-lg border border-border">
                      <p className="text-xs text-muted-foreground px-2 mb-1">Speed</p>
                      {PLAYBACK_SPEEDS.map(speed => (
                        <button
                          key={speed}
                          onClick={() => {
                            setPlaybackSpeed(speed);
                            setShowSpeedMenu(false);
                          }}
                          className={cn(
                            "w-full text-left px-2 py-1 text-sm rounded transition-colors",
                            playbackSpeed === speed
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-secondary text-foreground"
                          )}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subtitles */}
                {subtitles.length > 0 && (
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 h-8 w-8"
                      onClick={() => {
                        setShowSubtitleMenu(!showSubtitleMenu);
                        setShowSpeedMenu(false);
                      }}
                    >
                      <Subtitles className="w-4 h-4" />
                    </Button>
                    {showSubtitleMenu && (
                      <div className="absolute bottom-full right-0 mb-2 bg-card/95 backdrop-blur-sm rounded-lg p-2 min-w-[120px] shadow-lg border border-border">
                        <p className="text-xs text-muted-foreground px-2 mb-1">Subtitles</p>
                        <button
                          onClick={() => {
                            setCurrentSubtitle(null);
                            setShowSubtitleMenu(false);
                          }}
                          className={cn(
                            "w-full text-left px-2 py-1 text-sm rounded transition-colors",
                            currentSubtitle === null
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-secondary text-foreground"
                          )}
                        >
                          Off
                        </button>
                        {subtitles.map(sub => (
                          <button
                            key={sub.lang}
                            onClick={() => {
                              setCurrentSubtitle(sub.lang);
                              setShowSubtitleMenu(false);
                            }}
                            className={cn(
                              "w-full text-left px-2 py-1 text-sm rounded transition-colors",
                              currentSubtitle === sub.lang
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-secondary text-foreground"
                            )}
                          >
                            {sub.lang}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Quality Selection */}
                {qualities.length > 0 && (
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 h-8 w-8"
                      onClick={() => {
                        setShowQualityMenu(!showQualityMenu);
                        setShowSpeedMenu(false);
                        setShowSubtitleMenu(false);
                        setShowShortcuts(false);
                      }}
                    >
                      <Layers className="w-4 h-4" />
                    </Button>
                    {showQualityMenu && (
                      <div className="absolute bottom-full right-0 mb-2 bg-card/95 backdrop-blur-sm rounded-lg p-2 min-w-[120px] shadow-lg border border-border">
                        <p className="text-xs text-muted-foreground px-2 mb-1">Quality</p>
                        {qualities.map((q, index) => (
                          <button
                            key={index}
                            onClick={() => handleQualityChange(q)}
                            className={cn(
                              "w-full text-left px-2 py-1 text-sm rounded transition-colors",
                              currentQuality === q.url
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-secondary text-foreground"
                            )}
                          >
                            {q.quality || 'Auto'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Keyboard Shortcuts Help */}
                <div className="relative hidden sm:block">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 h-8 w-8"
                    onClick={() => {
                      setShowShortcuts(!showShortcuts);
                      setShowSpeedMenu(false);
                      setShowSubtitleMenu(false);
                      setShowQualityMenu(false);
                    }}
                  >
                    <Keyboard className="w-4 h-4" />
                  </Button>
                  {showShortcuts && (
                    <div className="absolute bottom-full right-0 mb-2 bg-card/95 backdrop-blur-sm rounded-lg p-3 min-w-[200px] shadow-lg border border-border">
                      <p className="text-xs font-medium text-foreground mb-2">Keyboard Shortcuts</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Play/Pause</span>
                          <span className="font-mono bg-secondary px-1 rounded">Space / K</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Rewind 10s</span>
                          <span className="font-mono bg-secondary px-1 rounded">← / J</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Forward 10s</span>
                          <span className="font-mono bg-secondary px-1 rounded">→ / L</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Volume Up/Down</span>
                          <span className="font-mono bg-secondary px-1 rounded">↑ / ↓</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Mute</span>
                          <span className="font-mono bg-secondary px-1 rounded">M</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Fullscreen</span>
                          <span className="font-mono bg-secondary px-1 rounded">F</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Seek to %</span>
                          <span className="font-mono bg-secondary px-1 rounded">0-9</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Speed -/+</span>
                          <span className="font-mono bg-secondary px-1 rounded">&lt; / &gt;</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-8 w-8"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Locked State Indicator */}
      {isLocked && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white/80 px-3 py-1 rounded-full text-sm">
          Screen locked - tap lock icon to unlock
        </div>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;