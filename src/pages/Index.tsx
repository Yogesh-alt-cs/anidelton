import { useTopAnime, useSeasonalAnime } from '@/hooks/useAnimeApi';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import FeaturedCarousel from '@/components/FeaturedCarousel';
import AnimeSection from '@/components/AnimeSection';
import AnimeRecommendations from '@/components/AnimeRecommendations';
import ContinueWatching from '@/components/ContinueWatching';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();
  const { data: topAiring, loading: loadingAiring } = useTopAnime('airing', 10);
  const { data: seasonal, loading: loadingSeasonal } = useSeasonalAnime(10);
  const { data: popular, loading: loadingPopular } = useTopAnime('bypopularity', 10);
  const { data: favorites, loading: loadingFavorites } = useTopAnime('favorite', 10);

  // Use seasonal anime for the featured carousel
  const featuredAnimes = seasonal.slice(0, 5);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      
      <main className="pt-20 px-4 space-y-8 max-w-7xl mx-auto">
        {/* Featured Carousel */}
        <FeaturedCarousel 
          animes={featuredAnimes} 
          loading={loadingSeasonal}
        />

        {/* Continue Watching - Real data from history */}
        {user && <ContinueWatching limit={10} />}

        {/* Personalized Recommendations */}
        {user && (
          <AnimeRecommendations limit={10} />
        )}

        {/* Trending Now */}
        <AnimeSection
          title="Trending Now"
          animes={popular}
          loading={loadingPopular}
          viewAllLink="/search?filter=trending"
          cardSize="md"
        />

        {/* This Season */}
        <AnimeSection
          title="This Season"
          animes={seasonal}
          loading={loadingSeasonal}
          viewAllLink="/search?filter=seasonal"
          cardSize="md"
        />

        {/* All-Time Favorites */}
        <AnimeSection
          title="All-Time Favorites"
          animes={favorites}
          loading={loadingFavorites}
          viewAllLink="/search?filter=favorites"
          cardSize="md"
        />

        {/* Currently Airing */}
        <AnimeSection
          title="Currently Airing"
          animes={topAiring}
          loading={loadingAiring}
          viewAllLink="/search?filter=airing"
          cardSize="md"
        />
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
