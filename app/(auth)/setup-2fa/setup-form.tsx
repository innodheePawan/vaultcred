'use client';

import { useState, useTransition } from 'react';
import { generateTwoFactorSetup, enableTwoFactor } from '@/lib/actions/two-factor';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ShieldCheck, CheckCircle, AlertCircle, Copy, Loader2 } from 'lucide-react';

interface SetupTwoFactorFormProps {
    user: any;
}

export default function SetupTwoFactorForm({ user }: SetupTwoFactorFormProps) {
    const router = useRouter();
    const { update } = useSession();
    const [step, setStep] = useState<'install' | 'generate' | 'verify' | 'done'>('install');
    const [platform, setPlatform] = useState<'ios' | 'android'>('ios');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [isPending, startTransition] = useTransition();

    const appStoreLinks = {
        ios: 'https://apps.apple.com/us/app/google-authenticator/id388497605',
        android: 'https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2'
    };

    const handleGenerate = () => {
        setError(null);
        startTransition(async () => {
            const result = await generateTwoFactorSetup();
            if (result.error) {
                setError(result.error);
                return;
            }
            setQrCode(result.qrCode!);
            setSecret(result.secret!);
            setStep('verify');
        });
    };

    const handleVerify = () => {
        if (code.length !== 6) {
            setError('Please enter a 6-digit code.');
            return;
        }
        setError(null);
        startTransition(async () => {
            const result = await enableTwoFactor(code);
            if (result.error) {
                setError(result.error);
                return;
            }

            // Workaround for NextAuth Edge Runtime Cookie desync:
            // Since the user is locked out by middleware until the cookie explicitly states `twoFactorEnabled: true`, 
            // and `update()` often fails due to heavy browser caching, we destroy the local session and force
            // them to log in once to perfectly align the NextAuth JWT Cookie with the true database state.
            setStep('done');
            setTimeout(() => {
                signOut({ callbackUrl: '/login?setup=success', redirect: true });
            }, 1500);
        });
    };

    const copySecret = () => {
        if (secret) {
            navigator.clipboard.writeText(secret);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            {step === 'install' && (
                <div className="text-center space-y-6 animate-in fade-in duration-300">
                    <div className="mx-auto w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                        <ShieldCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-300" />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Step 1: Install Authenticator
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Select your device type to download Google Authenticator.
                        </p>
                    </div>

                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => setPlatform('ios')}
                            className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${platform === 'ios'
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400'
                                }`}
                        >
                            <svg className="w-8 h-8 mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.1 2.48-1.34.03-1.77-.79-3.29-.79-1.53 0-1.99.77-3.29.82-1.35.05-2.33-1.32-3.18-2.55C3.93 16.6 2.46 11.12 4.38 7.8c.95-1.65 2.65-2.69 4.5-2.72 1.4-.02 2.73.96 3.59.96.86 0 2.48-1.17 4.15-.99 1.44.13 2.58.62 3.34 1.73-3.12 1.84-2.62 5.67.43 6.94-.7 1.78-1.59 3.56-2.68 5.7zM15.47 2c.73 0 2.06.49 2.5 1.5.06.12-.13.3-.25.3-.44 0-2.06-.49-2.5-1.5-.06-.12.13-.3.25-.3z" /></svg>
                            <span className="text-xs font-bold uppercase tracking-wider">iOS</span>
                        </button>
                        <button
                            onClick={() => setPlatform('android')}
                            className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${platform === 'android'
                                ? 'border-green-600 bg-green-50 dark:bg-green-900/40 text-green-600 dark:text-green-300'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400'
                                }`}
                        >
                            <svg className="w-8 h-8 mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M17.523 15.3414C17.0709 15.3414 16.6993 14.9698 16.6993 14.5177C16.6993 14.0656 17.0709 13.694 17.523 13.694C17.9751 13.694 18.3467 14.0656 18.3467 14.5177C18.3467 14.9698 17.9751 15.3414 17.523 15.3414ZM6.47702 15.3414C6.02492 15.3414 5.65332 14.9698 5.65332 14.5177C5.65332 14.0656 6.02492 13.694 6.47702 13.694C6.92912 13.694 7.30072 14.0656 7.30072 14.5177C7.30072 14.9698 6.92912 15.3414 6.47702 15.3414ZM17.8465 10.3877L19.5781 7.38734C19.6896 7.1942 19.6234 6.94723 19.4303 6.8357C19.2371 6.72418 18.9902 6.79038 18.8787 6.98352L17.1197 10.0306C15.6888 9.381 14.0955 9.01953 12.4 9.01953C10.7045 9.01953 9.3112 9.381 7.68028 10.0306L5.92128 6.98352C5.80975 6.79038 5.56279 6.72418 5.36965 6.8357C5.17651 6.94723 5.11031 7.1942 5.22183 7.38734L6.9535 10.3877C4.16273 11.8906 2.25391 14.7431 2.25391 18.0645H22.5461C22.5461 14.7431 20.6373 11.8906 17.8465 10.3877Z" /></svg>
                            <span className="text-xs font-bold uppercase tracking-wider">Android</span>
                        </button>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <a
                            href={appStoreLinks[platform]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:underline flex items-center gap-1"
                        >
                            Click here to download for {platform === 'ios' ? 'iOS' : 'Android'}
                        </a>
                    </div>

                    <div className="inline-block p-4 bg-white rounded-xl shadow-md border border-gray-100 ring-4 ring-gray-50 dark:ring-gray-900/50">
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appStoreLinks[platform as keyof typeof appStoreLinks])}`}
                            alt={`Download for ${platform}`}
                            className="w-40 h-40"
                        />
                        <div className="mt-3 flex items-center justify-center gap-2">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${platform === 'ios' ? 'bg-indigo-500' : 'bg-green-500'}`}></div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">
                                Scan for {platform === 'ios' ? 'App Store' : 'Play Store'}
                            </p>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={() => setStep('generate')}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            I have the app, let&apos;s continue
                        </button>
                    </div>
                </div>
            )}

            {step === 'generate' && (
                <div className="text-center space-y-4 animate-in fade-in duration-300">
                    <div className="mx-auto w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                        <ShieldCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-300" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Step 2: Secure Your Account
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Click below to generate your unique security code.
                            You will need to scan it with your authenticator app in the next step.
                        </p>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isPending}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                    >
                        {isPending ? (
                            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</>
                        ) : (
                            'Generate My Secret QR'
                        )}
                    </button>
                    <button
                        onClick={() => setStep('install')}
                        className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-medium"
                    >
                        Go back
                    </button>
                </div>
            )}

            {step === 'verify' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* QR Code */}
                    <div className="text-center space-y-4">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                1. Scan this QR code with your authenticator app:
                            </p>
                            {qrCode && (
                                <div className="inline-block p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                                    <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                                </div>
                            )}
                        </div>

                        {/* Direct Download Links for Mobile Users */}
                        <div className="space-y-3 pt-2">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Don&apos;t have the app yet? Download it now:
                            </p>
                            <div className="flex flex-wrap justify-center gap-3">
                                <a
                                    href={appStoreLinks.ios}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.1 2.48-1.34.03-1.77-.79-3.29-.79-1.53 0-1.99.77-3.29.82-1.35.05-2.33-1.32-3.18-2.55C3.93 16.6 2.46 11.12 4.38 7.8c.95-1.65 2.65-2.69 4.5-2.72 1.4-.02 2.73.96 3.59.96.86 0 2.48-1.17 4.15-.99 1.44.13 2.58.62 3.34 1.73-3.12 1.84-2.62 5.67.43 6.94-.7 1.78-1.59 3.56-2.68 5.7zM15.47 2c.73 0 2.06.49 2.5 1.5.06.12-.13.3-.25.3-.44 0-2.06-.49-2.5-1.5-.06-.12.13-.3.25-.3z" /></svg>
                                    <div className="text-left">
                                        <p className="text-[8px] uppercase leading-none">Download on the</p>
                                        <p className="text-sm font-semibold leading-tight">App Store</p>
                                    </div>
                                </a>
                                <a
                                    href={appStoreLinks.android}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M17.523 15.3414C17.0709 15.3414 16.6993 14.9698 16.6993 14.5177C16.6993 14.0656 17.0709 13.694 17.523 13.694C17.9751 13.694 18.3467 14.0656 18.3467 14.5177C18.3467 14.9698 17.9751 15.3414 17.523 15.3414ZM6.47702 15.3414C6.02492 15.3414 5.65332 14.9698 5.65332 14.5177C5.65332 14.0656 6.02492 13.694 6.47702 13.694C6.92912 13.694 7.30072 14.0656 7.30072 14.5177C7.30072 14.9698 6.92912 15.3414 6.47702 15.3414ZM17.8465 10.3877L19.5781 7.38734C19.6896 7.1942 19.6234 6.94723 19.4303 6.8357C19.2371 6.72418 18.9902 6.79038 18.8787 6.98352L17.1197 10.0306C15.6888 9.381 14.0955 9.01953 12.4 9.01953C10.7045 9.01953 9.3112 9.381 7.68028 10.0306L5.92128 6.98352C5.80975 6.79038 5.56279 6.72418 5.36965 6.8357C5.17651 6.94723 5.11031 7.1942 5.22183 7.38734L6.9535 10.3877C4.16273 11.8906 2.25391 14.7431 2.25391 18.0645H22.5461C22.5461 14.7431 20.6373 11.8906 17.8465 10.3877Z" /></svg>
                                    <div className="text-left">
                                        <p className="text-[8px] uppercase leading-none">Get it on</p>
                                        <p className="text-sm font-semibold leading-tight">Google Play</p>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Manual Secret — toggle-reveal for mobile users who can't scan */}
                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => setShowManualEntry(!showManualEntry)}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                        >
                            {showManualEntry ? 'Hide manual entry code' : "Can't scan the QR code? (e.g. on mobile)"}
                        </button>
                    </div>
                    {showManualEntry && secret && (
                        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700 animate-in fade-in duration-300">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                Copy this code and paste it into your authenticator app:
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 font-mono text-sm bg-white dark:bg-gray-900 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white select-all break-all">
                                    {secret}
                                </code>
                                <button
                                    onClick={copySecret}
                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    title="Copy secret"
                                >
                                    {copied ? (
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <Copy className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Verification Code Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Enter the 6-digit code from your app:
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            autoFocus
                            className="block w-full text-center tracking-[0.5em] text-2xl font-bold rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-gray-900 dark:text-white dark:ring-gray-700"
                        />
                    </div>

                    <button
                        onClick={handleVerify}
                        disabled={isPending || code.length !== 6}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                    >
                        {isPending ? (
                            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Verifying...</>
                        ) : (
                            'Verify & Enable 2FA'
                        )}
                    </button>
                </div>
            )}

            {step === 'done' && (
                <div className="text-center space-y-4 animate-in fade-in duration-300">
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        2FA Enabled Successfully!
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Redirecting to login...
                    </p>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 flex gap-2 items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
            )}
        </div>
    );
}
