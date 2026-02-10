import React from 'react';

export const Logo = ({ size = 'default', variant = 'dark' }) => {
  const sizes = {
    small: { container: 'w-8 h-8', icon: 24 },
    default: { container: 'w-10 h-10', icon: 28 },
    large: { container: 'w-12 h-12', icon: 32 }
  };

  const variants = {
    dark: { bg: 'bg-primary', stroke: '#FFFFFF' },
    light: { bg: 'bg-white/90', stroke: '#5A7D69' },
    transparent: { bg: 'bg-white/20', stroke: '#FFFFFF' }
  };

  const { container, icon } = sizes[size] || sizes.default;
  const { bg, stroke } = variants[variant] || variants.dark;

  return (
    <div className={`${container} ${bg} rounded-full flex items-center justify-center shadow-sm`}>
      <svg 
        width={icon} 
        height={icon} 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Cross */}
        <path 
          d="M16 6V26M10 12H22" 
          stroke={stroke} 
          strokeWidth="2.5" 
          strokeLinecap="round"
        />
        {/* Leaf wrapping around */}
        <path 
          d="M22 18C22 18 24 20 24 23C24 25 22 27 19 27C17 27 16 26 16 26" 
          stroke={stroke} 
          strokeWidth="1.5" 
          strokeLinecap="round"
          opacity="0.9"
        />
        {/* Small leaf accent */}
        <path 
          d="M19 22C20 21 21 21.5 21 23C21 24 20 24.5 19 24" 
          stroke={stroke} 
          strokeWidth="1" 
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
    </div>
  );
};

export const LogoWithText = ({ size = 'default', variant = 'dark', textClass = '' }) => {
  const textSizes = {
    small: 'text-lg',
    default: 'text-xl',
    large: 'text-2xl'
  };

  const textColors = {
    dark: 'text-foreground',
    light: 'text-foreground',
    transparent: 'text-white'
  };

  return (
    <div className="flex items-center gap-3">
      <Logo size={size} variant={variant} />
      <span 
        className={`${textSizes[size]} font-medium ${textColors[variant]} ${textClass}`}
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        Blessed Belly
      </span>
    </div>
  );
};

export default Logo;
