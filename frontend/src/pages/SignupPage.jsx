import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogoWithText } from '../components/Logo';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      await register(name, email, password);
      toast.success('Account created! Welcome to Blessed Belly.');
      navigate('/pricing');
    } catch (error) {
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2" data-testid="signup-page">
      {/* Left Side - Image & Quote */}
      <div className="hidden lg:flex relative auth-image-panel items-center justify-center p-12">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"
            alt="Woman in peaceful yoga pose"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 auth-image-overlay" />
        </div>
        
        <div className="relative z-10 max-w-md">
          <div className="public-card">
            <p className="text-lg italic text-foreground leading-relaxed mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              "I praise you because I am fearfully and wonderfully made; your works are wonderful, I know that full well."
            </p>
            <p className="text-sm text-primary font-medium">— Psalm 139:14</p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex items-center justify-center p-8 lg:p-12 auth-form-panel">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="inline-block mb-12">
            <LogoWithText size="large" variant="dark" />
          </Link>

          {/* Welcome Text */}
          <div className="mb-8">
            <h1 className="heading-2 mb-2">Begin Your Journey</h1>
            <p className="body text-muted-foreground">
              Create your account to start simplifying your health
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="auth-input"
                required
                data-testid="name-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                required
                data-testid="email-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                required
                minLength={6}
                data-testid="password-input"
              />
              <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
            </div>

            <Button 
              type="submit" 
              className="btn-primary w-full py-6 text-base"
              disabled={loading}
              data-testid="signup-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-6">
            By signing up, you agree to honor your body as God's temple.
          </p>

          {/* Login Link */}
          <p className="text-center mt-6 text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
