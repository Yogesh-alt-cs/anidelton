import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  Bookmark, 
  BookmarkCheck,
  User,
  Calendar,
  Tag,
  ChevronRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  Download
} from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import MangaReader from '@/components/MangaReader';
import MangaDownloadButton from '@/components/MangaDownloadButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useMangaDetails, 
  useMangaChapters, 
  useChapterPages,
  useReadingProgress,
  useBookmarks
} from '@/hooks/useManga';
import { prefetchChapterPages, extractOriginalUrl, getFallbackImageUrl, getChapterPages } from '@/lib/mangaApi';
import { cn } from '@/lib/utils';

const MangaDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: manga, loading: loadingManga, error, refetch: refetchManga } = useMangaDetails(id || null);
  const { data: chapters, loading: loadingChapters, refetch: refetchChapters } = useMangaChapters(id || null);
  const { saveProgress, getProgress } = useReadingProgress();
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showReader, setShowReader] = useState(false);
  
  const { data: pages, loading: loadingPages, error: pagesError, retry: retryPages } = useChapterPages(selectedChapterId);

  // Get reading progress for this manga
  const readingProgress = getProgress(id || '');

  // Find chapters info
  const selectedChapterIndex = useMemo(() => 
    chapters.findIndex(ch => ch.id === selectedChapterId), 
    [chapters, selectedChapterId]
  );
  
  const hasNextChapter = selectedChapterIndex >= 0 && selectedChapterIndex < chapters.length - 1;
  const hasPrevChapter = selectedChapterIndex > 0;

  // Find the chapter to continue from
  const continueChapter = chapters.find(ch => ch.id === readingProgress?.chapterId);

  // Prefetch next chapter when reading
  useEffect(() => {
    if (hasNextChapter && selectedChapterId) {
      const nextChapter = chapters[selectedChapterIndex + 1];
      if (nextChapter) {
        prefetchChapterPages(nextChapter.id);
      }
    }
  }, [selectedChapterId, hasNextChapter, selectedChapterIndex, chapters]);

  const handleReadChapter = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    const savedProgress = getProgress(id || '');
    if (savedProgress?.chapterId === chapterId) {
      setCurrentPage(savedProgress.page);
    } else {
      setCurrentPage(1);
    }
    setShowReader(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (id && selectedChapterId) {
      saveProgress(id, selectedChapterId, page);
    }
  };

  const handleCloseReader = () => {
    setShowReader(false);
    setSelectedChapterId(null);
  };

  const handleNextChapter = () => {
    if (hasNextChapter) {
      const nextChapter = chapters[selectedChapterIndex + 1];
      setSelectedChapterId(nextChapter.id);
      setCurrentPage(1);
      if (id) {
        saveProgress(id, nextChapter.id, 1);
      }
    }
  };

  const handlePrevChapter = () => {
    if (hasPrevChapter) {
      const prevChapter = chapters[selectedChapterIndex - 1];
      setSelectedChapterId(prevChapter.id);
      setCurrentPage(1);
      if (id) {
        saveProgress(id, prevChapter.id, 1);
      }
    }
  };

  const handleBookmark = () => {
    if (!manga || !id) return;
    
    if (isBookmarked(id)) {
      removeBookmark(id);
    } else {
      addBookmark({
        id,
        title: manga.title,
        image: manga.image,
        status: manga.status,
        contentRating: manga.contentRating,
      });
    }
  };

  const handleRetryAll = () => {
    refetchManga();
    refetchChapters();
  };

  if (loadingManga) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header />
        <main className="pt-20 px-4 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-6 animate-pulse">
            <Skeleton className="w-48 h-72 rounded-xl mx-auto md:mx-0 flex-shrink-0" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-24 w-full" />
              <div className="flex gap-3">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-10" />
              </div>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header />
        <main className="pt-20 px-4 max-w-4xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-bold mb-2">Failed to load manga</h2>
            <p className="text-muted-foreground mb-4">{error || 'Manga not found'}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleRetryAll}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
              <Button variant="outline" onClick={() => navigate('/manga')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Manga
              </Button>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  // Show reader if active
  if (showReader) {
    const selectedChapter = chapters.find(ch => ch.id === selectedChapterId);
    return (
      <MangaReader
        pages={pages}
        loading={loadingPages}
        error={pagesError}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onClose={handleCloseReader}
        onRetry={retryPages}
        chapterTitle={selectedChapter ? `Ch. ${selectedChapter.chapterNumber}` : undefined}
        onNextChapter={handleNextChapter}
        onPrevChapter={handlePrevChapter}
        hasNextChapter={hasNextChapter}
        hasPrevChapter={hasPrevChapter}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      
      <main className="pt-20 px-4 max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/manga')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Cover Image */}
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <img
              src={manga.image}
              alt={manga.title}
              className="w-48 h-72 object-cover rounded-xl shadow-lg shadow-primary/10"
              onError={(e) => {
                const img = e.currentTarget;
                const src = img.currentSrc || img.src;
                const tried = img.dataset.fallback === '1';
                
                const original = extractOriginalUrl(src);
                if (!tried && original) {
                  img.dataset.fallback = '1';
                  img.src = getFallbackImageUrl(original);
                  return;
                }
                
                img.src = '/placeholder.svg';
              }}
            />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold">{manga.title}</h1>
            
            {manga.altTitles.length > 0 && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {manga.altTitles.slice(0, 2).join(' • ')}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap gap-3 text-sm">
              <Badge variant="outline" className={cn(
                manga.status === 'completed' ? 'border-green-500 text-green-500' :
                manga.status === 'ongoing' ? 'border-blue-500 text-blue-500' :
                manga.status === 'hiatus' ? 'border-yellow-500 text-yellow-500' :
                'border-muted-foreground'
              )}>
                {manga.status}
              </Badge>
              
              {manga.releaseDate && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{manga.releaseDate}</span>
                </div>
              )}
              
              {manga.lastChapter && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <BookOpen className="w-4 h-4" />
                  <span>{manga.lastChapter} chapters</span>
                </div>
              )}
            </div>

            {/* Authors/Artists */}
            {(manga.authors.length > 0 || manga.artists.length > 0) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4 flex-shrink-0" />
                <span className="line-clamp-1">
                  {[...new Set([...manga.authors, ...manga.artists])].join(', ')}
                </span>
              </div>
            )}

            {/* Genres */}
            {manga.genres.length > 0 && (
              <div className="flex items-start gap-2">
                <Tag className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                <div className="flex flex-wrap gap-2">
                  {manga.genres.slice(0, 6).map((genre) => (
                    <Badge key={genre} variant="secondary" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {chapters.length > 0 && (
                <Button
                  onClick={() => handleReadChapter(continueChapter?.id || chapters[0].id)}
                  className="flex-1 md:flex-none"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  {continueChapter ? 'Continue Reading' : 'Start Reading'}
                </Button>
              )}
              
              <Button
                variant="outline"
                size="icon"
                onClick={handleBookmark}
              >
                {isBookmarked(id!) ? (
                  <BookmarkCheck className="w-5 h-5 text-primary" />
                ) : (
                  <Bookmark className="w-5 h-5" />
                )}
              </Button>
            </div>
            
            {/* Continue info */}
            {continueChapter && readingProgress && (
              <p className="text-xs text-muted-foreground">
                Continue from Chapter {continueChapter.chapterNumber}, Page {readingProgress.page}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        {manga.description && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Synopsis</h2>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-6">
              {manga.description}
            </p>
          </div>
        )}

        {/* Chapters List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Chapters ({chapters.length})
            </h2>
            {loadingChapters && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
          
          {loadingChapters && chapters.length === 0 ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : chapters.length > 0 ? (
            <ScrollArea className="h-[400px] rounded-lg border border-border/50">
              <div className="divide-y divide-border/50">
                {chapters.map((chapter) => {
                  const isCurrentChapter = readingProgress?.chapterId === chapter.id;
                  
                  return (
                    <div
                      key={chapter.id}
                      className={cn(
                        "w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors",
                        isCurrentChapter && "bg-primary/10 hover:bg-primary/20"
                      )}
                    >
                      <button
                        onClick={() => handleReadChapter(chapter.id)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <p className={cn(
                          "font-medium truncate",
                          isCurrentChapter && "text-primary"
                        )}>
                          Chapter {chapter.chapterNumber}
                          {chapter.title && ` - ${chapter.title}`}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          {chapter.scanlationGroup && (
                            <span className="truncate max-w-[150px]">{chapter.scanlationGroup}</span>
                          )}
                          {chapter.pages > 0 && (
                            <span>{chapter.pages} pages</span>
                          )}
                          {isCurrentChapter && readingProgress && (
                            <span className="text-primary">• Page {readingProgress.page}</span>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center gap-1 ml-2">
                        <MangaDownloadButton
                          mangaId={id!}
                          mangaTitle={manga.title}
                          chapterId={chapter.id}
                          chapterNumber={chapter.chapterNumber}
                          chapterTitle={chapter.title}
                          coverImage={manga.image}
                          onLoadPages={() => getChapterPages(chapter.id)}
                          size="icon"
                          className="h-8 w-8"
                        />
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground border border-border/50 rounded-lg">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No English chapters available</p>
              <p className="text-xs mt-1">Try checking back later</p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default MangaDetails;