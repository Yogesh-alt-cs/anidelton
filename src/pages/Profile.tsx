import { Link } from 'react-router-dom';
import { 
  Settings, ChevronRight, Eye, CheckCircle, Clock, Heart,
  Star, TrendingUp, Film, LogOut
} from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Profile = () => {
  // Mock user data
  const user = {
    name: 'Anime Fan',
    username: '@animefan',
    avatar: null,
    stats: {
      watching: 12,
      completed: 87,
      planToWatch: 45,
      favorites: 23,
    },
    totalEpisodes: 1247,
    hoursWatched: 498,
    averageScore: 8.2,
  };

  const menuItems = [
    { icon: Eye, label: 'Watching', count: user.stats.watching, path: '/watchlist?tab=watching' },
    { icon: CheckCircle, label: 'Completed', count: user.stats.completed, path: '/watchlist?tab=completed' },
    { icon: Clock, label: 'Plan to Watch', count: user.stats.planToWatch, path: '/watchlist?tab=plan_to_watch' },
    { icon: Heart, label: 'Favorites', count: user.stats.favorites, path: '/watchlist?tab=favorites' },
  ];

  const settingsItems = [
    { label: 'Account Settings', path: '/settings' },
    { label: 'Notifications', path: '/settings/notifications' },
    { label: 'Appearance', path: '/settings/appearance' },
    { label: 'Privacy', path: '/settings/privacy' },
    { label: 'Help & Support', path: '/settings/help' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header showSearch={false} showNotifications={false} />
      
      <main className="pt-20 px-4 space-y-6 max-w-lg mx-auto">
        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-lg shadow-primary/25">
              {user.name.charAt(0)}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-background" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-inter font-bold">{user.name}</h1>
            <p className="text-sm text-muted-foreground">{user.username}</p>
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
            <p className="text-2xl font-bold">{user.totalEpisodes}</p>
            <p className="text-xs text-muted-foreground">Episodes</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/50 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-2 text-accent" />
            <p className="text-2xl font-bold">{user.hoursWatched}</p>
            <p className="text-xs text-muted-foreground">Hours</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/50 text-center">
            <Star className="w-5 h-5 mx-auto mb-2 text-yellow-400" />
            <p className="text-2xl font-bold">{user.averageScore}</p>
            <p className="text-xs text-muted-foreground">Avg Score</p>
          </div>
        </div>

        {/* Watchlist Quick Access */}
        <div className="space-y-2">
          <h2 className="text-lg font-inter font-bold">My Lists</h2>
          <div className="space-y-2">
            {menuItems.map(({ icon: Icon, label, count, path }) => (
              <Link
                key={label}
                to={path}
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
        <Link to="/auth">
          <Button variant="ghost" className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
        </Link>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
