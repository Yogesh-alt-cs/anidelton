import { useState } from 'react';
import { Bell, CheckCheck, Play, Heart, MessageCircle, Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'new_episode' | 'recommendation' | 'social' | 'update';
  title: string;
  message: string;
  image?: string;
  time: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'new_episode',
    title: 'New Episode Available',
    message: 'Jujutsu Kaisen Season 2 Episode 15 is now available!',
    image: 'https://cdn.myanimelist.net/images/anime/1792/138022.jpg',
    time: '2 hours ago',
    read: false,
  },
  {
    id: '2',
    type: 'recommendation',
    title: 'Recommended for You',
    message: 'Based on your watch history, you might enjoy "Frieren: Beyond Journey\'s End"',
    image: 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg',
    time: '5 hours ago',
    read: false,
  },
  {
    id: '3',
    type: 'social',
    title: 'Friend Activity',
    message: 'Your friend @otaku_master added "Solo Leveling" to their watchlist',
    time: '1 day ago',
    read: true,
  },
  {
    id: '4',
    type: 'new_episode',
    title: 'New Episode Available',
    message: 'Demon Slayer: Hashira Training Arc Episode 8 is now available!',
    image: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg',
    time: '2 days ago',
    read: true,
  },
  {
    id: '5',
    type: 'update',
    title: 'App Update',
    message: 'New features added! Check out our improved recommendation system.',
    time: '3 days ago',
    read: true,
  },
];

const Notifications = () => {
  const [notifications, setNotifications] = useState(mockNotifications);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new_episode':
        return <Play className="w-4 h-4" />;
      case 'recommendation':
        return <Sparkles className="w-4 h-4" />;
      case 'social':
        return <Heart className="w-4 h-4" />;
      case 'update':
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header showNotifications={false} />
      
      <main className="pt-20 px-4 space-y-6 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
              <Bell className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-inter font-bold">Notifications</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="gap-2">
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notification List */}
        <div className="space-y-3">
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <div
                key={notification.id}
                className={cn(
                  "flex gap-4 p-4 rounded-xl border transition-all animate-fade-in cursor-pointer hover:border-primary/30",
                  notification.read 
                    ? "bg-card/50 border-border/50" 
                    : "bg-card border-primary/20"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Image or Icon */}
                <div className="flex-shrink-0">
                  {notification.image ? (
                    <img 
                      src={notification.image} 
                      alt="" 
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                  ) : (
                    <div className={cn(
                      "w-14 h-14 rounded-lg flex items-center justify-center",
                      notification.type === 'new_episode' && "bg-primary/10 text-primary",
                      notification.type === 'recommendation' && "bg-accent/10 text-accent",
                      notification.type === 'social' && "bg-pink-500/10 text-pink-500",
                      notification.type === 'update' && "bg-secondary text-muted-foreground"
                    )}>
                      {getNotificationIcon(notification.type)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={cn(
                      "font-medium text-sm",
                      !notification.read && "text-primary"
                    )}>
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {notification.message}
                  </p>
                  <span className="text-xs text-muted-foreground mt-2 block">
                    {notification.time}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
              <h4 className="text-lg font-medium mb-2">No notifications</h4>
              <p className="text-sm text-muted-foreground">
                You're all caught up! Check back later.
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Notifications;
