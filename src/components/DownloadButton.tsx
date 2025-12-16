import React, { useState } from 'react';
import { Download, Check, Loader2, Trash2, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOfflineDownload } from '@/hooks/useOfflineDownload';
import { cn } from '@/lib/utils';

interface DownloadButtonProps {
  animeId: number;
  animeTitle: string;
  episodeNumber: number;
  episodeTitle?: string;
  videoUrl?: string;
  thumbnail?: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
}

export const DownloadButton = ({
  animeId,
  animeTitle,
  episodeNumber,
  episodeTitle,
  videoUrl,
  thumbnail,
  className,
  size = 'icon'
}: DownloadButtonProps) => {
  const { downloadEpisode, deleteDownload, isDownloaded, downloadProgress } = useOfflineDownload();
  const [isHovering, setIsHovering] = useState(false);

  const episodeId = `${animeId}-${episodeNumber}`;
  const downloaded = isDownloaded(animeId, episodeNumber);
  const progress = downloadProgress.get(episodeId);
  const isDownloading = progress?.status === 'downloading';

  const handleClick = async () => {
    if (downloaded) {
      await deleteDownload(episodeId);
    } else if (videoUrl && !isDownloading) {
      await downloadEpisode(
        animeId,
        animeTitle,
        episodeNumber,
        videoUrl,
        episodeTitle,
        thumbnail
      );
    }
  };

  const getIcon = () => {
    if (isDownloading) {
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
      return `${Math.round(progress?.progress || 0)}%`;
    }
    if (downloaded) {
      return isHovering ? 'Remove' : 'Downloaded';
    }
    return 'Download';
  };

  if (!videoUrl && !downloaded) {
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
      disabled={isDownloading}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={cn(
        downloaded && !isHovering && "text-green-500",
        downloaded && isHovering && "text-destructive",
        className
      )}
      title={downloaded ? 'Remove download' : 'Download for offline'}
    >
      {getIcon()}
      {size !== 'icon' && <span className="ml-2">{getLabel()}</span>}
    </Button>
  );
};

export default DownloadButton;
