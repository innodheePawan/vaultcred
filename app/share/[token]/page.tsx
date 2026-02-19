'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { validateSecretMetadata, revealSecret } from '@/lib/actions/secrets';
import { Lock, AlertTriangle, Eye, Clock, ShieldCheck, Copy, Check } from 'lucide-react';

export default function ShareSecretPage() {
    const params = useParams();
    const token = params.token as string;

    const [status, setStatus] = useState<'LOADING' | 'VALID' | 'INVALID' | 'REVEALED'>('LOADING');
    const [error, setError] = useState<string | null>(null);
    const [secretData, setSecretData] = useState<string | null>(null);
    const [isRevealing, setIsRevealing] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (token) {
            validateToken();
        }
    }, [token]);

    const validateToken = async () => {
        const result = await validateSecretMetadata(token);
        if (!result.valid) {
            setStatus('INVALID');
            setError(result.error || 'Invalid link');
        } else {
            setStatus('VALID');
        }
    };

    const handleReveal = async () => {
        setIsRevealing(true);
        const result = await revealSecret(token);
        if (result.error) {
            setStatus('INVALID');
            setError(result.error);
        } else {
            setSecretData(result.secretData || '');
            setStatus('REVEALED');
        }
        setIsRevealing(false);
    };

    const handleCopy = () => {
        if (secretData) {
            navigator.clipboard.writeText(secretData);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (status === 'LOADING') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-500">Verifying secure link...</p>
            </div>
        );
    }

    if (status === 'INVALID') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {error || 'This link is invalid, expired, or has already been viewed.'}
                    </p>
                    <div className="text-sm text-gray-500">
                        If you believe this is an error, contact the sender.
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'REVEALED') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
                <div className="max-w-2xl w-full bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="bg-green-600 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white font-semibold">
                            <ShieldCheck className="w-5 h-5" />
                            Secret Revealed
                        </div>
                        <div className="text-indigo-100 text-sm">
                            Make sure to save this now.
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Secret Content
                            </label>
                            <div className="relative group">
                                <textarea
                                    readOnly
                                    value={secretData || ''}
                                    className="w-full h-48 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 font-mono text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <button
                                    onClick={handleCopy}
                                    className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-green-600 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title="Copy to clipboard"
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-100 dark:border-yellow-800 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-yellow-800 dark:text-yellow-400 text-sm">This link is now invalid</h4>
                                <p className="text-yellow-700 dark:text-yellow-500 text-sm mt-1">
                                    Depending on the settings, this secret may have been permanently deleted from our servers immediately after you viewed it.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // STATE: VALID (Prompt to reveal)
    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Secure Secret</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    You have received a secure one-time link. <br />
                    Once you view this secret, it may disappear forever.
                </p>

                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 mb-8 text-left text-sm text-gray-500 dark:text-gray-400 space-y-2">
                    <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span>Single or limited view access</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Time-limited availability</span>
                    </div>
                </div>

                <button
                    onClick={handleReveal}
                    disabled={isRevealing}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow transition transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isRevealing ? 'Decrypting...' : 'View Secret Now'}
                </button>
            </div>

            <p className="mt-8 text-xs text-gray-400 text-center">
                Powered by CRED Secure
            </p>
        </div>
    );
}
