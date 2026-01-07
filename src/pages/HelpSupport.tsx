import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, HelpCircle, MessageSquare, AlertTriangle, 
  ChevronDown, Loader2, Send, CheckCircle
} from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ReportIssueModal from '@/components/ReportIssueModal';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const HelpSupport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'report'>('faq');
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Contact form state
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [sendingContact, setSendingContact] = useState(false);
  const [contactSent, setContactSent] = useState(false);

  useEffect(() => {
    fetchFaqs();
  }, []);

  useEffect(() => {
    if (user?.email) {
      setContactEmail(user.email);
    }
  }, [user]);

  const fetchFaqs = async () => {
    try {
      const { data, error } = await supabase
        .from('faq')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setFaqs(data || []);
    } catch (err) {
      console.error('Failed to fetch FAQs:', err);
    } finally {
      setLoadingFaqs(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactEmail.trim() || !contactSubject.trim() || !contactMessage.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSendingContact(true);
    try {
      // Insert support ticket
      const { error: dbError } = await supabase.from('support_tickets').insert({
        user_id: user?.id || null,
        email: contactEmail.trim(),
        subject: contactSubject.trim(),
        message: contactMessage.trim(),
      });

      if (dbError) throw dbError;

      // Send email notification
      await supabase.functions.invoke('send-contact-email', {
        body: {
          email: contactEmail.trim(),
          subject: contactSubject.trim(),
          message: contactMessage.trim(),
        },
      });

      setContactSent(true);
      toast.success('Message sent successfully!');
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSendingContact(false);
    }
  };

  const resetContactForm = () => {
    setContactSubject('');
    setContactMessage('');
    setContactSent(false);
  };

  const tabs = [
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    { id: 'contact', label: 'Contact', icon: MessageSquare },
    { id: 'report', label: 'Report Bug', icon: AlertTriangle },
  ];

  const groupedFaqs = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  const categoryLabels: Record<string, string> = {
    streaming: '🎬 Streaming Issues',
    account: '👤 Account',
    notifications: '🔔 Notifications',
    features: '✨ Features',
    general: '📋 General',
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header showSearch={false} showNotifications={false} />
      
      <main className="pt-20 px-4 space-y-6 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-inter font-bold">Help & Support</h1>
        </div>

        {/* Tabs */}
        <div className="flex p-1 rounded-xl bg-secondary">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                if (id === 'report') {
                  setShowReportModal(true);
                } else {
                  setActiveTab(id as 'faq' | 'contact');
                }
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === id
                  ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="space-y-4">
            {loadingFaqs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : faqs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No FAQs available</p>
              </div>
            ) : (
              Object.entries(groupedFaqs).map(([category, items]) => (
                <div key={category} className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground px-1">
                    {categoryLabels[category] || category}
                  </h3>
                  <Accordion type="single" collapsible className="space-y-2">
                    {items.map((faq) => (
                      <AccordionItem
                        key={faq.id}
                        value={faq.id}
                        className="border border-border/50 rounded-xl bg-card px-4"
                      >
                        <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-4">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground pb-4">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))
            )}
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="space-y-4">
            {contactSent ? (
              <div className="text-center py-12 space-y-4">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
                <h3 className="text-lg font-medium">Message Sent!</h3>
                <p className="text-muted-foreground">
                  We've received your message and will get back to you soon.
                </p>
                <Button onClick={resetContactForm} variant="outline">
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Email</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="bg-secondary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    type="text"
                    placeholder="What's this about?"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    className="bg-secondary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    placeholder="Describe your question or issue in detail..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    rows={5}
                    className="resize-none bg-secondary"
                  />
                </div>

                <Button type="submit" disabled={sendingContact} className="w-full gap-2">
                  {sendingContact ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        )}

        {/* App Version */}
        <p className="text-center text-xs text-muted-foreground pt-4">
          AniDel v1.0.0
        </p>
      </main>

      <BottomNav />

      <ReportIssueModal 
        open={showReportModal} 
        onClose={() => setShowReportModal(false)} 
      />
    </div>
  );
};

export default HelpSupport;
