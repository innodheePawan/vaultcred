'use client';

import React, { useState } from 'react';
import { Shield, ListTree, Info } from 'lucide-react';

export default function TabSwitcher({
    ipBlockTable,
    loginActivityTable
}: {
    ipBlockTable: React.ReactNode;
    loginActivityTable: React.ReactNode;
}) {
    const [activeTab, setActiveTab] = useState<'ip-blocks' | 'login-activity'>('ip-blocks');

    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('ip-blocks')}
                        className={`
                            whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center gap-2
                            transition-all duration-200 active:scale-95
                            ${activeTab === 'ip-blocks'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
                        `}
                    >
                        <Shield className="w-4 h-4 pointer-events-none" />
                        IP Security Blocks
                    </button>
                    <button
                        onClick={() => setActiveTab('login-activity')}
                        className={`
                            whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center gap-2
                            transition-all duration-200 active:scale-95
                            ${activeTab === 'login-activity'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
                        `}
                    >
                        <ListTree className="w-4 h-4 pointer-events-none" />
                        Login Activity Logs
                    </button>
                </nav>
            </div>

            {activeTab === 'ip-blocks' ? (
                <div className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3 text-sm text-blue-700 dark:text-blue-300">
                        <Info className="w-5 h-5 flex-shrink-0" />
                        <div className="space-y-1">
                            <p className="font-semibold text-xs uppercase tracking-wider opacity-70">IP Block Policy</p>
                            <ul className="list-disc list-inside space-y-1 opacity-90 text-[11px]">
                                <li>IP addresses are automáticamente blocked for 4 hours after 20 failed attempts in 30 minutes.</li>
                                <li>Repeat offenders (2+ blocks in 24h) are blocked for 24 hours.</li>
                                <li>Extreme offenders (5+ blocks in 4 days) are permanently blacklisted.</li>
                            </ul>
                        </div>
                    </div>
                    {ipBlockTable}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3 text-sm text-blue-700 dark:text-blue-300">
                        <Info className="w-5 h-5 flex-shrink-0" />
                        <div className="space-y-1">
                            <p className="font-semibold text-xs uppercase tracking-wider opacity-70">Login Auditing Information</p>
                            <p className="opacity-90 text-[11px]">
                                This console tracks all authentication attempts. Successful logins are automatically moved to cold storage after 7 days to maintain performance.
                                Failures and blocks are kept for immediate security review.
                            </p>
                        </div>
                    </div>
                    {loginActivityTable}
                </div>
            )}
        </div>
    );
}
