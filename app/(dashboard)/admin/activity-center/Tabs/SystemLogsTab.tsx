'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getAuditLogs, AuditLogParams } from '@/lib/actions/audit';
import { Loader2, Search, Calendar } from 'lucide-react';

export default function SystemLogsTab() {
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
        const res = await getAuditLogs({ page, limit, search });
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl font-semibold text-white">System Logs</h3>
        <div className="relative w-full sm:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
           <input 
             type="text" 
             placeholder="Search logs..." 
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
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">Credential / Entity</th>
              <th className="px-6 py-4">Performed By</th>
              <th className="px-6 py-4">IP Address</th>
              <th className="px-6 py-4">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No logs found matching your criteria.
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
                    <span className="bg-gray-800 px-2 py-1 rounded text-xs">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">{log.credential?.name || log.newValue || 'System'}</td>
                  <td className="px-6 py-4">
                     {log.performedBy ? (
                       <div className="flex flex-col">
                         <span className="text-gray-200">{log.performedBy.name}</span>
                         <span className="text-xs text-gray-500">{log.performedBy.email}</span>
                       </div>
                     ) : 'System'}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{log.ipAddress || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-gray-400">
                       <Calendar className="w-3 h-3 mr-1" />
                       {new Date(log.performedOn).toLocaleString()}
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
             <span className="ml-2 text-gray-400 text-sm">Loading more logs...</span>
           </div>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <span className="text-sm text-gray-500">
          Total Logs Found: <span className="font-semibold text-gray-400">{total}</span>
        </span>
      </div>
    </div>
  );
}
