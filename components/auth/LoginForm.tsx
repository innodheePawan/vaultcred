'use client';

import { useActionState } from 'react';
import { authenticate } from '@/lib/actions';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function LoginForm() {
    const [state, dispatch, isPending] = useActionState(
        authenticate,
        undefined as any,
    );
    const router = useRouter();

    const emailRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (state?.success) {
            router.refresh(); // Refresh NextAuth session
            router.push('/dashboard');
        }
    }, [state, router]);

    return (
        <form action={dispatch} className="space-y-6">
            <div>
                <label
                    htmlFor="email"
                    className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                >
                    Email address
                </label>
                <div className="mt-2">
                    <input
                        ref={emailRef}
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-700"
                    />
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between">
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                    >
                        Password
                    </label>
                    <div className="text-sm">
                        <a
                            href="#"
                            className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                        >
                            Forgot password?
                        </a>
                    </div>
                </div>
                <div className="mt-2">
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-700"
                    />
                </div>
            </div>

            <div>
                <button
                    disabled={isPending}
                    type="submit"
                    className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                >
                    {isPending ? 'Signing in...' : 'Sign in'}
                </button>
            </div>

            <div
                className="flex h-8 items-end space-x-1"
                aria-live="polite"
                aria-atomic="true"
            >
                {state?.error && (
                    <>
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <p className="text-sm text-red-500">{state.error}</p>
                    </>
                )}
            </div>
        </form>
    );
}
