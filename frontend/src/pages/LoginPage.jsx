import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogoWithText } from '../components/Logo';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
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

  return (
    <div className="min-h-screen grid lg:grid-cols-2" data-testid="login-page">
      {/* Left Side - Image & Quote */}
      <div className="hidden lg:flex relative auth-image-panel items-center justify-center p-12">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1558086478-d632ccc5a833?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"
            alt="Woman enjoying peaceful morning with coffee"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 auth-image-overlay" />
        </div>
        
        <div className="relative z-10 max-w-md">
          <div className="public-card">
            <p className="text-lg italic text-foreground leading-relaxed mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              "Come to me, all you who are weary and burdened, and I will give you rest. Take my yoke upon you and learn from me, for I am gentle and humble in heart."
            </p>
            <p className="text-sm text-primary font-medium">— Matthew 11:28-29</p>
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
            <h1 className="heading-2 mb-2">Welcome Back</h1>
            <p className="body text-muted-foreground">
              Continue your journey to simplified health
            </p>
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
