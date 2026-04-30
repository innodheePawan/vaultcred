'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

export default function ForceLogout() {
    useEffect(() => {
        // Destroy the session cookie and redirect to login page
        signOut({ callbackUrl: '/login?reason=account_disabled' });
    }, []);

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="text-gray-500 font-medium">Session invalidated. Logging you out securely...</p>
            </div>
        </div>
    );
}
