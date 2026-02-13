'use client';

import React, { useState, useTransition } from 'react';
import { unblockIp } from '@/lib/actions/ip-blocks';
import {
    ShieldAlert,
    Unlock,
    Search,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Loader2
} from 'lucide-react';
const formatDistance = (date: Date) => {
    const diff = Math.floor((date.getTime() - Date.now()) / 1000);
    const absDiff = Math.abs(diff);
    if (absDiff < 60) return 'less than a minute';
    const mins = Math.floor(absDiff / 60);
    if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''}`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''}`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
};

type IpRecord = {
    id: string;
    ipAddress: string;
    failedAttempts: number;
    blockedUntil: Date | null;
    blockCount24h: number;
    totalBlockCount: number;
    lastBlockAt: Date | null;
    isPermanentBlock: boolean;
    updatedAt: Date;
};

export default function IpBlockTable({ initialRecords }: { initialRecords: IpRecord[] }) {
    const [records, setRecords] = useState(initialRecords);
    const [searchTerm, setSearchTerm] = useState('');
    const [isPending, startTransition] = useTransition();

    const filteredRecords = records.filter(record =>
        record.ipAddress.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUnblock = async (ipAddress: string) => {
        if (!confirm(`Are you sure you want to unblock ${ipAddress}? This will reset all security history for this IP.`)) return;

        startTransition(async () => {
            const result = await unblockIp(ipAddress);
            if (result.success) {
                setRecords(prev => prev.filter(r => r.ipAddress !== ipAddress));
            } else {
                alert(result.error);
            }
        });
    };

    return (
        <div className="space-y-4">
            {/* Search and Stats */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search IP address..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <span className="font-bold text-gray-900 dark:text-white">{records.length}</span> Total Security Event Records
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">IP Address</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Failures</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Blocked Since/Until</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredRecords.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                    {searchTerm ? 'No matching IP records found.' : 'No security records tracked yet.'}
                                </td>
                            </tr>
                        ) : (
                            filteredRecords.map((record) => {
                                const isBlocked = record.isPermanentBlock || (record.blockedUntil && new Date(record.blockedUntil) > new Date());

                                return (
                                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-white">{record.ipAddress}</span>
                                                {record.isPermanentBlock && (
                                                    <span className="px-1.5 py-0.5 text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded font-bold uppercase tracking-wider">Permanent</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {isBlocked ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    Blocked
                                                </span>
                                            ) : record.failedAttempts > 0 ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200">
                                                    <Clock className="w-3 h-3" />
                                                    Watchlist
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Clean
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {record.failedAttempts} fails (Total: {record.totalBlockCount} blocks)
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {record.isPermanentBlock ? (
                                                <span className="text-red-600 dark:text-red-400 font-medium whitespace-normal">Permanently Blacklisted</span>
                                            ) : record.blockedUntil && new Date(record.blockedUntil) > new Date() ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-orange-600 dark:text-orange-400 truncate max-w-[150px]">
                                                        Expires in {formatDistance(new Date(record.blockedUntil))}
                                                    </span>
                                                    <span className="text-[10px] opacity-70">
                                                        {new Date(record.blockedUntil).toLocaleString()}
                                                    </span>
                                                </div>
                                            ) : record.lastBlockAt ? (
                                                <span className="opacity-70">Last block {formatDistance(new Date(record.lastBlockAt))} ago</span>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => handleUnblock(record.ipAddress)}
                                                disabled={isPending}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlock className="w-3 h-3 pointer-events-none" />}
                                                Unblock
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
