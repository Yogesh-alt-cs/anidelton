import { Home, Search, Bookmark, Bell, User, Grid3X3, Clock } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';

const BottomNav = () => {
  const location = useLocation();
  const { unreadCount } = useNotifications();

  const navItems = [
    { icon: Home, label: 'Home', path: '/', badge: 0 },
    { icon: Grid3X3, label: 'Genres', path: '/genres', badge: 0 },
    { icon: Search, label: 'Search', path: '/search', badge: 0 },
    { icon: Clock, label: 'History', path: '/history', badge: 0 },
    { icon: User, label: 'Profile', path: '/profile', badge: 0 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navItems.map(({ icon: Icon, label, path, badge }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute -top-1 w-8 h-1 rounded-full bg-gradient-to-r from-primary to-accent" />
              )}
              <div className="relative">
                <Icon className={cn(
                  "w-5 h-5 transition-transform duration-300",
                  isActive && "scale-110"
                )} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-0.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
