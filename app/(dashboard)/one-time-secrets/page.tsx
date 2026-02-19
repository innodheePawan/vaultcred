'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, RefreshCcw, ExternalLink, Trash2, Copy, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
import { getMySecrets, revokeSecret } from '@/lib/actions/secrets';
import { useRouter } from 'next/navigation';

// If simple-toast or other toast lib is used, adjust layout. 
// For now I'll use standard window.alert or console if no toast provided in context.
// Checking package.json: no explicit toast lib seen in main dependencies, maybe it's custom.
// I'll stick to a basic UI and maybe adding a simple toast if needed. 
// Wait, 'sonner' or 'react-hot-toast' are common in Next.js.
// I'll use a local state for feedback if uncertain.

type Secret = {
    id: string;
    name: string | null;
    status: string;
    maxViews: number;
    currentViews: number;
    expiresAt: Date;
    createdAt: Date;
    sharedVia: string;
    recipientEmail: string | null;
    token: string;
    createdBy: {
        name: string | null;
        email: string;
    };
};

export default function OneTimeSecretsPage() {
    const [secrets, setSecrets] = useState<Secret[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchSecrets = async () => {
        setLoading(true);
        const data = await getMySecrets();
        // @ts-ignore
        setSecrets(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchSecrets();
    }, []);

    const handleRevoke = async (id: string) => {
        if (!confirm('Are you sure you want to revoke this secret? It will be inaccessible immediately.')) return;

        const result = await revokeSecret(id);
        if (result.success) {
            fetchSecrets();
        } else {
            alert('Failed to revoke secret');
        }
    };

    const copyLink = (token: string) => {
        const link = `${window.location.origin}/share/${token}`;
        navigator.clipboard.writeText(link);
        alert('Link copied to clipboard!');
    };

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">One-Time Secrets</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your secure links and shared secrets.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={async () => {
                            if (!confirm('Delete all expired and revoked secrets? This cannot be undone.')) return;
                            const { deleteExpiredSecrets } = await import('@/lib/actions/secrets');
                            const res = await deleteExpiredSecrets();
                            if (res.error) alert(res.error);
                            else {
                                alert(`Cleanup complete. Removed ${res.count} secrets.`);
                                fetchSecrets();
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20 transition"
                    >
                        <Trash2 className="w-4 h-4" />
                        Cleanup Expired
                    </button>
                    <Link
                        href="/one-time-secrets/create"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        <Plus className="w-5 h-5" />
                        Share New Secret
                    </Link>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">Name / Recipient</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">Views</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">Expires</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">Created</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Loading secrets...
                                    </td>
                                </tr>
                            ) : secrets.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No active secrets found. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                secrets.map((secret) => (
                                    <tr key={secret.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {secret.name || 'Untitled Secret'}
                                            </div>
                                            <div className="text-sm text-gray-500 flex items-center gap-1">
                                                {secret.sharedVia === 'EMAIL' ? '📧 Email:' : '🔗 Link'}
                                                {secret.recipientEmail && <span className="ml-1">{secret.recipientEmail}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <SecretStatusBadge status={secret.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                <Eye className="w-4 h-4 text-gray-400" />
                                                {secret.currentViews} <span className="text-gray-400">/ {secret.maxViews}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="flex items-center gap-2" title={new Date(secret.expiresAt).toLocaleString()}>
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                {getTimeRemaining(new Date(secret.expiresAt))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                            {new Date(secret.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {secret.status === 'ACTIVE' && (
                                                    <>
                                                        <button
                                                            onClick={() => copyLink(secret.token)}
                                                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                            title="Copy Link"
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRevoke(secret.id)}
                                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                            title="Revoke Access"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                {secret.status !== 'ACTIVE' && (
                                                    <span className="text-xs text-gray-400 italic">No actions</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function SecretStatusBadge({ status }: { status: string }) {
    if (status === 'ACTIVE') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle className="w-3.5 h-3.5" />
                Active
            </span>
        );
    }
    if (status === 'REVOKED') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                <XCircle className="w-3.5 h-3.5" />
                Revoked
            </span>
        );
    }
    if (status === 'EXPIRED') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                Expired
            </span>
        );
    }
    return null;
}

function getTimeRemaining(expiry: Date) {
    const total = Date.parse(expiry.toString()) - Date.parse(new Date().toString());
    if (total <= 0) return 'Expired';
    const hours = Math.floor((total / (1000 * 60 * 60)));
    const minutes = Math.floor((total / 1000 / 60) % 60);
    if (hours > 24) return `${Math.floor(hours / 24)} days`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}
