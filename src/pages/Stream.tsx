import { useState, useCallback } from 'react';
import { Search, X, Clock, TrendingUp, Play, Star, Loader2, Film } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import AnimeSection from '@/components/AnimeSection';
import TrailerModal from '@/components/TrailerModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTopAnime, useSeasonalAnime, useAnimeSearch } from '@/hooks/useAnimeApi';
import { Anime } from '@/types/anime';
import { cn } from '@/lib/utils';

const RECENT_SEARCHES_KEY = 'stream_recent_searches';

const Stream = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch data
  const { data: trendingAnime, loading: loadingTrending } = useTopAnime('bypopularity', 12);
  const { data: airingAnime, loading: loadingAiring } = useTopAnime('airing', 12);
  const { data: upcomingAnime, loading: loadingUpcoming } = useTopAnime('upcoming', 12);
  const { data: seasonalAnime, loading: loadingSeasonal } = useSeasonalAnime(12);
  const { data: searchResults, loading: loadingSearch } = useAnimeSearch(searchQuery);

  const addRecentSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== query);
      const updated = [query, ...filtered].slice(0, 10);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      addRecentSearch(query);
    }
  };

  const handleWatchTrailer = (anime: Anime) => {
    setSelectedAnime(anime);
    setShowTrailer(true);
  };

  const isSearching = searchQuery.length > 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      
      <main className="pt-20 px-4 space-y-6 max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="flex items-center gap-3">
          <Film className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Discover & Trailers</h1>
        </div>

        {/* Search Bar with Autocomplete */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search anime to watch trailers..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-10 h-12 bg-muted/50 border-border/50"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Recent Searches */}
        {!isSearching && recentSearches.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Recent Searches</span>
              </div>
              <Button variant="ghost" size="sm" onClick={clearRecentSearches}>
                Clear
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.slice(0, 5).map((search) => (
                <Badge
                  key={search}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary/20"
                  onClick={() => handleSearch(search)}
                >
                  {search}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {isSearching && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Search className="w-5 h-5" />
              Results for "{searchQuery}"
            </h2>
            
            {loadingSearch ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="w-full aspect-[3/4] rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {searchResults.map((anime) => (
                  <AnimeTrailerCard 
                    key={anime.mal_id} 
                    anime={anime} 
                    onWatchTrailer={handleWatchTrailer}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Film className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No anime found for "{searchQuery}"</p>
              </div>
            )}
          </div>
        )}

        {/* Default Content */}
        {!isSearching && (
          <>
            {/* Trending Section with Trailer Cards */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">🔥 Trending Now</h2>
              </div>
              {loadingTrending ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="w-full aspect-[3/4] rounded-xl" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {trendingAnime.slice(0, 6).map((anime) => (
                    <AnimeTrailerCard 
                      key={anime.mal_id} 
                      anime={anime} 
                      onWatchTrailer={handleWatchTrailer}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Currently Airing */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold">▶️ Currently Airing</h2>
              {loadingAiring ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="w-full aspect-[3/4] rounded-xl" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {airingAnime.slice(0, 6).map((anime) => (
                    <AnimeTrailerCard 
                      key={anime.mal_id} 
                      anime={anime} 
                      onWatchTrailer={handleWatchTrailer}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* This Season */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold">📺 This Season</h2>
              {loadingSeasonal ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="w-full aspect-[3/4] rounded-xl" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {seasonalAnime.slice(0, 6).map((anime) => (
                    <AnimeTrailerCard 
                      key={anime.mal_id} 
                      anime={anime} 
                      onWatchTrailer={handleWatchTrailer}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold">🚀 Coming Soon</h2>
              {loadingUpcoming ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="w-full aspect-[3/4] rounded-xl" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {upcomingAnime.slice(0, 6).map((anime) => (
                    <AnimeTrailerCard 
                      key={anime.mal_id} 
                      anime={anime} 
                      onWatchTrailer={handleWatchTrailer}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={showTrailer}
        onClose={() => setShowTrailer(false)}
        trailerUrl={selectedAnime?.trailer?.embed_url || null}
        trailerYoutubeId={selectedAnime?.trailer?.youtube_id || null}
        animeTitle={selectedAnime?.title || ''}
      />

      <BottomNav />
    </div>
  );
};

// Anime card with trailer button
interface AnimeTrailerCardProps {
  anime: Anime;
  onWatchTrailer: (anime: Anime) => void;
}

const AnimeTrailerCard = ({ anime, onWatchTrailer }: AnimeTrailerCardProps) => {
  const imageUrl = anime.images?.webp?.large_image_url || 
                   anime.images?.jpg?.large_image_url ||
                   '/placeholder.svg';

  const hasTrailer = anime.trailer?.youtube_id || anime.trailer?.embed_url;

  return (
    <div className="group">
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={anime.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-60" />
        
        {/* Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="icon"
            className={cn(
              "w-14 h-14 rounded-full shadow-lg",
              hasTrailer 
                ? "bg-primary hover:bg-primary/90" 
                : "bg-muted-foreground/50 cursor-not-allowed"
            )}
            onClick={() => hasTrailer && onWatchTrailer(anime)}
            disabled={!hasTrailer}
          >
            <Play className="w-6 h-6 fill-current" />
          </Button>
        </div>

        {/* Rating Badge */}
        {anime.score && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-background/80 backdrop-blur-sm">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span className="text-xs font-medium">{anime.score.toFixed(1)}</span>
          </div>
        )}

        {/* Trailer Badge */}
        {hasTrailer && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-primary/90 backdrop-blur-sm">
            <span className="text-xs font-medium text-primary-foreground">Trailer</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-2 space-y-1">
        <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {anime.title_english || anime.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{anime.type}</span>
          {anime.episodes && <span>• {anime.episodes} eps</span>}
          {anime.year && <span>• {anime.year}</span>}
        </div>
        {anime.genres && anime.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {anime.genres.slice(0, 2).map((genre) => (
              <Badge key={genre.mal_id} variant="secondary" className="text-[10px] px-1.5 py-0">
                {genre.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Stream;
