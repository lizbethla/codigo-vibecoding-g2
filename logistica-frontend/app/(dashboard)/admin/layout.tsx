'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  useEffect(() => {
    if (isAuthenticated && !isSuperAdmin) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isSuperAdmin, router]);

  if (!isSuperAdmin) return null;

  return <>{children}</>;
}
