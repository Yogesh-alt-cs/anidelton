import React, { useState, useEffect } from 'react';
import { X, Play, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trailerUrl?: string;
  trailerYoutubeId?: string;
  animeTitle: string;
}

export const TrailerModal = ({ 
  isOpen, 
  onClose, 
  trailerUrl, 
  trailerYoutubeId,
  animeTitle 
}: TrailerModalProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, retryCount]);

  if (!isOpen) return null;

  // Construct YouTube embed URL with proper parameters
  const youtubeUrl = trailerYoutubeId 
    ? `https://www.youtube.com/embed/${trailerYoutubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
    : trailerUrl;

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setLoading(true);
    setError(false);
  };

  const openInNewTab = () => {
    if (trailerYoutubeId) {
      window.open(`https://www.youtube.com/watch?v=${trailerYoutubeId}`, '_blank');
    } else if (trailerUrl) {
      window.open(trailerUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Content */}
      <div className="relative w-full max-w-4xl mx-4 z-10 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white truncate pr-4">
            {animeTitle} - Trailer
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20 shrink-0"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Video Container */}
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
          {loading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading trailer...</p>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4">
              <Play className="w-16 h-16 text-muted-foreground" />
              <p className="text-muted-foreground text-center">
                Failed to load trailer
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRetry} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </Button>
                <Button variant="outline" size="sm" onClick={openInNewTab} className="gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Open in YouTube
                </Button>
              </div>
            </div>
          )}
          
          {youtubeUrl ? (
            <iframe
              key={`trailer-${retryCount}`}
              src={youtubeUrl}
              title={`${animeTitle} Trailer`}
              className={cn(
                "w-full h-full",
                (loading || error) && "opacity-0"
              )}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onLoad={handleLoad}
              onError={handleError}
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <Play className="w-16 h-16 text-muted-foreground" />
              <p className="text-muted-foreground text-center px-4">
                No trailer available for this anime
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-2 mt-4">
          {youtubeUrl && (
            <Button variant="outline" onClick={openInNewTab} className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Watch on YouTube
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TrailerModal;
