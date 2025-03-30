import React, { createContext, useContext, ReactNode } from 'react';

// Define theme types - we no longer need to toggle, but keeping the structure for compatibility
export type ThemeMode = 'colorBlind';

// Define color palettes - only using the colorBlind palette now
export const colorPalettes = {
  colorBlind: {
    // Color-blind friendly palette (based on research for deuteranopia, protanopia, and tritanopia)
    positive: '#22C55E', // Green
    negative: '#D55E00', // Vermillion/Orange
    neutral: '#0072B2', // Blue
    primary: '#0072B2', // Blue
    secondary: '#CC79A7', // Reddish purple

    // Chart colors (colorblind-friendly palette)
    chartColors: [
      '#22C55E', // Green
      '#0072B2', // Blue
      '#D55E00', // Vermillion/Orange
      '#CC79A7', // Reddish purple
      '#F0E442', // Yellow (higher contrast)
      '#56B4E9', // Sky blue
      '#E69F00', // Orange
      '#000000', // Black
    ],

    // Specific financial indicators
    increase: '#22C55E', // Green
    decrease: '#D55E00', // Vermillion/Orange
    volume: '#CC79A7', // Reddish purple
    price: '#22C55E', // Green
    movingAverage: '#E69F00', // Orange
  }
};

// Define the context shape - keeping toggleThemeMode for compatibility but it won't do anything
interface ThemeContextType {
  themeMode: ThemeMode;
  toggleThemeMode: () => void;
  colors: typeof colorPalettes.colorBlind;
}

// Create the context with a default value - always using colorBlind palette
const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'colorBlind',
  toggleThemeMode: () => {},
  colors: colorPalettes.colorBlind
});

// Create a hook for using the theme context
export const useTheme = () => useContext(ThemeContext);

// Create the provider component - simplified since we don't toggle anymore
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Always use colorBlind theme
  const themeMode: ThemeMode = 'colorBlind';

  // Get colors (always colorBlind)
  const colors = colorPalettes.colorBlind;

  // Empty toggle function for compatibility
  const toggleThemeMode = () => {
    // Does nothing now since we're always using colorBlind mode
    console.log('Using accessible colors by default');
  };

  // Set data attribute for any CSS that might use it
  document.documentElement.setAttribute('data-theme-mode', themeMode);

  return (
    <ThemeContext.Provider value={{ themeMode, toggleThemeMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};