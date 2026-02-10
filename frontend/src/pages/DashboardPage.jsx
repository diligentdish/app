import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Loader2, RefreshCw, Footprints, BookOpen, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DashboardPage = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [todayData, setTodayData] = useState(null);
  const [showCheckIn, setShowCheckIn] = useState(true);

  const signals = [
    { id: 'stressed', label: 'Stressed or overwhelmed', emoji: '😮‍💨' },
    { id: 'low_energy', label: 'Low energy', emoji: '🪫' },
    { id: 'cravings', label: 'Cravings', emoji: '🍪' },
    { id: 'digestion', label: 'Digestion feels off', emoji: '🫃' },
    { id: 'normal', label: 'Feeling normal', emoji: '✨' }
  ];

  const baseColors = {
    'B': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
    'A': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    'S': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    'E': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' }
  };

  useEffect(() => {
    fetchTodayCheckIn();
  }, []);

  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchTodayCheckIn = async () => {
    try {
      const response = await fetch(`${API_URL}/api/checkin/today`, {
        credentials: 'include',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        if (data.has_checkin) {
          setTodayData(data);
          setShowCheckIn(false);
        }
      }
    } catch (error) {
      console.error('Error fetching today check-in:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (signal) => {
    setSubmitting(true);
    
    try {
      const response = await fetch(`${API_URL}/api/checkin`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ signal })
      });

      if (!response.ok) {
        throw new Error('Failed to submit check-in');
      }

      const data = await response.json();
      setTodayData({
        has_checkin: true,
        ...data
      });
      setShowCheckIn(false);
      toast.success('Your BASEline is ready!');
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('Failed to submit check-in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewCheckIn = () => {
    setShowCheckIn(true);
    setTodayData(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const baseColor = todayData ? baseColors[todayData.base_category] : baseColors['B'];

  return (
    <div className="min-h-screen py-8 md:py-12" data-testid="dashboard-page">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <p className="caption text-primary mb-2">Your Daily Rhythm</p>
          <h1 className="heading-2">
            Good {getTimeOfDay()}, {user?.name?.split(' ')[0]}
          </h1>
        </div>

        {/* Check-in Section */}
        {showCheckIn ? (
          <div className="card-custom max-w-2xl mx-auto fade-in-up" data-testid="checkin-section">
            <div className="text-center mb-8">
              <h2 className="heading-3 mb-2">Daily Check-In</h2>
              <p className="body-lg text-muted-foreground">
                What feels most true for your body today?
              </p>
            </div>

            <div className="grid gap-3">
              {signals.map((signal) => (
                <button
                  key={signal.id}
                  onClick={() => handleCheckIn(signal.id)}
                  disabled={submitting}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/50 transition-all text-left"
                  data-testid={`signal-${signal.id}`}
                >
                  <span className="text-2xl">{signal.emoji}</span>
                  <span className="font-medium">{signal.label}</span>
                  {submitting && (
                    <Loader2 className="w-4 h-4 animate-spin ml-auto text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* BASEline Display */
          <div className="max-w-3xl mx-auto space-y-6 fade-in-up" data-testid="baseline-section">
            {/* BASE Category Card */}
            <div className={`card-custom ${baseColor.border} border-2`}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="caption mb-1">Today's BASEline</p>
                  <h2 className="heading-2 flex items-center gap-3">
                    <span className={`base-badge ${baseColor.bg} ${baseColor.text}`}>
                      {todayData?.base_category}
                    </span>
                    {todayData?.action?.base_name}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewCheckIn}
                  className="text-muted-foreground"
                  data-testid="new-checkin-btn"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  New Check-in
                </Button>
              </div>

              {/* Daily Action */}
              <div className={`p-6 rounded-xl ${baseColor.bg} mb-4`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full bg-white/60 flex items-center justify-center ${baseColor.text}`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${baseColor.text} mb-1`}>Your One Action</p>
                    <p className="text-foreground font-medium">{todayData?.action?.text}</p>
                  </div>
                </div>
              </div>

              {/* Movement Suggestion */}
              <div className="p-6 rounded-xl bg-muted/50 mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Footprints className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary mb-1">Movement</p>
                    <p className="text-foreground">{todayData?.movement?.text}</p>
                  </div>
                </div>
              </div>

              {/* Scripture Verse */}
              <div className="p-6 rounded-xl border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-secondary mb-1">Truth to Remember</p>
                    <p className="text-foreground italic">"{todayData?.verse?.text}"</p>
                    <p className="text-sm text-muted-foreground mt-2">— {todayData?.verse?.reference}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Encouragement */}
            <div className="text-center py-6">
              <p className="body text-muted-foreground">
                Remember: Just this one thing today. That's enough. You are enough.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export default DashboardPage;
