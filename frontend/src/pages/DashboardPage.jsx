import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { MemberLayout } from '../components/MemberLayout';
import { Loader2, ChevronRight, Footprints, BookOpen, Heart, Cookie, Battery, Utensils } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DashboardPage = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [todayData, setTodayData] = useState(null);
  const [selectedSignal, setSelectedSignal] = useState(null);

  const signals = [
    { id: 'stressed', label: 'Stressed' },
    { id: 'low_energy', label: 'Low Energy' },
    { id: 'cravings', label: 'Cravings' },
    { id: 'digestion', label: 'Digestion' },
    { id: 'normal', label: 'Feeling Normal' }
  ];

  const quickTriggers = [
    { id: 'stressed', label: 'Stressed?', icon: Heart, color: 'bg-rose-100 text-rose-600' },
    { id: 'cravings', label: 'Cravings?', icon: Cookie, color: 'bg-amber-100 text-amber-600' },
    { id: 'low_energy', label: 'Low Energy?', icon: Battery, color: 'bg-emerald-100 text-emerald-600' },
    { id: 'after_meals', label: 'After Meals', icon: Utensils, color: 'bg-blue-100 text-blue-600' },
  ];

  const baseInfo = {
    'B': { name: 'Become Balanced', color: 'bg-[#5A7D69]', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop' },
    'A': { name: 'Activate Awareness', color: 'bg-[#D4A373]', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&h=200&fit=crop' },
    'S': { name: 'Support Strength', color: 'bg-[#7B9EA8]', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop' },
    'E': { name: 'Engage Your Gut', color: 'bg-[#9B8AA6]', image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=200&h=200&fit=crop' }
  };

  useEffect(() => {
    fetchTodayCheckIn();
  }, []);

  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
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
        }
      }
    } catch (error) {
      console.error('Error fetching today check-in:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (signal) => {
    setSelectedSignal(signal);
    setSubmitting(true);
    
    try {
      const response = await fetch(`${API_URL}/api/checkin`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ signal })
      });

      if (!response.ok) throw new Error('Failed to submit check-in');

      const data = await response.json();
      setTodayData({ has_checkin: true, ...data });
      toast.success('Your BASEline is ready!');
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('Failed to submit check-in. Please try again.');
    } finally {
      setSubmitting(false);
      setSelectedSignal(null);
    }
  };

  if (loading) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MemberLayout>
    );
  }

  const currentBase = todayData ? baseInfo[todayData.base_category] : null;

  return (
    <MemberLayout>
      <div className="max-w-4xl mx-auto" data-testid="dashboard-page">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="heading-2 text-foreground">
            Welcome Back, <span className="text-primary">{user?.name?.split(' ')[0]}!</span>
          </h1>
        </div>

        {/* Check-in Section */}
        <div className="member-card mb-6" data-testid="checkin-section">
          <p className="text-lg text-foreground mb-4">What feels most true for your body today?</p>
          
          <div className="flex flex-wrap gap-3">
            {signals.map((signal) => (
              <button
                key={signal.id}
                onClick={() => handleCheckIn(signal.id)}
                disabled={submitting}
                className={`px-5 py-2.5 rounded-full border-2 font-medium transition-all ${
                  todayData?.signal === signal.id
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-border hover:border-primary/50 text-foreground'
                } ${submitting && selectedSignal === signal.id ? 'opacity-70' : ''}`}
                data-testid={`signal-${signal.id}`}
              >
                {submitting && selectedSignal === signal.id ? (
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                ) : null}
                {signal.label}
              </button>
            ))}
          </div>
        </div>

        {/* Today's BASEline */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="heading-3">Today's <span className="italic">BASE</span>line</h2>
          <Link to="/triggers">
            <Button className="btn-primary" data-testid="open-trigger-library">
              Open Trigger Library
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {todayData ? (
          <div className="member-card mb-8" data-testid="baseline-card">
            {/* BASE Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-xl ${currentBase.color} flex items-center justify-center`}>
                <span className="text-white text-xl font-bold">{todayData.base_category}</span>
              </div>
              <h3 className="text-xl font-semibold">{currentBase.name}</h3>
            </div>

            {/* Content with Image */}
            <div className="flex gap-6 mb-6">
              <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 shadow-md">
                <img 
                  src={currentBase.image}
                  alt={currentBase.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="text-lg font-medium text-foreground mb-2">
                  {todayData.action?.text}
                </p>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Footprints className="w-4 h-4" />
                  {todayData.movement?.text}
                </p>
              </div>
            </div>

            {/* Scripture */}
            <div className="flex items-start gap-3 pt-4 border-t border-border">
              <BookOpen className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-foreground">
                <span className="italic">{todayData.verse?.text}</span>
                <span className="text-muted-foreground ml-2">— {todayData.verse?.reference}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="member-card mb-8 text-center py-12">
            <p className="text-muted-foreground text-lg">
              Select how you're feeling above to receive today's personalized BASEline.
            </p>
          </div>
        )}

        {/* Explore the Library */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-foreground mb-4">Explore the Library</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickTriggers.map((trigger) => {
              const Icon = trigger.icon;
              return (
                <Link
                  key={trigger.id}
                  to={`/triggers?type=${trigger.id}`}
                  className="member-card hover:shadow-lg transition-shadow flex flex-col items-center py-6 px-4"
                  data-testid={`quick-trigger-${trigger.id}`}
                >
                  <div className={`w-12 h-12 rounded-xl ${trigger.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <span className="font-medium text-foreground">{trigger.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </MemberLayout>
  );
};

export default DashboardPage;
