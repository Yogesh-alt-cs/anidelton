import { useTopAnime, useSeasonalAnime, useTopMovies, useTopTV } from '@/hooks/useAnimeApi';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import StableFeaturedCarousel from '@/components/StableFeaturedCarousel';
import AnimeSection from '@/components/AnimeSection';
import AnimeRecommendations from '@/components/AnimeRecommendations';
import ContinueWatching from '@/components/ContinueWatching';
import NewEpisodeSection from '@/components/NewEpisodeSection';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();
  const { data: topAiring, loading: loadingAiring } = useTopAnime('airing', 12);
  const { data: seasonal, loading: loadingSeasonal } = useSeasonalAnime(12);
  const { data: popular, loading: loadingPopular } = useTopAnime('bypopularity', 12);
  const { data: favorites, loading: loadingFavorites } = useTopAnime('favorite', 12);
  const { data: upcoming, loading: loadingUpcoming } = useTopAnime('upcoming', 12);
  const { data: topMovies, loading: loadingMovies } = useTopMovies(12);
  const { data: topTV, loading: loadingTV } = useTopTV(12);

  // Use seasonal anime for the featured carousel - guaranteed stable
  const featuredAnimes = seasonal.length > 0 ? seasonal.slice(0, 5) : topAiring.slice(0, 5);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      
      <main className="pt-20 px-4 space-y-8 max-w-7xl mx-auto">
        {/* Featured Carousel - Stable and always visible */}
        <StableFeaturedCarousel 
          animes={featuredAnimes} 
          loading={loadingSeasonal && loadingAiring}
        />

        {/* Continue Watching - For logged in users */}
        {user && <ContinueWatching limit={10} />}

        {/* For You / Personalized Recommendations */}
        {user && (
          <AnimeRecommendations limit={12} />
        )}

        {/* New Episode Releases */}
        <NewEpisodeSection />

        {/* Trending Now */}
        <AnimeSection
          title="🔥 Trending Now"
          animes={popular}
          loading={loadingPopular}
          viewAllLink="/search?filter=trending"
          cardSize="md"
        />

        {/* This Season */}
        <AnimeSection
          title="📺 This Season"
          animes={seasonal}
          loading={loadingSeasonal}
          viewAllLink="/search?filter=seasonal"
          cardSize="md"
        />

        {/* All-Time Favorites */}
        <AnimeSection
          title="⭐ All-Time Favorites"
          animes={favorites}
          loading={loadingFavorites}
          viewAllLink="/search?filter=favorites"
          cardSize="md"
        />

        {/* Currently Airing */}
        <AnimeSection
          title="▶️ Currently Airing"
          animes={topAiring}
          loading={loadingAiring}
          viewAllLink="/search?filter=airing"
          cardSize="md"
        />

        {/* Top TV Series */}
        <AnimeSection
          title="📺 Top TV Series"
          animes={topTV}
          loading={loadingTV}
          viewAllLink="/search?type=tv"
          cardSize="md"
        />

        {/* Top Movies */}
        <AnimeSection
          title="🎬 Top Movies"
          animes={topMovies}
          loading={loadingMovies}
          viewAllLink="/search?type=movie"
          cardSize="md"
        />

        {/* Upcoming / Anticipated */}
        <AnimeSection
          title="🚀 Coming Soon"
          animes={upcoming}
          loading={loadingUpcoming}
          viewAllLink="/search?filter=upcoming"
          cardSize="md"
        />
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;