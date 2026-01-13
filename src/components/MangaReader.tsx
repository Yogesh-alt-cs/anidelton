import { useState, useEffect, useCallback, useRef } from 'react';
import { MangaPage } from '@/types/manga';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { extractOriginalUrl, getFallbackReaderImageUrl } from '@/lib/mangaApi';
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
  Loader2,
  Maximize,
  Minimize,
  RefreshCw,
  AlertCircle,
  ImageOff
} from 'lucide-react';

interface MangaReaderProps {
  pages: MangaPage[];
  loading: boolean;
  error?: string | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  onClose: () => void;
  onRetry?: () => void;
  chapterTitle?: string;
  onNextChapter?: () => void;
  onPrevChapter?: () => void;
  hasNextChapter?: boolean;
  hasPrevChapter?: boolean;
}

type ReadingMode = 'page' | 'scroll';

type PageLoadState = 'loading' | 'loaded' | 'error';

const MangaReader = ({
  pages,
  loading,
  error,
  currentPage,
  onPageChange,
  onClose,
  onRetry,
  chapterTitle,
  onNextChapter,
  onPrevChapter,
  hasNextChapter,
  hasPrevChapter,
}: MangaReaderProps) => {
  const [zoom, setZoom] = useState(100);
  const [mode, setMode] = useState<ReadingMode>('page');
  const [darkMode, setDarkMode] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  
  // Scroll mode: track load state per page
  const [scrollPageStates, setScrollPageStates] = useState<Record<number, PageLoadState>>({});
  const [failedScrollPages, setFailedScrollPages] = useState<Set<number>>(new Set());
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset scroll page states when pages change
  useEffect(() => {
    setScrollPageStates({});
    setFailedScrollPages(new Set());
  }, [pages]);

  // Preload adjacent pages
  useEffect(() => {
    if (pages.length === 0) return;
    
    const preloadImage = (src: string) => {
      const img = new Image();
      img.src = src;
    };
    
    // Preload next 2 pages
    for (let i = currentPage; i < Math.min(currentPage + 3, pages.length); i++) {
      if (pages[i]) preloadImage(pages[i].img);
    }
    
    // Preload previous page
    if (currentPage > 1 && pages[currentPage - 2]) {
      preloadImage(pages[currentPage - 2].img);
    }
  }, [currentPage, pages]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === 'page') {
        if (e.key === 'ArrowRight' || e.key === ' ') {
          e.preventDefault();
          if (currentPage < pages.length) {
            onPageChange(currentPage + 1);
          } else if (hasNextChapter && onNextChapter) {
            onNextChapter();
          }
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          if (currentPage > 1) {
            onPageChange(currentPage - 1);
          } else if (hasPrevChapter && onPrevChapter) {
            onPrevChapter();
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
  }, [currentPage, pages.length, mode, onPageChange, onClose, hasNextChapter, hasPrevChapter, onNextChapter, onPrevChapter, isFullscreen]);

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

  // Reset image loading state when page changes
  useEffect(() => {
    if (!loadedPages.has(currentPage)) {
      setImageLoading(true);
    } else {
      setImageLoading(false);
    }
    setImageError(false);
  }, [currentPage, loadedPages]);

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

  const handleImageLoad = () => {
    setImageLoading(false);
    setLoadedPages(prev => new Set(prev).add(currentPage));
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handleRetryImage = () => {
    setImageError(false);
    setImageLoading(true);
    // Force reload by adding timestamp
    const img = document.querySelector(`img[data-current-page="${currentPage}"]`) as HTMLImageElement;
    if (img) {
      const src = img.src.split('?t=')[0];
      img.src = `${src}${src.includes('?') ? '&' : '?'}t=${Date.now()}`;
    }
  };

  // Scroll mode: handle page load state
  const handleScrollPageLoad = (pageNum: number) => {
    setScrollPageStates(prev => ({ ...prev, [pageNum]: 'loaded' }));
    setFailedScrollPages(prev => {
      const next = new Set(prev);
      next.delete(pageNum);
      return next;
    });
  };

  const handleScrollPageError = (pageNum: number) => {
    setScrollPageStates(prev => ({ ...prev, [pageNum]: 'error' }));
    setFailedScrollPages(prev => new Set(prev).add(pageNum));
  };

  const retryScrollPage = (pageNum: number, imgElement: HTMLImageElement) => {
    setScrollPageStates(prev => ({ ...prev, [pageNum]: 'loading' }));
    const originalSrc = pages[pageNum - 1]?.img;
    if (originalSrc) {
      // Try fallback proxy
      const original = extractOriginalUrl(originalSrc);
      if (original) {
        imgElement.src = getFallbackReaderImageUrl(original);
      } else {
        // Just reload with timestamp
        const src = originalSrc.split('?t=')[0];
        imgElement.src = `${src}${src.includes('?') ? '&' : '?'}t=${Date.now()}`;
      }
    }
  };

  const retryAllFailedPages = () => {
    failedScrollPages.forEach(pageNum => {
      const img = document.querySelector(`img[data-page="${pageNum}"]`) as HTMLImageElement;
      if (img) {
        retryScrollPage(pageNum, img);
      }
    });
  };

  // Click to navigate (tap zones)
  const handleReaderClick = (e: React.MouseEvent) => {
    if (mode !== 'page') return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    // Left third = previous, right third = next
    if (x < width / 3) {
      if (currentPage > 1) {
        onPageChange(currentPage - 1);
      }
    } else if (x > (width * 2) / 3) {
      if (currentPage < pages.length) {
        onPageChange(currentPage + 1);
      }
    } else {
      // Middle = toggle controls
      setShowControls(prev => !prev);
    }
  };

  if (loading) {
    return (
      <div className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        darkMode ? "bg-black" : "bg-white"
      )}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className={cn("w-10 h-10 animate-spin", darkMode ? "text-white" : "text-black")} />
          <p className={cn("text-lg", darkMode ? "text-white" : "text-black")}>Loading chapter...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        darkMode ? "bg-black" : "bg-white"
      )}>
        <div className="flex flex-col items-center gap-4 text-center p-6 max-w-md">
          <AlertCircle className={cn("w-16 h-16", darkMode ? "text-red-400" : "text-red-500")} />
          <h2 className={cn("text-xl font-bold", darkMode ? "text-white" : "text-black")}>
            Failed to load chapter
          </h2>
          <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-600")}>
            {error}
          </p>
          <div className="flex gap-3 mt-4">
            {onRetry && (
              <Button onClick={onRetry} variant="default">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
            <Button onClick={onClose} variant="outline">
              Go Back
            </Button>
          </div>
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
        <div className="flex flex-col items-center gap-4 text-center p-6">
          <AlertCircle className={cn("w-16 h-16 opacity-50", darkMode ? "text-white" : "text-black")} />
          <h2 className={cn("text-xl font-bold", darkMode ? "text-white" : "text-black")}>
            No pages available
          </h2>
          <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-600")}>
            This chapter may not have any readable pages yet.
          </p>
          <div className="flex gap-3 mt-4">
            {onRetry && (
              <Button onClick={onRetry} variant="default">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
            <Button onClick={onClose} variant="outline">
              Go Back
            </Button>
          </div>
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
          
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-medium", darkMode ? "text-white" : "text-black")}>
              {chapterTitle && `${chapterTitle} • `}
              {currentPage} / {pages.length}
            </span>
            {mode === 'scroll' && failedScrollPages.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={retryAllFailedPages}
                className={cn(
                  "text-xs",
                  darkMode ? "text-red-400 hover:bg-red-500/20" : "text-red-600 hover:bg-red-100"
                )}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry {failedScrollPages.size} failed
              </Button>
            )}
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
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className={cn("w-8 h-8 animate-spin", darkMode ? "text-white" : "text-black")} />
                  <span className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-600")}>
                    Loading page {currentPage}...
                  </span>
                </div>
              </div>
            )}
            
            {imageError ? (
              <div className="flex flex-col items-center gap-4">
                <AlertCircle className={cn("w-16 h-16 opacity-50", darkMode ? "text-white" : "text-black")} />
                <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-600")}>
                  Failed to load page {currentPage}
                </p>
                <Button onClick={handleRetryImage} size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : (
              <img
                key={`page-${currentPage}`}
                data-current-page={currentPage}
                src={pages[currentPage - 1]?.img}
                alt={`Page ${currentPage}`}
                className={cn(
                  "max-h-[85vh] max-w-full w-auto object-contain transition-opacity duration-200",
                  imageLoading ? "opacity-0" : "opacity-100"
                )}
                onLoad={handleImageLoad}
                onError={(e) => {
                  const img = e.currentTarget;
                  const src = img.currentSrc || img.src;
                  const tried = img.dataset.fallback === '1';
                  
                  // Try fallback proxy
                  const original = extractOriginalUrl(src);
                  if (!tried && original) {
                    img.dataset.fallback = '1';
                    img.src = getFallbackReaderImageUrl(original);
                    return;
                  }
                  
                  handleImageError();
                }}
                draggable={false}
              />
            )}
          </div>

          {/* Page Navigation Buttons */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              if (currentPage > 1) {
                onPageChange(currentPage - 1);
              } else if (hasPrevChapter && onPrevChapter) {
                onPrevChapter();
              }
            }}
            disabled={currentPage <= 1 && !hasPrevChapter}
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
              } else if (hasNextChapter && onNextChapter) {
                onNextChapter();
              }
            }}
            disabled={currentPage >= pages.length && !hasNextChapter}
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
            {pages.map((page, index) => {
              const pageNum = page.page;
              const state = scrollPageStates[pageNum] || 'loading';
              
              return (
                <div key={pageNum} data-page={pageNum} className="relative w-full flex flex-col items-center">
                  {state === 'error' ? (
                    <div 
                      className={cn(
                        "flex flex-col items-center justify-center gap-3 py-12 px-6 rounded-lg my-2",
                        darkMode ? "bg-white/5" : "bg-black/5"
                      )}
                      style={{ minHeight: '200px', width: `${zoom}%`, maxWidth: '100%' }}
                    >
                      <ImageOff className={cn("w-12 h-12 opacity-50", darkMode ? "text-white" : "text-black")} />
                      <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-600")}>
                        Page {pageNum} failed to load
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const img = document.querySelector(`img[data-scroll-page="${pageNum}"]`) as HTMLImageElement;
                          if (img) {
                            retryScrollPage(pageNum, img);
                          }
                        }}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  ) : (
                    <>
                      {state === 'loading' && (
                        <div 
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ minHeight: '200px' }}
                        >
                          <Loader2 className={cn("w-6 h-6 animate-spin", darkMode ? "text-white/50" : "text-black/30")} />
                        </div>
                      )}
                      <img
                        data-scroll-page={pageNum}
                        src={page.img}
                        alt={`Page ${index + 1}`}
                        className={cn(
                          "max-w-full w-auto transition-opacity duration-200",
                          state === 'loaded' ? 'opacity-100' : 'opacity-0'
                        )}
                        style={{ maxWidth: `${zoom}%` }}
                        loading="lazy"
                        onLoad={() => handleScrollPageLoad(pageNum)}
                        onError={(e) => {
                          const img = e.currentTarget;
                          const src = img.currentSrc || img.src;
                          const tried = img.dataset.fallback === '1';
                          
                          // Try fallback proxy
                          const original = extractOriginalUrl(src);
                          if (!tried && original) {
                            img.dataset.fallback = '1';
                            img.src = getFallbackReaderImageUrl(original);
                            return;
                          }
                          
                          handleScrollPageError(pageNum);
                        }}
                      />
                    </>
                  )}
                </div>
              );
            })}
            
            {/* End of chapter navigation */}
            {hasNextChapter && onNextChapter && (
              <div className="py-8">
                <Button onClick={onNextChapter} size="lg">
                  Next Chapter
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}
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

export default MangaReader;
