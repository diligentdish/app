import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowRight, Leaf, Heart, Zap, Sparkles } from 'lucide-react';

const HomePage = () => {
  const baseFramework = [
    {
      letter: 'B',
      title: 'Become Balanced',
      description: 'Balanced meals, blood sugar stability, 80/20 nutrition approach',
      colorClass: 'base-b',
      icon: Leaf
    },
    {
      letter: 'A',
      title: 'Activate Awareness',
      description: 'Mindful eating, stress awareness, gratitude, ingredient awareness',
      colorClass: 'base-a',
      icon: Heart
    },
    {
      letter: 'S',
      title: 'Support Strength',
      description: 'Simple daily movement like walking after meals and gentle strength',
      colorClass: 'base-s',
      icon: Zap
    },
    {
      letter: 'E',
      title: 'Engage Your Gut',
      description: 'Gut health strategies, fiber, fasting, digestion support',
      colorClass: 'base-e',
      icon: Sparkles
    }
  ];

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative overflow-hidden section-spacing">
        <div className="absolute inset-0 subtle-glow opacity-50" />
        <div className="container-custom relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="fade-in-up">
              <span className="caption mb-4 block text-primary">Faith-Informed Metabolic Habits</span>
              <h1 className="heading-1 mb-6">
                One Simple Action<br />
                <span className="text-primary italic">Every Day</span>
              </h1>
              <p className="body-lg text-muted-foreground mb-8 max-w-lg">
                Stop overthinking your health. Blessed Belly gives busy Christian women 
                one strategic daily action based on your body's signals—no dieting, 
                calorie counting, or complex planning required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup">
                  <Button className="btn-primary flex items-center gap-2" data-testid="hero-cta">
                    Start Your Journey
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button variant="outline" className="btn-secondary" data-testid="hero-pricing">
                    See Pricing
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative fade-in stagger-2">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1718361830657-1a2e0fbf9550?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"
                  alt="Woman peaceful morning journal coffee"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 gradient-overlay" />
              </div>
              
              {/* Floating Card */}
              <div className="absolute -bottom-6 -left-6 card-custom max-w-xs shadow-lg">
                <p className="text-sm italic text-muted-foreground">
                  "Come to me, all you who are weary and burdened, and I will give you rest."
                </p>
                <p className="text-xs text-primary mt-2 font-medium">— Matthew 11:28</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="section-spacing bg-muted/30">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="heading-2 mb-6">
              You're Not Failing—<br />
              <span className="text-primary">You're Overwhelmed</span>
            </h2>
            <p className="body-lg text-muted-foreground">
              Diet culture has made health feel complicated. You don't need another 
              meal plan, another workout program, or another thing to track. 
              You need simplicity rooted in wisdom.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "No More Calorie Counting",
                description: "Your body is designed to signal what it needs. Learn to listen, not calculate."
              },
              {
                title: "No Complex Meal Plans",
                description: "Simple principles, flexible application. Life happens—your habits should flow with it."
              },
              {
                title: "No All-or-Nothing Thinking",
                description: "Grace-based progress over perfection. 80/20 approach that honors your humanity."
              }
            ].map((item, idx) => (
              <div key={idx} className={`card-custom fade-in-up stagger-${idx + 1}`}>
                <h3 className="heading-3 text-xl mb-3">{item.title}</h3>
                <p className="body">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BASE Framework Section */}
      <section className="section-spacing" data-testid="base-framework-section">
        <div className="container-custom">
          <div className="text-center mb-16">
            <span className="caption mb-4 block text-primary">The Framework</span>
            <h2 className="heading-2 mb-4">The BASE Approach</h2>
            <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
              Four pillars that work together to support your body's natural wisdom.
              Each day, you focus on just one—based on how your body feels.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {baseFramework.map((item, idx) => (
              <div 
                key={item.letter} 
                className={`card-custom text-center fade-in-up stagger-${idx + 1}`}
                data-testid={`base-card-${item.letter.toLowerCase()}`}
              >
                <div className={`base-badge ${item.colorClass} mx-auto mb-4`}>
                  {item.letter}
                </div>
                <h3 className="heading-3 text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-spacing bg-muted/30">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1762199780803-8eed898ffb20?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"
                  alt="Healthy nutrition"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <span className="caption mb-4 block text-primary">How It Works</span>
              <h2 className="heading-2 mb-8">Your Daily Rhythm</h2>
              
              <div className="space-y-6">
                {[
                  {
                    step: "1",
                    title: "Check In",
                    description: "Answer one simple question: What feels most true for your body today?"
                  },
                  {
                    step: "2",
                    title: "Receive Your BASEline",
                    description: "Get one strategic action, one movement tip, and one scripture—tailored to your body's signals."
                  },
                  {
                    step: "3",
                    title: "Live It Out",
                    description: "Focus on that one action. No overwhelm. No perfectionism. Just faithful progress."
                  }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-semibold">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-spacing">
        <div className="container-custom">
          <div className="card-custom bg-primary/5 border-primary/20 text-center py-12 md:py-16">
            <h2 className="heading-2 mb-4">Ready to Simplify?</h2>
            <p className="body-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Join Blessed Belly for just $9/month and start experiencing 
              peace in your health journey.
            </p>
            <Link to="/signup">
              <Button className="btn-primary" size="lg" data-testid="cta-signup">
                Get Started Today
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
