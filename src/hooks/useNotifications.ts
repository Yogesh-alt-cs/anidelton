import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  user_id: string;
  anime_id: number;
  anime_title: string;
  anime_image: string | null;
  episode_number: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationSubscription {
  id: string;
  user_id: string;
  anime_id: number;
  anime_title: string;
  enabled: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [subscriptions, setSubscriptions] = useState<NotificationSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('anime_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchSubscriptions = useCallback(async () => {
    if (!user) {
      setSubscriptions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notification_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    fetchSubscriptions();
  }, [fetchNotifications, fetchSubscriptions]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'anime_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          toast.info(`New episode: ${newNotification.anime_title} Episode ${newNotification.episode_number}`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('anime_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await supabase
        .from('anime_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('anime_notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const subscribeToAnime = async (animeId: number, animeTitle: string) => {
    if (!user) {
      toast.error('Please sign in to enable notifications');
      return false;
    }

    try {
      const { error } = await supabase
        .from('notification_subscriptions')
        .upsert({
          user_id: user.id,
          anime_id: animeId,
          anime_title: animeTitle,
          enabled: true
        }, {
          onConflict: 'user_id,anime_id'
        });

      if (error) throw error;

      toast.success(`Notifications enabled for ${animeTitle}`);
      await fetchSubscriptions();
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to enable notifications');
      return false;
    }
  };

  const unsubscribeFromAnime = async (animeId: number) => {
    if (!user) return false;

    try {
      await supabase
        .from('notification_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('anime_id', animeId);

      await fetchSubscriptions();
      toast.success('Notifications disabled');
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to disable notifications');
      return false;
    }
  };

  const isSubscribed = (animeId: number) => {
    return subscriptions.some(s => s.anime_id === animeId && s.enabled);
  };

  return {
    notifications,
    subscriptions,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    subscribeToAnime,
    unsubscribeFromAnime,
    isSubscribed,
    refetch: fetchNotifications
  };
};
