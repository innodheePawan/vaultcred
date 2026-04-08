'use client';

import { useState, useRef, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { User, ShieldCheck, ShieldOff, AlertCircle, Loader2, Copy, CheckCircle, RefreshCw } from 'lucide-react';
import { updateUserProfile } from '@/lib/actions/users';
import { generateTwoFactorSetup, enableTwoFactor, disableTwoFactor, requestTwoFactorReconfiguration } from '@/lib/actions/two-factor';

interface UserProfileFormProps {
    user: {
        name?: string | null;
        email?: string | null;
        role?: string;
        image?: string | null;
        twoFactorEnabled?: boolean;
    };
    twoFactorMandatory?: boolean;
}

export default function UserProfileForm({ user, twoFactorMandatory = false }: UserProfileFormProps) {
    const [name, setName] = useState(user.name || '');
    const [imagePreview, setImagePreview] = useState<string | null>(user.image || null);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 2FA State
    const [twoFAEnabled, setTwoFAEnabled] = useState(user.twoFactorEnabled || false);
    const [twoFAStep, setTwoFAStep] = useState<'idle' | 'setup' | 'disable'>('idle');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [twoFACode, setTwoFACode] = useState('');
    const [twoFAError, setTwoFAError] = useState<string | null>(null);
    const [twoFASuccess, setTwoFASuccess] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [is2FAPending, start2FATransition] = useTransition();
    const [reconfigSent, setReconfigSent] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                alert('File size must be less than 1MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const formData = new FormData();
        formData.append('name', name);
        if (imagePreview) {
            formData.append('profileImage', imagePreview);
        }

        try {
            const result = await updateUserProfile(formData);
            if (result.error) {
                alert(result.error);
            } else {
                alert('Profile updated successfully!');
            }
        } catch (error) {
            alert('An unexpected error occurred.');
        } finally {
            setIsSaving(false);
        }
    };

    // 2FA Handlers
    const handleStartSetup = () => {
        setTwoFAError(null);
        setTwoFASuccess(null);
        setTwoFACode('');
        start2FATransition(async () => {
            const result = await generateTwoFactorSetup();
            if (result.error) {
                setTwoFAError(result.error);
                return;
            }
            setQrCode(result.qrCode!);
            setSecret(result.secret!);
            setTwoFAStep('setup');
        });
    };

    const handleEnable2FA = () => {
        if (twoFACode.length !== 6) {
            setTwoFAError('Please enter a 6-digit code.');
            return;
        }
        setTwoFAError(null);
        start2FATransition(async () => {
            const result = await enableTwoFactor(twoFACode);
            if (result.error) {
                setTwoFAError(result.error);
                return;
            }
            setTwoFAEnabled(true);
            setTwoFAStep('idle');
            setTwoFASuccess(result.message || '2FA enabled!');
            setQrCode(null);
            setSecret(null);
            setTwoFACode('');
        });
    };

    const handleReconfigure2FA = () => {
        setTwoFAError(null);
        setTwoFASuccess(null);
        start2FATransition(async () => {
            const result = await requestTwoFactorReconfiguration();
            if (result.error) {
                setTwoFAError(result.error);
                return;
            }
            setReconfigSent(true);
            setTwoFASuccess(result.message || 'Reconfiguration email sent!');
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
        <div className="space-y-6 max-w-2xl">
            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <div className="flex items-center gap-6 mb-6">
                        <div className="relative group">
                            <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-10 w-10 text-gray-400" />
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 bg-white dark:bg-gray-700 p-1.5 rounded-full shadow border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                                <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Profile Picture</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">JPG, GIF or PNG. Max 1MB.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm p-2 border"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={user.email || ''}
                                disabled
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 shadow-sm sm:text-sm p-2 border cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Role
                            </label>
                            <input
                                type="text"
                                value={user.role || 'USER'}
                                disabled
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 shadow-sm sm:text-sm p-2 border cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </form>

            {/* Two-Factor Authentication Section */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Two-Factor Authentication
                    </h3>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2 mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${twoFAEnabled
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                        {twoFAEnabled ? '✓ Enabled' : 'Not Enabled'}
                    </span>
                </div>

                {/* Success Message */}
                {twoFASuccess && (
                    <div className="mb-4 rounded-md bg-green-50 dark:bg-green-900/20 p-3 flex gap-2 items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                        <p className="text-sm text-green-700 dark:text-green-400">{twoFASuccess}</p>
                    </div>
                )}

                {/* Error Message */}
                {twoFAError && (
                    <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-3 flex gap-2 items-center">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <p className="text-sm text-red-700 dark:text-red-400">{twoFAError}</p>
                    </div>
                )}

                {/* Idle State Actions */}
                {twoFAStep === 'idle' && (
                    <div>
                        {!twoFAEnabled ? (
                            <div className="space-y-3">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Add an extra layer of security by enabling Two-Factor Authentication with an authenticator app.
                                </p>
                                <Button
                                    type="button"
                                    onClick={handleStartSetup}
                                    disabled={is2FAPending}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    {is2FAPending ? (
                                        <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</>
                                    ) : (
                                        <><ShieldCheck className="w-4 h-4 mr-2" /> Enable 2FA</>
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Your account is protected with Two-Factor Authentication.
                                </p>
                                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm text-amber-700 dark:text-amber-400 mb-2">
                                            Two-Factor Authentication is mandatory at the enterprise level.
                                            It cannot be disabled by individual users.
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleReconfigure2FA}
                                            disabled={is2FAPending || reconfigSent}
                                            className="text-indigo-600 border-indigo-300 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-700 dark:hover:bg-indigo-900/20 bg-white"
                                        >
                                            {is2FAPending ? (
                                                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...</>
                                            ) : (
                                                <><RefreshCw className="w-4 h-4 mr-2" /> Reconfigure 2FA</>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Setup Flow (Enable 2FA) */}
                {twoFAStep === 'setup' && (
                    <div className="space-y-5 border-t border-gray-200 dark:border-gray-700 pt-5 mt-4">
                        {/* QR Code */}
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Scan this QR code with your authenticator app:
                            </p>
                            {qrCode && (
                                <div className="inline-block p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                                    <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                                </div>
                            )}
                        </div>

                        {/* Manual Secret */}
                        <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Or enter manually:</p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 font-mono text-sm bg-white dark:bg-gray-900 px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white select-all break-all">
                                    {secret}
                                </code>
                                <button onClick={copySecret} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors" title="Copy">
                                    {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Verify Code */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Enter the 6-digit code from your app:
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={twoFACode}
                                onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                                placeholder="000000"
                                autoFocus
                                className="block w-full text-center tracking-[0.3em] text-xl font-bold rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-gray-900 dark:text-white dark:ring-gray-700"
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                onClick={handleEnable2FA}
                                disabled={is2FAPending || twoFACode.length !== 6}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {is2FAPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Verifying...</> : 'Verify & Enable'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => { setTwoFAStep('idle'); setTwoFACode(''); setTwoFAError(null); }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
