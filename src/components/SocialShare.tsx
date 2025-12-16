import React, { useState } from 'react';
import { Share2, Twitter, Facebook, MessageCircle, Copy, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SocialShareProps {
  title: string;
  description?: string;
  url?: string;
  image?: string;
  className?: string;
  variant?: 'icon' | 'button' | 'panel';
}

const SocialShare = ({
  title,
  description = '',
  url = typeof window !== 'undefined' ? window.location.href : '',
  image,
  className,
  variant = 'icon'
}: SocialShareProps) => {
  const [showPanel, setShowPanel] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareText = `${title}${description ? ` - ${description}` : ''}`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(url);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    discord: `https://discord.com/channels/@me?content=${encodedText}%20${encodedUrl}`,
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
    setShowPanel(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      setShowPanel(true);
    }
  };

  if (variant === 'icon') {
    return (
      <div className={cn("relative", className)}>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNativeShare}
          className="text-foreground hover:bg-secondary"
        >
          <Share2 className="w-5 h-5" />
        </Button>

        {showPanel && (
          <>
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setShowPanel(false)}
            />
            <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-lg p-3 z-50 min-w-[200px]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Share</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowPanel(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleShare('twitter')}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1DA1F2] flex items-center justify-center">
                    <Twitter className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs">Twitter</span>
                </button>
                
                <button
                  onClick={() => handleShare('facebook')}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center">
                    <Facebook className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs">Facebook</span>
                </button>
                
                <button
                  onClick={() => handleShare('discord')}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs">Discord</span>
                </button>
                
                <button
                  onClick={handleCopyLink}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    {copied ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs">{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <div className={cn("flex gap-2", className)}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare('twitter')}
          className="gap-2"
        >
          <Twitter className="w-4 h-4" />
          Twitter
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare('facebook')}
          className="gap-2"
        >
          <Facebook className="w-4 h-4" />
          Facebook
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare('discord')}
          className="gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          Discord
        </Button>
      </div>
    );
  }

  // Panel variant
  return (
    <div className={cn("bg-card border border-border rounded-xl p-4", className)}>
      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
        <Share2 className="w-4 h-4" />
        Share this anime
      </h3>
      
      <div className="flex gap-3">
        <button
          onClick={() => handleShare('twitter')}
          className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 transition-colors"
        >
          <Twitter className="w-6 h-6 text-[#1DA1F2]" />
          <span className="text-xs font-medium">Twitter</span>
        </button>
        
        <button
          onClick={() => handleShare('facebook')}
          className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 transition-colors"
        >
          <Facebook className="w-6 h-6 text-[#1877F2]" />
          <span className="text-xs font-medium">Facebook</span>
        </button>
        
        <button
          onClick={() => handleShare('discord')}
          className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl bg-[#5865F2]/10 hover:bg-[#5865F2]/20 transition-colors"
        >
          <MessageCircle className="w-6 h-6 text-[#5865F2]" />
          <span className="text-xs font-medium">Discord</span>
        </button>
        
        <button
          onClick={handleCopyLink}
          className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
        >
          {copied ? (
            <Check className="w-6 h-6 text-green-500" />
          ) : (
            <Copy className="w-6 h-6" />
          )}
          <span className="text-xs font-medium">{copied ? 'Copied!' : 'Copy Link'}</span>
        </button>
      </div>
    </div>
  );
};

export default SocialShare;
