import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Star, ChevronRight } from 'lucide-react';
import { useWatchProgress } from '@/hooks/useWatchProgress';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useTopAnime } from '@/hooks/useAnimeApi';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
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
  compact?: boolean;
}

export const AnimeRecommendations = ({ className, limit = 6, compact = true }: AnimeRecommendationsProps) => {
  const navigate = useNavigate();
  const { progress } = useWatchProgress();
  const { watchlist } = useWatchlist();
  const { data: topAnime, loading } = useTopAnime('bypopularity', 20);
  const { data: airingAnime } = useTopAnime('airing', 10);
  
  const [recommendations, setRecommendations] = useState<RecommendedAnime[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const generateRecommendations = async () => {
      setIsGenerating(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const watchedAnimeIds = new Set<number>();
      const watchlistAnimeIds = new Set<number>();
      
      const recommended: RecommendedAnime[] = [];
      
      // Add currently airing popular shows
      airingAnime.slice(0, 4).forEach(anime => {
        if (!watchedAnimeIds.has(anime.mal_id) && !watchlistAnimeIds.has(anime.mal_id)) {
          recommended.push({
            id: anime.mal_id,
            title: anime.title,
            image: anime.images.jpg.large_image_url || anime.images.jpg.image_url,
            score: anime.score,
            reason: 'Trending',
            genres: anime.genres?.map(g => g.name)
          });
        }
      });
      
      // Add top rated shows
      topAnime.slice(0, 8).forEach(anime => {
        if (!watchedAnimeIds.has(anime.mal_id) && 
            !watchlistAnimeIds.has(anime.mal_id) &&
            !recommended.find(r => r.id === anime.mal_id)) {
          recommended.push({
            id: anime.mal_id,
            title: anime.title,
            image: anime.images.jpg.large_image_url || anime.images.jpg.image_url,
            score: anime.score,
            reason: 'Top Rated',
            genres: anime.genres?.map(g => g.name)
          });
        }
      });
      
      setRecommendations(recommended);
      setIsGenerating(false);
    };
    
    if (topAnime.length > 0) {
      generateRecommendations();
    }
  }, [topAnime, airingAnime]);

  const displayLimit = compact && !showAll ? limit : recommendations.length;

  if (loading || isGenerating) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <h2 className="text-base font-semibold">Generating Recommendations...</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto scroll-hidden -mx-4 px-4 pb-2">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="shrink-0 w-28 space-y-1.5">
              <Skeleton className="aspect-[3/4] rounded-lg" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">For You</h2>
        </div>
        {compact && recommendations.length > limit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="gap-1 text-xs h-7 px-2"
          >
            {showAll ? 'Show Less' : 'View All'}
            <ChevronRight className={cn("w-3 h-3 transition-transform", showAll && "rotate-90")} />
          </Button>
        )}
      </div>
      
      {compact && !showAll ? (
        // Horizontal scroll for compact mode
        <div className="flex gap-3 overflow-x-auto scroll-hidden -mx-4 px-4 pb-2">
          {recommendations.slice(0, displayLimit).map((anime) => (
            <div
              key={anime.id}
              onClick={() => navigate(`/anime/${anime.id}`)}
              className="shrink-0 w-28 group cursor-pointer space-y-1.5"
            >
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-secondary">
                <img
                  src={anime.image}
                  alt={anime.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {anime.score && (
                  <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded">
                    <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                    {anime.score.toFixed(1)}
                  </div>
                )}
              </div>
              <h3 className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors">
                {anime.title}
              </h3>
            </div>
          ))}
        </div>
      ) : (
        // Grid for expanded view
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {recommendations.slice(0, displayLimit).map((anime) => (
            <div
              key={anime.id}
              onClick={() => navigate(`/anime/${anime.id}`)}
              className="group cursor-pointer space-y-1.5"
            >
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-secondary">
                <img
                  src={anime.image}
                  alt={anime.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {anime.score && (
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {anime.score.toFixed(1)}
                  </div>
                )}
                <span className="absolute bottom-1.5 left-1.5 text-[10px] text-white/90 bg-primary/80 px-1.5 py-0.5 rounded">
                  {anime.reason}
                </span>
              </div>
              <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                {anime.title}
              </h3>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnimeRecommendations;