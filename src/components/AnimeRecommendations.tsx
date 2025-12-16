import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, TrendingUp, Clock, Star } from 'lucide-react';
import { useWatchProgress } from '@/hooks/useWatchProgress';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useTopAnime } from '@/hooks/useAnimeApi';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface RecommendedAnime {
  id: number;
  title: string;
  image: string;
  score?: number;
  reason: string;
  genres?: string[];
}

interface AnimeRecommendationsProps {
  className?: string;
  limit?: number;
}

export const AnimeRecommendations = ({ className, limit = 10 }: AnimeRecommendationsProps) => {
  const navigate = useNavigate();
  const { progress } = useWatchProgress();
  const { watchlist } = useWatchlist();
  const { data: topAnime, loading } = useTopAnime('bypopularity', 20);
  const { data: airingAnime } = useTopAnime('airing', 10);
  
  const [recommendations, setRecommendations] = useState<RecommendedAnime[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    const generateRecommendations = async () => {
      setIsGenerating(true);
      
      // Simulate AI-based recommendation logic
      // In production, this would call an AI service or use collaborative filtering
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const watchedAnimeIds = new Set<number>();
      const watchlistAnimeIds = new Set<number>();
      
      // Get watch history from progress
      // This is a simplified version - in production, we'd fetch all watched anime
      
      const recommended: RecommendedAnime[] = [];
      
      // Add currently airing popular shows
      airingAnime.slice(0, 4).forEach(anime => {
        if (!watchedAnimeIds.has(anime.mal_id) && !watchlistAnimeIds.has(anime.mal_id)) {
          recommended.push({
            id: anime.mal_id,
            title: anime.title,
            image: anime.images.jpg.large_image_url || anime.images.jpg.image_url,
            score: anime.score,
            reason: 'Currently airing & trending',
            genres: anime.genres?.map(g => g.name)
          });
        }
      });
      
      // Add top rated shows
      topAnime.slice(0, 6).forEach(anime => {
        if (!watchedAnimeIds.has(anime.mal_id) && 
            !watchlistAnimeIds.has(anime.mal_id) &&
            !recommended.find(r => r.id === anime.mal_id)) {
          recommended.push({
            id: anime.mal_id,
            title: anime.title,
            image: anime.images.jpg.large_image_url || anime.images.jpg.image_url,
            score: anime.score,
            reason: 'Highly rated by community',
            genres: anime.genres?.map(g => g.name)
          });
        }
      });
      
      setRecommendations(recommended.slice(0, limit));
      setIsGenerating(false);
    };
    
    if (topAnime.length > 0) {
      generateRecommendations();
    }
  }, [topAnime, airingAnime, limit]);

  if (loading || isGenerating) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <h2 className="text-lg font-semibold">Generating Recommendations...</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[3/4] rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Recommended For You</h2>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {recommendations.map((anime) => (
          <div
            key={anime.id}
            onClick={() => navigate(`/anime/${anime.id}`)}
            className="group cursor-pointer space-y-2"
          >
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-secondary">
              <img
                src={anime.image}
                alt={anime.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Score Badge */}
              {anime.score && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {anime.score.toFixed(1)}
                </div>
              )}
              
              {/* Reason Badge */}
              <div className="absolute bottom-2 left-2 right-2">
                <span className="inline-flex items-center gap-1 text-[10px] text-white/90 bg-primary/80 px-2 py-0.5 rounded-full">
                  {anime.reason.includes('airing') ? (
                    <Clock className="w-3 h-3" />
                  ) : (
                    <TrendingUp className="w-3 h-3" />
                  )}
                  {anime.reason}
                </span>
              </div>
            </div>
            
            <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
              {anime.title}
            </h3>
            
            {anime.genres && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {anime.genres.slice(0, 2).join(', ')}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnimeRecommendations;