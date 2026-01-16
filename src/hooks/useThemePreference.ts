import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type ThemePreference = 'light' | 'dark' | 'system';

export const useThemePreference = () => {
  const { user, profile } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemePreference | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let shouldBeDark = false;
    
    if (savedTheme === 'dark') {
      shouldBeDark = true;
    } else if (savedTheme === 'light') {
      shouldBeDark = false;
    } else {
      // System preference or no saved theme
      shouldBeDark = prefersDark;
    }
    
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
    setIsLoading(false);
  }, []);

  // Sync with profile theme_preference when user logs in
  useEffect(() => {
    if (!user || !profile) return;

    const themeFromDB = (profile as { theme_preference?: ThemePreference }).theme_preference;
    
    if (themeFromDB && themeFromDB !== 'system') {
      const shouldBeDark = themeFromDB === 'dark';
      setIsDark(shouldBeDark);
      document.documentElement.classList.toggle('dark', shouldBeDark);
      localStorage.setItem('theme', themeFromDB);
    }
  }, [user, profile]);

  // Update theme preference in database
  const updateThemePreference = useCallback(async (isDarkMode: boolean) => {
    const newTheme: ThemePreference = isDarkMode ? 'dark' : 'light';
    
    // Update localStorage immediately
    localStorage.setItem('theme', newTheme);
    setIsDark(isDarkMode);
    document.documentElement.classList.toggle('dark', isDarkMode);

    // Update database if user is logged in
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ theme_preference: newTheme } as Record<string, unknown>)
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error updating theme preference:', error);
      }
    }
  }, [user]);

  const toggleTheme = useCallback(() => {
    updateThemePreference(!isDark);
  }, [isDark, updateThemePreference]);

  return {
    isDark,
    isLoading,
    toggleTheme,
    updateThemePreference,
  };
};
