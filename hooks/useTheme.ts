import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

// This custom hook manages the application's theme.
// It persists the theme to localStorage and applies the correct CSS class to the root HTML element.
export function useTheme(): [Theme, (theme: Theme) => void] {
  // Initialize state by reading from localStorage.
  // This function is only executed on the initial render.
  const [theme, setTheme] = useState<Theme>(() => {
    // Since this runs on the client, we can safely assume 'window' is available.
    try {
      const storedTheme = window.localStorage.getItem('theme');
      // Validate the stored value before using it.
      if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme;
      }
    } catch (error) {
      console.error('Failed to read theme from localStorage', error);
    }
    // Default to 'dark' if nothing is stored or if the stored value is invalid.
    return 'dark';
  });

  // This effect hook runs whenever the 'theme' state changes.
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Ensure only one theme class is present.
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    try {
      // Persist the new theme to localStorage.
      window.localStorage.setItem('theme', theme);
    } catch (error) {
      console.error('Failed to save theme to localStorage', error);
    }
  }, [theme]); // The effect re-runs only if the 'theme' state changes.

  return [theme, setTheme];
}
