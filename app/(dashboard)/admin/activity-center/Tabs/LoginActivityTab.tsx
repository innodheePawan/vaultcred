'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getLoginLogs } from '@/lib/actions/login-activity';
import { Loader2, Search, Calendar, ShieldAlert, Fingerprint } from 'lucide-react';

export default function LoginActivityTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  const limit = 50;
  const MAX_ROWS = 5000;

  useEffect(() => {
    let active = true;

    async function fetchLogs(reset = false) {
      if (reset) {
        setLoading(true);
      } else {
        if (isFetchingNextPage) return;
        setIsFetchingNextPage(true);
      }

      if (!reset && logs.length >= MAX_ROWS) {
        setHasMore(false);
        setIsFetchingNextPage(false);
        return;
      }

      const start = Date.now();
      try {
        const res = await getLoginLogs({ page, limit, email: search });
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
  }, [page, search]);



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
    if (risk === 'HIGH') return 'bg-red-500/10 text-red-500 border-red-500/20';
    if (risk === 'MEDIUM') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  }

  function getOutcomeColor(outcome: string) {
    if (outcome === 'SUCCESS') return 'text-emerald-400';
    if (outcome === 'BLOCKED') return 'text-red-400 font-bold';
    return 'text-amber-400';
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl font-semibold text-white">Security Events</h3>
        <div className="relative w-full sm:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
           <input 
             type="text" 
             placeholder="Search by email..." 
             className="w-full bg-[#1A1A24] border border-gray-700 text-gray-200 text-sm rounded-lg pl-10 p-2.5 focus:ring-blue-500 focus:border-blue-500 outline-none"
             value={search}
             onChange={(e) => {
               setSearch(e.target.value);
               setPage(1); 
               setLogs([]);
             }}
           />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-sm text-left text-gray-400">
          <thead className="text-xs text-gray-300 uppercase bg-[#1A1A24]">
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
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No security events found matching your criteria.
                </td>
              </tr>
            ) : (
              logs.map((log, index) => (
                <tr 
                  key={log.id} 
                  ref={index === logs.length - 1 ? lastElementRef : null}
                  className="border-b border-gray-800 hover:bg-[#1A1F2E] transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-200">
                     <span className="flex items-center gap-2">
                       <Fingerprint className="w-4 h-4 text-gray-500" />
                       {log.email}
                     </span>
                  </td>
                  <td className={`px-6 py-4 ${getOutcomeColor(log.outcome)}`}>
                    {log.outcome}
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex flex-col">
                       <span className="text-gray-300">{log.authMethod}</span>
                       <span className="text-xs text-gray-500 truncate max-w-[150px]" title={log.reasonMessage}>{log.reasonMessage || log.reasonCode}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`px-2.5 py-1 text-xs font-semibold rounded border ${getRiskColor(log.riskLevel)}`}>
                       {log.riskLevel}
                     </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                     <div className="flex flex-col">
                        <span className="text-blue-400">{log.ipAddress}</span>
                        {log.geoCountry && <span className="text-gray-500">{log.geoCountry}</span>}
                     </div>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <div className="flex items-center text-gray-400">
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
           <div className="py-4 flex justify-center border-t border-gray-800">
             <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
             <span className="ml-2 text-gray-400 text-sm">Loading more events...</span>
           </div>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <span className="text-sm text-gray-500">
          Total Events Found: <span className="font-semibold text-gray-400">{total}</span>
        </span>
      </div>
    </div>
  );
}
