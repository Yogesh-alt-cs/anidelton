import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmbedPlayerProps {
  embedUrl: string;
  title?: string;
  className?: string;
  fallbackUrls?: string[];
}

export const EmbedPlayer = ({ embedUrl, title, className, fallbackUrls = [] }: EmbedPlayerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  
  const allUrls = [embedUrl, ...fallbackUrls].filter(Boolean);
  const currentUrl = allUrls[currentUrlIndex] || embedUrl;

  useEffect(() => {
    setIsLoading(true);
    setError(false);
    setCurrentUrlIndex(0);
  }, [embedUrl]);

  const handleLoad = () => {
    setIsLoading(false);
    setError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    // Try next fallback URL
    if (currentUrlIndex < allUrls.length - 1) {
      setCurrentUrlIndex(prev => prev + 1);
      setIsLoading(true);
    } else {
      setError(true);
    }
  };

  const retry = () => {
    setIsLoading(true);
    setError(false);
    setCurrentUrlIndex(0);
  };

  if (!embedUrl && allUrls.length === 0) {
    return (
      <div className={cn("aspect-video flex flex-col items-center justify-center bg-secondary gap-4", className)}>
        <AlertCircle className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">No embed URL available</p>
      </div>
    );
  }

  return (
    <div className={cn("relative bg-black rounded-lg overflow-hidden max-h-[50vh] sm:max-h-[55vh] lg:max-h-[60vh]", className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading player...</p>
          </div>
        </div>
      )}
      
      {error ? (
        <div className="aspect-video max-h-[50vh] sm:max-h-[55vh] lg:max-h-[60vh] flex flex-col items-center justify-center bg-secondary gap-3 p-4">
          <AlertCircle className="w-10 h-10 text-destructive" />
          <p className="text-destructive text-center text-sm">Failed to load embed player</p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={retry}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(currentUrl, '_blank')}
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open in New Tab
            </Button>
          </div>
        </div>
      ) : (
        <iframe
          key={currentUrl}
          src={currentUrl}
          title={title || 'Video Player'}
          className="w-full aspect-video max-h-[50vh] sm:max-h-[55vh] lg:max-h-[60vh]"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          onLoad={handleLoad}
          onError={handleError}
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
};

export default EmbedPlayer;
