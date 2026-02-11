'use client';

import { useState, useTransition } from 'react';
import { generateTwoFactorSetup, enableTwoFactor } from '@/lib/actions/two-factor';
import { useRouter } from 'next/navigation';
import { ShieldCheck, CheckCircle, AlertCircle, Copy, Loader2 } from 'lucide-react';

interface SetupTwoFactorFormProps {
    user: any;
}

export default function SetupTwoFactorForm({ user }: SetupTwoFactorFormProps) {
    const router = useRouter();
    const [step, setStep] = useState<'generate' | 'verify' | 'done'>('generate');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isPending, startTransition] = useTransition();

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
            setStep('done');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
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
            {step === 'generate' && (
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                        <ShieldCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-300" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Two-Factor Authentication adds an extra layer of security to your account.
                        You&apos;ll need an authenticator app like Google Authenticator or Authy.
                    </p>
                    <button
                        onClick={handleGenerate}
                        disabled={isPending}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                    >
                        {isPending ? (
                            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</>
                        ) : (
                            'Generate QR Code'
                        )}
                    </button>
                </div>
            )}

            {step === 'verify' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* QR Code */}
                    <div className="text-center">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                            Scan this QR code with your authenticator app:
                        </p>
                        {qrCode && (
                            <div className="inline-block p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                            </div>
                        )}
                    </div>

                    {/* Manual Secret */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            Or enter this code manually:
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
                        Redirecting to dashboard...
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
