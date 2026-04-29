'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getApiLogs, ApiLogParams } from '@/lib/actions/api-logs';
import { Loader2, Search, Calendar, CheckCircle2, XCircle, RefreshCcw, RotateCcw, AlertCircle } from 'lucide-react';

export default function ApiLogsTab() {
  const getDefaultStartDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState('');
  
  const [appliedStartDate, setAppliedStartDate] = useState(getDefaultStartDate());
  const [appliedEndDate, setAppliedEndDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const limit = 50;
  const MAX_ROWS = 5000;

  useEffect(() => {
    let active = true;

    async function fetchLogs(reset = false) {
      if (reset) {
        setLoading(true);
      } else {
        if (isFetchingNextPage || loading) return;
        setIsFetchingNextPage(true);
      }

      if (!reset && logs.length >= MAX_ROWS) {
        setHasMore(false);
        setIsFetchingNextPage(false);
        return;
      }

      const start = Date.now();
      try {
        const res = await getApiLogs({ 
            page, 
            limit, 
            search: debouncedSearch,
            startDate: appliedStartDate,
            endDate: appliedEndDate
        });
        if (!active) return;

        if (res && !res.error) {
          setLogs(prev => reset ? (res.data || []) : [...prev, ...(res.data || [])]);
          setHasMore((res.page || 1) < (res.totalPages || 1));
          setTotal(res.total || 0);
        } else {
          if (reset) setLogs([]);
          setHasMore(false);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!active) return;
        const elapsed = Date.now() - start;
        const minWait = Math.max(0, 300 - elapsed);
        setTimeout(() => {
          if (!active) return;
          if (reset) setLoading(false);
          else setIsFetchingNextPage(false);
        }, minWait);
      }
    }

    fetchLogs(page === 1);

    return () => {
      active = false;
    };
  }, [page, debouncedSearch, appliedStartDate, appliedEndDate, refreshTrigger]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
    setLogs([]);
    setHasMore(true);
  }, [debouncedSearch]);

  const handleRefresh = () => {
    if (startDate && endDate && startDate > endDate) {
      setDateError('Start Date cannot be after End Date.');
      return;
    }
    setDateError('');
    setPage(1);
    setLogs([]);
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setRefreshTrigger(prev => prev + 1);
    if (containerRef.current) containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    const defStart = getDefaultStartDate();
    setStartDate(defStart);
    setEndDate('');
    setSearch('');
    setDateError('');
    setPage(1);
    setLogs([]);
    setAppliedStartDate(defStart);
    setAppliedEndDate('');
    setRefreshTrigger(prev => prev + 1);
    if (containerRef.current) containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };



  const lastElementRef = useCallback((node: HTMLTableRowElement | null) => {
    if (loading || isFetchingNextPage) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && logs.length < MAX_ROWS) {
        setPage(prev => prev + 1);
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loading, isFetchingNextPage, hasMore, logs.length]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
        <div>
           <h3 className="text-xl font-semibold text-white mb-2">API Telemetry</h3>
           {dateError && (
              <div className="flex items-center text-xs text-red-500 mt-1">
                 <AlertCircle className="w-3 h-3 mr-1" />
                 {dateError}
              </div>
           )}
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full xl:w-auto">
          <div className="relative w-full sm:w-48">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
             <input 
               type="text" 
               placeholder="Search endpoints..." 
               className="w-full bg-[#1A1A24] border border-gray-700 text-gray-200 text-sm rounded-lg pl-10 p-2.5 focus:ring-blue-500 focus:border-blue-500 outline-none"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <input 
                type="datetime-local"
                className="w-full sm:w-auto bg-[#1A1A24] border border-gray-700 text-gray-200 text-sm rounded-lg p-2.5 focus:ring-blue-500 outline-none"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="Start Date"
             />
             <span className="text-gray-500">-</span>
             <input 
                type="datetime-local"
                className="w-full sm:w-auto bg-[#1A1A24] border border-gray-700 text-gray-200 text-sm rounded-lg p-2.5 focus:ring-blue-500 outline-none"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="End Date"
             />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <button 
                onClick={handleRefresh}
                disabled={!!(startDate && endDate && startDate > endDate)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
             >
                <RefreshCcw className="w-4 h-4" />
                Refresh
             </button>
             <button 
                onClick={handleReset}
                className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-gray-700"
                title="Reset Filters"
             >
                <RotateCcw className="w-4 h-4" />
             </button>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-sm text-left text-gray-400">
          <thead className="text-xs text-gray-300 uppercase bg-[#1A1A24]">
            <tr>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">Resource</th>
              <th className="px-6 py-4">Response</th>
              <th className="px-6 py-4">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No api logs found matching your criteria.
                </td>
              </tr>
            ) : (
              logs.map((log, index) => {
                const actionMap: Record<string, string> = {
                    'LIST': 'List Metadata',
                    'LIST_FILES': 'List Files',
                    'DOWNLOAD_FILE': 'Download File',
                    'REVEAL_CREDENTIAL': 'Reveal Credential'
                };
                const actionDisplay = actionMap[log.action] || log.action || 'Unknown Action';

                return (
                <tr 
                  key={log.id}
                  ref={index === logs.length - 1 ? lastElementRef : null}
                  className="border-b border-gray-800 hover:bg-[#1A1F2E] transition-colors"
                >
                  <td className="px-6 py-4">
                     {log.responseStatus === 'SUCCESS' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                     ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                     )}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-200">{log.clientName || 'Unknown Client'}</td>
                  <td className="px-6 py-4">
                     <span className="text-gray-300 font-medium">{actionDisplay}</span>
                  </td>
                  <td className="px-6 py-4">
                     <span className="text-gray-300 truncate max-w-[200px] block" title={log.resourceName}>{log.resourceName || 'Global'}</span>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-1 rounded text-xs font-semibold ${
                       log.httpStatusCode < 400 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                     }`}>
                       {log.httpStatusCode}
                     </span>
                     {log.errorMessage && (
                       <p className="text-xs text-gray-500 mt-1 max-w-[150px] truncate" title={log.errorMessage}>
                         {log.errorMessage}
                       </p>
                     )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-gray-400 text-xs">
                       <Calendar className="w-3 h-3 mr-1" />
                       {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                </tr>
              );
            })
            )}
          </tbody>
        </table>

        {!loading && hasMore && (
           <div className="py-4 flex justify-center border-t border-gray-800">
             <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
             <span className="ml-2 text-gray-400 text-sm">Loading more logs...</span>
           </div>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <span className="text-sm text-gray-500">
          Total API Logs Found: <span className="font-semibold text-gray-400">{total}</span>
        </span>
      </div>
    </div>
  );
}
