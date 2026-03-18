import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
}

const STORAGE_KEY = 'survey-theme';

function getInitialTheme(): Theme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'dark') return 'dark';
  } catch { /* noop */ }
  return 'light';
}

function persist(theme: Theme) {
  try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* noop */ }
}

function syncDOM(theme: Theme) {
  const el = document.documentElement;
  el.classList.toggle('dark', theme === 'dark');
  el.setAttribute('data-theme', theme);
}

const initial = getInitialTheme();
syncDOM(initial);

export const useThemeStore = create<ThemeState>()((set, get) => ({
  theme: initial,
  toggle: () => {
    const next: Theme = get().theme === 'light' ? 'dark' : 'light';
    syncDOM(next);
    persist(next);
    set({ theme: next });
  },
}));
