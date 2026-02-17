'use client';

import { useEffect, useRef, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Clock, ShieldAlert } from 'lucide-react';

interface SessionTimeoutProps {
    timeoutMs?: number; // Default to 10 minutes (600000 ms)
}

export function SessionTimeout({ timeoutMs = 600000 }: SessionTimeoutProps) {
    const { data: session, status } = useSession();
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [timeLeft, setTimeLeft] = useState<number>(timeoutMs);

    // Determine effective timeout: 3 mins for setup/login/reconfig, 10 mins otherwise
    const isMfaLogin = pathname.startsWith('/login') && searchParams.get('mfa') === 'true';
    const isRestrictedRoute = pathname.startsWith('/setup-2fa') || isMfaLogin || pathname.includes('/reconfigure-2fa');

    const effectiveTimeout = isRestrictedRoute ? 180000 : timeoutMs;

    useEffect(() => {
        // Run if authenticated OR on restricted unauthenticated route (like MFA login phase)
        const canRun = status === 'authenticated' || (status === 'unauthenticated' && isRestrictedRoute);
        if (!canRun) return;

        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

        const resetTimer = (isInitial = false) => {
            // If it's a restricted route and NOT the initial load, don't reset the timer on activity
            // This ensures the 3-minute timeout is consolidated for the entire activity
            if (isRestrictedRoute && !isInitial) return;

            // Clear existing timeout
            if (timerRef.current) clearTimeout(timerRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);

            // Set the absolute logout timer
            timerRef.current = setTimeout(async () => {
                try {
                    // Only log if we have a session
                    if (status === 'authenticated') {
                        const { logUserLogout } = await import('@/lib/actions/login-activity');
                        await logUserLogout();
                    }
                } catch (e) {
                    console.error("Auto-logout log failed", e);
                } finally {
                    // For MFA login, returning to /login clears the mfa query and state
                    signOut({ callbackUrl: '/login' });
                }
            }, effectiveTimeout);

            // Initialize visual countdown
            setTimeLeft(effectiveTimeout);
            countdownRef.current = setInterval(() => {
                setTimeLeft((prev) => Math.max(0, prev - 1000));
            }, 1000);
        };

        // Initialize with isInitial = true
        resetTimer(true);

        // Add event listeners (these will call resetTimer with isInitial = false)
        events.forEach(event => {
            window.addEventListener(event, () => resetTimer(false));
        });

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
            events.forEach(event => {
                window.removeEventListener(event, () => resetTimer(false));
            });
        };
    }, [status, effectiveTimeout, isRestrictedRoute]);

    // Format time for UI (MM:SS)
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Only show the badge for the specific routes requested
    if (!isRestrictedRoute) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-2xl border backdrop-blur-md transition-colors duration-300 ${timeLeft < 60000
                ? 'bg-red-500/90 border-red-400 text-white animate-pulse'
                : 'bg-white/90 dark:bg-gray-900/90 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100'
                }`}>
                <div className={`p-1.5 rounded-lg ${timeLeft < 60000 ? 'bg-white/20' : 'bg-indigo-600'}`}>
                    {timeLeft < 60000 ? <ShieldAlert className="w-4 h-4" /> : <Clock className="w-4 h-4 text-white" />}
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider font-bold opacity-70 leading-none mb-1">
                        Session Security
                    </span>
                    <span className="text-sm font-mono font-bold leading-none">
                        Expires in: {timeDisplay}
                    </span>
                </div>
            </div>
        </div>
    );
}
