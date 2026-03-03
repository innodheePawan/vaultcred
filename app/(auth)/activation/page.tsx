'use client';

import React, { useState, useRef } from 'react';
import { Shield, Upload, FileText, CheckCircle2, XCircle, RefreshCw, Lock, Terminal, Info, Key, AlertTriangle, Keyboard } from 'lucide-react';
import { activateProduct } from '@/lib/actions/license';
import { clsx } from 'clsx';

export default function ActivationPage() {
    const [isPasting, setIsPasting] = useState(false);
    const [isManualEntry, setIsManualEntry] = useState(false);
    const [licenseContent, setLicenseContent] = useState('');
    const [fileName, setFileName] = useState('');
    const [isPending, setIsPending] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (event) => {
                setLicenseContent(event.target?.result as string);
                setIsPasting(false);
                setIsManualEntry(false);
            };
            reader.readAsText(file);
        }
    };

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        setError(null);
        setResponse(null);

        if (!fileName && !isPasting && !isManualEntry) {
            setError('Please select an activation method (File, Paste, or Manual).');
            setIsPending(false);
            return;
        }

        const formData = new FormData();
        if (fileName || isPasting) {
            if (!licenseContent.trim()) {
                setError('Please provide the license content.');
                setIsPending(false);
                return;
            }
            formData.append('licenseContent', licenseContent);
        } else {
            const formObj = e.currentTarget as HTMLFormElement;
            const activationKeyInput = formObj.elements.namedItem('activationKey') as HTMLInputElement;
            const apiKeyInput = formObj.elements.namedItem('apiKey') as HTMLInputElement;
            const apiSecretInput = formObj.elements.namedItem('apiSecret') as HTMLInputElement;

            const activationKey = activationKeyInput?.value;
            const apiKey = apiKeyInput?.value;
            const apiSecret = apiSecretInput?.value;

            if (!activationKey || !apiKey || !apiSecret) {
                setError('Please fill in all the manual key fields.');
                setIsPending(false);
                return;
            }

            formData.append('activationKey', activationKey);
            formData.append('apiKey', apiKey);
            formData.append('apiSecret', apiSecret);
        }

        try {
            const result = await activateProduct(formData);
            if (result.success) {
                setResponse(result);
                // Success redirect happens after a short delay or user interaction
                setTimeout(() => window.location.href = '/login', 2500);
            } else {
                setError(result.message);
                if (result.details) setResponse(result.details);
            }
        } catch (err) {
            setError('An unexpected error occurred.');
        } finally {
            setIsPending(false);
        }
    };

    const handleReset = () => {
        setLicenseContent('');
        setFileName('');
        setResponse(null);
        setError(null);
        setIsPasting(false);
        setIsManualEntry(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-10 text-white relative">
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100" fill="none">
                            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor"></path>
                        </svg>
                    </div>
                    <div className="flex flex-col items-center relative z-10">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md mb-4 group-hover:rotate-12 transition-transform duration-300">
                            <Shield className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Product Activation</h1>
                        <p className="mt-2 text-indigo-100 text-center max-w-md">
                            Activate your CRED Secure instance to unlock enterprise-grade credential management.
                        </p>
                    </div>
                </div>

                <div className="p-8">
                    <form onSubmit={handleActivate} className="space-y-8">
                        {/* Input Options */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* File Upload */}
                            <div
                                className={clsx(
                                    "relative border-2 border-dashed rounded-2xl p-6 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer group",
                                    fileName ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10" : "border-gray-300 dark:border-gray-600 hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10"
                                )}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".txt"
                                    onChange={handleFileChange}
                                />
                                <div className={clsx(
                                    "p-3 rounded-full mb-3 mb-3",
                                    fileName ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600" : "bg-gray-100 dark:bg-gray-700 text-gray-400 group-hover:text-indigo-600"
                                )}>
                                    {fileName ? <CheckCircle2 className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                    {fileName ? fileName : "Upload License File"}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {fileName ? "File successfully loaded" : "Click to browse .txt license file"}
                                </p>
                            </div>

                            {/* Paste Content Toggle */}
                            <div
                                className={clsx(
                                    "relative border-2 border-dashed rounded-2xl p-6 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer group",
                                    isPasting ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10" : "border-gray-300 dark:border-gray-600 hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10"
                                )}
                                onClick={() => {
                                    setIsPasting(true);
                                    setIsManualEntry(false);
                                    setFileName('');
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                            >
                                <div className={clsx(
                                    "p-3 rounded-full mb-3",
                                    isPasting ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600" : "bg-gray-100 dark:bg-gray-700 text-gray-400 group-hover:text-indigo-600"
                                )}>
                                    <FileText className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Paste</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Paste license content
                                </p>
                            </div>

                            {/* Manual Entry Toggle */}
                            <div
                                className={clsx(
                                    "relative border-2 border-dashed rounded-2xl p-6 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer group",
                                    isManualEntry ? "border-amber-500 bg-amber-50/30 dark:bg-amber-900/10" : "border-gray-300 dark:border-gray-600 hover:border-amber-500 hover:bg-amber-50/30 dark:hover:bg-amber-900/10"
                                )}
                                onClick={() => {
                                    setIsManualEntry(true);
                                    setIsPasting(false);
                                    setFileName('');
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                            >
                                <div className={clsx(
                                    "p-3 rounded-full mb-3",
                                    isManualEntry ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600" : "bg-gray-100 dark:bg-gray-700 text-gray-400 group-hover:text-amber-600"
                                )}>
                                    <Keyboard className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Enter Manually</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Type your license keys
                                </p>
                            </div>
                        </div>

                        {/* Paste TextArea */}
                        {isPasting && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">License Content</label>
                                <textarea
                                    value={licenseContent}
                                    onChange={(e) => setLicenseContent(e.target.value)}
                                    rows={6}
                                    className="block w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono p-4"
                                    placeholder="Paste the content of your .txt license file here..."
                                />
                            </div>
                        )}

                        {/* Manual Keys */}
                        {isManualEntry && (
                            <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-300">
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Activation Key</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Key className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            name="activationKey"
                                            className="block w-full pl-10 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3"
                                            placeholder="e.g., 8IU8M-N3KYQ-TPFZN-N0H7L-AEDDP"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">API Key</label>
                                        <input
                                            name="apiKey"
                                            className="block w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3"
                                            placeholder="e.g., ak_live_de87fe2b260e9afa2f8510982..."
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">API Secret</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <input
                                                name="apiSecret"
                                                type="password"
                                                className="block w-full pl-10 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3"
                                                placeholder="e.g., sk_live_52cf890e482bd04a17693..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={isPending}
                                className="flex-1 flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all active:scale-[0.98]"
                            >
                                {isPending ? (
                                    <>
                                        <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                        Activating...
                                    </>
                                ) : (
                                    "Activate CRED Secure"
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-6 py-4 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </form>

                    {/* Feedback */}
                    {(error || response) && (
                        <div className="mt-8 space-y-4 animate-in zoom-in-95 duration-300">
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-xl flex gap-3">
                                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-red-800 dark:text-red-400">Activation Failed</h4>
                                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                                    </div>
                                </div>
                            )}

                            {response && response.success && (
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl flex gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-emerald-800 dark:text-emerald-400">Success</h4>
                                        <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">{response.message}</p>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-2 font-medium">Redirecting to dashboard...</p>
                                    </div>
                                </div>
                            )}

                            {/* Raw JSON for Output requirement */}
                            {response && (
                                <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                    <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                        <span className="text-xs font-mono font-bold text-gray-500 uppercase tracking-tighter flex items-center gap-1.5">
                                            <Terminal className="w-3.5 h-3.5" /> API Server Response
                                        </span>
                                    </div>
                                    <pre className="p-4 bg-gray-950 text-indigo-400 text-xs font-mono overflow-x-auto">
                                        {JSON.stringify(response.success ? response : response, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="bg-gray-50 dark:bg-gray-900/50 px-8 py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4 text-[10px] sm:text-xs">
                        <div className="flex items-center gap-1.5 text-gray-500">
                            <Info className="w-3.5 h-3.5" />
                            <span>AES-256-GCM Encryption</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500">
                            <Lock className="w-3.5 h-3.5" />
                            <span>HMAC Signed Request</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500">
                            <Shield className="w-3.5 h-3.5" />
                            <span>Domain Locked Activation</span>
                        </div>
                    </div>
                </div>
            </div>

            <p className="text-center text-gray-500 text-xs mt-8 pb-8">
                &copy; {new Date().getFullYear()} Innodhee Services Pvt Ltd. All rights reserved.
            </p>
        </div>
    );
}
