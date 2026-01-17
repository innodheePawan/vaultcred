"use client";

import React from 'react';

export function Footer() {
    return (
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 px-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>&copy; {new Date().getFullYear()} OmniVault Inc. All rights reserved.</p>
        </footer>
    );
}
