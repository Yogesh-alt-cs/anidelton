import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Anime } from '@/types/anime';
import AnimeCard from './AnimeCard';
import { cn } from '@/lib/utils';

interface AnimeSectionProps {
  title: string;
  animes: Anime[];
  loading?: boolean;
  viewAllLink?: string;
  cardSize?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

const AnimeSection = ({ 
  title, 
  animes, 
  loading, 
  viewAllLink,
  cardSize = 'md',
  showProgress = false,
}: AnimeSectionProps) => {
  if (loading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-inter font-bold">{title}</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto scroll-hidden pb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "flex-shrink-0 rounded-xl bg-card shimmer",
                cardSize === 'sm' ? 'w-28 h-40' : cardSize === 'md' ? 'w-36 h-52' : 'w-44 h-64'
              )}
            />
          ))}
        </div>
      </section>
    );
  }

  if (animes.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-inter font-bold">{title}</h2>
        {viewAllLink && (
          <Link 
            to={viewAllLink}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto scroll-hidden pb-4 -mx-4 px-4">
        {animes.map((anime, index) => (
          <div 
            key={anime.mal_id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <AnimeCard 
              anime={anime} 
              size={cardSize}
              showProgress={showProgress}
              progress={showProgress ? Math.floor(Math.random() * 100) : undefined}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default AnimeSection;
