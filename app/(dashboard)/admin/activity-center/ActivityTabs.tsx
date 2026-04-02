'use client';

import { useState } from 'react';
import { Activity, ShieldCheck, GlobeLock, UserCheck } from 'lucide-react';
import SystemLogsTab from './Tabs/SystemLogsTab';
import LoginActivityTab from './Tabs/LoginActivityTab';
import IpSecurityTab from './Tabs/IpSecurityTab';
import ApiLogsTab from './Tabs/ApiLogsTab';

export function ActivityTabs() {
  const [activeTab, setActiveTab] = useState('system');

  const tabs = [
    { id: 'system', name: 'System Logs', icon: Activity },
    { id: 'login', name: 'Login Activity', icon: UserCheck },
    { id: 'ip_blocks', name: 'IP Security Blocks', icon: ShieldCheck },
    { id: 'api_logs', name: 'API Telemetry', icon: GlobeLock },
  ];

  return (
    <div className="flex flex-col space-y-6">
      <div className="border-b border-gray-800">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
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
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                  }
                `}
              >
                <Icon
                  className={`
                    -ml-0.5 mr-2 h-5 w-5 transition-colors duration-200
                    ${isActive ? 'text-blue-500' : 'text-gray-500 group-hover:text-gray-400'}
                  `}
                  aria-hidden="true"
                />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="bg-[#111116] border border-gray-800 rounded-xl p-6 shadow-2xl relative overflow-hidden">
         {/* Subtle background glow */}
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
         
         <div className="relative z-10 w-full overflow-x-auto min-h-[400px]">
            {activeTab === 'system' && <SystemLogsTab />}
            {activeTab === 'login' && <LoginActivityTab />}
            {activeTab === 'ip_blocks' && <IpSecurityTab />}
            {activeTab === 'api_logs' && <ApiLogsTab />}
         </div>
      </div>
    </div>
  );
}
