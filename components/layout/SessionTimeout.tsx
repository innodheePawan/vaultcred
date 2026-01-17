'use client';

import { useEffect, useRef } from 'react';
import { signOut } from 'next-auth/react';

interface SessionTimeoutProps {
    timeoutMs?: number; // Default to 10 minutes (600000 ms)
}

export function SessionTimeout({ timeoutMs = 600000 }: SessionTimeoutProps) {
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

        const resetTimer = () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            timerRef.current = setTimeout(() => {
                // Determine if we need to warn first? For now, just logout as requested.
                signOut({ callbackUrl: '/login' });
            }, timeoutMs);
        };

        // Initialize timer
        resetTimer();

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        // Cleanup
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [timeoutMs]);

    return null; // This component renders nothing
}
