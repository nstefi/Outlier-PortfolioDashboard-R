import React from 'react';
import { useTheme } from '../../lib/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { themeMode, toggleThemeMode } = useTheme();
  
  return (
    <button
      onClick={toggleThemeMode}
      className={`flex items-center space-x-2 px-3 py-2 rounded-md bg-white hover:bg-gray-50 border border-gray-200 shadow-sm transition-colors ${className}`}
      aria-label={themeMode === 'default' ? 'Switch to color-blind friendly mode' : 'Switch to default color mode'}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className={themeMode === 'default' ? 'text-gray-600' : 'text-blue-600'}
      >
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 3v1"></path>
        <path d="M12 20v1"></path>
        <path d="M3 12h1"></path>
        <path d="M20 12h1"></path>
        <path d="m18.364 5.636-.707.707"></path>
        <path d="m6.343 17.657-.707.707"></path>
        <path d="m5.636 5.636.707.707"></path>
        <path d="m17.657 17.657.707.707"></path>
      </svg>
      
      <span>
        {themeMode === 'default' ? 'Color-blind mode' : 'Default colors'}
      </span>
    </button>
  );
};

export default ThemeToggle;