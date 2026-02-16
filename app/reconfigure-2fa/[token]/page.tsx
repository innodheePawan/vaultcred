'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldCheck, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { resetTwoFactorWithToken } from '@/lib/actions/two-factor';

interface Reconfigure2FAPageProps {
    params: Promise<{ token: string }>;
}

export default function Reconfigure2FAPage({ params }: Reconfigure2FAPageProps) {
    const { token } = use(token);
    const router = useRouter();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyAndReset = async () => {
            const result = await resetTwoFactorWithToken(token);
            if (result.error) {
                setStatus('error');
                setMessage(result.error);
            } else {
                setStatus('success');
                setMessage(result.message || '2FA has been successfully reset.');
            }
        };

        verifyAndReset();
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                        <ShieldCheck className="w-6 h-6 text-indigo-600" />
                    </div>
                    <CardTitle>2FA Reconfiguration</CardTitle>
                    <CardDescription>
                        {status === 'verifying' && 'Verifying your request...'}
                        {status === 'success' && 'Reset successful!'}
                        {status === 'error' && 'Reset failed'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    {status === 'verifying' && (
                        <div className="flex flex-col items-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                            <p className="text-sm text-gray-500">Please wait while we secure your account.</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="py-4">
                            <div className="flex items-center justify-center text-green-600 mb-4">
                                <CheckCircle className="w-12 h-12" />
                            </div>
                            <p className="text-gray-700">{message}</p>
                            <p className="text-sm text-gray-500 mt-2">
                                For your security, you must now set up a new authenticator device.
                            </p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="py-4">
                            <div className="flex items-center justify-center text-red-600 mb-4">
                                <AlertCircle className="w-12 h-12" />
                            </div>
                            <p className="text-gray-700">{message}</p>
                            <p className="text-sm text-gray-500 mt-2">
                                This link may have expired or already been used. Please request a new one from your profile settings.
                            </p>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    {status === 'success' ? (
                        <Button
                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                            onClick={() => router.push('/profile')}
                        >
                            Go to Profile to Setup 2FA
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
                </CardFooter>
            </Card>
        </div>
    );
}
