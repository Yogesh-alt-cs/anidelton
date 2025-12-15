import { useState } from 'react';
import { useAnimeSearch, useTopAnime } from '@/hooks/useAnimeApi';
import { GENRES } from '@/types/anime';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import SearchInput from '@/components/SearchInput';
import GenreChip from '@/components/GenreChip';
import AnimeCard from '@/components/AnimeCard';
import { Sparkles, TrendingUp, Clock, Star } from 'lucide-react';

const Search = () => {
  const [query, setQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  
  const { data: searchResults, loading: searchLoading } = useAnimeSearch(query, selectedGenres);
  const { data: trendingAnime, loading: trendingLoading } = useTopAnime('bypopularity', 20);

  const toggleGenre = (genreId: number) => {
    setSelectedGenres(prev => 
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };

  const showResults = query || selectedGenres.length > 0;
  const displayAnimes = showResults ? searchResults : trendingAnime;
  const isLoading = showResults ? searchLoading : trendingLoading;

  const quickFilters = [
    { icon: <TrendingUp className="w-4 h-4" />, name: 'Trending', value: 'trending' },
    { icon: <Clock className="w-4 h-4" />, name: 'New', value: 'new' },
    { icon: <Star className="w-4 h-4" />, name: 'Top Rated', value: 'top' },
    { icon: <Sparkles className="w-4 h-4" />, name: 'Popular', value: 'popular' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header showSearch={false} />
      
      <main className="pt-20 px-4 space-y-6 max-w-7xl mx-auto">
        {/* Search Input */}
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search anime titles..."
          autoFocus
        />

        {/* Quick Filters */}
        <div className="flex gap-2 overflow-x-auto scroll-hidden -mx-4 px-4 pb-2">
          {quickFilters.map((filter) => (
            <GenreChip
              key={filter.value}
              name={filter.name}
              icon={filter.icon}
            />
          ))}
        </div>

        {/* Genre Filters */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Genres</h3>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => (
              <GenreChip
                key={genre.mal_id}
                name={genre.name}
                isSelected={selectedGenres.includes(genre.mal_id)}
                onClick={() => toggleGenre(genre.mal_id)}
              />
            ))}
          </div>
        </div>

        {/* Results */}
        <div>
          <h3 className="text-lg font-inter font-bold mb-4">
            {showResults ? 'Search Results' : 'Popular Anime'}
          </h3>
          
          {isLoading ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="aspect-[3/4] rounded-xl bg-card shimmer" />
                  <div className="h-4 w-3/4 rounded bg-card shimmer" />
                </div>
              ))}
            </div>
          ) : displayAnimes.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {displayAnimes.map((anime, index) => (
                <div 
                  key={anime.mal_id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <AnimeCard anime={anime} size="sm" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-muted-foreground" />
              </div>
              <h4 className="text-lg font-medium mb-2">No results found</h4>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Search;
