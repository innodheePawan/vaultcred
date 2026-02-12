'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building, Mail, ShieldCheck, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
    { name: 'General', href: '/settings/general', icon: Building },
    { name: 'Email (SMTP)', href: '/settings/email', icon: Mail },
    { name: 'Security', href: '/settings/security', icon: ShieldCheck },
    { name: 'Database', href: '/settings/database', icon: Database },
];

export default function SettingsNav() {
    const pathname = usePathname();

    return (
        <nav className="flex space-x-4 border-b border-gray-200 dark:border-gray-700 mb-8 overflow-x-auto">
            {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                const Icon = tab.icon;
                return (
                    <Link
                        key={tab.name}
                        href={tab.href}
                        className={cn(
                            'group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                            isActive
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        )}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        <Icon
                            className={cn(
                                '-ml-0.5 mr-2 h-5 w-5',
                                isActive
                                    ? 'text-indigo-500 dark:text-indigo-400'
                                    : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500'
                            )}
                            aria-hidden="true"
                        />
                        <span>{tab.name}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
