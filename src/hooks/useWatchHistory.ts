import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface WatchHistoryItem {
  id: string;
  anime_id: number;
  anime_title: string;
  anime_image: string | null;
  episode_number: number;
  progress_seconds: number;
  duration_seconds: number | null;
  completed: boolean;
  watched_at: string;
}

export const useWatchHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setHistory([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('watch_history')
        .select('*')
        .eq('user_id', user.id)
        .order('watched_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setHistory((data as WatchHistoryItem[]) || []);
    } catch (error) {
      console.error('Error fetching watch history:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const addToHistory = async (
    animeId: number,
    animeTitle: string,
    animeImage: string | null,
    episodeNumber: number,
    progressSeconds: number,
    durationSeconds?: number
  ) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const completed = durationSeconds 
        ? progressSeconds >= durationSeconds * 0.9 
        : false;

      // Check if entry exists
      const existing = history.find(
        h => h.anime_id === animeId && h.episode_number === episodeNumber
      );

      if (existing) {
        const { error } = await supabase
          .from('watch_history')
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
          .from('watch_history')
          .insert({
            user_id: user.id,
            anime_id: animeId,
            anime_title: animeTitle,
            anime_image: animeImage,
            episode_number: episodeNumber,
            progress_seconds: progressSeconds,
            duration_seconds: durationSeconds,
            completed
          });

        if (error) throw error;
      }

      await fetchHistory();
      return { error: null };
    } catch (error) {
      console.error('Error adding to history:', error);
      return { error: error as Error };
    }
  };

  const removeFromHistory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('watch_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setHistory(prev => prev.filter(h => h.id !== id));
      toast.success('Removed from history');
    } catch (error) {
      console.error('Error removing from history:', error);
      toast.error('Failed to remove from history');
    }
  };

  const clearHistory = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('watch_history')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      
      setHistory([]);
      toast.success('History cleared');
    } catch (error) {
      console.error('Error clearing history:', error);
      toast.error('Failed to clear history');
    }
  };

  return {
    history,
    loading,
    addToHistory,
    removeFromHistory,
    clearHistory,
    refetch: fetchHistory
  };
};
