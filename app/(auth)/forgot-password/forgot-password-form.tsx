'use client';

import { useState, useTransition } from 'react';
import { requestPasswordReset } from '@/lib/actions/password-reset';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        startTransition(async () => {
            const result = await requestPasswordReset(email);
            if (result.error) {
                setError(result.error);
            } else if (result.success) {
                setMessage(result.message || 'Check your email for a reset link.');
                setSent(true);
            }
        });
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {message && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <span>{message}</span>
                </div>
            )}

            {!sent ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email Address
                        </label>
                        <div className="mt-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-10 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 dark:bg-gray-700 dark:text-white"
                                placeholder="your@email.com"
                            />
                        </div>
                    </div>

                    <Button type="submit" disabled={isPending} className="w-full">
                        {isPending ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                </form>
            ) : (
                <div className="text-center py-4">
                    <Mail className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Check your inbox for <strong>{email}</strong>.
                        If you have 2FA enabled, you&apos;ll need your authenticator app when resetting.
                    </p>
                </div>
            )}

            <div className="text-center">
                <Link
                    href="/login"
                    className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Login
                </Link>
            </div>
        </div>
    );
}
