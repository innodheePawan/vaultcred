'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, RefreshCcw, ExternalLink, Trash2, Copy, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
import { getMySecrets, revokeSecret } from '@/lib/actions/secrets';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PaginationControls } from '@/components/ui/PaginationControls';

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
    const [secrets, setSecrets] = useState<any>({ data: [], total: 0, page: 1, totalPages: 0, permissions: { CREATE: false, DELETE: false, VIEW: false } });
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();

    const fetchSecrets = async () => {
        setLoading(true);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        
        const data = await getMySecrets(page, limit);

        // If the user is external, getMySecrets returns an error object, check for it
        if (data && 'error' in data && data.error === 'Unauthorized') {
            router.push('/dashboard');
            return;
        }

        setSecrets(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchSecrets();
    }, [searchParams]);

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
        <div className="container mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">One-Time Secrets</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm sm:text-base">Manage your secure links and shared secrets.</p>
                    {process.env.NODE_ENV === 'development' && (
                        <div className="text-xs text-red-500 font-mono">
                            DEBUG ROLE: {session?.user?.role} | SERVER PERMS CREATE: {String(secrets.permissions?.CREATE)}
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                    {secrets.permissions?.DELETE && (
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
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20 transition text-sm font-medium"
                        >
                            <Trash2 className="w-4 h-4" />
                            Cleanup Expired
                        </button>
                    )}
                    {secrets.permissions?.CREATE && (
                        <Link
                            href="/one-time-secrets/create"
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            Share New Secret
                        </Link>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
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
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-505">
                                        Loading secrets...
                                    </td>
                                </tr>
                            ) : secrets.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No active secrets found. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                secrets.data.map((secret: Secret) => (
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

                {/* Mobile Cards List View */}
                <div className="block md:hidden divide-y divide-gray-100 dark:divide-gray-700/50">
                    {loading ? (
                        <div className="p-6 text-center text-gray-500">Loading secrets...</div>
                    ) : secrets.data.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No active secrets found. Create one to get started.</div>
                    ) : (
                        secrets.data.map((secret: Secret) => (
                            <div key={secret.id} className="p-4 flex flex-col gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {secret.name || 'Untitled Secret'}
                                        </h3>
                                        <div className="text-xs text-gray-550 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                                            {secret.sharedVia === 'EMAIL' ? '📧 Email' : '🔗 Link'}
                                            {secret.recipientEmail && <span className="truncate max-w-[150px] font-medium">: {secret.recipientEmail}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <SecretStatusBadge status={secret.status} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-[11px] mt-1 border-y border-gray-100 dark:border-gray-700/40 py-2">
                                    <div>
                                        <span className="text-gray-400 dark:text-gray-500 block font-medium">Views</span>
                                        <span className="text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-1 mt-0.5">
                                            {secret.currentViews} / {secret.maxViews}
                                        </span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-gray-400 dark:text-gray-500 block font-medium">Expires</span>
                                        <span className="text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-1 mt-0.5" title={new Date(secret.expiresAt).toLocaleString()}>
                                            <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                                            {getTimeRemaining(new Date(secret.expiresAt))}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-[10px] text-gray-400">
                                        Created {new Date(secret.createdAt).toLocaleDateString()}
                                    </span>
                                    {secret.status === 'ACTIVE' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => copyLink(secret.token)}
                                                className="px-2.5 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded border border-indigo-200 dark:border-indigo-800 flex items-center gap-1"
                                                title="Copy Link"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                                Copy
                                            </button>
                                            <button
                                                onClick={() => handleRevoke(secret.id)}
                                                className="px-2.5 py-1.5 text-xs font-semibold text-red-605 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded border border-red-200 dark:border-red-800 flex items-center gap-1"
                                                title="Revoke Access"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Revoke
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            
            {secrets.total > 0 && !loading && (
                <PaginationControls
                    currentPage={secrets.page}
                    totalPages={secrets.totalPages}
                    totalItems={secrets.total}
                    currentLimit={parseInt(searchParams.get('limit') || '10', 10)}
                />
            )}
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
