import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../components/ui/dropdown-menu';
import { Menu, X, User, LogOut, LayoutDashboard, BookOpen, Settings } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, hasSubscription, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="nav-blur sticky top-0 z-50" data-testid="navbar">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2"
            data-testid="navbar-logo"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-semibold text-sm">BB</span>
            </div>
            <span className="text-xl font-medium" style={{ fontFamily: 'Playfair Display, serif' }}>
              Blessed Belly
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link 
              to="/" 
              className={`btn-ghost ${isActive('/') ? 'bg-muted' : ''}`}
              data-testid="nav-home"
            >
              Home
            </Link>
            <Link 
              to="/pricing" 
              className={`btn-ghost ${isActive('/pricing') ? 'bg-muted' : ''}`}
              data-testid="nav-pricing"
            >
              Pricing
            </Link>
            
            {isAuthenticated && hasSubscription && (
              <>
                <Link 
                  to="/dashboard" 
                  className={`btn-ghost ${isActive('/dashboard') ? 'bg-muted' : ''}`}
                  data-testid="nav-dashboard"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/triggers" 
                  className={`btn-ghost ${isActive('/triggers') ? 'bg-muted' : ''}`}
                  data-testid="nav-triggers"
                >
                  Triggers
                </Link>
              </>
            )}
            
            {isAdmin && (
              <Link 
                to="/admin" 
                className={`btn-ghost ${isActive('/admin') ? 'bg-muted' : ''}`}
                data-testid="nav-admin"
              >
                Admin
              </Link>
            )}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2"
                    data-testid="user-menu-trigger"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {user?.picture ? (
                        <img 
                          src={user.picture} 
                          alt={user.name} 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{user?.name?.split(' ')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {hasSubscription && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/triggers')}>
                        <BookOpen className="w-4 h-4 mr-2" />
                        Trigger Library
                      </DropdownMenuItem>
                    </>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Settings className="w-4 h-4 mr-2" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    data-testid="logout-btn"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" data-testid="login-btn">
                    Log in
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="btn-primary" data-testid="signup-btn">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border" data-testid="mobile-menu">
            <div className="flex flex-col gap-2">
              <Link 
                to="/" 
                className="px-4 py-2 hover:bg-muted rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/pricing" 
                className="px-4 py-2 hover:bg-muted rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              
              {isAuthenticated && hasSubscription && (
                <>
                  <Link 
                    to="/dashboard" 
                    className="px-4 py-2 hover:bg-muted rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/triggers" 
                    className="px-4 py-2 hover:bg-muted rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Trigger Library
                  </Link>
                </>
              )}
              
              {isAdmin && (
                <Link 
                  to="/admin" 
                  className="px-4 py-2 hover:bg-muted rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              )}
              
              <div className="border-t border-border my-2" />
              
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-4 py-2 text-left hover:bg-muted rounded-lg text-destructive"
                >
                  Log out
                </button>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="px-4 py-2 hover:bg-muted rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link 
                    to="/signup" 
                    className="px-4 py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button className="btn-primary w-full">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
