-- Table to track sent notifications and prevent duplicates
CREATE TABLE public.sent_notification_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anime_id INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'new_episode',
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(anime_id, episode_number, notification_type)
);

-- Enable RLS
ALTER TABLE public.sent_notification_tracking ENABLE ROW LEVEL SECURITY;

-- Only service role can manage this table (for background jobs)
CREATE POLICY "Service role can manage sent_notification_tracking"
ON public.sent_notification_tracking
FOR ALL
USING (true)
WITH CHECK (true);

-- Index for efficient lookups
CREATE INDEX idx_sent_notification_tracking_anime ON public.sent_notification_tracking(anime_id, episode_number);

-- Add last_episode_check column to notification_subscriptions to track when we last checked
ALTER TABLE public.notification_subscriptions 
ADD COLUMN IF NOT EXISTS last_notified_episode INTEGER DEFAULT 0;