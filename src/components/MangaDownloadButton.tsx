import React, { useState } from 'react';
import { Download, Check, Loader2, Trash2, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMangaOfflineDownload } from '@/hooks/useMangaOfflineDownload';
import { MangaPage } from '@/types/manga';
import { cn } from '@/lib/utils';

interface MangaDownloadButtonProps {
  mangaId: string;
  mangaTitle: string;
  chapterId: string;
  chapterNumber: string;
  chapterTitle?: string;
  pages?: MangaPage[];
  coverImage?: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  onLoadPages?: () => Promise<MangaPage[]>;
}

export const MangaDownloadButton = ({
  mangaId,
  mangaTitle,
  chapterId,
  chapterNumber,
  chapterTitle,
  pages,
  coverImage,
  className,
  size = 'icon',
  onLoadPages
}: MangaDownloadButtonProps) => {
  const { downloadChapter, deleteDownload, isDownloaded, downloadProgress } = useMangaOfflineDownload();
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const downloaded = isDownloaded(chapterId);
  const progress = downloadProgress.get(chapterId);
  const isDownloading = progress?.status === 'downloading';

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (downloaded) {
      await deleteDownload(chapterId);
    } else if (!isDownloading) {
      setIsLoading(true);
      try {
        let pagesToDownload = pages;
        
        // If pages not provided, try to load them
        if (!pagesToDownload && onLoadPages) {
          pagesToDownload = await onLoadPages();
        }
        
        if (pagesToDownload && pagesToDownload.length > 0) {
          await downloadChapter(
            mangaId,
            mangaTitle,
            chapterId,
            chapterNumber,
            pagesToDownload,
            chapterTitle,
            coverImage
          );
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getIcon = () => {
    if (isDownloading || isLoading) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    if (downloaded) {
      return isHovering ? (
        <Trash2 className="w-4 h-4" />
      ) : (
        <Check className="w-4 h-4" />
      );
    }
    return <Download className="w-4 h-4" />;
  };

  const getLabel = () => {
    if (isDownloading) {
      return `${progress?.currentPage || 0}/${progress?.totalPages || 0}`;
    }
    if (isLoading) {
      return 'Loading...';
    }
    if (downloaded) {
      return isHovering ? 'Remove' : 'Downloaded';
    }
    return 'Download';
  };

  if (!pages && !onLoadPages) {
    return (
      <Button
        variant="ghost"
        size={size}
        disabled
        className={cn("opacity-50", className)}
        title="Download not available"
      >
        <WifiOff className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Button
      variant={downloaded ? "secondary" : "ghost"}
      size={size}
      onClick={handleClick}
      disabled={isDownloading || isLoading}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={cn(
        downloaded && !isHovering && "text-green-500",
        downloaded && isHovering && "text-destructive",
        className
      )}
      title={downloaded ? 'Remove download' : 'Download for offline reading'}
    >
      {getIcon()}
      {size !== 'icon' && <span className="ml-2">{getLabel()}</span>}
    </Button>
  );
};

export default MangaDownloadButton;
