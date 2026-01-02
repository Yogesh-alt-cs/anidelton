import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Plus, Star, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Anime } from '@/types/anime';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StableFeaturedCarouselProps {
  animes: Anime[];
  loading?: boolean;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&h=600&fit=crop';

const StableFeaturedCarousel = ({ animes, loading }: StableFeaturedCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (animes.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % animes.length);
      }, 6000);
    }
  }, [animes.length]);

  useEffect(() => {
    startAutoPlay();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startAutoPlay]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + animes.length) % animes.length);
    startAutoPlay();
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % animes.length);
    startAutoPlay();
  };

  const handleImageLoad = (index: number) => {
    setImageLoaded(prev => ({ ...prev, [index]: true }));
  };

  const handleImageError = (index: number) => {
    setImageError(prev => ({ ...prev, [index]: true }));
    setImageLoaded(prev => ({ ...prev, [index]: true }));
  };

  // Always show the container with a stable height
  if (loading || animes.length === 0) {
    return (
      <div className="relative h-[450px] md:h-[500px] rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <span className="text-muted-foreground">Loading featured anime...</span>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>
    );
  }

  const currentAnime = animes[currentIndex];
  const imageUrl = currentAnime?.images?.webp?.large_image_url || 
                   currentAnime?.images?.jpg?.large_image_url ||
                   FALLBACK_IMAGE;

  const displayImageUrl = imageError[currentIndex] ? FALLBACK_IMAGE : imageUrl;

  return (
    <div className="relative h-[450px] md:h-[500px] rounded-2xl overflow-hidden group">
      {/* Preload images for smooth transitions */}
      {animes.slice(0, 5).map((anime, index) => (
        <img
          key={anime.mal_id}
          src={anime?.images?.webp?.large_image_url || anime?.images?.jpg?.large_image_url || FALLBACK_IMAGE}
          alt=""
          className="hidden"
          onLoad={() => handleImageLoad(index)}
          onError={() => handleImageError(index)}
        />
      ))}

      {/* Background Image */}
      <div className="absolute inset-0 transition-opacity duration-700 ease-out">
        <img
          src={displayImageUrl}
          alt={currentAnime?.title}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-500",
            imageLoaded[currentIndex] ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => handleImageLoad(currentIndex)}
          onError={() => handleImageError(currentIndex)}
        />
        {/* Fallback gradient while image loads */}
        {!imageLoaded[currentIndex] && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 animate-pulse" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex items-end p-6 md:p-10">
        <div className="max-w-xl space-y-4 animate-fade-in">
          {/* Badges */}
          <div className="flex items-center gap-3 flex-wrap">
            {currentAnime?.score && (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-semibold text-yellow-400">{currentAnime.score.toFixed(1)}</span>
              </div>
            )}
            <span className="px-3 py-1.5 rounded-lg bg-primary/20 backdrop-blur-sm border border-primary/30 text-sm font-medium text-primary">
              {currentAnime?.type || 'Anime'}
            </span>
            {currentAnime?.year && (
              <span className="px-3 py-1.5 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 text-sm font-medium">
                {currentAnime.year}
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl font-inter font-bold leading-tight">
            {currentAnime?.title_english || currentAnime?.title}
          </h2>

          {/* Synopsis */}
          <p className="text-sm md:text-base text-muted-foreground line-clamp-3">
            {currentAnime?.synopsis || 'Discover this amazing anime series'}
          </p>

          {/* Genres */}
          <div className="flex flex-wrap gap-2">
            {currentAnime?.genres?.slice(0, 4).map((genre) => (
              <span 
                key={genre.mal_id}
                className="px-2 py-1 rounded-md bg-secondary/50 text-xs font-medium"
              >
                {genre.name}
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Link to={`/anime/${currentAnime?.mal_id}`}>
              <Button variant="gradient" size="lg" className="gap-2">
                <Play className="w-5 h-5 fill-current" />
                Watch Now
              </Button>
            </Link>
            <Button variant="glass" size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Add to List
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/70"
        aria-label="Previous"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/70"
        aria-label="Next"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {animes.slice(0, 5).map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              startAutoPlay();
            }}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              index === currentIndex 
                ? "w-8 bg-gradient-to-r from-primary to-accent" 
                : "w-1.5 bg-foreground/30 hover:bg-foreground/50"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default StableFeaturedCarousel;