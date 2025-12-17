import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Play, Trash2 } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { useAuth } from '@/contexts/AuthContext';

const History = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { history, loading, clearHistory, removeFromHistory } = useWatchHistory();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header />
        <main className="pt-20 px-4 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Clock className="w-16 h-16 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Sign in to see your watch history</h2>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      
      <main className="pt-20 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Watch History</h1>
            <p className="text-muted-foreground text-sm">
              {history.length} {history.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          {history.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearHistory}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-32 h-20 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-2 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Clock className="w-16 h-16 text-muted-foreground" />
            <h2 className="text-xl font-semibold">No watch history yet</h2>
            <p className="text-muted-foreground text-center">
              Start watching anime to build your history
            </p>
            <Button onClick={() => navigate('/')}>Browse Anime</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => {
              const progress = item.duration_seconds 
                ? (item.progress_seconds / item.duration_seconds) * 100 
                : 0;
              
              return (
                <div
                  key={item.id}
                  className="flex gap-4 bg-card rounded-xl p-3 border border-border hover:border-primary/50 transition-colors group"
                >
                  {/* Thumbnail */}
                  <div 
                    className="relative w-32 h-20 rounded-lg overflow-hidden bg-secondary cursor-pointer"
                    onClick={() => navigate(`/stream/${item.anime_id}?ep=${item.episode_number}`)}
                  >
                    {item.anime_image ? (
                      <img 
                        src={item.anime_image} 
                        alt={item.anime_title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                    {/* Progress bar overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="font-medium truncate cursor-pointer hover:text-primary"
                      onClick={() => navigate(`/anime/${item.anime_id}`)}
                    >
                      {item.anime_title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Episode {item.episode_number} • {formatTime(item.progress_seconds)}
                      {item.duration_seconds && ` / ${formatTime(item.duration_seconds)}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(item.watched_at)}
                    </p>
                    
                    {/* Progress bar */}
                    <Progress value={progress} className="h-1 mt-2" />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeFromHistory(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => navigate(`/stream/${item.anime_id}?ep=${item.episode_number}`)}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default History;
