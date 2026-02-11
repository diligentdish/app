import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowRight, Check, Clock, Sparkles, Shield } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative overflow-hidden section-spacing public-hero">
        <div className="container-custom relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="fade-in-up">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                For Busy Christian Women
              </span>
              <h1 className="heading-1 mb-6">
                Lose Stubborn Belly Fat<br />
                <span className="text-primary italic">Without the Overwhelm</span>
              </h1>
              <p className="body-lg text-muted-foreground mb-4">
                What if losing weight didn't require calorie counting, complicated meal plans, 
                or hours at the gym?
              </p>
              <p className="body-lg text-foreground mb-8 font-medium">
                Blessed Belly gives you <span className="text-primary">one simple, strategic action each day</span>—personalized 
                to how your body actually feels. That's it. No overwhelm. No guilt. Just faithful progress.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup">
                  <Button className="btn-primary flex items-center gap-2 text-base px-8 py-6" data-testid="hero-cta">
                    Start for $9/month
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Cancel anytime. No contracts. No questions asked.
              </p>
            </div>
            
            <div className="relative fade-in stagger-2">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1713865466512-67bb4211b24a?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"
                  alt="Woman smiling while using the Blessed Belly app"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Floating Card */}
              <div className="absolute -bottom-6 -left-6 public-card max-w-xs">
                <p className="text-sm italic text-muted-foreground">
                  "Come to me, all you who are weary and burdened, and I will give you rest."
                </p>
                <p className="text-xs text-primary mt-2 font-medium">— Matthew 11:28</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Point Section */}
      <section className="section-spacing public-section-alt">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="heading-2 mb-6">
              You've Tried Everything.<br />
              <span className="text-primary">Nothing Sticks.</span>
            </h2>
            <p className="body-lg text-muted-foreground">
              You've counted calories until you wanted to scream. You've meal prepped on Sundays 
              only to throw it out by Wednesday. You've started workout programs you couldn't maintain. 
              And through it all, that stubborn belly fat hasn't budged.
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <p className="body-lg text-foreground text-center mb-8">
              <strong>Here's the truth no one tells you:</strong> The problem isn't your willpower. 
              It's not that you're lazy or undisciplined. The problem is that you've been given 
              <em> too much to do</em>.
            </p>
            
            <div className="public-card">
              <p className="text-lg text-foreground leading-relaxed">
                Your body is designed to tell you exactly what it needs. But when you're juggling 
                kids, work, ministry, and life—you don't have bandwidth for complex health protocols. 
                You need <strong className="text-primary">simplicity that actually works</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="section-spacing">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="heading-2 mb-4">Here's Exactly What You Get</h2>
            <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to finally make progress—nothing you don't.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                title: "One Daily Action",
                description: "Each morning, tell us how your body feels. We'll give you ONE strategic thing to focus on—not ten, not five, just one. Something you can actually do."
              },
              {
                title: "Personalized to Your Body",
                description: "Feeling stressed? You'll get a different action than when you're low on energy. Your body speaks—we help you listen and respond wisely."
              },
              {
                title: "Simple Movement Cues",
                description: "No hour-long workouts required. Just gentle, doable movement suggestions that fit into your real life. Walk after dinner. Stretch while the coffee brews."
              },
              {
                title: "Faith-Filled Encouragement",
                description: "Every day includes a scripture reminder that your body is a temple—fearfully and wonderfully made. This is health rooted in truth, not diet culture."
              },
              {
                title: "On-Demand Support",
                description: "Having a rough moment? Our Trigger Library gives you immediate, practical support for stress eating, cravings, low energy, and more."
              },
              {
                title: "Zero Calorie Counting",
                description: "We don't do calorie math here. No tracking apps, no food scales, no obsessing over macros. Just simple principles your grandmother would recognize."
              }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Transformation Section */}
      <section className="section-spacing public-section-alt">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-xl">
                <img 
                  src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"
                  alt="Healthy balanced meal"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <h2 className="heading-2 mb-6">
                Imagine Waking Up<br />
                <span className="text-primary">Without Dread</span>
              </h2>
              
              <div className="space-y-4 mb-8">
                <p className="body-lg text-muted-foreground">
                  No mental math about what you ate yesterday. No guilt about skipping the gym. 
                  No complicated meal prep waiting for you.
                </p>
                <p className="body-lg text-foreground">
                  Just one simple question: <em>"How does my body feel today?"</em>
                </p>
                <p className="body-lg text-muted-foreground">
                  Answer that, and you'll know exactly what to focus on. One thing. Something 
                  you can do between school drop-off and your first meeting. Something that 
                  actually moves the needle.
                </p>
                <p className="body-lg text-foreground font-medium">
                  That's the Blessed Belly way. And it works because it's sustainable.
                </p>
              </div>
              
              <Link to="/signup">
                <Button className="btn-primary" data-testid="transform-cta">
                  Start Your Journey
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Now Section */}
      <section className="section-spacing">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary mb-6">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Beta Pricing Available Now</span>
            </div>
            
            <h2 className="heading-2 mb-6">
              Why Start Today?
            </h2>
            
            <div className="space-y-6 text-left mb-10">
              <div className="public-card">
                <h3 className="font-semibold text-foreground mb-2">Every day you wait is another day of overwhelm.</h3>
                <p className="text-muted-foreground">
                  Another day of wondering what to eat, feeling guilty about what you did eat, 
                  and going to bed promising yourself tomorrow will be different. It doesn't have to be this hard.
                </p>
              </div>
              
              <div className="public-card">
                <h3 className="font-semibold text-foreground mb-2">Lock in $9/month forever.</h3>
                <p className="text-muted-foreground">
                  We're in beta, which means you get founding member pricing. When we raise our rates 
                  (and we will), your price stays the same. That's less than a single coffee shop visit 
                  for a month of daily guidance.
                </p>
              </div>
              
              <div className="public-card">
                <h3 className="font-semibold text-foreground mb-2">You have nothing to lose.</h3>
                <p className="text-muted-foreground">
                  Cancel anytime with one click. No contracts, no commitments, no awkward phone calls. 
                  If it's not for you, just leave. But what if it is?
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="section-spacing public-section-alt">
        <div className="container-custom">
          <div className="public-card-accent text-center py-12 md:py-16 max-w-3xl mx-auto">
            <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="heading-2 mb-4">Ready to Simplify?</h2>
            <p className="body-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Join Blessed Belly today and finally experience what it feels like to take care of 
              your body without losing your mind.
            </p>
            
            <Link to="/signup">
              <Button className="btn-primary text-lg px-10 py-6" size="lg" data-testid="cta-signup">
                Start for $9/month
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                Cancel anytime
              </span>
              <span>•</span>
              <span>No contracts</span>
              <span>•</span>
              <span>Instant access</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
