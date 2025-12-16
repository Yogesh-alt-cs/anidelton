import { Bell, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewEpisodeBadgeProps {
  episodeNumber?: number;
  className?: string;
  variant?: 'default' | 'pulse' | 'glow';
}

export const NewEpisodeBadge = ({ 
  episodeNumber, 
  className,
  variant = 'default'
}: NewEpisodeBadgeProps) => {
  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
        variant === 'default' && "bg-primary text-primary-foreground",
        variant === 'pulse' && "bg-primary text-primary-foreground animate-pulse",
        variant === 'glow' && "bg-primary text-primary-foreground shadow-lg shadow-primary/50",
        className
      )}
    >
      <Sparkles className="w-3 h-3" />
      <span>
        {episodeNumber ? `EP ${episodeNumber} NEW` : 'NEW EPISODE'}
      </span>
    </div>
  );
};

interface NewReleasesListProps {
  releases: Array<{
    animeId: number;
    animeTitle: string;
    episodeNumber: number;
    releaseDate: string;
    image?: string;
  }>;
  onAnimeClick?: (animeId: number, episodeNumber: number) => void;
  className?: string;
}

export const NewReleasesList = ({ releases, onAnimeClick, className }: NewReleasesListProps) => {
  if (releases.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No new releases</p>
        <p className="text-sm">Check back later for updates!</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {releases.map((release, index) => (
        <div
          key={`${release.animeId}-${release.episodeNumber}`}
          onClick={() => onAnimeClick?.(release.animeId, release.episodeNumber)}
          className="flex items-center gap-3 p-3 rounded-lg bg-card hover:bg-accent/50 cursor-pointer transition-colors border border-border"
        >
          {release.image && (
            <img
              src={release.image}
              alt={release.animeTitle}
              className="w-16 h-20 object-cover rounded-md"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{release.animeTitle}</h4>
            <p className="text-sm text-muted-foreground">Episode {release.episodeNumber}</p>
            <p className="text-xs text-muted-foreground">{release.releaseDate}</p>
          </div>
          <NewEpisodeBadge variant="glow" />
        </div>
      ))}
    </div>
  );
};

export default NewEpisodeBadge;