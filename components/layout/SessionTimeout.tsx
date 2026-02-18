'use client';

import { useEffect, useRef, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Clock, ShieldAlert } from 'lucide-react';

interface SessionTimeoutProps {
    timeoutMs?: number; // Default to 10 minutes (600000 ms)
}

export function SessionTimeout({ timeoutMs = 900000 }: SessionTimeoutProps) {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [timeLeft, setTimeLeft] = useState<number>(timeoutMs);
    const lastActivityRef = useRef<number>(Date.now());

    // Determine effective timeout
    const isMfaLogin = pathname.startsWith('/login') && searchParams.get('mfa') === 'true';
    // For 2FA setup flow, we might want a shorter separate timeout, but keeping existing logic:
    const isRestrictedRoute = pathname.startsWith('/setup-2fa') || isMfaLogin || pathname.includes('/reconfigure-2fa');
    const effectiveTimeout = isRestrictedRoute ? 180000 : timeoutMs;

    useEffect(() => {
        // Run if authenticated OR on restricted unauthenticated route
        const canRun = status === 'authenticated' || (status === 'unauthenticated' && isRestrictedRoute);
        if (!canRun) return;

        // Function to check if we should logout
        const checkTimer = () => {
            const now = Date.now();
            const elapsed = now - lastActivityRef.current;
            const remaining = effectiveTimeout - elapsed;

            if (remaining <= 0) {
                // Time expired
                handleLogout();
            } else {
                setTimeLeft(remaining);
            }
        };

        const handleLogout = async () => {
            try {
                if (status === 'authenticated') {
                    // Try to log the logout reason, but don't block
                    const { logUserLogout } = await import('@/lib/actions/login-activity');
                    await logUserLogout();
                }
            } catch (e) {
                console.error("Auto-logout log failed", e);
            } finally {
                signOut({ callbackUrl: '/login' });
            }
        };

        const updateActivity = () => {
            // Only update activity if we are NOT in a restricted route (restricted routes have fixed expirations usually?)
            // OR if the requirement is "activity keeps session alive". 
            // Previous logic: "If it's a restricted route and NOT the initial load, don't reset the timer on activity"
            if (isRestrictedRoute) {
                // For restricted routes, we DO NOT update lastActivity on user events.
                // We only set it once on mount (or explicit reset).
                return;
            }
            lastActivityRef.current = Date.now();
        };

        // Events to detect activity
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        const onUserActivity = () => updateActivity();

        // 1. Set initial activity timestamp
        lastActivityRef.current = Date.now();

        // 2. Setup Polling Interval (Check every 1 second)
        const intervalId = setInterval(checkTimer, 1000);

        // 3. Setup Listeners
        events.forEach(event => window.addEventListener(event, onUserActivity));

        // 4. Handle Visibility Change (Tab focus) - Check immediately when user returns
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkTimer();
            }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            clearInterval(intervalId);
            events.forEach(event => window.removeEventListener(event, onUserActivity));
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [status, effectiveTimeout, isRestrictedRoute]);

    // Format time for UI (MM:SS)
    // Prevent negative display
    const displayTime = Math.max(0, timeLeft);
    const minutes = Math.floor(displayTime / 60000);
    const seconds = Math.floor((displayTime % 60000) / 1000);
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
