import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Play, Plus, Share2, Star, Calendar, Clock, Film, 
  ChevronDown, ChevronUp, Heart, ArrowLeft, Loader2
} from 'lucide-react';
import { useAnimeDetails, useAnimeEpisodes, useRecommendations } from '@/hooks/useAnimeApi';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';
import EpisodeCard from '@/components/EpisodeCard';
import AnimeCard from '@/components/AnimeCard';
import { cn } from '@/lib/utils';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useWatchProgress } from '@/hooks/useWatchProgress';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const AnimeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const animeId = id ? parseInt(id) : null;
  const { user } = useAuth();
  
  const { data: anime, loading } = useAnimeDetails(animeId);
  const { data: episodes } = useAnimeEpisodes(animeId);
  const { data: recommendations } = useRecommendations(animeId);
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const { getLastWatchedEpisode } = useWatchProgress(animeId || undefined);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [addingToList, setAddingToList] = useState(false);

  const watchlistItem = animeId ? isInWatchlist(animeId) : null;
  const lastWatched = getLastWatchedEpisode();

  if (loading || !anime) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-[400px] bg-card shimmer" />
        <div className="p-4 space-y-4">
          <div className="h-8 w-3/4 bg-card shimmer rounded" />
          <div className="h-4 w-1/2 bg-card shimmer rounded" />
          <div className="h-20 bg-card shimmer rounded" />
        </div>
      </div>
    );
  }

  const imageUrl = anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url;

  const handleWatchNow = () => {
    const episodeToWatch = lastWatched ? lastWatched.episode_number : 1;
    navigate(`/watch/${animeId}?ep=${episodeToWatch}`);
  };

  const handleAddToList = async () => {
    if (!user) {
      toast.error('Please sign in to add to watchlist');
      navigate('/auth');
      return;
    }
    
    setAddingToList(true);
    if (watchlistItem) {
      await removeFromWatchlist(animeId!);
    } else {
      await addToWatchlist(
        animeId!,
        anime.title_english || anime.title,
        imageUrl || null,
        'plan_to_watch'
      );
    }
    setAddingToList(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section */}
      <div className="relative h-[450px]">
        <img
          src={imageUrl}
          alt={anime.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        {/* Back Button */}
        <Link 
          to="/"
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center border border-border/50 hover:bg-background/70 transition-colors z-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* Share Button */}
        <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center border border-border/50 hover:bg-background/70 transition-colors">
          <Share2 className="w-5 h-5" />
        </button>

        {/* Play Button Overlay */}
        <button
          onClick={handleWatchNow}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <div className="w-20 h-20 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-primary/50 hover:scale-110 transition-transform animate-pulse-glow">
            <Play className="w-8 h-8 text-primary-foreground fill-current ml-1" />
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="px-4 -mt-24 relative z-10 space-y-6">
        {/* Title & Actions */}
        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-inter font-bold leading-tight">
            {anime.title_english || anime.title}
          </h1>
          
          {anime.title_japanese && (
            <p className="text-sm text-muted-foreground">{anime.title_japanese}</p>
          )}

          {/* Info Badges */}
          <div className="flex flex-wrap items-center gap-3">
            {anime.score && (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-semibold text-yellow-400">{anime.score.toFixed(1)}</span>
              </div>
            )}
            <span className="px-3 py-1.5 rounded-lg bg-secondary text-sm font-medium">
              {anime.type}
            </span>
            {anime.episodes && (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-sm">
                <Film className="w-4 h-4" />
                {anime.episodes} eps
              </div>
            )}
            {anime.duration && (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-sm">
                <Clock className="w-4 h-4" />
                {anime.duration}
              </div>
            )}
            {anime.year && (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-sm">
                <Calendar className="w-4 h-4" />
                {anime.year}
              </div>
            )}
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-2">
            {anime.genres?.map((genre) => (
              <span 
                key={genre.mal_id}
                className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary"
              >
                {genre.name}
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="gradient" size="lg" className="flex-1 gap-2" onClick={handleWatchNow}>
              <Play className="w-5 h-5 fill-current" />
              {lastWatched ? `Continue Ep ${lastWatched.episode_number}` : 'Watch Now'}
            </Button>
            <Button 
              variant={watchlistItem ? "accent" : "glass"} 
              size="lg"
              onClick={handleAddToList}
              disabled={addingToList}
              className="gap-2"
            >
              {addingToList ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : watchlistItem ? (
                <Heart className="w-5 h-5 fill-current" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              {watchlistItem ? 'Added' : 'Add'}
            </Button>
          </div>
        </div>

        {/* Synopsis */}
        <div className="space-y-2">
          <h3 className="text-lg font-inter font-bold">Synopsis</h3>
          <p className={cn(
            "text-sm text-muted-foreground leading-relaxed",
            !isExpanded && "line-clamp-4"
          )}>
            {anime.synopsis || 'No synopsis available.'}
          </p>
          {anime.synopsis && anime.synopsis.length > 200 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {isExpanded ? (
                <>Show Less <ChevronUp className="w-4 h-4" /></>
              ) : (
                <>Show More <ChevronDown className="w-4 h-4" /></>
              )}
            </button>
          )}
        </div>

        {/* Studios */}
        {anime.studios && anime.studios.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Studios</h3>
            <div className="flex flex-wrap gap-2">
              {anime.studios.map((studio) => (
                <span 
                  key={studio.mal_id}
                  className="px-3 py-1 rounded-lg bg-secondary text-sm"
                >
                  {studio.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Episodes */}
        {episodes.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-inter font-bold">Episodes</h3>
              <span className="text-sm text-muted-foreground">{episodes.length} available</span>
            </div>
            <div className="space-y-2">
              {episodes.slice(0, 10).map((episode, index) => (
                <div 
                  key={episode.mal_id}
                  onClick={() => navigate(`/watch/${animeId}?ep=${index + 1}`)}
                  className="cursor-pointer"
                >
                  <EpisodeCard
                    number={index + 1}
                    title={episode.title}
                    isWatched={index < 2}
                    progress={index === 1 ? 45 : undefined}
                  />
                </div>
              ))}
              {episodes.length > 10 && (
                <Button variant="ghost" className="w-full mt-2">
                  View All {episodes.length} Episodes
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-inter font-bold">You Might Also Like</h3>
            <div className="flex gap-4 overflow-x-auto scroll-hidden -mx-4 px-4 pb-4">
              {recommendations.map((rec: any) => (
                <AnimeCard key={rec.mal_id} anime={rec} size="sm" />
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default AnimeDetails;
