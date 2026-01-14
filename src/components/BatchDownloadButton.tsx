import { useState } from 'react';
import { Download, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDownloadManager } from '@/hooks/useDownloadManager';
import { useMangaOfflineDownload } from '@/hooks/useMangaOfflineDownload';
import { MangaChapter } from '@/types/manga';
import { getChapterPages } from '@/lib/mangaApi';
import { cn } from '@/lib/utils';

interface BatchDownloadButtonProps {
  mangaId: string;
  mangaTitle: string;
  chapters: MangaChapter[];
  coverImage?: string;
  className?: string;
}

export const BatchDownloadButton = ({
  mangaId,
  mangaTitle,
  chapters,
  coverImage,
  className
}: BatchDownloadButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  
  const { addBatchToQueue, storageInfo } = useDownloadManager();
  const { isDownloaded } = useMangaOfflineDownload();

  const toggleChapter = (chapterId: string) => {
    setSelectedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  const selectAll = () => {
    const notDownloaded = chapters.filter(ch => !isDownloaded(ch.id)).map(ch => ch.id);
    setSelectedChapters(new Set(notDownloaded));
  };

  const selectNone = () => {
    setSelectedChapters(new Set());
  };

  const handleDownload = async () => {
    if (selectedChapters.size === 0) return;

    setIsLoading(true);
    try {
      const downloads = await Promise.all(
        Array.from(selectedChapters).map(async (chapterId) => {
          const chapter = chapters.find(ch => ch.id === chapterId);
          if (!chapter) return null;

          // Load pages for each chapter
          const pages = await getChapterPages(chapterId);

          return {
            id: chapterId,
            type: 'manga' as const,
            title: mangaTitle,
            subtitle: `Chapter ${chapter.chapterNumber}${chapter.title ? `: ${chapter.title}` : ''}`,
            mangaId,
            chapterId,
            chapterNumber: chapter.chapterNumber,
            pages,
            coverImage,
            totalPages: pages.length
          };
        })
      );

      const validDownloads = downloads.filter(Boolean) as any[];
      addBatchToQueue(validDownloads);
      setIsOpen(false);
      setSelectedChapters(new Set());
    } catch (error) {
      console.error('Batch download error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadedCount = chapters.filter(ch => isDownloaded(ch.id)).length;
  const availableCount = chapters.length - downloadedCount;

  if (chapters.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Download className="w-4 h-4 mr-2" />
          Download Chapters
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download Chapters</DialogTitle>
          <DialogDescription>
            Select chapters to download for offline reading.
            {downloadedCount > 0 && (
              <span className="block mt-1 text-green-500">
                {downloadedCount} chapter{downloadedCount !== 1 ? 's' : ''} already downloaded
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Storage Warning */}
        {storageInfo?.isLow && (
          <div className={cn(
            "p-3 rounded-lg text-sm",
            storageInfo.isCritical ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"
          )}>
            {storageInfo.isCritical 
              ? "Storage is critically low! Consider clearing old downloads."
              : "Storage is running low. Some downloads may fail."}
          </div>
        )}

        {/* Selection Controls */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-muted-foreground">
            {selectedChapters.size} of {availableCount} selected
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="ghost" size="sm" onClick={selectNone}>
              Clear
            </Button>
          </div>
        </div>

        {/* Chapter List */}
        <ScrollArea className="h-[300px] border rounded-lg">
          <div className="p-2 space-y-1">
            {chapters.map((chapter) => {
              const downloaded = isDownloaded(chapter.id);
              const selected = selectedChapters.has(chapter.id);
              
              return (
                <div
                  key={chapter.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg transition-colors",
                    !downloaded && "hover:bg-muted/50 cursor-pointer",
                    selected && "bg-primary/10"
                  )}
                  onClick={() => !downloaded && toggleChapter(chapter.id)}
                >
                  {downloaded ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => toggleChapter(chapter.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      downloaded && "text-muted-foreground"
                    )}>
                      Chapter {chapter.chapterNumber}
                      {chapter.title && `: ${chapter.title}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {chapter.pages} pages
                      {downloaded && " • Downloaded"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleDownload} 
            disabled={selectedChapters.size === 0 || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download {selectedChapters.size} Chapter{selectedChapters.size !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchDownloadButton;
