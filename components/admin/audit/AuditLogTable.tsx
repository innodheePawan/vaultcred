'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/utils';
import { ArrowUpDown, Eye } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

export default function AuditLogTable({ data, page, totalPages }: any) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [selectedLog, setSelectedLog] = useState<any>(null);

    const handleSort = (column: string) => {
        const params = new URLSearchParams(searchParams);
        const currentSort = params.get('sortBy');
        const currentOrder = params.get('sortOrder');

        if (currentSort === column) {
            params.set('sortOrder', currentOrder === 'asc' ? 'desc' : 'asc');
        } else {
            params.set('sortBy', column);
            params.set('sortOrder', 'desc');
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        const params = new URLSearchParams(searchParams);
        params.set('page', newPage.toString());
        router.replace(`${pathname}?${params.toString()}`);
    };

    const renderSortIcon = (column: string) => {
        return <ArrowUpDown className="ml-2 h-4 w-4 inline-block text-gray-400" />;
    };

    const renderDiff = (log: any) => {
        let diff = null;
        try {
            if (log.newValue) {
                diff = JSON.parse(log.newValue);
            } else if (log.details) {
                // If no newValue (legacy logs?), show details
                return <p className="text-sm text-gray-600 dark:text-gray-300">{log.details}</p>;
            }
        } catch (e) {
            diff = log.newValue; // Fallback to string if parse fails
        }

        if (!diff) return <p className="text-gray-500 italic">No detailed changes available.</p>;

        if (typeof diff === 'string') return <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700">{diff}</pre>;

        // Render Object / Diff
        return (
            <div className="space-y-3">
                {Object.entries(diff).map(([key, val]: [string, any]) => (
                    <div key={key} className="text-sm border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0">
                        <span className="font-semibold capitalize text-gray-700 dark:text-gray-300 block mb-1">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>

                        {val && typeof val === 'object' && 'from' in val && 'to' in val ? (
                            // Differential View
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-xs border border-red-100 dark:border-red-800/30">
                                    <span className="text-red-700 dark:text-red-400 font-semibold mb-1 block">Old Value</span>
                                    <div className="text-gray-800 dark:text-gray-200 break-all">{String(val.from ?? '(empty)')}</div>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-xs border border-green-100 dark:border-green-800/30">
                                    <span className="text-green-700 dark:text-green-400 font-semibold mb-1 block">New Value</span>
                                    <div className="text-gray-800 dark:text-gray-200 break-all">{String(val.to ?? '(empty)')}</div>
                                </div>
                            </div>
                        ) : val && typeof val === 'object' ? (
                            // Nested Object View (Create events mostly)
                            <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-xs font-mono overflow-x-auto border border-gray-200 dark:border-gray-700">
                                <pre>{JSON.stringify(val, null, 2)}</pre>
                            </div>
                        ) : (
                            // Simple Value
                            <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-sm text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                                {String(val)}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-gray-50 dark:bg-gray-900">
                        <TableRow>
                            <TableHead
                                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                onClick={() => handleSort('performedOn')}
                            >
                                Date {renderSortIcon('performedOn')}
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                onClick={() => handleSort('user')}
                            >
                                User {renderSortIcon('user')}
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                onClick={() => handleSort('action')}
                            >
                                Action {renderSortIcon('action')}
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                onClick={() => handleSort('credential')}
                            >
                                Resource {renderSortIcon('credential')}
                            </TableHead>
                            <TableHead>IP Address</TableHead>
                            <TableHead>Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    No audit logs found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((log: any) => (
                                <TableRow key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <TableCell className="whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                        {formatDateTime(log.performedOn)}
                                    </TableCell>
                                    <TableCell className="text-sm font-medium text-gray-900 dark:text-white">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs text-indigo-700 dark:text-indigo-300 font-bold">
                                                {log.performedBy?.name?.[0] || 'S'}
                                            </div>
                                            {log.performedBy?.name || 'System / Unknown'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                                            ${log.action === 'DELETE' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                log.action === 'CREATE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                    log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}
                                        `}>
                                            {log.action}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                                        {log.credential?.name || '-'}
                                    </TableCell>
                                    <TableCell className="text-sm font-mono text-gray-500">
                                        {log.ipAddress || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedLog(log)}
                                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700 dark:text-gray-400">
                            Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                        </p>
                    </div>
                    <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => handlePageChange(Number(page) - 1)}
                                className="rounded-l-md"
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages}
                                onClick={() => handlePageChange(Number(page) + 1)}
                                className="rounded-r-md"
                            >
                                Next
                            </Button>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Detail Dialog */}
            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-xl max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Audit Log Details</DialogTitle>
                        <DialogDescription>
                            {selectedLog && (
                                <div className="mt-2 flex flex-col gap-1 text-xs">
                                    <span className="font-medium">Action: {selectedLog.action}</span>
                                    <span>Date: {formatDateTime(selectedLog.performedOn)}</span>
                                    <span>User: {selectedLog.performedBy?.name || 'System'}</span>
                                    <p className="mt-2 font-mono text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                        {selectedLog.details}
                                    </p>
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto mt-4 px-1">
                        {selectedLog && renderDiff(selectedLog)}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

