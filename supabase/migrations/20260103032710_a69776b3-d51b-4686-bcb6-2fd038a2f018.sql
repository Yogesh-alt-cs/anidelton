-- Create a function to automatically update review likes count
CREATE OR REPLACE FUNCTION public.update_review_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE anime_reviews 
    SET likes_count = COALESCE(likes_count, 0) + 1 
    WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE anime_reviews 
    SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1) 
    WHERE id = OLD.review_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger to maintain likes_count automatically
CREATE TRIGGER review_likes_count_trigger
AFTER INSERT OR DELETE ON public.review_likes
FOR EACH ROW EXECUTE FUNCTION public.update_review_likes_count();