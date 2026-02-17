'use client';

import { useState, useTransition, useRef } from 'react';
import { authenticate } from '@/lib/actions';
import { preLoginCheck } from '@/lib/actions/auth-check';
import { requestTwoFactorResetDuringLogin } from '@/lib/actions/two-factor';
import { AlertCircle, Loader2, ArrowLeft, ShieldCheck, Mail, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SecurityChallenge } from './SecurityChallenge';

export default function LoginForm() {
    const router = useRouter();
    const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Reconfiguration state
    const [reconfigIsPending, startReconfigTransition] = useTransition();
    const [reconfigSent, setReconfigSent] = useState(false);
    const [reconfigMessage, setReconfigMessage] = useState<string | null>(null);

    const codeInputRef = useRef<HTMLInputElement>(null);

    // Step 1: Validate credentials and check if 2FA is needed
    const handleCredentialsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        startTransition(async () => {
            const formData = new FormData();
            formData.set('email', email);
            formData.set('password', password);
            if (captchaVerified) {
                formData.set('captcha_verified', 'true');
            }

            const result = await preLoginCheck(null, formData);

            if (result.requiresCaptcha) {
                setShowCaptcha(true);
                setError(null); // Clear error since we are showing challenge
                return;
            }

            if (result.error) {
                setError(result.error);
                return;
            }

            if (result.twoFactorRequired) {
                // Show 2FA code input
                setStep('2fa');
                // Update URL to signal to SessionTimeout that we are in MFA mode
                const url = new URL(window.location.href);
                url.searchParams.set('mfa', 'true');
                window.history.pushState({}, '', url.toString());

                setTimeout(() => codeInputRef.current?.focus(), 100);
            } else {
                // No 2FA — complete login directly
                await completeLogin();
            }
        });
    };

    // Step 2: Complete login (with or without 2FA code)
    const completeLogin = async (code?: string) => {
        const formData = new FormData();
        formData.set('email', email);
        formData.set('password', password);
        if (code) {
            formData.set('code', code);
        }
        if (captchaVerified) {
            formData.set('captcha_verified', 'true');
        }

        const result = await authenticate(null, formData);

        if (result?.requiresCaptcha) {
            setShowCaptcha(true);
            setError(null);
            return;
        }

        if (result?.error) {
            setError(result.error);
            return;
        }

        if (result?.success) {
            router.refresh();
            router.push('/dashboard');
        }
    };

    const handle2FASubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (twoFactorCode.length !== 6) {
            setError('Please enter a 6-digit code.');
            return;
        }
        setError(null);

        startTransition(async () => {
            await completeLogin(twoFactorCode);
        });
    };

    const handleRequest2FAReset = () => {
        setError(null);
        setReconfigMessage(null);

        startReconfigTransition(async () => {
            const formData = new FormData();
            formData.set('email', email);
            formData.set('password', password);

            const result = await requestTwoFactorResetDuringLogin(formData);

            if (result.error) {
                setError(result.error);
                return;
            }

            setReconfigSent(true);
            setReconfigMessage(result.message || 'Reconfiguration email sent!');
        });
    };

    const handleBackToCredentials = () => {
        setStep('credentials');
        setTwoFactorCode('');
        setError(null);
        setReconfigSent(false);
        setReconfigMessage(null);

        // Clear MFA flag from URL
        const url = new URL(window.location.href);
        url.searchParams.delete('mfa');
        window.history.pushState({}, '', url.toString());
    };

    return (
        <>
            {step === 'credentials' && (
                <form onSubmit={handleCredentialsSubmit} className="space-y-6">
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                        >
                            Email address
                        </label>
                        <div className="mt-2">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                                    href="/forgot-password"
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
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-700"
                            />
                        </div>
                    </div>

                    {showCaptcha && (
                        <SecurityChallenge
                            verified={captchaVerified}
                            onVerify={setCaptchaVerified}
                        />
                    )}

                    <div>
                        <button
                            disabled={isPending || (showCaptcha && !captchaVerified)}
                            type="submit"
                            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 transition-all active:scale-[0.98]"
                        >
                            {isPending ? (
                                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Signing in...</>
                            ) : (
                                'Sign in'
                            )}
                        </button>
                    </div>

                    {/* Error */}
                    <div className="flex h-8 items-end space-x-1" aria-live="polite" aria-atomic="true">
                        {error && (
                            <>
                                <AlertCircle className="h-5 w-5 text-red-500" />
                                <p className="text-sm text-red-500">{error}</p>
                            </>
                        )}
                    </div>
                </form>
            )}

            {step === '2fa' && (
                <form onSubmit={handle2FASubmit} className="space-y-6 animate-in fade-in duration-200">
                    {/* Back Button */}
                    <button
                        type="button"
                        onClick={handleBackToCredentials}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    {/* 2FA Header */}
                    <div className="text-center space-y-2">
                        <div className="mx-auto w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Two-Factor Authentication
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Enter the 6-digit code from your authenticator app.
                        </p>
                    </div>

                    {/* Code Input */}
                    <div>
                        <input
                            ref={codeInputRef}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            autoFocus
                            className="block w-full text-center tracking-[0.5em] text-2xl font-bold rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-gray-800 dark:text-white dark:ring-gray-700"
                        />
                    </div>

                    <button
                        disabled={isPending || twoFactorCode.length !== 6}
                        type="submit"
                        className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 transition-colors"
                    >
                        {isPending ? (
                            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Verifying...</>
                        ) : (
                            'Verify'
                        )}
                    </button>

                    {/* 2FA Recovery Link */}
                    <div className="text-center">
                        {!reconfigSent ? (
                            <button
                                type="button"
                                disabled={reconfigIsPending}
                                onClick={handleRequest2FAReset}
                                className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 flex items-center justify-center gap-1 mx-auto disabled:opacity-50"
                            >
                                {reconfigIsPending ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending link...</>
                                ) : (
                                    <><Mail className="w-4 h-4" /> Lost your device? Reset via email</>
                                )}
                            </button>
                        ) : (
                            <div className="flex flex-col items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
                                <div className="flex items-center gap-2 font-medium">
                                    <CheckCircle className="w-4 h-4" /> Email Sent!
                                </div>
                                <p className="text-xs text-center">
                                    Please check your inbox for the reconfiguration link.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Error */}
                    <div className="flex h-8 items-end space-x-1" aria-live="polite" aria-atomic="true">
                        {error && (
                            <>
                                <AlertCircle className="h-5 w-5 text-red-500" />
                                <p className="text-sm text-red-500">{error}</p>
                            </>
                        )}
                    </div>
                </form>
            )}
        </>
    );
}
