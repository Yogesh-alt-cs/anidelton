import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Review {
  id: string;
  user_id: string;
  anime_id: number;
  rating: number | null;
  title: string | null;
  content: string;
  spoiler: boolean;
  likes_count: number;
  created_at: string;
  updated_at: string;
  username?: string;
  avatar_url?: string;
  user_liked?: boolean;
}

export const useAnimeReviews = (animeId: number | null) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [userReview, setUserReview] = useState<Review | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!animeId) return;
    
    setLoading(true);
    try {
      const { data: reviewsData, error } = await supabase
        .from('anime_reviews')
        .select('*')
        .eq('anime_id', animeId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for usernames
      const userIds = reviewsData?.map(r => r.user_id) || [];
      let profilesMap: Record<string, { username: string; avatar_url: string | null }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, avatar_url')
          .in('user_id', userIds);
        
        profiles?.forEach(p => {
          profilesMap[p.user_id] = { username: p.username || 'Anonymous', avatar_url: p.avatar_url };
        });
      }

      // Fetch user's likes if logged in
      let userLikes: Set<string> = new Set();
      if (user) {
        const { data: likes } = await supabase
          .from('review_likes')
          .select('review_id')
          .eq('user_id', user.id);
        
        likes?.forEach(l => userLikes.add(l.review_id));
      }

      const enrichedReviews = reviewsData?.map(r => ({
        ...r,
        username: profilesMap[r.user_id]?.username || 'Anonymous',
        avatar_url: profilesMap[r.user_id]?.avatar_url,
        user_liked: userLikes.has(r.id)
      })) || [];

      setReviews(enrichedReviews);

      // Set user's review if exists
      if (user) {
        const myReview = enrichedReviews.find(r => r.user_id === user.id);
        setUserReview(myReview || null);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [animeId, user]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const addReview = async (rating: number, content: string, title?: string, spoiler?: boolean) => {
    if (!user || !animeId) {
      toast.error('Please sign in to add a review');
      return false;
    }

    // Input validation - prevent excessively long content
    const trimmedContent = content.trim();
    const trimmedTitle = title?.trim() || null;
    
    if (trimmedContent.length > 5000) {
      toast.error('Review is too long. Maximum 5000 characters.');
      return false;
    }
    
    if (trimmedContent.length === 0) {
      toast.error('Review content cannot be empty.');
      return false;
    }
    
    if (trimmedTitle && trimmedTitle.length > 200) {
      toast.error('Review title is too long. Maximum 200 characters.');
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('anime_reviews')
        .insert({
          user_id: user.id,
          anime_id: animeId,
          rating,
          content: trimmedContent,
          title: trimmedTitle,
          spoiler: spoiler || false
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Review added successfully!');
      await fetchReviews();
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to add review');
      return false;
    }
  };

  const updateReview = async (reviewId: string, rating: number, content: string, title?: string, spoiler?: boolean) => {
    if (!user) return false;

    // Input validation - prevent excessively long content
    const trimmedContent = content.trim();
    const trimmedTitle = title?.trim() || null;
    
    if (trimmedContent.length > 5000) {
      toast.error('Review is too long. Maximum 5000 characters.');
      return false;
    }
    
    if (trimmedContent.length === 0) {
      toast.error('Review content cannot be empty.');
      return false;
    }
    
    if (trimmedTitle && trimmedTitle.length > 200) {
      toast.error('Review title is too long. Maximum 200 characters.');
      return false;
    }

    try {
      const { error } = await supabase
        .from('anime_reviews')
        .update({
          rating,
          content: trimmedContent,
          title: trimmedTitle,
          spoiler: spoiler || false
        })
        .eq('id', reviewId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Review updated!');
      await fetchReviews();
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to update review');
      return false;
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('anime_reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Review deleted');
      await fetchReviews();
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete review');
      return false;
    }
  };

  const toggleLike = async (reviewId: string) => {
    if (!user) {
      toast.error('Please sign in to like reviews');
      return;
    }

    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;

    try {
      if (review.user_liked) {
        // Remove like - trigger automatically updates likes_count
        await supabase
          .from('review_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('review_id', reviewId);
      } else {
        // Add like - trigger automatically updates likes_count
        await supabase
          .from('review_likes')
          .insert({ user_id: user.id, review_id: reviewId });
      }

      await fetchReviews();
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  return {
    reviews,
    loading,
    userReview,
    addReview,
    updateReview,
    deleteReview,
    toggleLike,
    refetch: fetchReviews
  };
};
