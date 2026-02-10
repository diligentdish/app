import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, refreshUser } = useAuth();
  const [status, setStatus] = useState('checking'); // checking, success, error
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setStatus('error');
      return;
    }

    const pollPaymentStatus = async (attempts = 0) => {
      const maxAttempts = 5;
      const pollInterval = 2000;

      if (attempts >= maxAttempts) {
        setStatus('error');
        toast.error('Payment verification timed out. Please contact support.');
        return;
      }

      try {
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/api/checkout/status/${sessionId}`, {
          credentials: 'include',
          headers
        });

        if (!response.ok) {
          throw new Error('Failed to check payment status');
        }

        const data = await response.json();

        if (data.payment_status === 'paid') {
          setStatus('success');
          await refreshUser();
          toast.success('Payment successful! Welcome to Blessed Belly.');
          return;
        } else if (data.status === 'expired') {
          setStatus('error');
          toast.error('Payment session expired. Please try again.');
          return;
        }

        // Continue polling
        setTimeout(() => pollPaymentStatus(attempts + 1), pollInterval);
      } catch (error) {
        console.error('Payment status check error:', error);
        setTimeout(() => pollPaymentStatus(attempts + 1), pollInterval);
      }
    };

    pollPaymentStatus();
  }, [searchParams, token, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" data-testid="payment-success-page">
      <div className="w-full max-w-md text-center">
        {status === 'checking' && (
          <div className="card-custom">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h1 className="heading-3 mb-2">Verifying Payment</h1>
            <p className="body">Please wait while we confirm your payment...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="card-custom">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="heading-2 mb-2">Welcome to Blessed Belly!</h1>
            <p className="body mb-6">
              Your subscription is now active. Let's begin your simplified health journey.
            </p>
            <Button 
              onClick={() => navigate('/dashboard')}
              className="btn-primary"
              data-testid="go-to-dashboard-btn"
            >
              Go to Dashboard
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="card-custom">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="heading-3 mb-2">Payment Issue</h1>
            <p className="body mb-6">
              There was a problem verifying your payment. If you believe this is an error, 
              please try again or contact support.
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => navigate('/checkout')}
                className="btn-primary"
              >
                Try Again
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/pricing')}
              >
                Back to Pricing
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
