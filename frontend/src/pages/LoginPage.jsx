import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2" data-testid="login-page">
      {/* Left Side - Image & Quote */}
      <div className="hidden lg:flex relative bg-muted/30 items-center justify-center p-12">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1611570172695-ae1a64ee13bf?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"
            alt="Woman walking peacefully in nature"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/10" />
        </div>
        
        <div className="relative z-10 max-w-md">
          <div className="card-custom bg-white/90 backdrop-blur-sm">
            <p className="text-lg italic text-foreground leading-relaxed mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              "Come to me, all you who are weary and burdened, and I will give you rest. Take my yoke upon you and learn from me, for I am gentle and humble in heart."
            </p>
            <p className="text-sm text-primary font-medium">— Matthew 11:28-29</p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-semibold text-lg">BB</span>
            </div>
            <span className="text-2xl font-medium" style={{ fontFamily: 'Playfair Display, serif' }}>
              Blessed Belly
            </span>
          </Link>

          {/* Welcome Text */}
          <div className="mb-8">
            <h1 className="heading-2 mb-2">Welcome Back</h1>
            <p className="body text-muted-foreground">
              Continue your journey to simplified health
            </p>
          </div>

          {/* Google Login - Primary Option */}
          <Button 
            type="button"
            variant="outline" 
            className="w-full py-6 mb-6 rounded-xl border-2 border-border hover:border-primary/30 hover:bg-muted/50"
            onClick={handleGoogleLogin}
            data-testid="google-login-btn"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground tracking-wider">or with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-custom py-6 text-base"
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
                className="input-custom py-6 text-base"
                required
                data-testid="password-input"
              />
            </div>

            <Button 
              type="submit" 
              className="btn-primary w-full py-6 text-base"
              disabled={loading}
              data-testid="login-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Sign Up Link */}
          <p className="text-center mt-8 text-muted-foreground">
            New here?{' '}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Begin your journey
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
