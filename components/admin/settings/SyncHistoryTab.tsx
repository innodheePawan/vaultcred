'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { Button } from '@/components/ui/button';
import { retrySynchronizationAction } from '@/lib/actions/sync-targets';
import {
  Search,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  RefreshCcw,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  Play,
  Loader2,
  ChevronRight,
  X,
  Copy,
  Check,
  Filter,
} from 'lucide-react';

interface SyncHistoryTabProps {
  historyData: {
    data: any[];
    total: number;
    page: number;
    totalPages: number;
  };
  targets: any[];
  canRetry: boolean;
  currentPage: number;
  currentLimit: number;
}

export default function SyncHistoryTab({
  historyData,
  targets,
  canRetry,
  currentPage,
  currentLimit,
}: SyncHistoryTabProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<'APPLY' | 'REFRESH' | 'RESET' | null>(null);

  React.useEffect(() => {
    if (!isPending) {
      setActiveAction(null);
    }
  }, [isPending]);

  // Filters State
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'ALL');
  const [targetId, setTargetId] = useState(searchParams.get('targetId') || 'ALL');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [dateError, setDateError] = useState('');

  // Details Modal State
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Apply filters to URL query
  const handleApplyFilters = () => {
    if (startDate && endDate && startDate > endDate) {
      setDateError('Start date cannot be after end date.');
      return;
    }
    setDateError('');

    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1'); // reset to page 1

    if (search.trim()) params.set('search', search.trim());
    else params.delete('search');

    if (status !== 'ALL') params.set('status', status);
    else params.delete('status');

    if (targetId !== 'ALL') params.set('targetId', targetId);
    else params.delete('targetId');

    if (startDate) params.set('startDate', startDate);
    else params.delete('startDate');

    if (endDate) params.set('endDate', endDate);
    else params.delete('endDate');

    setActiveAction('APPLY');
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setStatus('ALL');
    setTargetId('ALL');
    setStartDate('');
    setEndDate('');
    setDateError('');

    const params = new URLSearchParams();
    params.set('tab', 'history');
    setActiveAction('RESET');
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  // Explicit refresh history trigger
  const handleRefresh = () => {
    setActiveAction('REFRESH');
    startTransition(() => {
      router.refresh();
    });
  };

  // Run Manual Retry
  const handleRetry = async (id: string) => {
    if (!confirm('Are you sure you want to retry this synchronization? This will create a new synchronization attempt and a new Audit Log entry.')) {
      return;
    }

    setRetryingId(id);
    startTransition(async () => {
      try {
        const res = await retrySynchronizationAction(id);
        if (res && res.success) {
          alert(res.message || 'Retry triggered successfully!');
          // Refresh page
          router.refresh();
        } else {
          alert((res && res.error) || 'Failed to trigger retry.');
        }
      } finally {
        setRetryingId(null);
      }
    });
  };

  const getStatusBadge = (status: string, startedAt?: Date | string) => {
    let displayStatus = status;
    if (status === 'IN_PROGRESS' && startedAt) {
      const elapsed = Date.now() - new Date(startedAt).getTime();
      if (elapsed > 5 * 60 * 1000) { // 5 minutes threshold
        displayStatus = 'TIMED_OUT';
      }
    }

    switch (displayStatus) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Success
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800/30">
            <XCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      case 'TIMED_OUT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" /> Timed Out
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30 animate-pulse">
            <Clock className="w-3.5 h-3.5 animate-spin" /> In Progress
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border border-gray-200 dark:border-gray-800/30">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
      case 'SKIPPED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30">
            <Clock className="w-3.5 h-3.5" /> Skipped
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-850 dark:bg-gray-800 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Layout */}
      <div className="flex flex-col gap-4 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-200 dark:border-gray-700/80">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search credential or target..."
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-650 text-gray-900 dark:text-white text-sm rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
              />
            </div>

            {/* Target Filter */}
            <div className="w-full sm:w-48">
              <select
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-650 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
              >
                <option value="ALL">All Targets</option>
                {targets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-40">
              <select
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-650 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="PENDING">Pending</option>
                <option value="SKIPPED">Skipped</option>
              </select>
            </div>
          </div>

          {/* Date range and controls */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center w-full lg:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="date"
                className="w-full sm:w-auto bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-650 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="Start Date"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                className="w-full sm:w-auto bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-650 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="End Date"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button onClick={handleApplyFilters} size="sm" className="w-full sm:w-auto" disabled={isPending}>
                {isPending && activeAction === 'APPLY' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Filter className="w-4 h-4 mr-2" />
                )}
                Apply
              </Button>
              <button
                onClick={handleRefresh}
                disabled={isPending}
                className="p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors disabled:opacity-50"
                title="Refresh History"
              >
                {isPending && activeAction === 'REFRESH' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCcw className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleResetFilters}
                disabled={isPending}
                className="p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors disabled:opacity-50"
                title="Reset Filters"
              >
                {isPending && activeAction === 'RESET' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {dateError && (
          <div className="flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle className="w-3.5 h-3.5" />
            {dateError}
          </div>
        )}
      </div>

      {/* History Records Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-semibold text-left">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Credential details</th>
                <th className="px-6 py-3">Target Details</th>
                <th className="px-6 py-3">Operation</th>
                <th className="px-6 py-3">Result</th>
                <th className="px-6 py-3">Initiated By</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
              {historyData.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No synchronization logs found.
                  </td>
                </tr>
              ) : (
                historyData.data.map((record) => {
                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors"
                    >
                      {/* Timestamp */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                        {new Date(record.startedAt).toLocaleString()}
                      </td>

                      {/* Credential */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {record.credentialName}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Type: {record.credentialType} | v{record.version}
                        </div>
                      </td>

                      {/* Target */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          {record.targetName} {!record.targetId && ' (Deleted)'}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {record.platform}
                        </div>
                      </td>

                      {/* Operation */}
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                        <span className="bg-gray-100 dark:bg-gray-900 px-2 py-0.5 rounded font-semibold text-gray-700 dark:text-gray-300">
                          {record.operation}
                        </span>
                      </td>

                      {/* Result */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(record.status, record.startedAt)}
                      </td>

                      {/* Initiator */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        {record.initiatedByName}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* View Details */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedRecord(record)}
                            title="View log details"
                          >
                            <Eye className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white" />
                          </Button>

                          {/* Retry */}
                          {canRetry && record.status === 'FAILED' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRetry(record.id)}
                              disabled={isPending}
                              title="Retry synchronization"
                            >
                              {retryingId === record.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                              ) : (
                                <Play className="w-4 h-4 text-blue-600 hover:text-blue-700 dark:text-blue-400" />
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <PaginationControls
          currentPage={currentPage}
          totalPages={historyData.totalPages}
          totalItems={historyData.total}
          currentLimit={currentLimit}
        />
      </div>

      {/* VIEW DETAILS OVERLAY MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Synchronization Details
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Duration: {selectedRecord.durationMs} ms
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Details */}
            <div className="p-6 space-y-6 text-sm">
              {/* Category Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* General Info */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-1.5">
                    General
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex gap-2 items-start">
                      <span className="text-gray-500 w-28 shrink-0 text-left">Execution Type:</span>
                      <span className="font-mono font-semibold text-left truncate max-w-[150px] block" title={selectedRecord.executionType}>{selectedRecord.executionType}</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <span className="text-gray-500 w-28 shrink-0 text-left">Started At:</span>
                      <span className="text-gray-800 dark:text-gray-200 text-left truncate max-w-[160px] block" title={new Date(selectedRecord.startedAt).toLocaleString()}>
                        {new Date(selectedRecord.startedAt).toLocaleString()}
                      </span>
                    </div>
                    {selectedRecord.status !== 'IN_PROGRESS' && selectedRecord.status !== 'PENDING' && (
                      <div className="flex gap-2 items-start">
                        <span className="text-gray-500 w-28 shrink-0 text-left">Completed At:</span>
                        <span className="text-gray-800 dark:text-gray-200 text-left truncate max-w-[160px] block" title={new Date(selectedRecord.completedAt).toLocaleString()}>
                          {new Date(selectedRecord.completedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedRecord.parentHistoryId && (
                      <div className="flex gap-2 items-start">
                        <span className="text-gray-500 w-28 shrink-0 text-left">Retried From:</span>
                        <span className="font-mono font-semibold truncate max-w-[150px] text-left block" title={selectedRecord.parentHistoryId}>
                          {selectedRecord.parentHistoryId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Credential Info */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-1.5">
                    Credential
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex gap-2 items-start">
                      <span className="text-gray-500 w-28 shrink-0 text-left">Name:</span>
                      <span className="font-semibold text-gray-900 dark:text-white text-left truncate max-w-[150px] block" title={selectedRecord.credentialName}>{selectedRecord.credentialName}</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <span className="text-gray-550 w-28 shrink-0 text-left">Category:</span>
                      <span className="text-left truncate max-w-[150px] block" title={selectedRecord.category || '-'}>{selectedRecord.category || '-'}</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <span className="text-gray-500 w-28 shrink-0 text-left">Environment:</span>
                      <span className="text-left truncate max-w-[150px] block" title={selectedRecord.environment || '-'}>{selectedRecord.environment || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Target Info */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-1.5">
                    Target
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex gap-2 items-start">
                      <span className="text-gray-500 w-28 shrink-0 text-left">Name:</span>
                      <span className="font-semibold text-gray-900 dark:text-white text-left truncate max-w-[150px] block" title={selectedRecord.targetName}>
                        {selectedRecord.targetName} {!selectedRecord.targetId && ' (Deleted)'}
                      </span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <span className="text-gray-500 w-28 shrink-0 text-left">Platform:</span>
                      <span className="text-left truncate max-w-[150px] block" title={selectedRecord.platform}>{selectedRecord.platform}</span>
                    </div>
                    {selectedRecord.httpStatus !== null && selectedRecord.httpStatus !== undefined && (
                      <div className="flex gap-2 items-start">
                        <span className="text-gray-500 w-28 shrink-0 text-left">HTTP Status:</span>
                        <span
                          className={`font-semibold px-2 py-0.5 rounded border text-left truncate max-w-[150px] block text-xs ${
                            selectedRecord.httpStatus < 400
                              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30'
                              : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30'
                          }`}
                          title={String(selectedRecord.httpStatus)}
                        >
                          {selectedRecord.httpStatus}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Operation Info */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-1.5">
                    Operation
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex gap-2 items-start">
                      <span className="text-gray-500 w-28 shrink-0 text-left">Operation:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400 text-left truncate max-w-[150px] block" title={selectedRecord.operation}>{selectedRecord.operation}</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-gray-500 w-28 shrink-0 text-left">Initiated By:</span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-left truncate max-w-[120px] block" title={selectedRecord.initiatedByName}>
                          {selectedRecord.initiatedByName}
                        </span>
                        <button
                          onClick={() => handleCopy(selectedRecord.initiatedByName, 'initiatedBy')}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                          title="Copy User ID"
                        >
                          {copiedId === 'initiatedBy' ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2 items-start">
                      <span className="text-gray-500 w-28 shrink-0 text-left">Result Status:</span>
                      <span className="text-left">{getStatusBadge(selectedRecord.status, selectedRecord.startedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Headers and Bodies display (Sanitized) - Failures only */}
              {selectedRecord.status === 'FAILED' && (
                <>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-1.5">
                      Request Headers (Sanitized)
                    </h4>
                    {selectedRecord.requestHeaders ? (
                      <pre className="p-3 bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap select-all border border-gray-200 dark:border-gray-800/80">
                        {JSON.stringify(JSON.parse(selectedRecord.requestHeaders), null, 2)}
                      </pre>
                    ) : (
                      <p className="text-xs text-gray-500 italic">No request headers recorded.</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-1.5">
                      Request Body (Sanitized)
                    </h4>
                    {selectedRecord.requestBody ? (
                      <pre className="p-3 bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap select-all border border-gray-200 dark:border-gray-800/80">
                        {selectedRecord.requestBody.trim().startsWith('{') || selectedRecord.requestBody.trim().startsWith('[') ? (
                          (() => {
                            try {
                              return JSON.stringify(JSON.parse(selectedRecord.requestBody), null, 2);
                            } catch {
                              return selectedRecord.requestBody;
                            }
                          })()
                        ) : (
                          selectedRecord.requestBody
                        )}
                      </pre>
                    ) : (
                      <p className="text-xs text-gray-550 italic">No request body recorded.</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-1.5">
                      Response Headers
                    </h4>
                    {selectedRecord.responseHeaders ? (
                      <pre className="p-3 bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap select-all border border-gray-200 dark:border-gray-800/80">
                        {JSON.stringify(JSON.parse(selectedRecord.responseHeaders), null, 2)}
                      </pre>
                    ) : (
                      <p className="text-xs text-gray-500 italic">No response headers recorded.</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-1.5">
                      Response Body
                    </h4>
                    {selectedRecord.responseBody ? (
                      <pre className="p-3 bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap select-all border border-gray-200 dark:border-gray-800/80">
                        {selectedRecord.responseBody.trim().startsWith('{') || selectedRecord.responseBody.trim().startsWith('[') ? (
                          (() => {
                            try {
                              return JSON.stringify(JSON.parse(selectedRecord.responseBody), null, 2);
                            } catch {
                              return selectedRecord.responseBody;
                            }
                          })()
                        ) : (
                          selectedRecord.responseBody
                        )}
                      </pre>
                    ) : (
                      <p className="text-xs text-gray-500 italic">No response body recorded.</p>
                    )}
                  </div>
                </>
              )}

              {/* Error messages */}
              {selectedRecord.status === 'FAILED' && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-red-600 dark:text-red-400 border-b border-red-100 dark:border-red-950/40 pb-1.5">
                    Error Message
                  </h4>
                  <div className="p-3.5 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/30 text-xs font-mono whitespace-pre-wrap">
                    {selectedRecord.errorMessage || 'Unknown Error'}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
              <span className="text-xs text-gray-500">
                Sensitive details in request/response bodies are masked.
              </span>
              <div className="flex gap-2">
                {canRetry && selectedRecord.status === 'FAILED' && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      const id = selectedRecord.id;
                      setSelectedRecord(null);
                      handleRetry(id);
                    }}
                    disabled={isPending}
                  >
                    <Play className="w-4 h-4 mr-2" /> Retry Now
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setSelectedRecord(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
