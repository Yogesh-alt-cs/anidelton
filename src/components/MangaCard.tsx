import { Link } from 'react-router-dom';
import { MangaSearchResult } from '@/types/manga';
import { cn } from '@/lib/utils';
import { BookOpen } from 'lucide-react';

interface MangaCardProps {
  manga: MangaSearchResult;
  size?: 'sm' | 'md' | 'lg';
}

const MangaCard = ({ manga, size = 'md' }: MangaCardProps) => {
  const sizeClasses = {
    sm: 'w-28 h-40',
    md: 'w-36 h-52',
    lg: 'w-44 h-64',
  };

  return (
    <Link 
      to={`/manga/${manga.id}`}
      className="group flex-shrink-0"
    >
      <div className={cn(
        "relative overflow-hidden rounded-xl bg-muted transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-primary/20",
        sizeClasses[size]
      )}>
        <img
          src={manga.image}
          alt={manga.title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-60" />
        
        {/* Read Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <div className="w-12 h-12 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-primary/50">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>

        {/* Status Badge */}
        <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-background/80 backdrop-blur-sm z-10">
          <span className={cn(
            "text-xs font-medium capitalize",
            manga.status === 'completed' ? 'text-green-400' : 
            manga.status === 'ongoing' ? 'text-blue-400' : 'text-muted-foreground'
          )}>
            {manga.status}
          </span>
        </div>
      </div>

      {/* Title */}
      <div className="mt-2 space-y-1">
        <h3 className={cn(
          "font-medium line-clamp-2 group-hover:text-primary transition-colors",
          size === 'sm' ? 'text-xs' : 'text-sm'
        )}>
          {manga.title}
        </h3>
      </div>
    </Link>
  );
};

export default MangaCard;
