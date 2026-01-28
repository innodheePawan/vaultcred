'use client';

import { useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check } from 'lucide-react';
import { registerUser } from '@/lib/actions';
import { useRouter } from 'next/navigation';

const initialState = {
    message: null,
    error: null,
    success: false
};

export default function RegisterInviteForm({ token, email }: { token: string, email: string }) {
    const router = useRouter();

    // Wrapper to pass token
    const registerWithToken = async (prevState: any, formData: FormData) => {
        return registerUser(token, formData);
    };

    const [state, formAction, isPending] = useActionState(registerWithToken, initialState as any);

    useEffect(() => {
        if (state?.success) {
            // Redirect to login after short delay
            setTimeout(() => {
                router.push('/login?registered=true');
            }, 2000);
        }
    }, [state?.success, router]);

    if (state?.success) {
        return (
            <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <Check className="h-5 w-5 text-green-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">Registration Successful</h3>
                        <div className="mt-2 text-sm text-green-700">
                            <p>Redirecting you to login...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <form action={formAction} className="space-y-6">
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                </label>
                <div className="mt-1">
                    <input
                        type="email"
                        disabled
                        value={email}
                        className="block w-full rounded-md border-gray-300 bg-gray-100 dark:bg-gray-700 dark:border-gray-600 shadow-sm sm:text-sm px-3 py-2 text-gray-500 cursor-not-allowed"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name
                </label>
                <div className="mt-1">
                    <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        className="block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                </label>
                <div className="mt-1">
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={6}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                    />
                </div>
                <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
            </div>

            {state?.error && (
                <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">{state.error}</h3>
                        </div>
                    </div>
                </div>
            )}

            <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? 'Creating Account...' : 'Complete Registration'}
            </Button>
        </form>
    );
}
