'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createOneTimeSecret } from '@/lib/actions/secrets';
import { Lock, Mail, Link as LinkIcon, AlertCircle, Clock, Eye, Send } from 'lucide-react';

export default function CreateOneTimeSecretPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        secretData: '',
        name: '',
        maxViews: 1,
        ttlHours: 1,
        sharedVia: 'LINK' as 'LINK' | 'EMAIL',
        recipientEmail: '',
        recipientMessage: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const result = await createOneTimeSecret({
            ...formData,
            maxViews: Number(formData.maxViews),
            ttlHours: Number(formData.ttlHours)
        });

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            // Success
            if (formData.sharedVia === 'LINK') {
                // Show modal or redirect with highlight?
                // For simplicity, redirect to list. But we need to show the link!
                // Actually, if it's LINK, we should show it immediately here or on a success page.
                // The implementation plan says "Show: Copy Link button" on success.
                // I'll update logic to show success state in this component.
                if (result.token) {
                    setSuccessToken(result.token);
                }
                setLoading(false);
            } else {
                // Email sent. Redirect to list.
                router.push('/one-time-secrets');
            }
        }
    };

    const [successToken, setSuccessToken] = useState<string | null>(null);

    if (successToken) {
        return (
            <div className="container mx-auto max-w-2xl px-6 py-12">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-green-600 dark:text-green-300" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Secret Created!</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                        Your secret is ready to share. Copy the link below.
                    </p>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-3 mb-6">
                        <code className="flex-1 font-mono text-sm text-gray-700 dark:text-gray-300 break-all select-all">
                            {window.location.origin}/share/{successToken}
                        </code>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/share/${successToken}`);
                                alert('Copied!');
                            }}
                            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 p-2 rounded-md transition"
                        >
                            Copy
                        </button>
                    </div>

                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => router.push('/one-time-secrets')}
                            className="text-indigo-600 hover:underline"
                        >
                            Go to Secrets List
                        </button>
                        <button
                            onClick={() => {
                                setSuccessToken(null);
                                setFormData({ ...formData, secretData: '', recipientEmail: '' });
                            }}
                            className="text-gray-600 hover:underline"
                        >
                            Create Another
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-3xl px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">New One-Time Secret</h1>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl p-8 space-y-6">

                {/* Secret Data */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Secret Value <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        required
                        value={formData.secretData}
                        onChange={e => setFormData({ ...formData, secretData: e.target.value })}
                        rows={4}
                        placeholder="Paste password, API key, or sensitive note..."
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 bg-gray-50 p-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-base font-mono"
                    />
                </div>

                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Name / Reference (Optional)
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Database Password for John"
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-3"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Expiry */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Valid For
                        </label>
                        <select
                            value={formData.ttlHours}
                            onChange={e => setFormData({ ...formData, ttlHours: Number(e.target.value) })}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-3"
                        >
                            <option value={1}>1 Hour</option>
                            <option value={2}>2 Hours</option>
                            <option value={4}>4 Hours</option>
                            <option value={8}>8 Hours</option>
                            <option value={24}>24 Hours</option>
                            <option value={72}>3 Days</option>
                            <option value={168}>7 Days</option>
                        </select>
                    </div>

                    {/* Max Views */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Eye className="w-4 h-4 inline mr-1" />
                            Max Views
                        </label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 5, 10].map(num => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, maxViews: num })}
                                    className={`px-3 py-2 rounded-md border text-sm transition ${formData.maxViews === num
                                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                        : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700/50'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sharing Method */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                        Sharing Method
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div
                            onClick={() => setFormData({ ...formData, sharedVia: 'LINK' })}
                            className={`cursor-pointer rounded-xl border p-4 flex items-start gap-3 transition ${formData.sharedVia === 'LINK'
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-500'
                                : 'border-gray-200 hover:border-indigo-300 dark:border-gray-700'
                                }`}
                        >
                            <div className={`p-2 rounded-lg ${formData.sharedVia === 'LINK' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                                <LinkIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">One-Time Link</h3>
                                <p className="text-sm text-gray-500">Generate a unique link to copy and share manually.</p>
                            </div>
                        </div>

                        <div
                            onClick={() => setFormData({ ...formData, sharedVia: 'EMAIL' })}
                            className={`cursor-pointer rounded-xl border p-4 flex items-start gap-3 transition ${formData.sharedVia === 'EMAIL'
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-500'
                                : 'border-gray-200 hover:border-indigo-300 dark:border-gray-700'
                                }`}
                        >
                            <div className={`p-2 rounded-lg ${formData.sharedVia === 'EMAIL' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Send via Email</h3>
                                <p className="text-sm text-gray-500">System emails the secure link directly to the recipient.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Email Fields */}
                {formData.sharedVia === 'EMAIL' && (
                    <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Recipient Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.recipientEmail}
                                onChange={e => setFormData({ ...formData, recipientEmail: e.target.value })}
                                placeholder="recipient@example.com"
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-3"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Personal Message (Optional)
                            </label>
                            <textarea
                                value={formData.recipientMessage}
                                onChange={e => setFormData({ ...formData, recipientMessage: e.target.value })}
                                rows={2}
                                placeholder="Hey, here is the password you asked for..."
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-3"
                            />
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 text-sm">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? 'Creating...' : (
                            <>
                                {formData.sharedVia === 'EMAIL' ? <Send className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                {formData.sharedVia === 'EMAIL' ? 'Send Secret' : 'Create Secret Link'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
