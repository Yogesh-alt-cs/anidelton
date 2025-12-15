import { Link, useNavigate } from 'react-router-dom';
import { 
  Settings, ChevronRight, Eye, CheckCircle, Clock, Heart,
  Star, TrendingUp, Film, LogOut, Loader2
} from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useWatchProgress } from '@/hooks/useWatchProgress';

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { watchlist, loading: watchlistLoading } = useWatchlist();
  const { progress } = useWatchProgress();

  // Redirect to auth if not logged in
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header showSearch={false} showNotifications={false} />
        <main className="pt-20 px-4 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto text-3xl font-bold text-primary-foreground">
              ?
            </div>
            <h2 className="text-xl font-bold">Sign in to view your profile</h2>
            <p className="text-muted-foreground text-sm">Track your anime, save your watchlist, and more</p>
            <Button variant="gradient" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (authLoading || watchlistLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = {
    watching: watchlist.filter(w => w.status === 'watching').length,
    completed: watchlist.filter(w => w.status === 'completed').length,
    planToWatch: watchlist.filter(w => w.status === 'plan_to_watch').length,
    dropped: watchlist.filter(w => w.status === 'dropped').length,
  };

  const totalEpisodes = progress.length;
  const completedEpisodes = progress.filter(p => p.completed).length;
  const hoursWatched = Math.round(progress.reduce((acc, p) => acc + (p.progress_seconds || 0), 0) / 3600);

  const menuItems = [
    { icon: Eye, label: 'Watching', count: stats.watching, tab: 'watching' },
    { icon: CheckCircle, label: 'Completed', count: stats.completed, tab: 'completed' },
    { icon: Clock, label: 'Plan to Watch', count: stats.planToWatch, tab: 'plan_to_watch' },
    { icon: Heart, label: 'Dropped', count: stats.dropped, tab: 'dropped' },
  ];

  const settingsItems = [
    { label: 'Account Settings', path: '/settings' },
    { label: 'Notifications', path: '/notifications' },
    { label: 'Help & Support', path: '/settings/help' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header showSearch={false} showNotifications={false} />
      
      <main className="pt-20 px-4 space-y-6 max-w-lg mx-auto">
        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-lg shadow-primary/25">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-background" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-inter font-bold">{username}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Link to="/settings">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-card border border-border/50 text-center">
            <Film className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{totalEpisodes}</p>
            <p className="text-xs text-muted-foreground">Episodes</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/50 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-2 text-accent" />
            <p className="text-2xl font-bold">{hoursWatched}</p>
            <p className="text-xs text-muted-foreground">Hours</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/50 text-center">
            <Star className="w-5 h-5 mx-auto mb-2 text-yellow-400" />
            <p className="text-2xl font-bold">{completedEpisodes}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
        </div>

        {/* Watchlist Quick Access */}
        <div className="space-y-2">
          <h2 className="text-lg font-inter font-bold">My Lists</h2>
          <div className="space-y-2">
            {menuItems.map(({ icon: Icon, label, count, tab }) => (
              <Link
                key={label}
                to={`/watchlist?tab=${tab}`}
                className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="font-medium">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{count}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Settings Menu */}
        <div className="space-y-2">
          <h2 className="text-lg font-inter font-bold">Settings</h2>
          <div className="rounded-xl bg-card border border-border/50 overflow-hidden divide-y divide-border/50">
            {settingsItems.map(({ label, path }) => (
              <Link
                key={label}
                to={path}
                className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
              >
                <span className="font-medium">{label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>

        {/* Logout */}
        <Button 
          variant="ghost" 
          className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </Button>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
