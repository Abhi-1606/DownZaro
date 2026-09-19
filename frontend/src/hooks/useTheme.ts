import { useState, useEffect } from 'react';
import { ThemeMode } from '../utils/types';

const THEME_KEY = 'downzaro_theme_preference';

export const useTheme = () => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY) as ThemeMode;
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored;
      }
    } catch {
      // In-memory fallback if localStorage is blocked
    }
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const updateTheme = () => {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      let targetTheme: 'light' | 'dark' = 'dark';

      if (themeMode === 'system') {
        targetTheme = systemPrefersDark ? 'dark' : 'light';
      } else {
        targetTheme = themeMode;
      }

      setResolvedTheme(targetTheme);

      if (targetTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
    };

    updateTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (themeMode === 'system') {
        updateTheme();
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem(THEME_KEY, mode);
    } catch {
      // Fallback silently if storage unavailable
    }
  };

  return {
    themeMode,
    resolvedTheme,
    setThemeMode,
  };
};
