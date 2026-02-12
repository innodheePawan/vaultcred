'use client';

import { useState, useTransition } from 'react';
import { verifyResetTwoFactor, resetPassword } from '@/lib/actions/password-reset';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

type Step = 'two-factor' | 'new-password' | 'done';

export default function ResetPasswordForm({
    token,
    twoFactorRequired,
}: {
    token: string;
    twoFactorRequired: boolean;
}) {
    const [step, setStep] = useState<Step>(twoFactorRequired ? 'two-factor' : 'new-password');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [twoFactorVerified, setTwoFactorVerified] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleVerify2FA = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        startTransition(async () => {
            const result = await verifyResetTwoFactor(token, twoFactorCode);
            if (result.verified) {
                setTwoFactorVerified(true);
                setStep('new-password');
            } else {
                setError(result.error || 'Invalid 2FA code.');
            }
        });
    };

    const handleResetPassword = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        startTransition(async () => {
            const result = await resetPassword(
                token,
                newPassword,
                twoFactorRequired ? twoFactorCode : undefined
            );

            if (result.error) {
                setError(result.error);
            } else if (result.success) {
                setStep('done');
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

            {/* Step 1: 2FA Verification (if required) */}
            {step === 'two-factor' && (
                <form onSubmit={handleVerify2FA} className="space-y-6">
                    <div className="text-center pb-4">
                        <ShieldCheck className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Your account has Two-Factor Authentication enabled.
                            Enter the code from your authenticator app to continue.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Authentication Code
                        </label>
                        <div className="mt-1">
                            <input
                                id="twoFactorCode"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                required
                                autoFocus
                                value={twoFactorCode}
                                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                                className="block w-full text-center text-2xl tracking-[0.5em] rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-3 dark:bg-gray-700 dark:text-white"
                                placeholder="000000"
                            />
                        </div>
                    </div>

                    <Button type="submit" disabled={isPending || twoFactorCode.length !== 6} className="w-full">
                        {isPending ? 'Verifying...' : 'Verify & Continue'}
                    </Button>
                </form>
            )}

            {/* Step 2: New Password */}
            {step === 'new-password' && (
                <form onSubmit={handleResetPassword} className="space-y-6">
                    {twoFactorRequired && twoFactorVerified && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            <span>2FA verified successfully</span>
                        </div>
                    )}

                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            New Password
                        </label>
                        <div className="mt-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="newPassword"
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={8}
                                autoFocus
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="block w-full pl-10 pr-10 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 dark:bg-gray-700 dark:text-white"
                                placeholder="Minimum 8 characters"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Confirm Password
                        </label>
                        <div className="mt-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={8}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="block w-full pl-10 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 dark:bg-gray-700 dark:text-white"
                                placeholder="Re-enter password"
                            />
                        </div>
                    </div>

                    <Button type="submit" disabled={isPending} className="w-full">
                        {isPending ? 'Resetting...' : 'Reset Password'}
                    </Button>
                </form>
            )}

            {/* Step 3: Done */}
            {step === 'done' && (
                <div className="text-center py-4 space-y-4">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Password Reset Successfully!
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        You can now log in with your new password.
                    </p>
                    <Link href="/login">
                        <Button className="w-full mt-4">Go to Login</Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
