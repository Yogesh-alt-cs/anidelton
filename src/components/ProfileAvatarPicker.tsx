import { useState, useRef, useEffect } from 'react';
import { Camera, Check, Loader2, User, RefreshCw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Anime character avatars from various sources that refresh
const ANIME_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=anime1',
  'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=anime2',
  'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=anime3',
  'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=anime4',
  'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=anime5',
  'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=anime6',
  'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=anime7',
  'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=anime8',
  'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=anime9',
  'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=anime10',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=anime11',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=anime12',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=anime13',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=anime14',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=anime15',
  'https://api.dicebear.com/7.x/notionists/svg?seed=anime16',
  'https://api.dicebear.com/7.x/notionists/svg?seed=anime17',
  'https://api.dicebear.com/7.x/notionists/svg?seed=anime18',
  'https://api.dicebear.com/7.x/notionists/svg?seed=anime19',
  'https://api.dicebear.com/7.x/notionists/svg?seed=anime20',
  'https://api.dicebear.com/7.x/personas/svg?seed=anime21',
  'https://api.dicebear.com/7.x/personas/svg?seed=anime22',
  'https://api.dicebear.com/7.x/personas/svg?seed=anime23',
  'https://api.dicebear.com/7.x/personas/svg?seed=anime24',
  'https://api.dicebear.com/7.x/personas/svg?seed=anime25',
];

interface ProfileAvatarPickerProps {
  currentAvatar?: string | null;
  username?: string;
  onAvatarChange?: (url: string) => void;
}

const ProfileAvatarPicker = ({ currentAvatar, username, onAvatarChange }: ProfileAvatarPickerProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(currentAvatar || null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate refreshed avatars based on key
  const refreshedAvatars = ANIME_AVATARS.map((url, i) => 
    url.replace(/seed=anime\d+/, `seed=anime${i + 1 + refreshKey * 25}`)
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setSelectedAvatar(publicUrl);
      toast.success('Photo uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !selectedAvatar) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: selectedAvatar })
        .eq('user_id', user.id);

      if (error) throw error;

      onAvatarChange?.(selectedAvatar);
      setIsOpen(false);
      toast.success('Avatar updated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update avatar');
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshAvatars = () => {
    setRefreshKey(prev => prev + 1);
  };

  const displayAvatar = currentAvatar || selectedAvatar;
  const initial = username?.charAt(0).toUpperCase() || '?';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="relative group">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-lg shadow-primary/25 ring-4 ring-background">
            {displayAvatar ? (
              <img 
                src={displayAvatar} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              initial
            )}
          </div>
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary border-2 border-background flex items-center justify-center">
            <Camera className="w-3 h-3 text-primary-foreground" />
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change Profile Picture</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="preset" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preset">Choose Avatar</TabsTrigger>
            <TabsTrigger value="upload">Upload Photo</TabsTrigger>
          </TabsList>

          <TabsContent value="preset" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Select from anime-style avatars
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRefreshAvatars}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
            
            <div className="grid grid-cols-5 gap-3 max-h-[300px] overflow-y-auto p-1">
              {refreshedAvatars.map((avatar, index) => (
                <button
                  key={`${avatar}-${refreshKey}`}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={cn(
                    "relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105",
                    selectedAvatar === avatar
                      ? "border-primary ring-2 ring-primary/50"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <img 
                    src={avatar} 
                    alt={`Avatar ${index + 1}`}
                    className="w-full h-full object-cover bg-secondary"
                    loading="lazy"
                  />
                  {selectedAvatar === avatar && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-border rounded-xl">
              {selectedAvatar && selectedAvatar.includes('supabase') ? (
                <div className="w-24 h-24 rounded-full overflow-hidden">
                  <img 
                    src={selectedAvatar} 
                    alt="Uploaded" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center">
                  <User className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Photo
                  </>
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                JPG, PNG or GIF. Max 2MB.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 mt-4">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="gradient" 
            className="flex-1"
            onClick={handleSave}
            disabled={!selectedAvatar || saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileAvatarPicker;