import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, Loader2, Play, CheckCheck, XCircle } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    notifications, 
    loading, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    clearAllNotifications,
    deleteNotification 
  } = useNotifications();

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header showNotifications={false} />
        <div className="flex flex-col items-center justify-center h-[60vh] px-4 text-center">
          <Bell className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Sign in to see notifications</h2>
          <p className="text-muted-foreground mb-4">
            Get notified when new episodes of your favorite anime are released
          </p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

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
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="gap-2">
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllNotifications} 
                className="gap-2 text-destructive hover:text-destructive"
              >
                <XCircle className="w-4 h-4" />
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-medium mb-2">No notifications</h4>
            <p className="text-sm text-muted-foreground max-w-xs">
              Subscribe to your favorite anime to get notified when new episodes are released
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <div
                key={notification.id}
                className={cn(
                  "flex gap-4 p-4 rounded-xl border transition-all animate-fade-in",
                  notification.is_read 
                    ? "bg-card/50 border-border/50" 
                    : "bg-card border-primary/20"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Anime Image */}
                <div className="flex-shrink-0">
                  {notification.anime_image ? (
                    <img 
                      src={notification.anime_image} 
                      alt={notification.anime_title}
                      className="w-14 h-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-14 h-20 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Play className="w-5 h-5 text-primary" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={cn(
                      "font-medium text-sm",
                      !notification.is_read && "text-primary"
                    )}>
                      {notification.anime_title}
                    </h3>
                    {!notification.is_read && (
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 h-7 px-2"
                        onClick={() => {
                          if (!notification.is_read) {
                            markAsRead(notification.id);
                          }
                          navigate(`/stream/${notification.anime_id}?ep=${notification.episode_number}`);
                        }}
                      >
                        <Play className="w-3 h-3" />
                        Watch
                      </Button>
                      
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Notifications;
