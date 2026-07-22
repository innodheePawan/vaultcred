'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getIpSecurityRecords, unblockIp } from '@/lib/actions/ip-blocks';
import { Loader2, Unlock, Search, AlertTriangle, ShieldCheck, RefreshCcw, RotateCcw, AlertCircle } from 'lucide-react';

export default function IpSecurityTab() {
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

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [unblocking, setUnblocking] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState('');
  
  const [appliedStartDate, setAppliedStartDate] = useState(getDefaultStartDate());
  const [appliedEndDate, setAppliedEndDate] = useState('');
  const [dateError, setDateError] = useState('');

  const observerRef = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const limit = 50;
  const MAX_ROWS = 5000;

  useEffect(() => {
    let active = true;

    async function fetchRecords(reset = false) {
      if (reset) {
        setLoading(true);
      } else {
        if (isFetchingNextPage || loading) return;
        setIsFetchingNextPage(true);
      }

      if (!reset && records.length >= MAX_ROWS) {
        setHasMore(false);
        setIsFetchingNextPage(false);
        return;
      }

      const start = Date.now();
      try {
        const res = await getIpSecurityRecords(page, limit, appliedStartDate, appliedEndDate, debouncedSearch);
        if (!active) return;

        if (res && res.data) {
          setRecords(prev => reset ? res.data : [...prev, ...res.data]);
          setHasMore(res.page < res.totalPages);
          setTotal(res.total);
        } else {
          if (reset) setRecords([]);
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

    fetchRecords(page === 1);

    return () => {
      active = false;
    };
  }, [page, refreshKey, appliedStartDate, appliedEndDate, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
    setRecords([]);
    setHasMore(true);
  }, [debouncedSearch]);

  const handleRefresh = () => {
    if (startDate && endDate && startDate > endDate) {
      setDateError('Start Date cannot be after End Date.');
      return;
    }
    setDateError('');
    setPage(1);
    setRecords([]);
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setRefreshKey(prev => prev + 1);
    if (containerRef.current) containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    const defStart = getDefaultStartDate();
    setStartDate(defStart);
    setEndDate('');
    setDateError('');
    setPage(1);
    setRecords([]);
    setAppliedStartDate(defStart);
    setAppliedEndDate('');
    setRefreshKey(prev => prev + 1);
    if (containerRef.current) containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };



  const lastElementRef = useCallback((node: HTMLTableRowElement | null) => {
    if (loading || isFetchingNextPage) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && records.length < MAX_ROWS) {
        setPage(prev => prev + 1);
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loading, isFetchingNextPage, hasMore, records.length]);

  async function handleUnblock(ip: string) {
    if (!confirm(`Are you sure you want to unblock ${ip}?`)) return;
    
    setUnblocking(ip);
    try {
      const res = await unblockIp(ip);
      if (res.success) {
        setPage(1);
        setRefreshKey(r => r + 1);
      } else {
        alert(res.error || 'Failed to unblock IP');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while unblocking.');
    } finally {
      setUnblocking(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
         <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">IP Security Blocks</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review and manage automated network-tier blocks.</p>
            {dateError && (
               <div className="flex items-center text-xs text-red-500 mt-2">
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
               placeholder="Search IPs..." 
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
              <th className="px-6 py-4">IP Address</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Failed Attempts</th>
              <th className="px-6 py-4">Total Blocks</th>
              <th className="px-6 py-4">Last Blocked</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                     <ShieldCheck className="w-10 h-10 text-emerald-500 opacity-80" />
                     <p className="text-gray-500 dark:text-gray-400 font-medium">No active or historical blocks found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              records.map((rec, index) => {
                const now = new Date();
                const blockedUntil = rec.blockedUntil ? new Date(rec.blockedUntil) : null;
                const isCurrentlyBlocked = rec.isPermanentBlock || (blockedUntil && blockedUntil > now);
                
                return (
                  <tr 
                    key={rec.id}
                    ref={index === records.length - 1 ? lastElementRef : null}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-gray-900 dark:text-gray-200">
                      {rec.ipAddress}
                    </td>
                    <td className="px-6 py-4">
                       {isCurrentlyBlocked ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                             <AlertTriangle className="w-3.5 h-3.5 text-red-500 dark:text-red-450" />
                             {rec.isPermanentBlock ? 'Permanent' : 'Temporarily Blocked'}
                          </span>
                       ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-650">
                             Historical
                          </span>
                       )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-center text-gray-800 dark:text-gray-200">
                       {rec.failedAttempts}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-850 dark:text-gray-300">
                       {rec.totalBlockCount}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                       {rec.lastBlockAt ? new Date(rec.lastBlockAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button
                         onClick={() => handleUnblock(rec.ipAddress)}
                         disabled={unblocking === rec.ipAddress}
                         className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/20 rounded-md transition-colors disabled:opacity-50"
                       >
                         {unblocking === rec.ipAddress ? (
                           <Loader2 className="w-3.5 h-3.5 animate-spin" />
                         ) : (
                           <Unlock className="w-3.5 h-3.5" />
                         )}
                         Unblock
                       </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        
        {!loading && hasMore && (
           <div className="py-4 flex justify-center border-t border-gray-200 dark:border-gray-700">
             <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
             <span className="ml-2 text-gray-500 dark:text-gray-400 text-sm">Loading more records...</span>
           </div>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Total Blocks Found: <span className="font-semibold text-gray-900 dark:text-gray-200">{total}</span>
        </span>
      </div>
    </div>
  );
}
