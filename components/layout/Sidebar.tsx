"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, LayoutDashboard, Key, Users, Settings, Shield, FileText } from 'lucide-react';
import { clsx } from 'clsx';

type MenuItem = {
    title: string;
    href?: string;
    icon?: React.ReactNode;
    children?: MenuItem[];
};

const MENU_ITEMS: MenuItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
        title: 'Credentials',
        icon: <Key className="w-5 h-5" />,
        children: [
            { title: 'All Credentials', href: '/credentials' },
            { title: 'Passwords', href: '/credentials/passwords' },
            { title: 'API Keys', href: '/credentials/api-keys' },
            { title: 'Certificates', href: '/credentials/certificates' },
        ],
    },
    {
        title: 'Admin',
        icon: <Shield className="w-5 h-5" />,
        children: [
            { title: 'Users & Roles', href: '/admin/users' },
            { title: 'Invite Users', href: '/admin/invites' },
            { title: 'Audit Logs', href: '/admin/audit' },
        ],
    },
    {
        title: 'Settings',
        href: '/settings',
        icon: <Settings className="w-5 h-5" />,
    },
];

import { useSession } from 'next-auth/react';

// ...

export function Sidebar({ className }: { className?: string }) {
    const [expandedItems, setExpandedItems] = useState<string[]>(['Credentials', 'Admin']);
    const pathname = usePathname();
    const { data: session } = useSession();

    const filteredItems = MENU_ITEMS.filter(item => {
        if (item.title === 'Admin') {
            return session?.user?.role === 'ADMIN';
        }
        return true;
    });

    const toggleExpand = (title: string) => {
        setExpandedItems((prev) =>
            prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
        );
    };

    return (
        <aside className={clsx("w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full", className)}>
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-2">
                    {filteredItems.map((item) => (
                        <div key={item.title}>
                            {item.children ? (
                                <div>
                                    <button
                                        onClick={() => toggleExpand(item.title)}
                                        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            {item.icon}
                                            <span>{item.title}</span>
                                        </div>
                                        {expandedItems.includes(item.title) ? (
                                            <ChevronDown className="w-4 h-4" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4" />
                                        )}
                                    </button>
                                    {expandedItems.includes(item.title) && (
                                        <div className="mt-1 ml-9 space-y-1 border-l-2 border-gray-100 dark:border-gray-700 pl-2">
                                            {item.children.map((child) => (
                                                <Link
                                                    key={child.title}
                                                    href={child.href || '#'}
                                                    className={clsx(
                                                        "block px-3 py-2 text-sm rounded-md transition-colors",
                                                        pathname === child.href
                                                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 font-semibold"
                                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200"
                                                    )}
                                                >
                                                    {child.title}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    href={item.href || '#'}
                                    className={clsx(
                                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                        pathname === item.href
                                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                            : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    )}
                                >
                                    {item.icon}
                                    <span>{item.title}</span>
                                </Link>
                            )}
                        </div>
                    ))}
                </nav>
            </div>
        </aside>
    );
}
