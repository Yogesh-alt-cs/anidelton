import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WatchProgress {
  id: string;
  anime_id: number;
  episode_number: number;
  progress_seconds: number;
  duration_seconds: number | null;
  completed: boolean;
  watched_at: string;
}

export const useWatchProgress = (animeId?: number) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<WatchProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!user) {
      setProgress([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('watch_progress')
        .select('*')
        .eq('user_id', user.id);

      if (animeId) {
        query = query.eq('anime_id', animeId);
      }

      const { data, error } = await query.order('watched_at', { ascending: false });

      if (error) throw error;
      setProgress((data as WatchProgress[]) || []);
    } catch (error) {
      console.error('Error fetching watch progress:', error);
    } finally {
      setLoading(false);
    }
  }, [user, animeId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const updateProgress = async (
    animeId: number,
    episodeNumber: number,
    progressSeconds: number,
    durationSeconds?: number
  ) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const completed = durationSeconds 
        ? progressSeconds >= durationSeconds * 0.9 
        : false;

      // Check if progress exists for this episode
      const existing = progress.find(
        p => p.anime_id === animeId && p.episode_number === episodeNumber
      );

      if (existing) {
        const { error } = await supabase
          .from('watch_progress')
          .update({
            progress_seconds: progressSeconds,
            duration_seconds: durationSeconds || existing.duration_seconds,
            completed,
            watched_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('watch_progress')
          .insert({
            user_id: user.id,
            anime_id: animeId,
            episode_number: episodeNumber,
            progress_seconds: progressSeconds,
            duration_seconds: durationSeconds,
            completed
          });

        if (error) throw error;
      }

      await fetchProgress();
      return { error: null };
    } catch (error) {
      console.error('Error updating progress:', error);
      return { error: error as Error };
    }
  };

  const getEpisodeProgress = (episodeNumber: number) => {
    return progress.find(p => p.episode_number === episodeNumber);
  };

  const getLastWatchedEpisode = () => {
    if (progress.length === 0) return null;
    return progress.reduce((latest, current) => 
      new Date(current.watched_at) > new Date(latest.watched_at) ? current : latest
    );
  };

  return {
    progress,
    loading,
    updateProgress,
    getEpisodeProgress,
    getLastWatchedEpisode,
    refetch: fetchProgress
  };
};
