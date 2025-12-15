import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnimeSearch, useTopAnime } from '@/hooks/useAnimeApi';
import { useAnimeStreaming } from '@/hooks/useAnimeStreaming';
import { GENRES } from '@/types/anime';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import SearchInput from '@/components/SearchInput';
import GenreChip from '@/components/GenreChip';
import AnimeCard from '@/components/AnimeCard';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Clock, Star, Play, Film, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type SearchMode = 'info' | 'stream';

interface StreamResult {
  id: string;
  title: string;
  image: string;
  releaseDate?: string;
  subOrDub?: string;
}

const Search = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [searchMode, setSearchMode] = useState<SearchMode>('info');
  const [streamResults, setStreamResults] = useState<StreamResult[]>([]);
  const [streamLoading, setStreamLoading] = useState(false);
  
  const { data: searchResults, loading: searchLoading } = useAnimeSearch(query, selectedGenres);
  const { data: trendingAnime, loading: trendingLoading } = useTopAnime('bypopularity', 20);
  const { searchAnime } = useAnimeStreaming();

  const toggleGenre = (genreId: number) => {
    setSelectedGenres(prev => 
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    
    if (searchMode === 'stream' && searchQuery.length > 2) {
      setStreamLoading(true);
      const results = await searchAnime(searchQuery);
      setStreamResults(results);
      setStreamLoading(false);
    }
  };

  const handleModeChange = async (mode: SearchMode) => {
    setSearchMode(mode);
    
    if (mode === 'stream' && query.length > 2) {
      setStreamLoading(true);
      const results = await searchAnime(query);
      setStreamResults(results);
      setStreamLoading(false);
    }
  };

  const handleStreamClick = (animeId: string) => {
    navigate(`/stream/${animeId}`);
  };

  const showResults = query || selectedGenres.length > 0;
  const displayAnimes = showResults ? searchResults : trendingAnime;
  const isLoading = searchMode === 'stream' ? streamLoading : (showResults ? searchLoading : trendingLoading);

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
          onChange={handleSearch}
          placeholder={searchMode === 'stream' ? "Search anime to stream..." : "Search anime titles..."}
          autoFocus
        />

        {/* Search Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={searchMode === 'info' ? 'gradient' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('info')}
            className="gap-2"
          >
            <Film className="w-4 h-4" />
            Info
          </Button>
          <Button
            variant={searchMode === 'stream' ? 'gradient' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('stream')}
            className="gap-2"
          >
            <Play className="w-4 h-4" />
            Stream
          </Button>
        </div>

        {/* Quick Filters - only show for info mode */}
        {searchMode === 'info' && (
          <div className="flex gap-2 overflow-x-auto scroll-hidden -mx-4 px-4 pb-2">
            {quickFilters.map((filter) => (
              <GenreChip
                key={filter.value}
                name={filter.name}
                icon={filter.icon}
              />
            ))}
          </div>
        )}

        {/* Genre Filters - only show for info mode */}
        {searchMode === 'info' && (
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
        )}

        {/* Streaming tip */}
        {searchMode === 'stream' && !query && (
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-sm text-center">
              <span className="font-medium text-primary">Tip:</span> Search for anime by title to find streaming sources
            </p>
          </div>
        )}

        {/* Results */}
        <div>
          <h3 className="text-lg font-inter font-bold mb-4">
            {searchMode === 'stream' 
              ? (query ? 'Streaming Results' : 'Search to stream') 
              : (showResults ? 'Search Results' : 'Popular Anime')
            }
          </h3>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : searchMode === 'stream' ? (
            streamResults.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {streamResults.map((anime, index) => (
                  <button
                    key={anime.id}
                    onClick={() => handleStreamClick(anime.id)}
                    className="group text-left animate-fade-in rounded-xl overflow-hidden bg-card border border-border/50 hover:border-primary/50 transition-all"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img 
                        src={anime.image || '/placeholder.svg'} 
                        alt={anime.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center">
                          <Play className="w-6 h-6 text-primary-foreground fill-current ml-1" />
                        </div>
                      </div>
                      {anime.subOrDub && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-primary/90 text-xs font-medium text-primary-foreground uppercase">
                          {anime.subOrDub}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {anime.title}
                      </h4>
                      {anime.releaseDate && (
                        <p className="text-xs text-muted-foreground mt-1">{anime.releaseDate}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : query ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-muted-foreground" />
                </div>
                <h4 className="text-lg font-medium mb-2">No streaming sources found</h4>
                <p className="text-sm text-muted-foreground">
                  Try a different search term
                </p>
              </div>
            ) : null
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
