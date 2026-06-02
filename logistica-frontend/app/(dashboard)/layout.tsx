'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-auto bg-neutral-50">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
