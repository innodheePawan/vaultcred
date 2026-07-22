'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getLoginLogs } from '@/lib/actions/login-activity';
import { Loader2, Search, Calendar, ShieldAlert, Fingerprint, RefreshCcw, RotateCcw, AlertCircle } from 'lucide-react';

export default function LoginActivityTab() {
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
        const res = await getLoginLogs({ 
            page, 
            limit, 
            search: debouncedSearch,
            startDate: appliedStartDate,
            endDate: appliedEndDate
        });
        if (!active) return;

        if (res && res.logs) {
          setLogs(prev => reset ? res.logs : [...prev, ...res.logs]);
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

  function getRiskColor(risk: string) {
    if (risk === 'HIGH') return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    if (risk === 'MEDIUM') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  }

  function getOutcomeColor(outcome: string) {
    if (outcome === 'SUCCESS') return 'text-emerald-600 dark:text-emerald-400';
    if (outcome === 'BLOCKED') return 'text-red-600 dark:text-red-400 font-bold';
    return 'text-amber-600 dark:text-amber-400';
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
        <div>
           <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Security Events</h3>
           {dateError && (
              <div className="flex items-center text-xs text-red-500 mt-1">
                 <AlertCircle className="w-3 h-3 mr-1" />
                 {dateError}
              </div>
           )}
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full xl:w-auto">
          <div className="relative w-full sm:w-48">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
             <input 
               type="text" 
               placeholder="Search by email..." 
               className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg pl-10 p-2.5 focus:ring-blue-500 focus:border-blue-500 outline-none"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <input 
                type="datetime-local"
                className="w-full sm:w-auto bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg p-2.5 focus:ring-blue-500 outline-none"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="Start Date"
             />
             <span className="text-gray-500">-</span>
             <input 
                type="datetime-local"
                className="w-full sm:w-auto bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg p-2.5 focus:ring-blue-500 outline-none"
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
                className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-gray-300 dark:border-gray-600"
                title="Reset Filters"
             >
                <RotateCcw className="w-4 h-4" />
             </button>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm text-left text-gray-550 dark:text-gray-400">
          <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-55/80 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-4">Identity</th>
              <th className="px-6 py-4">Outcome</th>
              <th className="px-6 py-4">Method / Reason</th>
              <th className="px-6 py-4">Risk Level</th>
              <th className="px-6 py-4">Network Info</th>
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
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  No security events found matching your criteria.
                </td>
              </tr>
            ) : (
              logs.map((log, index) => (
                <tr 
                  key={log.id} 
                  ref={index === logs.length - 1 ? lastElementRef : null}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200">
                     <span className="flex items-center gap-2">
                       <Fingerprint className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                       {log.email}
                     </span>
                  </td>
                  <td className={`px-6 py-4 ${getOutcomeColor(log.outcome)}`}>
                    {log.outcome}
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex flex-col">
                       <span className="text-gray-800 dark:text-gray-300">{log.authMethod}</span>
                       <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]" title={log.reasonMessage}>{log.reasonMessage || log.reasonCode}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`px-2.5 py-1 text-xs font-semibold rounded border ${getRiskColor(log.riskLevel)}`}>
                       {log.riskLevel}
                     </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                     <div className="flex flex-col">
                        <span className="text-blue-600 dark:text-blue-400">{log.ipAddress}</span>
                        {log.geoCountry && <span className="text-gray-500 dark:text-gray-400">{log.geoCountry}</span>}
                     </div>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                       <Calendar className="w-3 h-3 mr-1" />
                       {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {!loading && hasMore && (
           <div className="py-4 flex justify-center border-t border-gray-200 dark:border-gray-700">
             <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
             <span className="ml-2 text-gray-500 dark:text-gray-400 text-sm">Loading more events...</span>
           </div>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Total Events Found: <span className="font-semibold text-gray-900 dark:text-gray-200">{total}</span>
        </span>
      </div>
    </div>
  );
}
