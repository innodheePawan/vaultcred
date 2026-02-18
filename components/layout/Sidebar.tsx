"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronRight, LayoutDashboard, Key, Users, Settings, Shield, FileText, Lock, Terminal, Folder } from 'lucide-react';
import { clsx } from 'clsx';
import { useSession } from 'next-auth/react';
import { useLayout } from './LayoutContext';

type MenuItem = {
    title: string;
    href?: string;
    icon?: React.ReactNode;
    children?: MenuItem[];
    param?: string; // Add param field to track type
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
            { title: 'Passwords', href: '/credentials?type=PASSWORD', param: 'PASSWORD' },
            { title: 'API Keys', href: '/credentials?type=API_OAUTH', param: 'API_OAUTH' },
            { title: 'Certificates', href: '/credentials?type=KEY_CERT', param: 'KEY_CERT' },
            { title: 'Tokens', href: '/credentials?type=TOKEN', param: 'TOKEN' },
            { title: 'Secure Notes', href: '/credentials?type=SECURE_NOTE', param: 'SECURE_NOTE' },
            { title: 'Files', href: '/credentials?type=FILE', param: 'FILE' },
        ],
    },
    {
        title: 'Admin',
        icon: <Shield className="w-5 h-5" />,
        children: [
            { title: 'Users & Groups', href: '/admin/users' },
            { title: 'Audit Logs', href: '/admin/audit' },
            { title: 'Security Events', href: '/admin/security-events' },
            { title: 'Bulk Import', href: '/credentials/bulk-import' },
        ],
    },
    {
        title: 'Settings',
        href: '/settings',
        icon: <Settings className="w-5 h-5" />,
    },
];

export function Sidebar({ className, role: initialRole, showSettings, showAdminMenu }: { className?: string; role?: string; showSettings?: boolean; showAdminMenu?: boolean }) {
    const [expandedItems, setExpandedItems] = useState<string[]>(['Credentials', 'Admin']);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentType = searchParams.get('type');
    const { data: session } = useSession();
    const { isCollapsed } = useLayout();

    // Use server-passed role (immediate) or client-side session role (fallback/update)
    const userRole = initialRole || session?.user?.role;
    const isExternal = (session?.user as any)?.isExternal ?? false;

    const filteredItems = MENU_ITEMS.filter(item => {
        // If external, ONLY show Credentials
        if (isExternal) {
            return item.title === 'Credentials';
        }

        if (item.title === 'Admin') {
            // Show if explicit prop is true OR if session role is ADMIN (fallback)
            return showAdminMenu || (userRole === 'ADMIN');
        }
        if (item.title === 'Settings') {
            // Show if explicit prop is true OR if session role is ADMIN (fallback)
            return showSettings || (userRole === 'ADMIN');
        }
        return true;
    });

    const toggleExpand = (title: string) => {
        if (isCollapsed) return; // Don't allow expanding when collapsed
        setExpandedItems((prev) =>
            prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
        );
    };

    const isActive = (item: MenuItem) => {
        if (item.href === pathname) {
            // If it's the exact path match (e.g. /dashboard)
            // But for credentials, we need to check params too
            if (pathname === '/credentials') {
                if (item.param) {
                    return currentType === item.param;
                } else {
                    return !currentType; // "All Credentials" matches only when no type param
                }
            }
            return true;
        }
        // Handle query param matches for full hrefs
        if (item.href?.includes('?')) {
            const [path, query] = item.href.split('?');
            const itemParams = new URLSearchParams(query);
            const itemType = itemParams.get('type');
            return pathname === path && currentType === itemType;
        }

        return false;
    };

    return (
        <aside className={clsx(
            "bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full z-30 relative transition-all duration-300",
            isCollapsed ? "w-20" : "w-64",
            className
        )}>
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-2">
                    {filteredItems.map((item) => (
                        <div key={item.title}>
                            {item.children ? (
                                <div>
                                    <button
                                        onClick={() => toggleExpand(item.title)}
                                        title={isCollapsed ? item.title : undefined}
                                        className={clsx(
                                            "w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors",
                                            isCollapsed && "justify-center"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={clsx("flex-shrink-0", isCollapsed && "mx-auto")}>
                                                {item.icon}
                                            </div>
                                            {!isCollapsed && <span>{item.title}</span>}
                                        </div>
                                        {!isCollapsed && (
                                            expandedItems.includes(item.title) ? (
                                                <ChevronDown className="w-4 h-4" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4" />
                                            )
                                        )}
                                    </button>
                                    {!isCollapsed && expandedItems.includes(item.title) && (
                                        <div className="mt-1 ml-9 space-y-1 border-l-2 border-gray-100 dark:border-gray-700 pl-2">
                                            {item.children.map((child) => {
                                                // Role-based visibility for specific child items
                                                if (child.title === 'Security Events' && userRole !== 'ADMIN') return null;

                                                return (
                                                    <Link
                                                        key={child.title}
                                                        href={child.href || '#'}
                                                        className={clsx(
                                                            "block px-3 py-2 text-sm rounded-md transition-colors",
                                                            isActive(child)
                                                                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 font-semibold"
                                                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200"
                                                        )}
                                                    >
                                                        {child.title}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    href={item.href || '#'}
                                    title={isCollapsed ? item.title : undefined}
                                    className={clsx(
                                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                        isActive(item)
                                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                            : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700",
                                        isCollapsed && "justify-center px-0"
                                    )}
                                >
                                    <div className={clsx("flex-shrink-0", isCollapsed && "mx-auto")}>
                                        {item.icon}
                                    </div>
                                    {!isCollapsed && <span>{item.title}</span>}
                                </Link>
                            )}
                        </div>
                    ))}
                </nav>
            </div>
        </aside>
    );
}
