import { useState } from 'react';
import { 
  Download, 
  Pause, 
  Play, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  X,
  AlertCircle,
  RefreshCw,
  Video,
  BookOpen,
  Loader2,
  HardDrive,
  Trash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useDownloadManager, useStorageCleanup, QueuedDownload } from '@/hooks/useDownloadManager';
import { cn } from '@/lib/utils';

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const getStatusColor = (status: QueuedDownload['status']) => {
  switch (status) {
    case 'downloading': return 'text-blue-500';
    case 'completed': return 'text-green-500';
    case 'error': return 'text-red-500';
    case 'paused': return 'text-yellow-500';
    default: return 'text-muted-foreground';
  }
};

const getStatusIcon = (status: QueuedDownload['status']) => {
  switch (status) {
    case 'downloading': return <Loader2 className="w-4 h-4 animate-spin" />;
    case 'completed': return <Download className="w-4 h-4" />;
    case 'error': return <AlertCircle className="w-4 h-4" />;
    case 'paused': return <Pause className="w-4 h-4" />;
    default: return <Download className="w-4 h-4" />;
  }
};

export const DownloadQueuePanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    queue,
    storageInfo,
    globalPaused,
    removeFromQueue,
    clearCompleted,
    pauseDownload,
    resumeDownload,
    pauseAll,
    resumeAll,
    retryDownload,
    moveInQueue,
    getQueueStats
  } = useDownloadManager();
  
  const { autoCleanup } = useStorageCleanup();
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const stats = getQueueStats();
  const activeCount = stats.downloading + stats.queued;

  const handleAutoCleanup = async () => {
    setIsCleaningUp(true);
    try {
      await autoCleanup(75);
    } finally {
      setIsCleaningUp(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          title="Download Queue"
        >
          <Download className="w-5 h-5" />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Download Queue
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Storage Info */}
          {storageInfo && (
            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-muted-foreground" />
                  <span>Storage</span>
                </div>
                <span className={cn(
                  storageInfo.isCritical && "text-red-500",
                  storageInfo.isLow && !storageInfo.isCritical && "text-yellow-500"
                )}>
                  {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.quota)}
                </span>
              </div>
              <Progress 
                value={storageInfo.percentage} 
                className={cn(
                  "h-2",
                  storageInfo.isCritical && "[&>div]:bg-red-500",
                  storageInfo.isLow && !storageInfo.isCritical && "[&>div]:bg-yellow-500"
                )}
              />
              {storageInfo.isLow && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleAutoCleanup}
                  disabled={isCleaningUp}
                >
                  {isCleaningUp ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash className="w-4 h-4 mr-2" />
                  )}
                  Clean Up Old Downloads
                </Button>
              )}
            </div>
          )}

          {/* Queue Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {stats.downloading} active
              </Badge>
              <Badge variant="outline">
                {stats.queued} queued
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              {activeCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={globalPaused ? resumeAll : pauseAll}
                >
                  {globalPaused ? (
                    <>
                      <Play className="w-4 h-4 mr-1" />
                      Resume All
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4 mr-1" />
                      Pause All
                    </>
                  )}
                </Button>
              )}
              {(stats.completed > 0 || stats.failed > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCompleted}
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear Done
                </Button>
              )}
            </div>
          </div>

          {/* Queue List */}
          <ScrollArea className="h-[calc(100vh-280px)]">
            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Download className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No downloads in queue</p>
              </div>
            ) : (
              <div className="space-y-2">
                {queue.map((download, index) => (
                  <div 
                    key={download.id}
                    className="p-3 rounded-lg bg-card border border-border/50 space-y-2"
                  >
                    <div className="flex items-start gap-3">
                      {/* Type Icon */}
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                        download.type === 'anime' ? "bg-blue-500/20" : "bg-purple-500/20"
                      )}>
                        {download.type === 'anime' ? (
                          <Video className="w-5 h-5 text-blue-500" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-purple-500" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{download.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{download.subtitle}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn("text-xs flex items-center gap-1", getStatusColor(download.status))}>
                            {getStatusIcon(download.status)}
                            {download.status}
                          </span>
                          {download.size > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {formatBytes(download.size)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1">
                        {download.status === 'queued' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => moveInQueue(download.id, 'up')}
                              disabled={index === 0}
                            >
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => moveInQueue(download.id, 'down')}
                              disabled={index === queue.length - 1}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {download.status === 'downloading' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => pauseDownload(download.id)}
                          >
                            <Pause className="w-4 h-4" />
                          </Button>
                        )}
                        {download.status === 'paused' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => resumeDownload(download.id)}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        {download.status === 'error' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => retryDownload(download.id)}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => removeFromQueue(download.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {(download.status === 'downloading' || download.status === 'paused') && (
                      <div className="space-y-1">
                        <Progress value={download.progress} className="h-1.5" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{Math.round(download.progress)}%</span>
                          {download.type === 'manga' && download.currentPage && download.totalPages && (
                            <span>{download.currentPage}/{download.totalPages} pages</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DownloadQueuePanel;
