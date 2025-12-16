import { useState } from 'react';
import { X, Search, Play, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Episode {
  mal_id: number;
  title: string;
  aired?: string;
  filler?: boolean;
}

interface EpisodeListModalProps {
  isOpen: boolean;
  onClose: () => void;
  episodes: Episode[];
  animeId: number;
  animeTitle: string;
  onSelectEpisode: (episodeNumber: number) => void;
  watchedEpisodes?: number[];
}

const EpisodeListModal = ({
  isOpen,
  onClose,
  episodes,
  animeId,
  animeTitle,
  onSelectEpisode,
  watchedEpisodes = []
}: EpisodeListModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (!isOpen) return null;

  const filteredEpisodes = episodes.filter((ep, index) => {
    const episodeNumber = index + 1;
    const searchLower = searchQuery.toLowerCase();
    return (
      episodeNumber.toString().includes(searchQuery) ||
      ep.title?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-card rounded-2xl shadow-xl border border-border overflow-hidden mx-4">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">All Episodes</h2>
              <p className="text-sm text-muted-foreground">{animeTitle}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search episodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-1 bg-secondary rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "px-3 py-1 rounded text-sm transition-colors",
                  viewMode === 'grid' ? "bg-primary text-primary-foreground" : "hover:bg-secondary/80"
                )}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "px-3 py-1 rounded text-sm transition-colors",
                  viewMode === 'list' ? "bg-primary text-primary-foreground" : "hover:bg-secondary/80"
                )}
              >
                List
              </button>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mt-2">
            {filteredEpisodes.length} episodes
          </p>
        </div>
        
        {/* Episodes */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {filteredEpisodes.map((ep, index) => {
                const episodeNumber = index + 1;
                const isWatched = watchedEpisodes.includes(episodeNumber);
                
                return (
                  <button
                    key={ep.mal_id || index}
                    onClick={() => {
                      onSelectEpisode(episodeNumber);
                      onClose();
                    }}
                    className={cn(
                      "aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all hover:scale-105",
                      isWatched
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-secondary hover:bg-secondary/80",
                      ep.filler && "bg-yellow-500/20 border border-yellow-500/30"
                    )}
                  >
                    {isWatched ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      episodeNumber
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEpisodes.map((ep, index) => {
                const episodeNumber = index + 1;
                const isWatched = watchedEpisodes.includes(episodeNumber);
                
                return (
                  <button
                    key={ep.mal_id || index}
                    onClick={() => {
                      onSelectEpisode(episodeNumber);
                      onClose();
                    }}
                    className={cn(
                      "w-full p-3 rounded-lg flex items-center gap-3 transition-colors text-left",
                      isWatched
                        ? "bg-primary/10 border border-primary/20"
                        : "bg-secondary hover:bg-secondary/80",
                      ep.filler && "bg-yellow-500/10 border border-yellow-500/20"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center font-semibold",
                      isWatched ? "bg-primary text-primary-foreground" : "bg-background"
                    )}>
                      {isWatched ? <Check className="w-5 h-5" /> : episodeNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        Episode {episodeNumber}
                        {ep.filler && <span className="ml-2 text-xs text-yellow-500">(Filler)</span>}
                      </p>
                      {ep.title && (
                        <p className="text-sm text-muted-foreground truncate">{ep.title}</p>
                      )}
                    </div>
                    <Play className="w-5 h-5 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EpisodeListModal;
