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
import { ArrowUpDown, Eye, CheckCircle2, XCircle, Info } from 'lucide-react';
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

export default function ApiLogTable({ data, page, totalPages, searchParams }: any) {
    const router = useRouter();
    const pathname = usePathname();
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

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-gray-50 dark:bg-gray-900">
                        <TableRow>
                            <TableHead
                                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 whitespace-nowrap"
                                onClick={() => handleSort('timestamp')}
                            >
                                Time <ArrowUpDown className="ml-2 h-4 w-4 inline-block text-gray-400" />
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 whitespace-nowrap"
                                onClick={() => handleSort('clientName')}
                            >
                                API Client <ArrowUpDown className="ml-2 h-4 w-4 inline-block text-gray-400" />
                            </TableHead>
                            <TableHead>Endpoint</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-right">Code</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    No API activity logs found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((log: any) => (
                                <TableRow key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <TableCell className="whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                        {formatDateTime(log.timestamp)}
                                    </TableCell>
                                    <TableCell className="text-sm font-medium text-gray-900 dark:text-white">
                                        {log.clientName || 'Unknown Client'}
                                        <div className="text-[10px] text-gray-500 font-mono">{log.apiClientId}</div>
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                                        <div className="flex items-center gap-2">
                                            <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-bold font-mono">
                                                {log.method}
                                            </span>
                                            <span className="truncate max-w-[200px]" title={log.endpoint}>
                                                {log.endpoint}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {log.responseStatus === 'SUCCESS' ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                        <span className={log.httpStatusCode >= 400 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                                            {log.httpStatusCode}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedLog(log)}
                                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                        >
                                            <Info className="w-4 h-4 mr-1" />
                                            Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => handlePageChange(page - 1)}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => handlePageChange(page + 1)}
                    >
                        Next
                    </Button>
                </div>
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
                                onClick={() => handlePageChange(page - 1)}
                                className="rounded-l-md"
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages}
                                onClick={() => handlePageChange(page + 1)}
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
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>API Transaction Details</DialogTitle>
                        <DialogDescription>
                            Full audit log trace for Request ID: {selectedLog?.requestId}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="space-y-1">
                                    <span className="text-gray-500 block">IP Address</span>
                                    <span className="font-mono">{selectedLog.ipAddress || 'Not Captured'}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-gray-500 block">User Agent</span>
                                    <span className="truncate block" title={selectedLog.userAgent}>{selectedLog.userAgent || 'Not Captured'}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-gray-500 block">Auth Strategy</span>
                                    <span className="font-semibold">{selectedLog.authType}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-gray-500 block">Certificate Identity</span>
                                    <span className="font-mono text-xs">{selectedLog.certificateIdentity || 'N/A'}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-gray-500 block">Action Performed</span>
                                    <span className="uppercase">{selectedLog.action}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-gray-500 block">HTTP Outcome</span>
                                    <span className={selectedLog.httpStatusCode >= 400 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                                        {selectedLog.httpStatusCode}
                                    </span>
                                </div>
                            </div>

                            {selectedLog.errorMessage && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
                                    <div className="font-bold flex items-center gap-1 mb-1">
                                        <XCircle className="w-4 h-4" /> Error Description:
                                    </div>
                                    {selectedLog.errorMessage}
                                </div>
                            )}

                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800">
                                <div className="text-xs text-gray-500 mb-2">Internal Metadata</div>
                                <div className="grid grid-cols-2 gap-y-2 text-xs font-mono">
                                    <div>APP: {selectedLog.application || '-'}</div>
                                    <div>ENV: {selectedLog.environment || '-'}</div>
                                    <div>CRED_ID: {selectedLog.credentialId || '-'}</div>
                                    <div>FILE: {selectedLog.fileName || '-'}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
