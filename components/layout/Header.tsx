"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Bell, User, LogOut, Settings } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { clsx } from 'clsx';

export function Header() {
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    return (
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center z-20">
            {/* Logo Section - Matches Sidebar Width (w-64) */}
            <div className="w-64 flex-shrink-0 h-full flex items-center px-6 border-r border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">V</div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">Vault<span className="text-blue-600">Secure</span></span>
                </div>
            </div>

            {/* Header Content */}
            <div className="flex-1 flex items-center justify-between px-6 h-full">
                {/* Global Search */}
                <div className="max-w-md w-full relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-gray-50 dark:bg-gray-700 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                        placeholder="Search users, credentials..."
                    />
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    <button className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                        <Bell className="h-5 w-5" />
                    </button>

                    {/* User Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-2 focus:outline-none"
                        >
                            <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium">
                                JD
                            </div>
                            <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-200">John Doe</span>
                            <User className="h-4 w-4 text-gray-400" />
                        </button>

                        {/* Dropdown Menu */}
                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in-95 duration-100">
                                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-600">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Signed in as</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">john.doe@company.com</p>
                                </div>
                                <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2">
                                    <User className="h-4 w-4" /> Profile
                                </Link>
                                <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2">
                                    <Settings className="h-4 w-4" /> Settings
                                </Link>
                                <button
                                    onClick={() => signOut({ callbackUrl: '/login' })}
                                    className="w-full text-left block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                                >
                                    <LogOut className="h-4 w-4" /> Sign out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
