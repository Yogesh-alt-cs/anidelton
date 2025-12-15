import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type WatchlistStatus = 'watching' | 'completed' | 'plan_to_watch' | 'dropped';

export interface WatchlistItem {
  id: string;
  anime_id: number;
  anime_title: string;
  anime_image: string | null;
  status: WatchlistStatus;
  created_at: string;
  updated_at: string;
}

export const useWatchlist = () => {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = useCallback(async () => {
    if (!user) {
      setWatchlist([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setWatchlist((data as WatchlistItem[]) || []);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const addToWatchlist = async (
    animeId: number,
    animeTitle: string,
    animeImage: string | null,
    status: WatchlistStatus = 'plan_to_watch'
  ) => {
    if (!user) {
      toast.error('Please sign in to add to watchlist');
      return { error: new Error('Not authenticated') };
    }

    try {
      // Check if already exists
      const existing = watchlist.find(item => item.anime_id === animeId);
      
      if (existing) {
        // Update status
        const { error } = await supabase
          .from('watchlist')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (error) throw error;
        toast.success(`Updated to ${status.replace('_', ' ')}`);
      } else {
        // Insert new
        const { error } = await supabase
          .from('watchlist')
          .insert({
            user_id: user.id,
            anime_id: animeId,
            anime_title: animeTitle,
            anime_image: animeImage,
            status
          });

        if (error) throw error;
        toast.success('Added to watchlist!');
      }

      await fetchWatchlist();
      return { error: null };
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast.error('Failed to update watchlist');
      return { error: error as Error };
    }
  };

  const removeFromWatchlist = async (animeId: number) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('anime_id', animeId);

      if (error) throw error;
      toast.success('Removed from watchlist');
      await fetchWatchlist();
      return { error: null };
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast.error('Failed to remove from watchlist');
      return { error: error as Error };
    }
  };

  const getWatchlistByStatus = (status: WatchlistStatus) => {
    return watchlist.filter(item => item.status === status);
  };

  const isInWatchlist = (animeId: number) => {
    return watchlist.find(item => item.anime_id === animeId);
  };

  return {
    watchlist,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    getWatchlistByStatus,
    isInWatchlist,
    refetch: fetchWatchlist
  };
};
