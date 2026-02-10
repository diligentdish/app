import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Loader2, CreditCard, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CheckoutPage = () => {
  const [loading, setLoading] = useState(false);
  const { user, token, hasSubscription, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (hasSubscription) {
      navigate('/dashboard');
    }
  }, [hasSubscription, navigate]);

  const handleCheckout = async () => {
    setLoading(true);
    
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/checkout/session`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          origin_url: window.location.origin
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create checkout session');
      }

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" data-testid="checkout-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>
          <h1 className="heading-2 mb-2">Complete Your Subscription</h1>
          <p className="body">You're one step away from your simplified health journey</p>
        </div>

        <div className="card-custom">
          <div className="border-b border-border pb-4 mb-4">
            <h3 className="font-semibold mb-2">Blessed Belly Membership</h3>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Monthly subscription</span>
              <span className="text-2xl font-bold">$9<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Beta pricing (locked in)</span>
              <span>$9.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Billed monthly</span>
              <span>Cancel anytime</span>
            </div>
          </div>

          <Button 
            onClick={handleCheckout}
            className="btn-primary w-full py-6"
            disabled={loading}
            data-testid="checkout-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Redirecting to payment...
              </>
            ) : (
              <>
                Proceed to Payment
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Secure payment powered by Stripe. Your card details are never stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
