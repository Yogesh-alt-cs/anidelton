import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNewReleases } from '@/hooks/useAnimeApi';

const NewEpisodeSection = () => {
  const { data: newReleases, loading } = useNewReleases(12);

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-inter font-bold">New Episode Releases</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-card shimmer" />
          ))}
        </div>
      </section>
    );
  }

  if (!newReleases.length) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-inter font-bold">New Episode Releases</h2>
        </div>
        <Link 
          to="/search?filter=new"
          className="text-sm text-primary hover:underline"
        >
          View All
        </Link>
      </div>
      
      <div className="overflow-x-auto pb-2 -mx-4 px-4">
        <div className="flex gap-4" style={{ width: 'max-content' }}>
          {newReleases.map((anime, index) => (
            <Link 
              key={anime.mal_id}
              to={`/anime/${anime.mal_id}`}
              className="group relative w-36 flex-shrink-0 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
                <img
                  src={anime.images?.webp?.image_url || anime.images?.jpg?.image_url}
                  alt={anime.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                {/* New Badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-accent text-accent-foreground text-xs font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  NEW
                </div>

                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                    <Play className="w-5 h-5 text-primary-foreground fill-current" />
                  </div>
                </div>
                
                {/* Title */}
                <div className="absolute bottom-2 left-2 right-2">
                  <h3 className="text-sm font-medium text-white line-clamp-2">
                    {anime.title_english || anime.title}
                  </h3>
                  {anime.episodes && (
                    <p className="text-xs text-white/70 mt-0.5">
                      {anime.episodes} episodes
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewEpisodeSection;