-- Create complaints table for issue reporting
CREATE TABLE public.complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  issue_type TEXT NOT NULL,
  description TEXT NOT NULL,
  anime_id INTEGER,
  anime_title TEXT,
  episode_id TEXT,
  episode_number INTEGER,
  device_info TEXT,
  browser_info TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create FAQ table for help section
CREATE TABLE public.faq (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support_tickets table for contact form
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS policies for complaints - anyone can insert (logged in or not for bug reports)
CREATE POLICY "Anyone can create complaints" 
ON public.complaints 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own complaints" 
ON public.complaints 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS policies for FAQ - anyone can view
CREATE POLICY "Anyone can view FAQ" 
ON public.faq 
FOR SELECT 
USING (true);

-- RLS policies for support_tickets
CREATE POLICY "Anyone can create support tickets" 
ON public.support_tickets 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own tickets" 
ON public.support_tickets 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Insert default FAQ entries
INSERT INTO public.faq (question, answer, category, order_index) VALUES
('Why is the video not playing?', 'Try switching servers using the server selection button. If all servers fail, the episode may be temporarily unavailable. Clear your browser cache and try again.', 'streaming', 1),
('Why am I seeing a blank screen?', 'This can happen due to network issues. Refresh the page and ensure you have a stable internet connection. Try disabling any ad blockers.', 'streaming', 2),
('How do I reset my password?', 'Click on "Forgot password" on the login page, enter your email, and follow the instructions sent to your inbox.', 'account', 3),
('Why am I not receiving notifications?', 'Make sure you have subscribed to the anime and notifications are enabled in your settings. Check your browser notification permissions.', 'notifications', 4),
('How do I report a bug or issue?', 'Use the "Report Issue" button in the video player or go to Settings > Help & Support > Report a Bug.', 'general', 5),
('Can I download episodes for offline viewing?', 'Currently, offline downloads are available through the Downloads section. Note that not all episodes may be available for download.', 'features', 6),
('How do I cancel my subscription to anime notifications?', 'Go to the anime detail page and click the bell icon to toggle notifications off, or manage all subscriptions in your notification settings.', 'notifications', 7),
('Why is the audio out of sync?', 'Try switching to a different server or quality setting. If the issue persists, report it using the bug report feature.', 'streaming', 8);

-- Add trigger for updated_at on complaints
CREATE TRIGGER update_complaints_updated_at
BEFORE UPDATE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on support_tickets
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();