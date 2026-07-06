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
