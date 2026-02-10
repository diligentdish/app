import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, BookOpen, User, LogOut, ChevronRight } from 'lucide-react';

export const MemberLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/triggers', label: 'Trigger Library', icon: BookOpen },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen flex member-bg">
      {/* Cross silhouette - faith element */}
      <div className="cross-silhouette" style={{
        position: 'fixed',
        right: '10%',
        top: '28%',
        width: '70px',
        height: '110px',
        background: 'linear-gradient(180deg, rgba(90, 125, 105, 0.1) 0%, rgba(90, 125, 105, 0.04) 100%)',
        clipPath: 'polygon(40% 0%, 60% 0%, 60% 35%, 100% 35%, 100% 50%, 60% 50%, 60% 100%, 40% 100%, 40% 50%, 0% 50%, 0% 35%, 40% 35%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col member-sidebar" data-testid="member-sidebar">
        {/* Logo */}
        <div className="p-6">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
              <span className="text-primary font-bold text-lg">✝</span>
            </div>
            <span className="text-xl font-medium text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
              Blessed Belly
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <Icon className="w-5 h-5" strokeWidth={1.5} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            data-testid="logout-btn"
          >
            <LogOut className="w-5 h-5" strokeWidth={1.5} />
            <span className="font-medium">Log Out</span>
          </button>
        </div>

        {/* Decorative leaves */}
        <div className="absolute bottom-0 left-0 w-full h-32 pointer-events-none overflow-hidden opacity-30">
          <svg viewBox="0 0 200 100" className="w-full h-full">
            <path d="M20 100 Q30 70 50 80 Q40 60 60 50 Q50 30 70 40" fill="none" stroke="white" strokeWidth="1"/>
            <path d="M40 100 Q50 80 70 85 Q60 65 80 60" fill="none" stroke="white" strokeWidth="1"/>
          </svg>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 member-sidebar py-4 px-4">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
              <span className="text-primary font-bold">✝</span>
            </div>
            <span className="text-lg font-medium text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
              Blessed Belly
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}`}
                >
                  <Icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                </Link>
              );
            })}
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-white/10">
              <LogOut className="w-5 h-5 text-white" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-0 mt-16 md:mt-0">
        <div className="member-content-area min-h-screen p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MemberLayout;
