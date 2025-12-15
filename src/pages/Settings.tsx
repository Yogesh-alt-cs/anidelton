import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Bell, Palette, Shield, HelpCircle, 
  ChevronRight, Moon, Sun, Monitor, Check, Loader2,
  Mail, Lock, LogOut
} from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Theme = 'light' | 'dark' | 'system';

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'dark';
  });
  
  // Notification preferences
  const [notifications, setNotifications] = useState({
    newEpisodes: true,
    recommendations: true,
    updates: false,
    marketing: false,
  });
  
  // Appearance settings
  const [autoplay, setAutoplay] = useState(true);
  const [quality, setQuality] = useState<'auto' | '1080p' | '720p' | '480p'>('auto');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast.success('Signed out successfully');
  };

  const menuSections = [
    {
      id: 'account',
      icon: User,
      title: 'Account',
      description: 'Manage your profile and account',
    },
    {
      id: 'notifications',
      icon: Bell,
      title: 'Notifications',
      description: 'Configure notification preferences',
    },
    {
      id: 'appearance',
      icon: Palette,
      title: 'Appearance',
      description: 'Customize theme and display',
    },
    {
      id: 'privacy',
      icon: Shield,
      title: 'Privacy & Security',
      description: 'Manage your data and security',
    },
    {
      id: 'help',
      icon: HelpCircle,
      title: 'Help & Support',
      description: 'Get help and contact support',
    },
  ];

  const themeOptions: { id: Theme; icon: React.ElementType; label: string }[] = [
    { id: 'light', icon: Sun, label: 'Light' },
    { id: 'dark', icon: Moon, label: 'Dark' },
    { id: 'system', icon: Monitor, label: 'System' },
  ];

  const qualityOptions = [
    { id: 'auto', label: 'Auto' },
    { id: '1080p', label: '1080p' },
    { id: '720p', label: '720p' },
    { id: '480p', label: '480p' },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'account':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-primary-foreground">
                {user?.email?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <p className="font-medium">{user?.user_metadata?.username || 'User'}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="pl-10 bg-secondary"
                  />
                </div>
              </div>

              <Button variant="outline" className="w-full gap-2" disabled>
                <Lock className="w-4 h-4" />
                Change Password
              </Button>

              <Button 
                variant="destructive" 
                className="w-full gap-2"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            {[
              { key: 'newEpisodes', label: 'New Episodes', description: 'Get notified when new episodes are available' },
              { key: 'recommendations', label: 'Recommendations', description: 'Personalized anime suggestions' },
              { key: 'updates', label: 'App Updates', description: 'New features and improvements' },
              { key: 'marketing', label: 'Promotions', description: 'Special offers and news' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <Switch
                  checked={notifications[item.key as keyof typeof notifications]}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, [item.key]: checked }))
                  }
                />
              </div>
            ))}
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Theme</h3>
              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setTheme(id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                      theme === id
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-card border-border/50 hover:border-primary/50"
                    )}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-sm font-medium">{label}</span>
                    {theme === id && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Video Quality</h3>
              <div className="grid grid-cols-2 gap-3">
                {qualityOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setQuality(option.id as typeof quality)}
                    className={cn(
                      "p-3 rounded-xl border text-sm font-medium transition-all",
                      quality === option.id
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-card border-border/50 hover:border-primary/50"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
              <div>
                <p className="font-medium">Autoplay</p>
                <p className="text-sm text-muted-foreground">Automatically play next episode</p>
              </div>
              <Switch
                checked={autoplay}
                onCheckedChange={setAutoplay}
              />
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <h4 className="font-medium mb-2">Data Collection</h4>
              <p className="text-sm text-muted-foreground">
                We collect minimal data to improve your experience. Your watch history and preferences are stored securely.
              </p>
            </div>
            <Button variant="outline" className="w-full" disabled>
              Download My Data
            </Button>
            <Button variant="destructive" className="w-full" disabled>
              Delete Account
            </Button>
          </div>
        );

      case 'help':
        return (
          <div className="space-y-4">
            {[
              { label: 'FAQ', description: 'Frequently asked questions' },
              { label: 'Contact Support', description: 'Get help from our team' },
              { label: 'Report a Bug', description: 'Help us improve' },
              { label: 'About', description: 'App version and info' },
            ].map((item) => (
              <button
                key={item.label}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all"
              >
                <div className="text-left">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            ))}
            <p className="text-center text-xs text-muted-foreground pt-4">
              AniDel v1.0.0
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header showSearch={false} showNotifications={false} />
      
      <main className="pt-20 px-4 space-y-6 max-w-lg mx-auto">
        {activeSection ? (
          <>
            {/* Section Header */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveSection(null)}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-inter font-bold">
                {menuSections.find(s => s.id === activeSection)?.title}
              </h1>
            </div>

            {/* Section Content */}
            {renderSectionContent()}
          </>
        ) : (
          <>
            {/* Settings Header */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-inter font-bold">Settings</h1>
            </div>

            {/* Menu Items */}
            <div className="space-y-2">
              {menuSections.map(({ id, icon: Icon, title, description }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>

            {/* Sign Out */}
            {user && (
              <Button 
                variant="ghost" 
                className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </Button>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Settings;
