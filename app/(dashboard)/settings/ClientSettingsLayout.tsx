'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import SettingsNav from '@/components/admin/settings/SettingsNav';

interface ClientSettingsLayoutProps {
  children: React.ReactNode;
  role?: string;
}

export default function ClientSettingsLayout({ children, role }: ClientSettingsLayoutProps) {
  const pathname = usePathname();
  const isSyncRoute = pathname.startsWith('/settings/sync-targets');

  if (isSyncRoute) {
    return <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">{children}</div>;
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-10rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl mx-auto space-y-8">
        <div className="text-left">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">System Settings</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage global configuration, email services, and security policies.
          </p>
        </div>

        <SettingsNav role={role} />

        <div className="mt-6">
          {children}
        </div>
      </div>
    </div>
  );
}
