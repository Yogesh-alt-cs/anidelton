import React, { useState, useEffect } from 'react';
import { X, Play, Loader2 } from 'lucide-react';
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

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const youtubeUrl = trailerYoutubeId 
    ? `https://www.youtube.com/embed/${trailerYoutubeId}?autoplay=1&rel=0`
    : trailerUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Content */}
      <div className="relative w-full max-w-4xl mx-4 z-10">
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
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
          )}
          
          {youtubeUrl ? (
            <iframe
              src={youtubeUrl}
              title={`${animeTitle} Trailer`}
              className={cn(
                "w-full h-full",
                loading && "opacity-0"
              )}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => setLoading(false)}
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
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TrailerModal;
