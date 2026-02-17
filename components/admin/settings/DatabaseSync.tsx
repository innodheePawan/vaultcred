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
        try {
            const result = await checkDatabaseDrift();
            if ('drift' in result) {
                setDrift(result.drift);
            }
        } catch (e) {
            console.error(e);
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
            <div className="flex items-center gap-2 text-sm text-gray-500 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Checking for schema updates...
            </div>
        );
    }

    if (!drift && !syncing) return null;

    return (
        <div className="mt-8 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg">
                        <RefreshCw className={`w-6 h-6 text-indigo-600 dark:text-indigo-400 ${syncing ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                            {syncing ? 'Synchronizing Database...' : 'Schema Update Available'}
                        </h4>
                        <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                            {syncing
                                ? 'Applying changes to match the latest application requirements.'
                                : 'Changes detected in the data model. Synchronize now to ensure all features work correctly.'}
                        </p>
                    </div>
                </div>

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
                        'Sync Database Now'
                    )}
                </button>
            </div>

            {syncing && status?.logs && (
                <div className="mt-4 bg-black/5 dark:bg-black/40 rounded-md p-4 max-h-40 overflow-y-auto font-mono text-xs space-y-1">
                    {status.logs.map((log: string, idx: number) => (
                        <div key={idx} className={log.includes('[ERROR]') ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}>
                            {log}
                        </div>
                    ))}
                </div>
            )}

            {status?.status === 'SUCCESS' && (
                <div className="mt-4 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    Synchronization completed successfully.
                </div>
            )}

            {status?.status === 'FAILED' && (
                <div className="mt-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    Synchronization failed: {status.error}
                </div>
            )}
        </div>
    );
}
