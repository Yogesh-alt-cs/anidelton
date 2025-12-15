import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Plus, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Anime } from '@/types/anime';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FeaturedCarouselProps {
  animes: Anime[];
  loading?: boolean;
}

const FeaturedCarousel = ({ animes, loading }: FeaturedCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (animes.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % animes.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [animes.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + animes.length) % animes.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % animes.length);
  };

  if (loading) {
    return (
      <div className="relative h-[450px] md:h-[500px] bg-card rounded-2xl overflow-hidden shimmer">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>
    );
  }

  if (animes.length === 0) return null;

  const currentAnime = animes[currentIndex];
  const imageUrl = currentAnime?.images?.webp?.large_image_url || 
                   currentAnime?.images?.jpg?.large_image_url;

  return (
    <div className="relative h-[450px] md:h-[500px] rounded-2xl overflow-hidden group">
      {/* Background Image */}
      <div className="absolute inset-0 transition-transform duration-700 ease-out">
        <img
          src={imageUrl}
          alt={currentAnime?.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex items-end p-6 md:p-10">
        <div className="max-w-xl space-y-4 animate-fade-in">
          {/* Badges */}
          <div className="flex items-center gap-3">
            {currentAnime?.score && (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-semibold text-yellow-400">{currentAnime.score.toFixed(1)}</span>
              </div>
            )}
            <span className="px-3 py-1.5 rounded-lg bg-primary/20 backdrop-blur-sm border border-primary/30 text-sm font-medium text-primary">
              {currentAnime?.type}
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
            {currentAnime?.synopsis}
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
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/70"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {animes.slice(0, 5).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              index === currentIndex 
                ? "w-8 bg-gradient-to-r from-primary to-accent" 
                : "w-1.5 bg-foreground/30 hover:bg-foreground/50"
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default FeaturedCarousel;
