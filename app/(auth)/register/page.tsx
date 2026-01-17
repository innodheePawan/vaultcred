'use client';

import { useActionState } from 'react';
import { registerUser } from '@/lib/actions';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

const initialState = {
    message: null,
    error: null,
};

function RegisterContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const registerWithToken = registerUser.bind(null, token || '');

    const [state, formAction, isPending] = useActionState(async (prev: any, formData: FormData) => {
        const result = await registerWithToken(formData);
        if (result.error) return { ...prev, error: result.error, message: null };
        if (result.success) return { ...prev, message: 'Registration successful! You can now login.', error: null };
        return prev;
    }, initialState);

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
                <div className="max-w-md w-full text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Invalid Invite Link</h2>
                    <p className="text-gray-600 dark:text-gray-400">Please provide a valid invitation token.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-gray-50 dark:bg-gray-900">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900 dark:text-white">
                    Complete User Registration
                </h2>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                {state.message ? (
                    <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{state.message}</h3>
                        <Link href="/login">
                            <Button>Go to Login</Button>
                        </Link>
                    </div>
                ) : (
                    <form action={formAction} className="space-y-6">
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                            >
                                Full Name
                            </label>
                            <div className="mt-2">
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    required
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-700 px-3"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                            >
                                Set Password
                            </label>
                            <div className="mt-2">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    minLength={6}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-700 px-3"
                                />
                            </div>
                        </div>

                        <div>
                            <Button
                                type="submit"
                                disabled={isPending}
                                className="w-full"
                            >
                                {isPending ? 'Registering...' : 'Complete Registration'}
                            </Button>
                        </div>

                        <div
                            className="flex h-8 items-end space-x-1"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            {state.error && (
                                <>
                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                    <p className="text-sm text-red-500">{state.error}</p>
                                </>
                            )}
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <RegisterContent />
        </Suspense>
    );
}
