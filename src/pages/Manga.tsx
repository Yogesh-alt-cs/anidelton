import { useState } from 'react';
import { Search, X, Clock, TrendingUp, BookOpen, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import MangaSection from '@/components/MangaSection';
import MangaCard from '@/components/MangaCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  usePopularManga, 
  useRecentManga, 
  useMangaSearch,
  useMangaByGenre,
  useRecentSearches,
  useBookmarks
} from '@/hooks/useManga';
import { MANGA_GENRES } from '@/lib/mangaApi';
import { cn } from '@/lib/utils';

const Manga = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  
  const { data: popularManga, loading: loadingPopular } = usePopularManga(12);
  const { data: recentManga, loading: loadingRecent } = useRecentManga(12);
  const { data: searchResults, loading: loadingSearch } = useMangaSearch(searchQuery);
  const { data: genreManga, loading: loadingGenre } = useMangaByGenre(selectedGenre || '', 20);
  const { searches, addSearch, clearSearches } = useRecentSearches();
  const { bookmarks } = useBookmarks();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedGenre(null);
    if (query.trim()) {
      addSearch(query);
    }
  };

  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(genre === selectedGenre ? null : genre);
    setSearchQuery('');
  };

  const isSearching = searchQuery.length > 0;
  const isFilteringByGenre = selectedGenre !== null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      
      <main className="pt-20 px-4 space-y-6 max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Manga</h1>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search manga by title, author, genre..."
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
        {!isSearching && !isFilteringByGenre && searches.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Recent Searches</span>
              </div>
              <Button variant="ghost" size="sm" onClick={clearSearches}>
                Clear
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {searches.slice(0, 5).map((search) => (
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

        {/* Genre Chips */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span>Genres</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {MANGA_GENRES.map((genre) => (
              <Badge
                key={genre}
                variant={selectedGenre === genre ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-all",
                  selectedGenre === genre 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-primary/20"
                )}
                onClick={() => handleGenreSelect(genre)}
              >
                {genre}
              </Badge>
            ))}
          </div>
        </div>

        {/* Search Results */}
        {isSearching && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Results for "{searchQuery}"
            </h2>
            
            {loadingSearch ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {searchResults.map((manga) => (
                  <MangaCard key={manga.id} manga={manga} size="sm" />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No manga found for "{searchQuery}"</p>
              </div>
            )}
          </div>
        )}

        {/* Genre Results */}
        {isFilteringByGenre && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {selectedGenre} Manga
            </h2>
            
            {loadingGenre ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : genreManga.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {genreManga.map((manga) => (
                  <MangaCard key={manga.id} manga={manga} size="sm" />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No manga found for {selectedGenre}</p>
              </div>
            )}
          </div>
        )}

        {/* Default Content */}
        {!isSearching && !isFilteringByGenre && (
          <>
            {/* Bookmarks */}
            {bookmarks.length > 0 && (
              <MangaSection
                title="📚 Your Bookmarks"
                manga={bookmarks}
                cardSize="md"
              />
            )}

            {/* Popular Manga */}
            <MangaSection
              title="🔥 Popular Manga"
              manga={popularManga}
              loading={loadingPopular}
              cardSize="md"
            />

            {/* Recently Updated */}
            <MangaSection
              title="✨ Recently Updated"
              manga={recentManga}
              loading={loadingRecent}
              cardSize="md"
            />
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Manga;
