import { validateResetToken } from '@/lib/actions/password-reset';
import ResetPasswordForm from './reset-password-form';
import { Shield } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
    title: 'Reset Password',
};

export default async function ResetPasswordPage(props: { params: Promise<{ token: string }> }) {
    const params = await props.params;
    const token = params.token;
    const result = await validateResetToken(token);

    if (!result.valid) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                        <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                        Invalid Reset Link
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {result.error}
                    </p>
                    <div className="mt-6 space-y-3">
                        <Link href="/forgot-password">
                            <Button variant="default" className="w-full">Request New Reset Link</Button>
                        </Link>
                        <Link href="/login">
                            <Button variant="outline" className="w-full mt-2">Back to Login</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                        <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                        Reset Password
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Set a new password for <strong>{result.email}</strong>
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <ResetPasswordForm
                        token={token}
                        twoFactorRequired={result.twoFactorRequired || false}
                    />
                </div>
            </div>
        </div>
    );
}
