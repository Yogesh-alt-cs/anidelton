import { useState } from 'react';
import { Star, ThumbsUp, Edit2, Trash2, MessageSquare, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useAnimeReviews, Review } from '@/hooks/useAnimeReviews';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface ReviewSectionProps {
  animeId: number;
  animeTitle: string;
}

const StarRating = ({ 
  rating, 
  onRatingChange, 
  readonly = false 
}: { 
  rating: number; 
  onRatingChange?: (rating: number) => void; 
  readonly?: boolean;
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={cn(
            "transition-colors",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          )}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          onClick={() => onRatingChange?.(star)}
        >
          <Star
            className={cn(
              "w-5 h-5 transition-colors",
              (hoverRating || rating) >= star
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            )}
          />
        </button>
      ))}
      <span className="ml-2 text-sm font-medium">
        {hoverRating || rating || 0}/10
      </span>
    </div>
  );
};

const ReviewCard = ({ 
  review, 
  onLike, 
  onEdit, 
  onDelete, 
  isOwner 
}: { 
  review: Review; 
  onLike: () => void; 
  onEdit: () => void; 
  onDelete: () => void;
  isOwner: boolean;
}) => {
  const [showSpoiler, setShowSpoiler] = useState(false);

  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={review.avatar_url || ''} />
          <AvatarFallback>{review.username?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="font-medium">{review.username}</span>
              <span className="text-muted-foreground text-sm ml-2">
                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
              </span>
            </div>
            
            {review.rating && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/20">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold text-yellow-400">{review.rating}/10</span>
              </div>
            )}
          </div>
          
          {review.title && (
            <h4 className="font-semibold mt-2">{review.title}</h4>
          )}
          
          {review.spoiler && !showSpoiler ? (
            <div className="mt-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Spoiler Warning</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setShowSpoiler(true)}
              >
                Show Review
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground mt-2 whitespace-pre-wrap">{review.content}</p>
          )}
          
          <div className="flex items-center gap-3 mt-3">
            <Button
              variant="ghost"
              size="sm"
              className={cn("gap-1", review.user_liked && "text-primary")}
              onClick={onLike}
            >
              <ThumbsUp className={cn("w-4 h-4", review.user_liked && "fill-current")} />
              {review.likes_count}
            </Button>
            
            {isOwner && (
              <>
                <Button variant="ghost" size="sm" className="gap-1" onClick={onEdit}>
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm" className="gap-1 text-destructive" onClick={onDelete}>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ReviewSection = ({ animeId, animeTitle }: ReviewSectionProps) => {
  const { user } = useAuth();
  const { reviews, loading, userReview, addReview, updateReview, deleteReview, toggleLike } = useAnimeReviews(animeId);
  
  const [isWriting, setIsWriting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [spoiler, setSpoiler] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setRating(0);
    setTitle('');
    setContent('');
    setSpoiler(false);
    setIsWriting(false);
    setIsEditing(false);
  };

  const handleEdit = () => {
    if (userReview) {
      setRating(userReview.rating || 0);
      setTitle(userReview.title || '');
      setContent(userReview.content);
      setSpoiler(userReview.spoiler);
      setIsEditing(true);
      setIsWriting(true);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    setSubmitting(true);
    
    if (isEditing && userReview) {
      await updateReview(userReview.id, rating, content, title, spoiler);
    } else {
      await addReview(rating, content, title, spoiler);
    }
    
    resetForm();
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (userReview && confirm('Are you sure you want to delete your review?')) {
      await deleteReview(userReview.id);
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.filter(r => r.rating).length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-inter font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Reviews
          </h3>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-muted-foreground">
                {averageRating.toFixed(1)} average from {reviews.length} reviews
              </span>
            </div>
          )}
        </div>
        
        {user && !userReview && !isWriting && (
          <Button onClick={() => setIsWriting(true)} className="gap-2">
            <Edit2 className="w-4 h-4" />
            Write Review
          </Button>
        )}
      </div>

      {/* Review Form */}
      {isWriting && (
        <div className="p-4 rounded-xl bg-card border border-border space-y-4">
          <h4 className="font-semibold">
            {isEditing ? 'Edit Your Review' : `Review ${animeTitle}`}
          </h4>
          
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Your Rating</label>
            <StarRating rating={rating} onRatingChange={setRating} />
          </div>
          
          <Input
            placeholder="Review title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          
          <Textarea
            placeholder="Share your thoughts about this anime..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />
          
          <div className="flex items-center gap-2">
            <Switch
              checked={spoiler}
              onCheckedChange={setSpoiler}
            />
            <label className="text-sm">Contains spoilers</label>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={!content.trim() || submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isEditing ? 'Update Review' : 'Post Review'}
            </Button>
            <Button variant="ghost" onClick={resetForm}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onLike={() => toggleLike(review.id)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isOwner={user?.id === review.user_id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
