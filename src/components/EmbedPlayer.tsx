import { useState } from 'react';
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmbedPlayerProps {
  embedUrl: string;
  title?: string;
  className?: string;
}

export const EmbedPlayer = ({ embedUrl, title, className }: EmbedPlayerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  if (!embedUrl) {
    return (
      <div className={cn("aspect-video flex flex-col items-center justify-center bg-secondary gap-4", className)}>
        <AlertCircle className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">No embed URL available</p>
      </div>
    );
  }

  return (
    <div className={cn("relative bg-black rounded-lg overflow-hidden", className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      )}
      
      {error ? (
        <div className="aspect-video flex flex-col items-center justify-center bg-secondary gap-4 p-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-destructive text-center">Failed to load embed player</p>
          <Button 
            variant="outline" 
            onClick={() => window.open(embedUrl, '_blank')}
            className="gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Open in New Tab
          </Button>
        </div>
      ) : (
        <iframe
          src={embedUrl}
          title={title || 'Video Player'}
          className="w-full aspect-video"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          onLoad={handleLoad}
          onError={handleError}
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
        />
      )}
    </div>
  );
};

export default EmbedPlayer;