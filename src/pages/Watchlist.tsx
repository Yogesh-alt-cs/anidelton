import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Bookmark, Eye, CheckCircle, Clock, XCircle, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWatchlist, WatchlistStatus } from '@/hooks/useWatchlist';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

type WatchlistTab = WatchlistStatus;

const tabs: { id: WatchlistTab; label: string; icon: React.ElementType }[] = [
  { id: 'watching', label: 'Watching', icon: Eye },
  { id: 'plan_to_watch', label: 'Plan to Watch', icon: Clock },
  { id: 'completed', label: 'Completed', icon: CheckCircle },
  { id: 'dropped', label: 'Dropped', icon: XCircle },
];

const Watchlist = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { watchlist, loading, getWatchlistByStatus, addToWatchlist, removeFromWatchlist } = useWatchlist();
  
  const tabParam = searchParams.get('tab') as WatchlistTab | null;
  const [activeTab, setActiveTab] = useState<WatchlistTab>(tabParam || 'watching');

  useEffect(() => {
    if (tabParam && tabs.some(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Redirect to auth if not logged in
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header />
        <main className="pt-20 px-4 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto">
              <Bookmark className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold">Sign in to view your watchlist</h2>
            <p className="text-muted-foreground text-sm">Save anime to your watchlist and track your progress</p>
            <Button variant="gradient" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const animeList = getWatchlistByStatus(activeTab);
  const ActiveIcon = tabs.find(t => t.id === activeTab)?.icon || Bookmark;

  const handleStatusChange = async (animeId: number, newStatus: WatchlistStatus) => {
    const item = watchlist.find(w => w.anime_id === animeId);
    if (item) {
      await addToWatchlist(animeId, item.anime_title, item.anime_image, newStatus);
    }
  };

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
                "p-3 rounded-xl text-center transition-all cursor-pointer",
                activeTab === id ? "bg-primary/10 border border-primary/20" : "bg-card"
              )}
              onClick={() => setActiveTab(id)}
            >
              <Icon className={cn(
                "w-5 h-5 mx-auto mb-1",
                activeTab === id ? "text-primary" : "text-muted-foreground"
              )} />
              <p className="text-lg font-bold">
                {getWatchlistByStatus(id).length}
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

          {animeList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {animeList.map((item, index) => (
                <div 
                  key={item.id}
                  className="flex gap-4 p-4 rounded-xl bg-card border border-border/50 animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <Link to={`/anime/${item.anime_id}`} className="shrink-0">
                    <img 
                      src={item.anime_image || '/placeholder.svg'} 
                      alt={item.anime_title}
                      className="w-20 h-28 object-cover rounded-lg"
                    />
                  </Link>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <Link to={`/anime/${item.anime_id}`}>
                      <h3 className="font-medium line-clamp-2 hover:text-primary transition-colors">
                        {item.anime_title}
                      </h3>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1">
                      Added {new Date(item.created_at).toLocaleDateString()}
                    </p>
                    <div className="mt-auto pt-2 flex flex-wrap gap-2">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.anime_id, e.target.value as WatchlistStatus)}
                        className="text-xs px-2 py-1 rounded-lg bg-secondary border-none focus:ring-1 focus:ring-primary"
                      >
                        {tabs.map(tab => (
                          <option key={tab.id} value={tab.id}>{tab.label}</option>
                        ))}
                      </select>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeFromWatchlist(item.anime_id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
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
              <Button variant="gradient" onClick={() => navigate('/search')}>
                Browse Anime
              </Button>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Watchlist;
