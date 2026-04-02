'use client';

import { useState, useEffect } from 'react';
import { getLoginLogs } from '@/lib/actions/login-activity';
import { Loader2, Search, Calendar, ChevronLeft, ChevronRight, ShieldAlert, Fingerprint } from 'lucide-react';

export default function LoginActivityTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  useEffect(() => {
    fetchLogs();
  }, [page, search]);

  async function fetchLogs() {
    setLoading(true);
    try {
      // Use search as email filter
      const res = await getLoginLogs({ page, limit, email: search });
      if (res && res.logs) {
        setLogs(res.logs);
        setTotalPages(res.totalPages || 1);
        setTotal(res.total || 0);
      } else {
        setLogs([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

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
              logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-800 hover:bg-[#1A1F2E] transition-colors">
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
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <span className="text-sm text-gray-400">
            Showing <span className="font-semibold text-white">{(page - 1) * limit + 1}</span> to <span className="font-semibold text-white">{Math.min(page * limit, total)}</span> of <span className="font-semibold text-white">{total}</span> Entries
          </span>
          <div className="flex space-x-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 bg-[#1A1A24] border border-gray-700 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-300" />
            </button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 bg-[#1A1A24] border border-gray-700 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
