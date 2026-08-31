'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Clock, ShieldAlert, MousePointerClick } from 'lucide-react';
import { logUserLogout } from '@/lib/actions/login-activity';

interface SessionTimeoutProps {
    timeoutMs?: number; // Default 15 minutes (900000 ms)
    warningMs?: number; // Show warning this many ms before expiry (default 60000 = 1 min)
}

export function SessionTimeout({ timeoutMs = 900000, warningMs = 60000 }: SessionTimeoutProps) {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [timeLeft, setTimeLeft] = useState<number>(timeoutMs);
    const [showWarning, setShowWarning] = useState(false);
    const lastActivityRef = useRef<number>(Date.now());
    const logoutCalledRef = useRef(false);

    // Determine effective timeout
    const isMfaLogin = pathname.startsWith('/login') && searchParams.get('mfa') === 'true';
    const isRestrictedRoute = pathname.startsWith('/setup-2fa') || isMfaLogin || pathname.includes('/reconfigure-2fa');
    const effectiveTimeout = isRestrictedRoute ? 180000 : timeoutMs;

    const handleLogout = useCallback(async () => {
        if (logoutCalledRef.current) return; // Prevent double-call
        logoutCalledRef.current = true;

        try {
            if (status === 'authenticated') {
                await logUserLogout();
            }
        } catch (e) {
            // Auto-logout log failed
        } finally {
            signOut({ callbackUrl: '/login?reason=timeout' });
        }
    }, [status]);

    const resetTimer = useCallback(() => {
        lastActivityRef.current = Date.now();
        setShowWarning(false);
        logoutCalledRef.current = false;
    }, []);

    useEffect(() => {
        const canRun = status === 'authenticated' || (status === 'unauthenticated' && isRestrictedRoute);
        if (!canRun) return;

        const checkTimer = () => {
            const now = Date.now();
            const elapsed = now - lastActivityRef.current;
            const remaining = effectiveTimeout - elapsed;

            if (remaining <= 0) {
                handleLogout();
            } else {
                setTimeLeft(remaining);
                // Show warning when less than warningMs remaining
                if (remaining <= warningMs && !isRestrictedRoute) {
                    setShowWarning(true);
                }
            }
        };

        const updateActivity = () => {
            if (isRestrictedRoute) return; // Restricted routes have fixed expiration
            lastActivityRef.current = Date.now();
            setShowWarning(false);
        };

        // Events to detect activity
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        const onUserActivity = () => updateActivity();

        // Set initial activity timestamp
        lastActivityRef.current = Date.now();

        // Polling interval (every second)
        const intervalId = setInterval(checkTimer, 1000);

        // Setup listeners
        events.forEach(event => window.addEventListener(event, onUserActivity));

        // Handle visibility change (tab focus)
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
    }, [status, effectiveTimeout, isRestrictedRoute, handleLogout, warningMs]);

    // Format time for display
    const displayTime = Math.max(0, timeLeft);
    const minutes = Math.floor(displayTime / 60000);
    const seconds = Math.floor((displayTime % 60000) / 1000);
    const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Restricted route badge (MFA/2FA setup)
    if (isRestrictedRoute) {
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

    // Dashboard warning modal (shows 1 minute before timeout)
    if (!showWarning) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 max-w-sm mx-4 text-center space-y-5 animate-in zoom-in-95 duration-300">
                {/* Pulsing icon */}
                <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center">
                    <ShieldAlert className="w-8 h-8 text-amber-600 dark:text-amber-400 animate-pulse" />
                </div>

                {/* Title */}
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Session Expiring Soon
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        You will be logged out due to inactivity.
                    </p>
                </div>

                {/* Countdown */}
                <div className={`text-4xl font-mono font-black tracking-wider ${timeLeft < 30000 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-amber-600 dark:text-amber-400'}`}>
                    {timeDisplay}
                </div>

                {/* Action button */}
                <button
                    onClick={resetTimer}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <MousePointerClick className="w-4 h-4" />
                    I&apos;m still here — Keep me logged in
                </button>

                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-bold">
                    or move your mouse / press any key
                </p>
            </div>
        </div>
    );
}
