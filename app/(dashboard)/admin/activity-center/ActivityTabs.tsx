'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Activity, ShieldCheck, GlobeLock, UserCheck } from 'lucide-react';
import SystemLogsTab from './Tabs/SystemLogsTab';
import LoginActivityTab from './Tabs/LoginActivityTab';
import IpSecurityTab from './Tabs/IpSecurityTab';
import ApiLogsTab from './Tabs/ApiLogsTab';

// Feature keys mapped to each tab
const ALL_TABS = [
  { id: 'system',    name: 'System Logs',       icon: Activity,    feature: 'ACTIVITY_SYSTEM_LOG' },
  { id: 'login',     name: 'Login Activity',     icon: UserCheck,   feature: 'ACTIVITY_LOGIN' },
  { id: 'ip_blocks', name: 'IP Security Blocks', icon: ShieldCheck, feature: 'ACTIVITY_IP_BLOCK' },
  { id: 'api_logs',  name: 'API Telemetry',      icon: GlobeLock,   feature: 'ACTIVITY_API_LOG' },
] as const;

type TabId = typeof ALL_TABS[number]['id'];

interface Props {
  // Resolved server-side — avoids client Prisma calls and hydration race conditions
  featurePermissions: Record<string, string>;
}

export function ActivityTabs({ featurePermissions }: Props) {
  const { status } = useSession();
  const [activeTab, setActiveTab] = useState<TabId>('system');

  // isAuthReady prevents false NO_ACCESS flash before session hydrates
  const isAuthReady = status !== 'loading';

  // Filter tabs using server-resolved permissions
  // VIEW, VIEW_MASKED, ALL, ALL_SCOPED all grant tab visibility (anything except NO_ACCESS)
  const visibleTabs = isAuthReady
    ? ALL_TABS.filter((tab) => {
        const perm = featurePermissions[tab.feature];
        return perm && perm !== 'NO_ACCESS';
      })
    : [];

  // Reset to first available tab if current tab becomes invisible
  useEffect(() => {
    if (isAuthReady && visibleTabs.length > 0 && !visibleTabs.find((t) => t.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [isAuthReady, visibleTabs, activeTab]);

  // Skeleton while session loads — never evaluate permissions during loading
  if (!isAuthReady) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400 animate-pulse">
        Loading module permissions...
      </div>
    );
  }

  if (visibleTabs.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        You do not have access to any Activity Center modules.
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                  ${
                    isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
                  }
                `}
              >
                <Icon
                  className={`
                    -ml-0.5 mr-2 h-5 w-5 transition-colors duration-200
                    ${isActive ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400'}
                  `}
                  aria-hidden="true"
                />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-md relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />

        <div className="relative z-10 w-full overflow-x-auto min-h-[400px]">
          {activeTab === 'system'    && <SystemLogsTab />}
          {activeTab === 'login'     && <LoginActivityTab />}
          {activeTab === 'ip_blocks' && <IpSecurityTab />}
          {activeTab === 'api_logs'  && <ApiLogsTab />}
        </div>
      </div>
    </div>
  );
}
