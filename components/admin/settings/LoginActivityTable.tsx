'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { getLoginLogs, archiveLoginLogs, getArchivalStatus } from '@/lib/actions/login-activity';
import {
    Search,
    Filter,
    Database,
    History,
    AlertCircle,
    CheckCircle2,
    XCircle,
    ShieldAlert,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Calendar,
    Archive
} from 'lucide-react';

export default function LoginActivityTable() {
    const [logs, setLogs] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isPending, startTransition] = useTransition();

    const [filters, setFilters] = useState({
        email: '',
        outcome: 'ALL',
        category: 'ALL',
        ipAddress: ''
    });

    const [archivalStatus, setArchivalStatus] = useState<any>(null);

    const loadLogs = async () => {
        startTransition(async () => {
            const result = await getLoginLogs({ ...filters, page });
            setLogs(result.logs);
            setTotal(result.total);
            setTotalPages(result.totalPages);
        });
    };

    const loadArchivalStatus = async () => {
        const status = await getArchivalStatus();
        setArchivalStatus(status);
    };

    useEffect(() => {
        loadLogs();
        loadArchivalStatus();
    }, [page, filters]);

    const handleArchive = async () => {
        if (!confirm('Are you sure you want to move successful logins older than 7 days to cold storage? This helps keep the active management console fast.')) return;

        startTransition(async () => {
            const result = await archiveLoginLogs();
            if (result.success) {
                alert(result.message);
                loadLogs();
                loadArchivalStatus();
            } else {
                alert(result.error);
            }
        });
    };

    const getOutcomeIcon = (outcome: string) => {
        switch (outcome) {
            case 'SUCCESS': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'FAILURE': return <XCircle className="w-4 h-4 text-red-500" />;
            case 'BLOCKED': return <ShieldAlert className="w-4 h-4 text-orange-500" />;
            default: return null;
        }
    };

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'HIGH': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'MEDIUM': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            default: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        }
    };

    return (
        <div className="space-y-4">
            {/* Archival Banner */}
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex gap-3">
                    <History className="w-5 h-5 text-indigo-500 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Archival Status</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {archivalStatus?.lastLoginArchivedAt
                                ? `Last archived: ${new Date(archivalStatus.lastLoginArchivedAt).toLocaleString()} (Batch: ${archivalStatus.lastArchiveBatchId?.slice(0, 8)}...)`
                                : 'No archival history recorded.'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleArchive}
                    disabled={isPending}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50"
                >
                    {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Archive className="w-3 h-3" />}
                    Archive Successful Logins
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Email..."
                        value={filters.email}
                        onChange={(e) => setFilters(f => ({ ...f, email: e.target.value }))}
                        className="pl-9 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-xs"
                    />
                </div>
                <div className="relative">
                    <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="IP Address..."
                        value={filters.ipAddress}
                        onChange={(e) => setFilters(f => ({ ...f, ipAddress: e.target.value }))}
                        className="pl-9 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-xs"
                    />
                </div>
                <select
                    value={filters.outcome}
                    onChange={(e) => setFilters(f => ({ ...f, outcome: e.target.value }))}
                    className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-xs"
                >
                    <option value="ALL">All Outcomes</option>
                    <option value="SUCCESS">Success</option>
                    <option value="FAILURE">Failure</option>
                    <option value="BLOCKED">Blocked</option>
                </select>
                <select
                    value={filters.category}
                    onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
                    className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-xs"
                >
                    <option value="ALL">All Categories</option>
                    <option value="AUTHENTICATION">Authentication</option>
                    <option value="MFA">MFA (2FA)</option>
                    <option value="ACCOUNT_STATUS">Account Status</option>
                </select>
                <div className="flex items-center justify-end gap-2 text-xs text-gray-500">
                    <span className="font-bold text-gray-900 dark:text-white">{total}</span> Results
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Timestamp</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User / Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Outcome</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Risk</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category / Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Context</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {isPending && logs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400 text-sm">
                                    No login activity found for the selected filters.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col">
                                            <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                                            <span className="opacity-70">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{log.email}</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-widest">{log.authMethod}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-xs font-semibold">
                                            {getOutcomeIcon(log.outcome)}
                                            <span className={log.outcome === 'SUCCESS' ? 'text-green-700 dark:text-green-400' : log.outcome === 'FAILURE' ? 'text-red-700 dark:text-red-400' : 'text-orange-700 dark:text-orange-400'}>
                                                {log.outcome}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getRiskColor(log.riskLevel)}`}>
                                            {log.riskLevel}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-medium text-gray-900 dark:text-white">{log.category}</div>
                                        <div className="text-[10px] text-gray-500 font-mono">{log.reasonCode}</div>
                                        {log.reasonMessage && <p className="text-[10px] text-gray-400 mt-1 italic line-clamp-1">{log.reasonMessage}</p>}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-mono bg-gray-100 dark:bg-gray-900 px-1 rounded w-fit">{log.ipAddress}</span>
                                            <span className="text-[10px] opacity-70 line-clamp-1 max-w-[150px]" title={log.userAgent}>
                                                {log.userAgent}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Showing page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || isPending}
                        className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || isPending}
                        className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
