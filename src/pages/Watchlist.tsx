import { useState } from 'react';
import { useTopAnime } from '@/hooks/useAnimeApi';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import AnimeCard from '@/components/AnimeCard';
import { Bookmark, Eye, CheckCircle, Clock, XCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type WatchlistTab = 'watching' | 'completed' | 'plan_to_watch' | 'dropped';

const tabs: { id: WatchlistTab; label: string; icon: React.ElementType }[] = [
  { id: 'watching', label: 'Watching', icon: Eye },
  { id: 'plan_to_watch', label: 'Plan to Watch', icon: Clock },
  { id: 'completed', label: 'Completed', icon: CheckCircle },
  { id: 'dropped', label: 'Dropped', icon: XCircle },
];

const Watchlist = () => {
  const [activeTab, setActiveTab] = useState<WatchlistTab>('watching');
  
  // Mock data using top anime - in real app this would come from user's saved watchlist
  const { data: mockWatching, loading } = useTopAnime('airing', 6);
  const { data: mockPlanToWatch } = useTopAnime('upcoming', 8);
  const { data: mockCompleted } = useTopAnime('favorite', 10);
  const { data: mockDropped } = useTopAnime('bypopularity', 2);

  const getAnimeForTab = () => {
    switch (activeTab) {
      case 'watching':
        return mockWatching;
      case 'plan_to_watch':
        return mockPlanToWatch;
      case 'completed':
        return mockCompleted;
      case 'dropped':
        return mockDropped;
      default:
        return [];
    }
  };

  const animeList = getAnimeForTab();
  const ActiveIcon = tabs.find(t => t.id === activeTab)?.icon || Bookmark;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      
      <main className="pt-20 px-4 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
            <Bookmark className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-inter font-bold">My Watchlist</h1>
            <p className="text-sm text-muted-foreground">Track your anime journey</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto scroll-hidden -mx-4 px-4 pb-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap",
                activeTab === id
                  ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {tabs.map(({ id, label, icon: Icon }) => (
            <div
              key={id}
              className={cn(
                "p-3 rounded-xl text-center transition-all",
                activeTab === id ? "bg-primary/10 border border-primary/20" : "bg-card"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 mx-auto mb-1",
                activeTab === id ? "text-primary" : "text-muted-foreground"
              )} />
              <p className="text-lg font-bold">
                {id === 'watching' ? mockWatching.length :
                 id === 'plan_to_watch' ? mockPlanToWatch.length :
                 id === 'completed' ? mockCompleted.length :
                 mockDropped.length}
              </p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Anime Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-inter font-bold flex items-center gap-2">
              <ActiveIcon className="w-5 h-5 text-primary" />
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            <span className="text-sm text-muted-foreground">
              {animeList.length} anime
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="aspect-[3/4] rounded-xl bg-card shimmer" />
                  <div className="h-4 w-3/4 rounded bg-card shimmer" />
                </div>
              ))}
            </div>
          ) : animeList.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {animeList.map((anime, index) => (
                <div 
                  key={anime.mal_id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <AnimeCard 
                    anime={anime} 
                    size="sm"
                    showProgress={activeTab === 'watching'}
                    progress={activeTab === 'watching' ? Math.floor(Math.random() * 100) : undefined}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-muted-foreground" />
              </div>
              <h4 className="text-lg font-medium mb-2">No anime here yet</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Start adding anime to your {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} list
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Watchlist;
