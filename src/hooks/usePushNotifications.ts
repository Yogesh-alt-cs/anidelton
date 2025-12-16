import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface PushSubscriptionState {
  isSupported: boolean;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  permissionState: NotificationPermission;
}

// VAPID public key - in production, this should come from your backend
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

export const usePushNotifications = () => {
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isSubscribed: false,
    subscription: null,
    permissionState: 'default'
  });
  const [loading, setLoading] = useState(true);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = 'serviceWorker' in navigator && 
                          'PushManager' in window && 
                          'Notification' in window;
      
      if (!isSupported) {
        setState(prev => ({ ...prev, isSupported: false }));
        setLoading(false);
        return;
      }

      const permissionState = Notification.permission;
      
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        setState({
          isSupported: true,
          isSubscribed: !!subscription,
          subscription,
          permissionState
        });
      } catch (error) {
        console.error('Error checking push subscription:', error);
        setState(prev => ({ 
          ...prev, 
          isSupported: true, 
          permissionState 
        }));
      } finally {
        setLoading(false);
      }
    };

    checkSupport();
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permissionState: permission }));
      
      if (permission === 'granted') {
        toast.success('Notifications enabled!');
        return true;
      } else if (permission === 'denied') {
        toast.error('Notifications blocked. Please enable in browser settings.');
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast.error('Failed to request notification permission');
      return false;
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!state.isSupported) {
      toast.error('Push notifications not supported');
      return null;
    }

    try {
      setLoading(true);
      
      // Request permission if not granted
      if (Notification.permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) return null;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Subscribe to push notifications
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      }

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        subscription
      }));

      toast.success('Push notifications enabled!');
      
      // In production, send subscription to your backend
      console.log('Push subscription:', JSON.stringify(subscription));
      
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error('Failed to enable push notifications');
      return null;
    } finally {
      setLoading(false);
    }
  }, [state.isSupported, requestPermission]);

  const unsubscribe = useCallback(async () => {
    try {
      setLoading(true);
      
      if (state.subscription) {
        await state.subscription.unsubscribe();
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        subscription: null
      }));

      toast.success('Push notifications disabled');
      
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      toast.error('Failed to disable push notifications');
      return false;
    } finally {
      setLoading(false);
    }
  }, [state.subscription]);

  const sendLocalNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, []);

  return {
    ...state,
    loading,
    requestPermission,
    subscribe,
    unsubscribe,
    sendLocalNotification
  };
};
