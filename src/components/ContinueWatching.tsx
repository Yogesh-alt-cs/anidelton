import React from 'react';
import { Link } from 'react-router-dom';
import { Play, ChevronRight, Clock } from 'lucide-react';
import { useWatchHistory, WatchHistoryItem } from '@/hooks/useWatchHistory';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ContinueWatchingProps {
  limit?: number;
}

const formatTimeRemaining = (progressSeconds: number, durationSeconds: number | null) => {
  if (!durationSeconds) return '';
  const remaining = durationSeconds - progressSeconds;
  if (remaining <= 0) return 'Completed';
  const mins = Math.floor(remaining / 60);
  if (mins < 60) return `${mins}m left`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m left`;
};

const ContinueWatching = ({ limit = 10 }: ContinueWatchingProps) => {
  const { history, loading } = useWatchHistory();
  
  // Filter to only show incomplete episodes, sorted by most recent
  const continueItems = history
    .filter(item => !item.completed && item.progress_seconds > 0)
    .slice(0, limit);

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-inter font-bold">Continue Watching</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto scroll-hidden pb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div 
              key={i} 
              className="flex-shrink-0 w-64 h-36 rounded-xl bg-card shimmer"
            />
          ))}
        </div>
      </section>
    );
  }

  if (continueItems.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-inter font-bold">Continue Watching</h2>
        <Link 
          to="/history"
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          View History
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="flex gap-4 overflow-x-auto scroll-hidden pb-4 -mx-4 px-4">
        {continueItems.map((item, index) => (
          <ContinueWatchingCard 
            key={item.id} 
            item={item}
            style={{ animationDelay: `${index * 50}ms` }}
          />
        ))}
      </div>
    </section>
  );
};

interface ContinueWatchingCardProps {
  item: WatchHistoryItem;
  style?: React.CSSProperties;
}

const ContinueWatchingCard = ({ item, style }: ContinueWatchingCardProps) => {
  const progressPercent = item.duration_seconds 
    ? Math.min(100, (item.progress_seconds / item.duration_seconds) * 100)
    : 0;

  return (
    <Link 
      to={`/stream/${item.anime_id}?ep=${item.episode_number}`}
      className="flex-shrink-0 group animate-fade-in"
      style={style}
    >
      <div className="relative w-64 h-36 rounded-xl overflow-hidden bg-card border border-border/50">
        {/* Background Image */}
        <div className="absolute inset-0">
          {item.anime_image ? (
            <img
              src={item.anime_image}
              alt={item.anime_title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/50">
            <Play className="w-5 h-5 text-primary-foreground fill-current ml-0.5" />
          </div>
        </div>
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
          <div>
            <h3 className="font-medium text-sm truncate">{item.anime_title}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Episode {item.episode_number}</span>
              {item.duration_seconds && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeRemaining(item.progress_seconds, item.duration_seconds)}
                  </span>
                </>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          <Progress 
            value={progressPercent} 
            className="h-1 bg-secondary"
          />
        </div>
      </div>
    </Link>
  );
};

export default ContinueWatching;
