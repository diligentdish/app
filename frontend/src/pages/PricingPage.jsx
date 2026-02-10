import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PricingPage = () => {
  const { isAuthenticated, hasSubscription } = useAuth();
  const location = useLocation();
  const showSubscriptionMessage = location.state?.message === 'subscription_required';

  const features = [
    "Daily personalized BASEline actions",
    "Complete Trigger Library access",
    "Scripture-based encouragement",
    "Simple body signal check-ins",
    "Movement suggestions",
    "No calorie counting ever",
    "Cancel anytime"
  ];

  return (
    <div className="min-h-screen" data-testid="pricing-page">
      <section className="section-spacing">
        <div className="container-custom">
          {/* Message for users redirected from protected pages */}
          {showSubscriptionMessage && (
            <div className="max-w-xl mx-auto mb-8 p-4 bg-secondary/10 border border-secondary/30 rounded-xl text-center">
              <p className="text-foreground">
                An active subscription is required to access member content. 
                Join today to unlock your personalized BASEline!
              </p>
            </div>
          )}

          <div className="text-center mb-16">
            <span className="caption mb-4 block text-primary">Simple Pricing</span>
            <h1 className="heading-1 mb-6">
              One Price.<br />
              <span className="text-primary italic">Full Access.</span>
            </h1>
            <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
              No hidden fees. No upsells. Just the tools you need to simplify 
              your health journey.
            </p>
          </div>

          {/* Pricing Card */}
          <div className="max-w-lg mx-auto">
            <div className="card-custom relative overflow-hidden">
              {/* Beta Badge */}
              <div className="absolute top-4 right-4">
                <span className="inline-block px-3 py-1 text-xs font-medium bg-secondary/20 text-secondary rounded-full">
                  Beta Price
                </span>
              </div>

              <div className="text-center pt-4 pb-8 border-b border-border">
                <h2 className="heading-3 mb-2">Blessed Belly Membership</h2>
                <div className="flex items-end justify-center gap-1 mb-2">
                  <span className="text-5xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>$9</span>
                  <span className="text-muted-foreground mb-2">/month</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Special beta pricing — lock in this rate forever
                </p>
              </div>

              <div className="py-8">
                <ul className="space-y-4">
                  {features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-border">
                {hasSubscription ? (
                  <div className="text-center py-4">
                    <p className="text-primary font-medium mb-2">You're a member!</p>
                    <Link to="/dashboard">
                      <Button className="btn-primary w-full">
                        Go to Dashboard
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                ) : isAuthenticated ? (
                  <Link to="/checkout">
                    <Button className="btn-primary w-full" size="lg" data-testid="subscribe-btn">
                      Subscribe Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/signup">
                    <Button className="btn-primary w-full" size="lg" data-testid="get-started-btn">
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Trust Note */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Secure payment via Stripe. Cancel anytime with no questions asked.
              </p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-2xl mx-auto mt-20">
            <h2 className="heading-2 text-center mb-12">Common Questions</h2>
            
            <div className="space-y-6">
              {[
                {
                  q: "Is this another diet program?",
                  a: "No. Blessed Belly is anti-diet. We don't count calories, restrict food groups, or promote any form of food obsession. We focus on gentle habits that honor your body as the temple it is."
                },
                {
                  q: "How is this faith-informed?",
                  a: "We integrate scripture and biblical principles throughout—not in a preachy way, but as gentle reminders that your body is fearfully and wonderfully made. We approach health from a place of gratitude, not punishment."
                },
                {
                  q: "What if I miss a day?",
                  a: "Grace, sister. That's what. There's no streak to maintain, no guilt to carry. Each day is fresh. Just check in when you can."
                },
                {
                  q: "Can I cancel anytime?",
                  a: "Absolutely. No contracts, no hidden fees, no questions asked. We want you here because it's helping you, not because you're stuck."
                }
              ].map((item, idx) => (
                <div key={idx} className="card-custom">
                  <h3 className="font-semibold mb-2">{item.q}</h3>
                  <p className="text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
