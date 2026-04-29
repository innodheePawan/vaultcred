'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ShieldCheck, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { resetTwoFactorWithToken } from '@/lib/actions/two-factor';

interface Reconfigure2FAPageProps {
    params: Promise<{ token: string }>;
}

export default function Reconfigure2FAPage({ params }: Reconfigure2FAPageProps) {
    const { token } = use(params);
    const router = useRouter();
    const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleConfirm = async () => {
        setStatus('verifying');
        const result = await resetTwoFactorWithToken(token);
        if (result.error) {
            setStatus('error');
            setMessage(result.error);
        } else {
            setStatus('success');
            setMessage(result.message || '2FA has been successfully reset.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 text-center">
                    <div className="mx-auto w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-4">
                        <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">2FA Reconfiguration</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {status === 'idle' && 'Ready to reset your Two-Factor Authentication'}
                        {status === 'verifying' && 'Verifying your request...'}
                        {status === 'success' && 'Reset successful!'}
                        {status === 'error' && 'Reset failed'}
                    </p>
                </div>

                <div className="px-6 py-4 text-center space-y-4">
                    {status === 'idle' && (
                        <div className="py-8">
                            <p className="text-gray-700 dark:text-gray-300 mb-6">
                                Please confirm that you want to reset and remove your current Two-Factor Authentication device.
                            </p>
                            <Button
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                onClick={handleConfirm}
                            >
                                Confirm 2FA Reset
                            </Button>
                        </div>
                    )}

                    {status === 'verifying' && (
                        <div className="flex flex-col items-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">Please wait while we secure your account.</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="py-4">
                            <div className="flex items-center justify-center text-green-600 mb-4">
                                <CheckCircle className="w-12 h-12" />
                            </div>
                            <p className="text-gray-700 dark:text-gray-300">{message}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                For your security, you must now set up a new authenticator device.
                            </p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="py-4">
                            <div className="flex items-center justify-center text-red-600 mb-4">
                                <AlertCircle className="w-12 h-12" />
                            </div>
                            <p className="text-gray-700 dark:text-gray-300">{message}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                This link may have expired or already been used. Please request a new one from your profile settings.
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
                    {status === 'success' ? (
                        <Button
                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                            onClick={() => router.push('/profile')}
                        >
                            Login to Setup 2FA
                        </Button>
                    ) : status === 'error' ? (
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => router.push('/login')}
                        >
                            Back to Login
                        </Button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
