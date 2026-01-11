import { useState, useEffect, useCallback, useRef } from 'react';
import { MangaPage } from '@/types/manga';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  LayoutGrid,
  ArrowDown,
  Moon,
  Sun,
  X,
  Loader2
} from 'lucide-react';

interface MangaReaderProps {
  pages: MangaPage[];
  loading: boolean;
  currentPage: number;
  onPageChange: (page: number) => void;
  onClose: () => void;
  chapterTitle?: string;
}

type ReadingMode = 'page' | 'scroll';

const MangaReader = ({
  pages,
  loading,
  currentPage,
  onPageChange,
  onClose,
  chapterTitle,
}: MangaReaderProps) => {
  const [zoom, setZoom] = useState(100);
  const [mode, setMode] = useState<ReadingMode>('page');
  const [darkMode, setDarkMode] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === 'page') {
        if (e.key === 'ArrowRight' || e.key === ' ') {
          e.preventDefault();
          if (currentPage < pages.length) {
            onPageChange(currentPage + 1);
          }
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          if (currentPage > 1) {
            onPageChange(currentPage - 1);
          }
        }
      }
      
      if (e.key === 'Escape') {
        onClose();
      }
      
      if (e.key === '+' || e.key === '=') {
        setZoom(prev => Math.min(prev + 25, 200));
      }
      
      if (e.key === '-') {
        setZoom(prev => Math.max(prev - 25, 50));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, pages.length, mode, onPageChange, onClose]);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimeout]);

  // Scroll mode page tracking
  useEffect(() => {
    if (mode === 'scroll' && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const handleScroll = () => {
        const images = container.querySelectorAll('img');
        let currentVisible = 1;
        
        images.forEach((img, index) => {
          const rect = img.getBoundingClientRect();
          if (rect.top <= window.innerHeight / 2) {
            currentVisible = index + 1;
          }
        });
        
        onPageChange(currentVisible);
      };

      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [mode, onPageChange]);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageLoading(false);
    (e.target as HTMLImageElement).src = '/placeholder.svg';
  };

  if (loading) {
    return (
      <div className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        darkMode ? "bg-black" : "bg-white"
      )}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className={cn("w-8 h-8 animate-spin", darkMode ? "text-white" : "text-black")} />
          <p className={darkMode ? "text-white" : "text-black"}>Loading pages...</p>
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        darkMode ? "bg-black" : "bg-white"
      )}>
        <div className="text-center">
          <p className={darkMode ? "text-white" : "text-black"}>No pages available</p>
          <Button onClick={onClose} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex flex-col",
        darkMode ? "bg-black" : "bg-white"
      )}
      onMouseMove={resetControlsTimeout}
      onClick={resetControlsTimeout}
    >
      {/* Header Controls */}
      <div className={cn(
        "absolute top-0 left-0 right-0 z-10 p-4 transition-opacity duration-300",
        showControls ? "opacity-100" : "opacity-0 pointer-events-none",
        darkMode ? "bg-gradient-to-b from-black/80 to-transparent" : "bg-gradient-to-b from-white/80 to-transparent"
      )}>
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className={darkMode ? "text-white hover:bg-white/20" : "text-black hover:bg-black/10"}
          >
            <X className="w-6 h-6" />
          </Button>
          
          <div className="flex items-center gap-2">
            <span className={cn("text-sm", darkMode ? "text-white" : "text-black")}>
              {chapterTitle && `${chapterTitle} • `}
              {currentPage} / {pages.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMode(mode === 'page' ? 'scroll' : 'page')}
              className={darkMode ? "text-white hover:bg-white/20" : "text-black hover:bg-black/10"}
              title={mode === 'page' ? 'Switch to scroll mode' : 'Switch to page mode'}
            >
              {mode === 'page' ? <ArrowDown className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom(prev => Math.max(prev - 25, 50))}
              className={darkMode ? "text-white hover:bg-white/20" : "text-black hover:bg-black/10"}
            >
              <ZoomOut className="w-5 h-5" />
            </Button>
            
            <span className={cn("text-sm min-w-[3rem] text-center", darkMode ? "text-white" : "text-black")}>
              {zoom}%
            </span>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom(prev => Math.min(prev + 25, 200))}
              className={darkMode ? "text-white hover:bg-white/20" : "text-black hover:bg-black/10"}
            >
              <ZoomIn className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              className={darkMode ? "text-white hover:bg-white/20" : "text-black hover:bg-black/10"}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Page Mode */}
      {mode === 'page' && (
        <div className="flex-1 flex items-center justify-center overflow-auto p-4">
          <div 
            className="relative flex items-center justify-center"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
          >
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Skeleton className="w-full h-full min-w-[300px] min-h-[400px]" />
              </div>
            )}
            <img
              src={pages[currentPage - 1]?.img}
              alt={`Page ${currentPage}`}
              className="max-h-[85vh] w-auto object-contain"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </div>

          {/* Page Navigation */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12",
              darkMode ? "text-white hover:bg-white/20" : "text-black hover:bg-black/10",
              !showControls && "opacity-0 pointer-events-none"
            )}
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= pages.length}
            className={cn(
              "absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12",
              darkMode ? "text-white hover:bg-white/20" : "text-black hover:bg-black/10",
              !showControls && "opacity-0 pointer-events-none"
            )}
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        </div>
      )}

      {/* Scroll Mode */}
      {mode === 'scroll' && (
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto"
        >
          <div className="flex flex-col items-center gap-2 py-16">
            {pages.map((page, index) => (
              <img
                key={page.page}
                src={page.img}
                alt={`Page ${index + 1}`}
                className="max-w-full w-auto"
                style={{ maxWidth: `${zoom}%` }}
                loading="lazy"
                onError={handleImageError}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bottom Progress */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-1",
        darkMode ? "bg-white/20" : "bg-black/20"
      )}>
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${(currentPage / pages.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default MangaReader;
