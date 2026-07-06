import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'PLATFORM_ADMIN' | 'CITY_ADMIN' | 'OPERATOR' | 'Clerk' | 'Superintendent' | 'Officer' | 'Admin';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: Role;
  cityId: string | null;
  officeId: string | null;
  departmentId: string | null;
  citySlug: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  _hasHydrated: boolean;

  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  setHasHydrated: (val: boolean) => void;
}

// ─── Cookie storage adapter ───────────────────────────────────────────────────
// Next.js App Router has severe hydration race conditions with localStorage.
// We MUST use cookies so the auth state survives page refreshes reliably.
// ─────────────────────────────────────────────────────────────────────────────
import { createJSONStorage } from 'zustand/middleware';

const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

const cookieStorage = createJSONStorage(() => ({
  getItem: (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)')
    );
    return match ? decodeURIComponent(match[1]) : null;
  },
  setItem: (name: string, value: string): void => {
    if (typeof document === 'undefined') return;
    const isSecure = typeof location !== 'undefined' && location.protocol === 'https:';
    document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`;
  },
  removeItem: (name: string): void => {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; Max-Age=0; Path=/`;
  },
}));

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      _hasHydrated: false,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),

      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null }),

      updateTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setHasHydrated: (val) =>
        set({ _hasHydrated: val }),
    }),
    {
      name: 'etapalwala-auth',
      storage: cookieStorage,
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
