import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MemberLayout } from '../components/MemberLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Loader2, X, Heart, Cookie, Battery, Utensils, Moon, BookOpen, Sparkles } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TriggerLibraryPage = () => {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [triggers, setTriggers] = useState([]);
  const [selectedTrigger, setSelectedTrigger] = useState(null);

  const triggerConfig = {
    'stressed': { label: 'Stressed?', icon: Heart, color: 'bg-rose-100 text-rose-600', borderColor: 'border-rose-200' },
    'cravings': { label: 'Cravings?', icon: Cookie, color: 'bg-amber-100 text-amber-600', borderColor: 'border-amber-200' },
    'low_energy': { label: 'Low Energy?', icon: Battery, color: 'bg-emerald-100 text-emerald-600', borderColor: 'border-emerald-200' },
    'after_meals': { label: 'After Meals', icon: Utensils, color: 'bg-blue-100 text-blue-600', borderColor: 'border-blue-200' },
    'before_bed': { label: 'Before Bed', icon: Moon, color: 'bg-purple-100 text-purple-600', borderColor: 'border-purple-200' }
  };

  useEffect(() => {
    fetchTriggers();
  }, []);

  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam && triggers.length > 0) {
      const trigger = triggers.find(t => t.trigger_type === typeParam);
      if (trigger) setSelectedTrigger(trigger);
    }
  }, [searchParams, triggers]);

  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const fetchTriggers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/triggers`, {
        credentials: 'include',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setTriggers(data);
      }
    } catch (error) {
      console.error('Error fetching triggers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTriggerByType = (type) => triggers.find(t => t.trigger_type === type);
  const getConfig = (type) => triggerConfig[type] || triggerConfig['stressed'];

  if (loading) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <div className="max-w-4xl mx-auto" data-testid="trigger-library-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="heading-2 text-foreground mb-2">Trigger Library</h1>
          <p className="body-lg text-muted-foreground">
            Your pocket nutritionist. Select what you're experiencing for immediate, faith-filled support.
          </p>
        </div>

        {/* Trigger Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(triggerConfig).map(([type, config]) => {
            const Icon = config.icon;
            const trigger = getTriggerByType(type);
            
            return (
              <button
                key={type}
                onClick={() => trigger && setSelectedTrigger(trigger)}
                disabled={!trigger}
                className={`member-card border-2 ${config.borderColor} hover:shadow-lg transition-all flex flex-col items-center py-8 px-6 ${!trigger ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                data-testid={`trigger-btn-${type}`}
              >
                <div className={`w-16 h-16 rounded-2xl ${config.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <span className="text-lg font-semibold text-foreground">{config.label}</span>
                {trigger && (
                  <span className="text-sm text-muted-foreground mt-1">Tap for support</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Empty State */}
        {triggers.length === 0 && (
          <div className="member-card text-center py-12 mt-8">
            <Sparkles className="w-12 h-12 text-secondary mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              Trigger cards are being prepared. Check back soon!
            </p>
          </div>
        )}

        {/* Bottom Encouragement */}
        <div className="text-center mt-12 py-8">
          <p className="body text-muted-foreground max-w-md mx-auto italic">
            "These triggers are information, not emergencies. Respond with grace, not reaction."
          </p>
        </div>

        {/* Trigger Detail Modal */}
        <Dialog open={!!selectedTrigger} onOpenChange={() => setSelectedTrigger(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" data-testid="trigger-modal">
            {selectedTrigger && (() => {
              const config = getConfig(selectedTrigger.trigger_type);
              const Icon = config.icon;
              return (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl ${config.color} flex items-center justify-center`}>
                        <Icon className="w-7 h-7" strokeWidth={1.5} />
                      </div>
                      <DialogTitle className="heading-3 text-left">{selectedTrigger.title}</DialogTitle>
                    </div>
                  </DialogHeader>

                  <div className="space-y-6 mt-6">
                    {/* Immediate Action */}
                    <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10">
                      <p className="text-sm font-semibold text-primary mb-2 uppercase tracking-wide">Immediate Action</p>
                      <p className="text-foreground text-lg">{selectedTrigger.immediate_action}</p>
                    </div>

                    {/* Explanation */}
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Why This Works</p>
                      <p className="text-foreground leading-relaxed">{selectedTrigger.explanation}</p>
                    </div>

                    {/* Body Truth */}
                    <div className="p-5 rounded-2xl bg-secondary/10 border border-secondary/20">
                      <p className="text-sm font-semibold text-secondary mb-2 uppercase tracking-wide">Body Truth</p>
                      <p className="text-foreground italic text-lg">{selectedTrigger.body_truth}</p>
                    </div>

                    {/* Scripture */}
                    <div className="p-5 rounded-2xl border-2 border-border bg-white">
                      <div className="flex items-start gap-4">
                        <BookOpen className="w-6 h-6 text-primary flex-shrink-0 mt-1" strokeWidth={1.5} />
                        <div>
                          <p className="text-foreground text-lg italic leading-relaxed">"{selectedTrigger.verse}"</p>
                          <p className="text-sm text-primary font-medium mt-3">— {selectedTrigger.verse_ref}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 rounded-full"
                    onClick={() => setSelectedTrigger(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </MemberLayout>
  );
};

export default TriggerLibraryPage;
