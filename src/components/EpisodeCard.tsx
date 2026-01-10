import { Play, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EpisodeCardProps {
  number: number;
  title: string;
  thumbnail?: string;
  duration?: string;
  isWatched?: boolean;
  progress?: number;
  onClick?: () => void;
}

const EpisodeCard = ({ 
  number, 
  title, 
  thumbnail, 
  duration = "24 min",
  isWatched = false,
  progress = 0,
  onClick 
}: EpisodeCardProps) => {
  return (
    <button
      onClick={onClick}
      className="group flex gap-2.5 p-2 rounded-lg bg-card/50 hover:bg-card border border-transparent hover:border-border/50 transition-all duration-200 w-full text-left"
    >
      {/* Thumbnail */}
      <div className="relative w-20 h-14 sm:w-24 sm:h-16 rounded-md overflow-hidden flex-shrink-0 bg-secondary">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <span className="text-lg font-bold text-primary">{number}</span>
          </div>
        )}
        
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-7 h-7 rounded-full bg-primary/90 flex items-center justify-center">
            <Play className="w-3 h-3 text-primary-foreground fill-current ml-0.5" />
          </div>
        </div>

        {/* Progress bar */}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Ep {number}</span>
          {isWatched && (
            <CheckCircle className="w-3 h-3 text-primary" />
          )}
        </div>
        <h4 className={cn(
          "text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors",
          isWatched && "text-muted-foreground"
        )}>
          {title || `Episode ${number}`}
        </h4>
        <span className="text-[10px] text-muted-foreground">{duration}</span>
      </div>
    </button>
  );
};

export default EpisodeCard;
