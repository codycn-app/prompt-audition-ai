import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

export function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>('dark');

  const setTheme = useCallback((newTheme: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(newTheme);
    localStorage.setItem('theme', newTheme);
    setThemeState(newTheme);
  }, []);
  
  useEffect(() => {
    // Luôn áp dụng class 'dark' khi component mount
    const root = window.document.documentElement;
    if (!root.classList.contains('dark')) {
        root.classList.add('dark');
    }
  }, []);

  return [theme, setTheme];
}