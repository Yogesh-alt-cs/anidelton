import { useState } from 'react';
import { AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ISSUE_TYPES = [
  { value: 'video_not_playing', label: 'Video not playing' },
  { value: 'trailer_not_loading', label: 'Trailer not loading' },
  { value: 'audio_issue', label: 'Audio issue' },
  { value: 'buffering', label: 'Constant buffering' },
  { value: 'subtitle_issue', label: 'Subtitle issue' },
  { value: 'app_crash', label: 'App crash' },
  { value: 'login_issue', label: 'Login / account issue' },
  { value: 'other', label: 'Other' },
];

interface ReportIssueModalProps {
  open: boolean;
  onClose: () => void;
  animeId?: number;
  animeTitle?: string;
  episodeNumber?: number;
}

const ReportIssueModal = ({ open, onClose, animeId, animeTitle, episodeNumber }: ReportIssueModalProps) => {
  const { user } = useAuth();
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    const isMobile = /Mobile|Android|iPhone|iPad/.test(ua);
    return isMobile ? 'Mobile' : 'Desktop';
  };

  const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!issueType) {
      toast.error('Please select an issue type');
      return;
    }

    if (!description.trim()) {
      toast.error('Please describe the issue');
      return;
    }

    setLoading(true);
    try {
      // Insert complaint into database
      const { error: dbError } = await supabase.from('complaints').insert({
        user_id: user?.id || null,
        issue_type: ISSUE_TYPES.find(t => t.value === issueType)?.label || issueType,
        description: description.trim(),
        anime_id: animeId,
        anime_title: animeTitle,
        episode_number: episodeNumber,
        device_info: getDeviceInfo(),
        browser_info: getBrowserInfo(),
      });

      if (dbError) throw dbError;

      // Send email notification
      await supabase.functions.invoke('send-complaint-email', {
        body: {
          issue_type: ISSUE_TYPES.find(t => t.value === issueType)?.label || issueType,
          description: description.trim(),
          anime_id: animeId,
          anime_title: animeTitle,
          episode_number: episodeNumber,
          device_info: getDeviceInfo(),
          browser_info: getBrowserInfo(),
          user_email: user?.email,
        },
      });

      setSubmitted(true);
      toast.success('Issue reported successfully!');
    } catch (err) {
      console.error('Failed to submit complaint:', err);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIssueType('');
    setDescription('');
    setSubmitted(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {submitted ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                Issue Reported
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Report an Issue
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">
              Your issue has been reported. Our team will look into it.
            </p>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {animeTitle && (
              <div className="p-3 rounded-lg bg-secondary text-sm">
                <p className="text-muted-foreground">
                  Reporting issue for: <strong>{animeTitle}</strong>
                  {episodeNumber && ` - Episode ${episodeNumber}`}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Issue Type</label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Please describe the issue in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Report'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReportIssueModal;
