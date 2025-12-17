import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sword, 
  Heart, 
  Laugh, 
  Sparkles, 
  Ghost, 
  Rocket, 
  Trophy, 
  Music, 
  Skull, 
  Brain,
  Zap,
  Users,
  Baby,
  Glasses,
  Flame,
  Snowflake
} from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import GenreChip from '@/components/GenreChip';
import AnimeCard from '@/components/AnimeCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnimeByGenre } from '@/hooks/useAnimeApi';

const GENRES = [
  { id: 1, name: 'Action', icon: Sword },
  { id: 22, name: 'Romance', icon: Heart },
  { id: 4, name: 'Comedy', icon: Laugh },
  { id: 16, name: 'Magic', icon: Sparkles },
  { id: 14, name: 'Horror', icon: Ghost },
  { id: 24, name: 'Sci-Fi', icon: Rocket },
  { id: 30, name: 'Sports', icon: Trophy },
  { id: 19, name: 'Music', icon: Music },
  { id: 8, name: 'Drama', icon: Skull },
  { id: 7, name: 'Mystery', icon: Brain },
  { id: 2, name: 'Adventure', icon: Zap },
  { id: 36, name: 'Slice of Life', icon: Users },
  { id: 15, name: 'Kids', icon: Baby },
  { id: 25, name: 'Shoujo', icon: Glasses },
  { id: 27, name: 'Shounen', icon: Flame },
  { id: 41, name: 'Thriller', icon: Snowflake },
];

const Genres = () => {
  const navigate = useNavigate();
  const [selectedGenre, setSelectedGenre] = useState<number>(GENRES[0].id);
  const selectedGenreName = GENRES.find(g => g.id === selectedGenre)?.name || 'Action';
  
  const { data: animeList, loading } = useAnimeByGenre(selectedGenre, 24);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      
      <main className="pt-20 px-4 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Browse by Genre</h1>
        
        {/* Genre Chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          {GENRES.map((genre) => {
            const Icon = genre.icon;
            return (
              <GenreChip
                key={genre.id}
                name={genre.name}
                icon={<Icon className="w-4 h-4" />}
                isSelected={selectedGenre === genre.id}
                onClick={() => setSelectedGenre(genre.id)}
              />
            );
          })}
        </div>

        {/* Anime Grid */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold">{selectedGenreName} Anime</h2>
          <p className="text-muted-foreground text-sm">
            {loading ? 'Loading...' : `${animeList.length} results`}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {loading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[3/4] rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          ) : (
            animeList.map((anime) => (
              <AnimeCard
                key={anime.mal_id}
                anime={anime}
                onClick={() => navigate(`/anime/${anime.mal_id}`)}
              />
            ))
          )}
        </div>

        {!loading && animeList.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No anime found for this genre</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Genres;
