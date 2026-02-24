import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'soft-modern' | 'midnight' | 'ocean';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  root.classList.remove('light', 'dark', 'soft-modern', 'midnight', 'ocean');

  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'soft-modern') {
    root.classList.add('soft-modern');
  } else if (theme === 'midnight') {
    root.classList.add('dark', 'midnight');
  } else if (theme === 'ocean') {
    root.classList.add('dark', 'ocean');
  } else {
    root.classList.add('light');
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'ocean',

      toggleTheme: () => {
        const currentTheme = get().theme;
        const themeOrder: Theme[] = ['ocean', 'midnight', 'light'];
        const currentIndex = themeOrder.indexOf(currentTheme);
        const newTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
        applyTheme(newTheme);
        set({ theme: newTheme });
      },

      setTheme: (theme: Theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme);
        }
      },
    }
  )
);
