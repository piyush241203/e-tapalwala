'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { PageLoader } from '@/components/ui/Spinner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, accessToken, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // ─── CRITICAL: Do NOT make any auth decisions until Zustand has
    // finished hydrating from localStorage. Without this guard, the
    // layout runs with user=null on first render and immediately
    // pushes to /login even for logged-in users.
    if (!_hasHydrated) return;

    if (!accessToken || !user) {
      if (pathname.startsWith('/super-admin') || pathname.startsWith('/admin')) {
        router.replace('/admin/platform-login');
      } else {
        router.replace('/login');
      }
      return;
    }

    const isAdminPath = pathname.startsWith('/super-admin') || pathname.startsWith('/admin');

    // Legacy SUPER_ADMIN role cleanup
    if ((user as any).role === 'SUPER_ADMIN') {
      useAuthStore.getState().clearAuth();
      router.replace('/admin/platform-login');
      return;
    }

    if (isAdminPath && user.role !== 'PLATFORM_ADMIN') {
      router.replace('/login');
      return;
    }

    if (!isAdminPath && user.role !== 'PLATFORM_ADMIN') {
      const pathParts = pathname.split('/').filter(Boolean);
      const urlCitySlug = pathParts[0];

      // Prevent city slug mismatch (user accessing another city's URL)
      if (urlCitySlug && user.citySlug && urlCitySlug !== user.citySlug) {
        router.replace(`/${user.citySlug}/dashboard`);
        return;
      }

      const isOperatorPath = pathParts.length > 1 && pathParts[1] === 'operator';

      const isCityAdmin = user.role === 'CITY_ADMIN' || user.role === 'Admin';
      const isOperator = user.role === 'OPERATOR' || user.role === 'Clerk' || user.role === 'Superintendent' || user.role === 'Officer';

      if (isCityAdmin && isOperatorPath) {
        router.replace(`/${user.citySlug}/dashboard`);
        return;
      }

      if (isOperator && !isOperatorPath) {
        router.replace(`/${user.citySlug}/operator/dashboard`);
        return;
      }
    }
  }, [_hasHydrated, accessToken, user, router, pathname]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // ─── Show loader while Zustand is still reading from localStorage ───
  // This replaces the old `if (!user) return <PageLoader />` which would
  // sometimes flash and then redirect even for authenticated users.
  if (!_hasHydrated) {
    return <PageLoader />;
  }

  // After hydration: if no user, show loader while redirect is in-flight
  if (!user || !accessToken) {
    return <PageLoader />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
