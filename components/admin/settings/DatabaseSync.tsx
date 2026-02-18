'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { checkDatabaseDrift, syncDatabaseAction } from '@/lib/actions/database';
import { getSyncStatusAction } from '@/lib/actions/setup';

export default function DatabaseSync() {
    const [drift, setDrift] = useState<boolean>(false);
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    const checkDrift = async () => {
        setLoading(true);
        setStatus(null);
        try {
            const result = await checkDatabaseDrift();
            if ('drift' in result) {
                setDrift(result.drift);
                if (result.error) {
                    setStatus({ status: 'ERROR', message: result.error, code: (result as any).code });
                }
            }
        } catch (e: any) {
            setStatus({ status: 'ERROR', message: e.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkDrift();
    }, []);

    // Polling logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (syncing) {
            interval = setInterval(async () => {
                const s = await getSyncStatusAction();
                setStatus(s);
                if (s?.status === 'SUCCESS' || s?.status === 'FAILED') {
                    setSyncing(false);
                    if (s?.status === 'SUCCESS') setDrift(false);
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [syncing]);

    const handleSync = async () => {
        setSyncing(true);
        const res = await syncDatabaseAction();
        if (res.error) {
            alert(res.error);
            setSyncing(false);
        }
    };

    if (loading && !syncing) {
        return (
            <div className="mt-8 flex items-center gap-2 text-sm text-gray-500 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Checking for data model consistency...
            </div>
        );
    }

    return (
        <div className={`mt-8 rounded-lg p-6 border ${drift
            ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
            : 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${drift ? 'bg-amber-100 dark:bg-amber-800' : 'bg-green-100 dark:bg-green-800'}`}>
                        {drift ? (
                            <RefreshCw className={`w-6 h-6 text-amber-600 dark:text-amber-400 ${syncing ? 'animate-spin' : ''}`} />
                        ) : (
                            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                        )}
                    </div>
                    <div>
                        <h4 className={`text-lg font-semibold ${drift ? 'text-amber-900 dark:text-amber-100' : 'text-green-900 dark:text-green-100'}`}>
                            {syncing ? 'Synchronizing Database...' : drift ? 'Schema Update Available' : 'Database is In Sync'}
                        </h4>
                        <p className={`text-sm mt-1 ${drift ? 'text-amber-700 dark:text-amber-300' : 'text-green-700 dark:text-green-300'}`}>
                            {syncing
                                ? 'Applying changes to match the latest application requirements.'
                                : drift
                                    ? 'Changes detected in the data model. Synchronize now to ensure all features work correctly.'
                                    : 'The database schema matches the application requirements perfectly.'}
                        </p>
                    </div>
                </div>

                {(drift || status?.status === 'ERROR') && (
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {syncing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Syncing...
                            </>
                        ) : (
                            status?.status === 'ERROR' ? 'Force Sync Now' : 'Sync Database Now'
                        )}
                    </button>
                )}

                {!drift && !syncing && (
                    <button
                        onClick={checkDrift}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Re-check
                    </button>
                )}
            </div>

            {syncing && status?.logs && (
                <div className="mt-4 bg-black/5 dark:bg-black/40 rounded-md p-4 max-h-40 overflow-y-auto font-mono text-xs space-y-1 text-gray-600 dark:text-gray-400">
                    {status.logs.map((log: string, idx: number) => (
                        <div key={idx} className={log.includes('[ERROR]') ? 'text-red-500' : ''}>
                            {log}
                        </div>
                    ))}
                </div>
            )}

            {status?.status === 'ERROR' && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <div className="flex items-center gap-2 text-red-800 dark:text-red-200 font-medium mb-1">
                        <AlertCircle className="w-4 h-4" />
                        Drift Check Failed
                    </div>
                    <p className="text-xs text-red-600 dark:text-red-400 font-mono">
                        {status.message} {status.code ? `(Code: ${status.code})` : ''}
                    </p>
                </div>
            )}
        </div>
    );
}
