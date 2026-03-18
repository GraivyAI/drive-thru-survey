import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LocationInfo {
  id: string;
  name: string;
  code: string;
}

interface LaneInfo {
  id: string;
  shortCode: string;
  name: string | null;
}

interface AuthState {
  token: string | null;
  location: LocationInfo | null;
  lane: LaneInfo | null;
  isAuthenticated: boolean;
  login: (token: string, location: LocationInfo, lane: LaneInfo) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      location: null,
      lane: null,
      isAuthenticated: false,
      login: (token, location, lane) =>
        set({ token, location, lane, isAuthenticated: true }),
      logout: () =>
        set({ token: null, location: null, lane: null, isAuthenticated: false }),
    }),
    { name: 'survey-auth' },
  ),
);
