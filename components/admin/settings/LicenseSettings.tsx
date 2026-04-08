'use client';

import React, { useState, useRef } from 'react';
import { activateProduct } from '@/lib/actions/license';
import { clsx } from 'clsx';
import { Calendar, Users, ShieldAlert, CheckCircle2, ShieldQuestion, FileText, Upload, RefreshCw, XCircle, Terminal, Key, Lock, Keyboard, Clock } from 'lucide-react';

export default function LicenseSettings({ initialLicense, canEdit = true }: { initialLicense: any, canEdit?: boolean }) {
    const [showRenewalForm, setShowRenewalForm] = useState(false);
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
                // Reload page seamlessly to update state instead of redirecting
                setTimeout(() => window.location.reload(), 2000);
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

    const getStatusColor = (state: string) => {
        switch (state) {
            case 'VALID': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-emerald-500/20';
            case 'GRACE': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 ring-yellow-500/20';
            case 'LOCKED': return 'text-red-500 bg-red-50 dark:bg-red-900/20 ring-red-500/20';
            default: return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20 ring-gray-500/20';
        }
    };

    return (
        <div className="space-y-8">
            {/* Current Details Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Current Application License</h3>
                    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset', getStatusColor(initialLicense?.state))}>
                        {initialLicense?.state || 'UNACTIVATED'}
                    </span>
                </div>

                <div className="p-6">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-1">
                            <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Expires On
                            </dt>
                            <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                                {initialLicense?.validityTill ? new Date(initialLicense.validityTill).toLocaleDateString() : 'N/A'}
                            </dd>
                        </div>
                        <div className="space-y-1">
                            <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Users className="w-4 h-4" /> Active Users Allowed
                            </dt>
                            <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                                {initialLicense?.activeUsers ? initialLicense.activeUsers.toString() : 'N/A'}
                            </dd>
                        </div>
                        <div className="space-y-1">
                            <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Grace Period
                            </dt>
                            <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                                {initialLicense?.gracePeriodDays ? `${initialLicense.gracePeriodDays} Days` : 'N/A'}
                            </dd>
                        </div>
                        <div className="space-y-1">
                            <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <ShieldQuestion className="w-4 h-4" /> Digital Signature
                            </dt>
                            <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                                {initialLicense?.signatureVerified ? (
                                    <span className="text-emerald-500 flex items-center text-sm gap-1"><CheckCircle2 className="w-4 h-4" /> Verified</span>
                                ) : (
                                    <span className="text-red-500 flex items-center text-sm gap-1"><XCircle className="w-4 h-4" /> Invalid</span>
                                )}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* Renewal Form Toggled */}
            {canEdit && (
                !showRenewalForm ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 text-center">
                        <div className="mx-auto w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                            <Upload className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Need to extend your license?</h3>
                        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                            If your existing license is expiring soon or you need to unlock more user seats, apply a new license key here.
                        </p>
                        <button
                            onClick={() => setShowRenewalForm(true)}
                            className="inline-flex justify-center items-center py-2.5 px-6 shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all active:scale-95"
                        >
                            Extend License
                        </button>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Update & Renew License</h3>
                                <p className="text-sm text-gray-500 mt-1">Provide a new valid license to immediately extend or unlock your instance.</p>
                            </div>
                            <button
                                onClick={() => setShowRenewalForm(false)}
                                className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                Cancel
                            </button>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleActivate} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* File Upload */}
                                    <div
                                        className={clsx(
                                            "relative border-2 border-dashed rounded-xl p-4 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer group",
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
                                            "p-2 rounded-full mb-2",
                                            fileName ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600" : "bg-gray-100 dark:bg-gray-700 text-gray-400 group-hover:text-indigo-600"
                                        )}>
                                            {fileName ? <CheckCircle2 className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                                        </div>
                                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                                            {fileName ? fileName : "Upload"}
                                        </h3>
                                    </div>

                                    {/* Paste Content Toggle */}
                                    <div
                                        className={clsx(
                                            "relative border-2 border-dashed rounded-xl p-4 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer group",
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
                                            "p-2 rounded-full mb-2",
                                            isPasting ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600" : "bg-gray-100 dark:bg-gray-700 text-gray-400 group-hover:text-indigo-600"
                                        )}>
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">Paste</h3>
                                    </div>

                                    {/* Manual Entry Toggle */}
                                    <div
                                        className={clsx(
                                            "relative border-2 border-dashed rounded-xl p-4 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer group",
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
                                            "p-2 rounded-full mb-2",
                                            isManualEntry ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600" : "bg-gray-100 dark:bg-gray-700 text-gray-400 group-hover:text-amber-600"
                                        )}>
                                            <Keyboard className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">Manual</h3>
                                    </div>
                                </div>

                                {/* Textarea */}
                                {isPasting && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">License Content</label>
                                        <textarea
                                            value={licenseContent}
                                            onChange={(e) => setLicenseContent(e.target.value)}
                                            rows={4}
                                            className="block w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono p-3"
                                            placeholder="Paste .txt license content..."
                                        />
                                    </div>
                                )}

                                {/* Manual Form */}
                                {isManualEntry && (
                                    <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-300">
                                        <div className="space-y-1">
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Activation Key</label>
                                            <input
                                                name="activationKey"
                                                className="block w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5"
                                                placeholder="e.g., 8IU8M-N3KYQ..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">API Key</label>
                                                <input
                                                    name="apiKey"
                                                    className="block w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5"
                                                    placeholder="ak_live_..."
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">API Secret</label>
                                                <input
                                                    name="apiSecret"
                                                    type="password"
                                                    className="block w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5"
                                                    placeholder="sk_live_..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={isPending || (!fileName && !isPasting && !isManualEntry)}
                                        className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                    >
                                        {isPending ? <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" /> : null}
                                        {isPending ? "Validating..." : "Apply License Update"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </form>

                            {/* Feedback */}
                            {(error || response) && (
                                <div className="mt-6">
                                    {error && (
                                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-lg flex gap-3 text-sm">
                                            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                            <span className="text-red-800 dark:text-red-400">{error}</span>
                                        </div>
                                    )}

                                    {response && response.success && (
                                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40 rounded-lg flex gap-3 text-sm">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                            <div>
                                                <span className="font-semibold text-emerald-800 dark:text-emerald-400">Success! </span>
                                                <span className="text-emerald-700 dark:text-emerald-300">{response.message}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Dump error logs if requested */}
                                    {response && !response.success && (
                                        <pre className="mt-3 p-3 bg-gray-950 text-indigo-400 text-xs font-mono rounded-lg overflow-x-auto">
                                            {JSON.stringify(response, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )
            )}
        </div>
    );
}
