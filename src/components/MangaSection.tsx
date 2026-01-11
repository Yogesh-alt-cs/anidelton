import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import MangaCard from './MangaCard';
import { MangaSearchResult } from '@/types/manga';
import { Skeleton } from '@/components/ui/skeleton';

interface MangaSectionProps {
  title: string;
  manga: MangaSearchResult[];
  loading?: boolean;
  viewAllLink?: string;
  cardSize?: 'sm' | 'md' | 'lg';
}

const MangaSection = ({ 
  title, 
  manga, 
  loading = false,
  viewAllLink,
  cardSize = 'md',
}: MangaSectionProps) => {
  const skeletonCount = 6;
  
  const sizeClasses = {
    sm: 'w-28 h-40',
    md: 'w-36 h-52',
    lg: 'w-44 h-64',
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        {viewAllLink && (
          <Link 
            to={viewAllLink}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
        {loading ? (
          Array.from({ length: skeletonCount }).map((_, i) => (
            <div key={i} className="flex-shrink-0 space-y-2">
              <Skeleton className={sizeClasses[cardSize]} />
              <Skeleton className="h-4 w-24" />
            </div>
          ))
        ) : manga.length > 0 ? (
          manga.map((item) => (
            <MangaCard key={item.id} manga={item} size={cardSize} />
          ))
        ) : (
          <p className="text-muted-foreground text-sm">No manga found</p>
        )}
      </div>
    </section>
  );
};

export default MangaSection;
