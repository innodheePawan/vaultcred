"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { clsx } from 'clsx';
import { useLayout } from './LayoutContext';
import { Menu } from 'lucide-react';

export function Header({ settings, user, publicView = false }: { settings?: any, user?: any, publicView?: boolean }) {
    const { data: session } = useSession();
    const router = useRouter();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Conditional hook usage or mock? useLayout throws if not in provider. 
    // We will ensure LayoutProvider is used in public layout too.
    const { isCollapsed, toggleSidebar } = useLayout();

    // Use passed user object (from DB) or session fallback
    const displayUser = user || session?.user;

    const userInitials = displayUser?.name
        ? displayUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
        : displayUser?.email?.substring(0, 2).toUpperCase() || 'U';

    const userName = displayUser?.name || 'User';
    const userEmail = displayUser?.email || '';

    const applicationName = settings?.applicationName || 'CRED Secure';
    const logoUrl = settings?.logoUrl;

    return (
        <header className="h-[60px] bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center z-40 relative">
            {/* Logo Section - Matches Sidebar Width (w-64/w-20), auto-fits any logo size */}
            <div className={clsx(
                "flex-shrink-0 h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 overflow-hidden transition-all duration-300",
                !publicView && isCollapsed ? "w-20" : "w-64"
            )}>
                <Link href={publicView ? "#" : "/dashboard"} className="flex items-center justify-center w-full h-full">
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt="Logo"
                            style={{ width: '100%', height: '100%', objectFit: (!publicView && isCollapsed) ? 'contain' : 'fill', display: 'block', padding: (!publicView && isCollapsed) ? '8px' : '0' }}
                        />
                    ) : (
                        <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                            {applicationName.substring(0, 1)}
                        </div>
                    )}
                </Link>
            </div>

            {/* Toggle & Application Name Section */}
            <div className={clsx(
                "flex-shrink-0 flex items-center justify-start h-full pl-4 gap-4 transition-all duration-300",
                !publicView && isCollapsed ? "w-48" : "w-64"
            )}>
                {!publicView && (
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Menu className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </button>
                )}
                {/* Show App Name if NOT collapsed OR if Public View (always show in public) */}
                {(publicView || !isCollapsed) && (
                    <span className="text-xl font-bold text-gray-900 dark:text-white truncate text-left">
                        {applicationName}
                    </span>
                )}
            </div>

            {/* Header Content */}
            <div className="flex-1 flex items-center justify-between px-6 h-full">

                {/* Global Search - Centered */}
                <div className="flex-1 flex max-w-2xl mx-auto">
                    {!publicView && (
                        <div className="w-full max-w-md relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-gray-50 dark:bg-gray-700 placeholder-gray-500 focus:outline-none text-black focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                                placeholder="Search users, credentials..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        router.push(`/credentials?q=${encodeURIComponent(e.currentTarget.value)}`);
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4 flex-shrink-0">
                    {!publicView && (
                        <>
                            <button className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                                <Bell className="h-5 w-5" />
                            </button>

                            {/* User Profile Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-2 focus:outline-none"
                                >
                                    <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium overflow-hidden">
                                        {displayUser?.profileImage ? (
                                            <img src={displayUser.profileImage} alt="Profile" className="h-full w-full object-cover" />
                                        ) : (
                                            userInitials
                                        )}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{userName}</span>
                                    <ChevronDown className={clsx("h-4 w-4 text-gray-400 transition-transform duration-200", isProfileOpen && "rotate-180")} />
                                </button>

                                {/* Dropdown Menu */}
                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in-95 duration-100">
                                        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-600">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Signed in as</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{userEmail}</p>
                                        </div>
                                        <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2">
                                            <User className="h-4 w-4" /> Profile
                                        </Link>
                                        {displayUser?.role !== 'EXTERNAL' && (
                                            <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2">
                                                <Settings className="h-4 w-4" /> Settings
                                            </Link>
                                        )}
                                        <button
                                            onClick={async () => {
                                                const { logUserLogout } = await import('@/lib/actions/login-activity');
                                                await logUserLogout();
                                                signOut({ callbackUrl: '/login' });
                                            }}
                                            className="w-full text-left block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                                        >
                                            <LogOut className="h-4 w-4" /> Sign out
                                        </button>

                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
