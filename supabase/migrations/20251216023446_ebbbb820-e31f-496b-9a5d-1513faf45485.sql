-- Create table for anime comments and reviews
CREATE TABLE public.anime_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  anime_id INTEGER NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  title TEXT,
  content TEXT NOT NULL,
  spoiler BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for review likes
CREATE TABLE public.review_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  review_id UUID NOT NULL REFERENCES public.anime_reviews(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, review_id)
);

-- Create table for episode release notifications
CREATE TABLE public.anime_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  anime_id INTEGER NOT NULL,
  anime_title TEXT NOT NULL,
  anime_image TEXT,
  episode_number INTEGER NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to track subscribed anime for notifications
CREATE TABLE public.notification_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  anime_id INTEGER NOT NULL,
  anime_title TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, anime_id)
);

-- Enable RLS
ALTER TABLE public.anime_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anime_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for anime_reviews
CREATE POLICY "Anyone can view reviews" ON public.anime_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create their own reviews" ON public.anime_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.anime_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON public.anime_reviews FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for review_likes
CREATE POLICY "Anyone can view likes" ON public.review_likes FOR SELECT USING (true);
CREATE POLICY "Users can create their own likes" ON public.review_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON public.review_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for anime_notifications
CREATE POLICY "Users can view their own notifications" ON public.anime_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notifications" ON public.anime_notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.anime_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON public.anime_notifications FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for notification_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.notification_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own subscriptions" ON public.notification_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscriptions" ON public.notification_subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own subscriptions" ON public.notification_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_anime_reviews_updated_at BEFORE UPDATE ON public.anime_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();