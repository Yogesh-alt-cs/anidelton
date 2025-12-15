import { Search, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  showSearch?: boolean;
  showNotifications?: boolean;
}

const Header = ({ showSearch = true, showNotifications = true }: HeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
            <span className="text-xl font-bold text-primary-foreground">A</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-accent opacity-50 blur-lg -z-10" />
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
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
