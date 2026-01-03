import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAnimeSearch, useTopAnime } from '@/hooks/useAnimeApi';
import { useAnimeStreaming } from '@/hooks/useAnimeStreaming';
import { GENRES } from '@/types/anime';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import SearchInput from '@/components/SearchInput';
import GenreChip from '@/components/GenreChip';
import AnimeCard from '@/components/AnimeCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, TrendingUp, Clock, Star, Play, Film, Loader2, Filter, X, Tv, Clapperboard, Building2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

type SearchMode = 'info' | 'stream';

interface StreamResult {
  id: string;
  title: string;
  image: string;
  releaseDate?: string;
  subOrDub?: string;
}

// Studios for filter
const STUDIOS = [
  { id: 'all', name: 'All Studios' },
  { id: '21', name: 'Studio Ghibli' },
  { id: '11', name: 'Madhouse' },
  { id: '7', name: 'J.C.Staff' },
  { id: '1', name: 'Pierrot' },
  { id: '2', name: 'Kyoto Animation' },
  { id: '4', name: 'Bones' },
  { id: '43', name: 'ufotable' },
  { id: '44', name: 'Shaft' },
  { id: '569', name: 'MAPPA' },
  { id: '858', name: 'Wit Studio' },
];

// Years for filter (last 30 years)
const currentYear = new Date().getFullYear();
const YEARS = [
  { id: 'all', name: 'All Years' },
  ...Array.from({ length: 30 }, (_, i) => ({
    id: String(currentYear - i),
    name: String(currentYear - i),
  }))
];

const Search = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [query, setQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [searchMode, setSearchMode] = useState<SearchMode>('info');
  const [streamResults, setStreamResults] = useState<StreamResult[]>([]);
  const [streamLoading, setStreamLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Advanced filters
  const [typeFilter, setTypeFilter] = useState<string>(searchParams.get('type') || 'all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [studioFilter, setStudioFilter] = useState<string>('all');
  
  const { data: searchResults, loading: searchLoading } = useAnimeSearch(query, selectedGenres);
  const { data: trendingAnime, loading: trendingLoading } = useTopAnime('bypopularity', 20);
  const { searchAnime } = useAnimeStreaming();

  // Apply filters to results
  const filteredResults = (query || selectedGenres.length > 0 ? searchResults : trendingAnime).filter((anime) => {
    // Type filter
    if (typeFilter !== 'all') {
      const animeType = anime.type?.toLowerCase();
      if (typeFilter === 'tv' && animeType !== 'tv') return false;
      if (typeFilter === 'movie' && animeType !== 'movie') return false;
      if (typeFilter === 'ova' && !['ova', 'ona', 'special'].includes(animeType || '')) return false;
    }
    
    // Year filter
    if (yearFilter !== 'all') {
      const animeYear = anime.year || (anime.aired?.from ? new Date(anime.aired.from).getFullYear() : null);
      if (animeYear !== parseInt(yearFilter)) return false;
    }
    
    // Studio filter
    if (studioFilter !== 'all') {
      const hasStudio = anime.studios?.some(s => String(s.mal_id) === studioFilter);
      if (!hasStudio) return false;
    }
    
    return true;
  });

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

  const clearFilters = () => {
    setTypeFilter('all');
    setYearFilter('all');
    setStudioFilter('all');
    setSelectedGenres([]);
  };

  const hasActiveFilters = typeFilter !== 'all' || yearFilter !== 'all' || studioFilter !== 'all' || selectedGenres.length > 0;
  const activeFilterCount = (typeFilter !== 'all' ? 1 : 0) + (yearFilter !== 'all' ? 1 : 0) + (studioFilter !== 'all' ? 1 : 0) + selectedGenres.length;

  const showResults = query || selectedGenres.length > 0;
  const displayAnimes = filteredResults;
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

        {/* Search Mode Toggle & Filters Button */}
        <div className="flex flex-wrap gap-2">
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
          
          {searchMode === 'info' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn("gap-2 ml-auto", hasActiveFilters && "border-primary text-primary")}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && searchMode === 'info' && (
          <div className="bg-card rounded-xl p-4 space-y-4 border border-border animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Advanced Filters
              </h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                  <X className="w-4 h-4" />
                  Clear All
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Type Filter */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Tv className="w-4 h-4" />
                  Type
                </label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="tv">
                      <div className="flex items-center gap-2">
                        <Tv className="w-4 h-4" />
                        TV Series
                      </div>
                    </SelectItem>
                    <SelectItem value="movie">
                      <div className="flex items-center gap-2">
                        <Clapperboard className="w-4 h-4" />
                        Movies
                      </div>
                    </SelectItem>
                    <SelectItem value="ova">OVA/ONA/Special</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Year Filter */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Year
                </label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map(year => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Studio Filter */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Studio
                </label>
                <Select value={studioFilter} onValueChange={setStudioFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Studios" />
                  </SelectTrigger>
                  <SelectContent>
                    {STUDIOS.map(studio => (
                      <SelectItem key={studio.id} value={studio.id}>
                        {studio.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Genre Chips in Filter Panel */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Genres</label>
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
          </div>
        )}

        {/* Quick Filters - only show for info mode when filter panel is closed */}
        {searchMode === 'info' && !showFilters && (
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

        {/* Genre Filters - only show for info mode when filter panel is closed */}
        {searchMode === 'info' && !showFilters && (
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
              : (showResults ? `Search Results${hasActiveFilters ? ` (${displayAnimes.length} found)` : ''}` : 'Popular Anime')
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
