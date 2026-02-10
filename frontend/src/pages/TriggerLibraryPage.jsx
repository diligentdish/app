import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Loader2, X, Zap, Cookie, Battery, Utensils, Moon, BookOpen } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TriggerLibraryPage = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [triggers, setTriggers] = useState([]);
  const [selectedTrigger, setSelectedTrigger] = useState(null);

  const triggerTypes = [
    { id: 'stressed', label: 'Stressed?', icon: Zap, color: 'bg-red-100 text-red-700 border-red-200' },
    { id: 'cravings', label: 'Cravings?', icon: Cookie, color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { id: 'low_energy', label: 'Low Energy?', icon: Battery, color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'after_meals', label: 'After Meals?', icon: Utensils, color: 'bg-green-100 text-green-700 border-green-200' },
    { id: 'before_bed', label: 'Before Bed?', icon: Moon, color: 'bg-purple-100 text-purple-700 border-purple-200' }
  ];

  useEffect(() => {
    fetchTriggers();
  }, []);

  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
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

  const getTriggerByType = (type) => {
    return triggers.find(t => t.trigger_type === type);
  };

  const handleTriggerClick = (type) => {
    const trigger = getTriggerByType(type);
    if (trigger) {
      setSelectedTrigger(trigger);
    }
  };

  const getTriggerConfig = (type) => {
    return triggerTypes.find(t => t.id === type);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 md:py-12" data-testid="trigger-library-page">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="caption text-primary mb-2 block">On-Demand Support</span>
          <h1 className="heading-2 mb-4">Trigger Library</h1>
          <p className="body-lg text-muted-foreground max-w-xl mx-auto">
            Need immediate support? Select what you're experiencing for a quick, 
            faith-filled response.
          </p>
        </div>

        {/* Trigger Buttons Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
          {triggerTypes.map((type) => {
            const Icon = type.icon;
            const trigger = getTriggerByType(type.id);
            
            return (
              <button
                key={type.id}
                onClick={() => handleTriggerClick(type.id)}
                disabled={!trigger}
                className={`trigger-card flex flex-col items-center justify-center py-8 px-4 ${type.color} border-2 ${!trigger ? 'opacity-50 cursor-not-allowed' : ''}`}
                data-testid={`trigger-btn-${type.id}`}
              >
                <Icon className="w-8 h-8 mb-3" />
                <span className="font-medium text-center">{type.label}</span>
              </button>
            );
          })}
        </div>

        {/* Empty State */}
        {triggers.length === 0 && (
          <div className="text-center py-12 mt-8">
            <p className="text-muted-foreground">
              Trigger cards are being prepared. Check back soon!
            </p>
          </div>
        )}

        {/* Trigger Modal */}
        <Dialog open={!!selectedTrigger} onOpenChange={() => setSelectedTrigger(null)}>
          <DialogContent className="max-w-lg" data-testid="trigger-modal">
            {selectedTrigger && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const config = getTriggerConfig(selectedTrigger.trigger_type);
                      const Icon = config?.icon || Zap;
                      return (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config?.color || 'bg-primary/10 text-primary'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                      );
                    })()}
                    <DialogTitle className="heading-3">{selectedTrigger.title}</DialogTitle>
                  </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                  {/* Immediate Action */}
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="text-sm font-medium text-primary mb-2">Immediate Action</p>
                    <p className="text-foreground">{selectedTrigger.immediate_action}</p>
                  </div>

                  {/* Explanation */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Why This Works</p>
                    <p className="text-foreground">{selectedTrigger.explanation}</p>
                  </div>

                  {/* Body Truth */}
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-sm font-medium text-secondary mb-2">Body Truth</p>
                    <p className="text-foreground italic">{selectedTrigger.body_truth}</p>
                  </div>

                  {/* Scripture */}
                  <div className="p-4 rounded-xl border border-border">
                    <div className="flex items-start gap-3">
                      <BookOpen className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-foreground italic">"{selectedTrigger.verse}"</p>
                        <p className="text-sm text-muted-foreground mt-2">— {selectedTrigger.verse_ref}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  className="absolute top-4 right-4"
                  onClick={() => setSelectedTrigger(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Bottom Encouragement */}
        <div className="text-center mt-16 py-8">
          <p className="body text-muted-foreground max-w-md mx-auto">
            Remember, these triggers are information, not emergencies. 
            Respond with grace, not reaction.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TriggerLibraryPage;
