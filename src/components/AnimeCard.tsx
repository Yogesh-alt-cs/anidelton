import { Star, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Anime } from '@/types/anime';
import { cn } from '@/lib/utils';

interface AnimeCardProps {
  anime: Anime;
  size?: 'sm' | 'md' | 'lg';
  showRating?: boolean;
  showProgress?: boolean;
  progress?: number;
}

const AnimeCard = ({ 
  anime, 
  size = 'md', 
  showRating = true,
  showProgress = false,
  progress = 0,
}: AnimeCardProps) => {
  const sizeClasses = {
    sm: 'w-28 h-40',
    md: 'w-36 h-52',
    lg: 'w-44 h-64',
  };

  const imageUrl = anime.images?.webp?.large_image_url || 
                   anime.images?.jpg?.large_image_url ||
                   '/placeholder.svg';

  return (
    <Link 
      to={`/anime/${anime.mal_id}`}
      className="group flex-shrink-0"
    >
      <div className={cn(
        "anime-card relative",
        sizeClasses[size]
      )}>
        <img
          src={imageUrl}
          alt={anime.title}
          className="w-full h-full object-cover rounded-xl"
          loading="lazy"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent rounded-xl opacity-60" />
        
        {/* Play Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <div className="w-12 h-12 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-primary/50">
            <Play className="w-5 h-5 text-primary-foreground fill-current ml-0.5" />
          </div>
        </div>

        {/* Rating Badge */}
        {showRating && anime.score && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-background/80 backdrop-blur-sm z-10">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span className="text-xs font-medium">{anime.score.toFixed(1)}</span>
          </div>
        )}

        {/* Progress Bar */}
        {showProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted rounded-b-xl overflow-hidden z-10">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Title */}
      <div className="mt-2 space-y-1">
        <h3 className={cn(
          "font-medium line-clamp-2 group-hover:text-primary transition-colors",
          size === 'sm' ? 'text-xs' : 'text-sm'
        )}>
          {anime.title_english || anime.title}
        </h3>
        {size !== 'sm' && (
          <p className="text-xs text-muted-foreground">
            {anime.type} • {anime.episodes ? `${anime.episodes} eps` : 'Ongoing'}
          </p>
        )}
      </div>
    </Link>
  );
};

export default AnimeCard;
