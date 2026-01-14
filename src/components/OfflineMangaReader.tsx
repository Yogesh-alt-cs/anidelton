import { useState, useEffect, useCallback, useRef } from 'react';
import { MangaPage } from '@/types/manga';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
  Maximize,
  Minimize,
  WifiOff
} from 'lucide-react';

interface OfflineMangaReaderProps {
  pages: MangaPage[];
  currentPage: number;
  onPageChange: (page: number) => void;
  onClose: () => void;
  chapterTitle?: string;
  mangaTitle?: string;
}

type ReadingMode = 'page' | 'scroll';

const OfflineMangaReader = ({
  pages,
  currentPage,
  onPageChange,
  onClose,
  chapterTitle,
  mangaTitle
}: OfflineMangaReaderProps) => {
  const [zoom, setZoom] = useState(100);
  const [mode, setMode] = useState<ReadingMode>('page');
  const [darkMode, setDarkMode] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

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
        if (isFullscreen) {
          document.exitFullscreen?.();
        } else {
          onClose();
        }
      }
      
      if (e.key === '+' || e.key === '=') {
        setZoom(prev => Math.min(prev + 25, 200));
      }
      
      if (e.key === '-') {
        setZoom(prev => Math.max(prev - 25, 50));
      }
      
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, pages.length, mode, onPageChange, onClose, isFullscreen]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && containerRef.current) {
        await containerRef.current.requestFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

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
        const images = container.querySelectorAll('[data-page]');
        let currentVisible = 1;
        
        images.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const pageNum = parseInt(el.getAttribute('data-page') || '1');
          if (rect.top <= window.innerHeight / 2) {
            currentVisible = pageNum;
          }
        });
        
        onPageChange(currentVisible);
      };

      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [mode, onPageChange]);

  // Click to navigate (tap zones)
  const handleReaderClick = (e: React.MouseEvent) => {
    if (mode !== 'page') return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    if (x < width / 3) {
      if (currentPage > 1) {
        onPageChange(currentPage - 1);
      }
    } else if (x > (width * 2) / 3) {
      if (currentPage < pages.length) {
        onPageChange(currentPage + 1);
      }
    } else {
      setShowControls(prev => !prev);
    }
  };

  if (pages.length === 0) {
    return (
      <div className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        darkMode ? "bg-black" : "bg-white"
      )}>
        <div className="flex flex-col items-center gap-4 text-center p-6">
          <WifiOff className={cn("w-16 h-16 opacity-50", darkMode ? "text-white" : "text-black")} />
          <h2 className={cn("text-xl font-bold", darkMode ? "text-white" : "text-black")}>
            No pages available
          </h2>
          <Button onClick={onClose} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        "fixed inset-0 z-50 flex flex-col",
        darkMode ? "bg-black" : "bg-white"
      )}
      onMouseMove={resetControlsTimeout}
    >
      {/* Offline indicator */}
      <div className={cn(
        "absolute top-4 right-4 z-30 flex items-center gap-1 px-2 py-1 rounded-full text-xs",
        darkMode ? "bg-yellow-500/20 text-yellow-400" : "bg-yellow-100 text-yellow-600"
      )}>
        <WifiOff className="w-3 h-3" />
        Offline
      </div>

      {/* Header Controls */}
      <div className={cn(
        "absolute top-0 left-0 right-0 z-20 p-3 sm:p-4 transition-opacity duration-300",
        showControls ? "opacity-100" : "opacity-0 pointer-events-none",
        darkMode ? "bg-gradient-to-b from-black/90 to-transparent" : "bg-gradient-to-b from-white/90 to-transparent"
      )}>
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className={darkMode ? "text-white hover:bg-white/20" : "text-black hover:bg-black/10"}
          >
            <X className="w-6 h-6" />
          </Button>
          
          <div className="text-center flex-1 mx-4">
            {mangaTitle && (
              <p className={cn("text-xs truncate", darkMode ? "text-gray-400" : "text-gray-600")}>
                {mangaTitle}
              </p>
            )}
            <span className={cn("text-sm font-medium", darkMode ? "text-white" : "text-black")}>
              {chapterTitle && `${chapterTitle} • `}
              {currentPage} / {pages.length}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMode(mode === 'page' ? 'scroll' : 'page')}
              className={cn(
                "hidden sm:flex",
                darkMode ? "text-white hover:bg-white/20" : "text-black hover:bg-black/10"
              )}
              title={mode === 'page' ? 'Switch to scroll mode' : 'Switch to page mode'}
            >
              {mode === 'page' ? <ArrowDown className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom(prev => Math.max(prev - 25, 50))}
              className={cn(
                "hidden sm:flex",
                darkMode ? "text-white hover:bg-white/20" : "text-black hover:bg-black/10"
              )}
            >
              <ZoomOut className="w-5 h-5" />
            </Button>
            
            <span className={cn(
              "text-sm min-w-[3rem] text-center hidden sm:block",
              darkMode ? "text-white" : "text-black"
            )}>
              {zoom}%
            </span>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom(prev => Math.min(prev + 25, 200))}
              className={cn(
                "hidden sm:flex",
                darkMode ? "text-white hover:bg-white/20" : "text-black hover:bg-black/10"
              )}
            >
              <ZoomIn className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className={darkMode ? "text-white hover:bg-white/20" : "text-black hover:bg-black/10"}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
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
        <div 
          className="flex-1 flex items-center justify-center overflow-auto cursor-pointer select-none"
          onClick={handleReaderClick}
        >
          <div 
            className="relative flex items-center justify-center w-full h-full p-4"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
          >
            <img
              key={`page-${currentPage}`}
              src={pages[currentPage - 1]?.img}
              alt={`Page ${currentPage}`}
              className="max-h-[85vh] max-w-full w-auto object-contain"
              draggable={false}
            />
          </div>

          {/* Page Navigation Buttons */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              if (currentPage > 1) {
                onPageChange(currentPage - 1);
              }
            }}
            disabled={currentPage <= 1}
            className={cn(
              "absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full",
              darkMode ? "text-white hover:bg-white/20 bg-black/30" : "text-black hover:bg-black/10 bg-white/30",
              !showControls && "opacity-0 pointer-events-none",
              "transition-opacity duration-300"
            )}
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              if (currentPage < pages.length) {
                onPageChange(currentPage + 1);
              }
            }}
            disabled={currentPage >= pages.length}
            className={cn(
              "absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full",
              darkMode ? "text-white hover:bg-white/20 bg-black/30" : "text-black hover:bg-black/10 bg-white/30",
              !showControls && "opacity-0 pointer-events-none",
              "transition-opacity duration-300"
            )}
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
          </Button>
        </div>
      )}

      {/* Scroll Mode */}
      {mode === 'scroll' && (
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto scroll-smooth"
        >
          <div className="flex flex-col items-center gap-1 py-16">
            {pages.map((page, index) => (
              <div key={page.page} data-page={page.page} className="relative w-full flex flex-col items-center">
                <img
                  src={page.img}
                  alt={`Page ${index + 1}`}
                  className="max-w-full w-auto"
                  style={{ maxWidth: `${zoom}%` }}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Progress Bar */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-1.5",
        darkMode ? "bg-white/10" : "bg-black/10"
      )}>
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${(currentPage / pages.length) * 100}%` }}
        />
      </div>
      
      {/* Mobile mode toggle */}
      <div className={cn(
        "absolute bottom-6 left-1/2 -translate-x-1/2 sm:hidden transition-opacity duration-300",
        showControls ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full",
          darkMode ? "bg-white/10 backdrop-blur-sm" : "bg-black/10 backdrop-blur-sm"
        )}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode(mode === 'page' ? 'scroll' : 'page')}
            className={darkMode ? "text-white" : "text-black"}
          >
            {mode === 'page' ? (
              <>
                <ArrowDown className="w-4 h-4 mr-1" /> Scroll
              </>
            ) : (
              <>
                <LayoutGrid className="w-4 h-4 mr-1" /> Page
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OfflineMangaReader;
