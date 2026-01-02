import { Search, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import appIcon from '@/assets/app-icon.png';

interface HeaderProps {
  showSearch?: boolean;
  showNotifications?: boolean;
}

const Header = ({ showSearch = true, showNotifications = true }: HeaderProps) => {
  const { unreadCount } = useNotifications();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-primary/25">
            <img 
              src={appIcon} 
              alt="AniDel" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 opacity-50 blur-lg -z-10" />
          </div>
          <span className="text-xl font-inter font-bold gradient-text">AniDel</span>
        </Link>

        <div className="flex items-center gap-2">
          {showSearch && (
            <Link to="/search">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Search className="w-5 h-5" />
              </Button>
            </Link>
          )}
          {showNotifications && (
            <Link to="/notifications">
              <Button variant="ghost" size="icon" className="rounded-full relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;