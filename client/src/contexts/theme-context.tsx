import { createContext, useContext, useEffect, useState } from "react";

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(true);

  // Get theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('dukafiti-theme') as Theme | null;
    const initialTheme = savedTheme || 'light';
    setThemeState(initialTheme);
    applyThemeToDocument(initialTheme);
    setIsLoading(false);
  }, []);

  // Apply theme to document
  const applyThemeToDocument = (themeToApply: Theme) => {
    const html = document.documentElement;
    if (themeToApply === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  };

  // Update theme with localStorage persistence
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('dukafiti-theme', newTheme);
    applyThemeToDocument(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}