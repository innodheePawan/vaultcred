'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getIpSecurityRecords, unblockIp } from '@/lib/actions/ip-blocks';
import { Loader2, Unlock, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function IpSecurityTab() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const limit = 50;

  useEffect(() => {
    fetchRecords(page === 1);
  }, [page]);

  async function fetchRecords(reset = false) {
    if (reset) setLoading(true);
    try {
      const res = await getIpSecurityRecords(page, limit);
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
      if (reset) setLoading(false);
    }
  }

  const lastElementRef = useCallback((node: HTMLTableRowElement | null) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore]);

  async function handleUnblock(ip: string) {
    if (!confirm(`Are you sure you want to unblock ${ip}?`)) return;
    
    setUnblocking(ip);
    try {
      const res = await unblockIp(ip);
      if (res.success) {
        await fetchRecords();
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
      <div className="flex items-center justify-between">
         <div>
            <h3 className="text-xl font-semibold text-white">IP Security Blocks</h3>
            <p className="text-sm text-gray-400 mt-1">Review and manage automated network-tier blocks.</p>
         </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-sm text-left text-gray-400">
          <thead className="text-xs text-gray-300 uppercase bg-[#1A1A24]">
            <tr>
              <th className="px-6 py-4">IP Address</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Failed Attempts</th>
              <th className="px-6 py-4">Total Blocks</th>
              <th className="px-6 py-4">Last Blocked</th>
              <th className="px-6 py-4text-right">Actions</th>
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
                     <p className="text-gray-400 font-medium">No active or historical blocks found.</p>
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
                    className="border-b border-gray-800 hover:bg-[#1A1F2E] transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-gray-200">
                      {rec.ipAddress}
                    </td>
                    <td className="px-6 py-4">
                       {isCurrentlyBlocked ? (
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {rec.isPermanentBlock ? 'Permanent' : 'Temporarily Blocked'}
                         </span>
                       ) : (
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700">
                            Historical
                         </span>
                       )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-center text-gray-300">
                       {rec.failedAttempts}
                    </td>
                    <td className="px-6 py-4 text-center">
                       {rec.totalBlockCount}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {rec.lastBlockAt ? new Date(rec.lastBlockAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button
                         onClick={() => handleUnblock(rec.ipAddress)}
                         disabled={unblocking === rec.ipAddress}
                         className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-md transition-colors disabled:opacity-50"
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
           <div className="py-4 flex justify-center border-t border-gray-800">
             <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
             <span className="ml-2 text-gray-400 text-sm">Loading more records...</span>
           </div>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <span className="text-sm text-gray-500">
          Total Blocks Found: <span className="font-semibold text-gray-400">{total}</span>
        </span>
      </div>
    </div>
  );
}
