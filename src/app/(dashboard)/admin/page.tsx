'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { PageLoader } from '@/components/ui/Spinner';

/**
 * Redirect root /admin → /admin/dashboard
 */
export default function AdminRootPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.role === 'PLATFORM_ADMIN') {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/admin/platform-login');
    }
  }, [user, router]);

  return <PageLoader />;
}
