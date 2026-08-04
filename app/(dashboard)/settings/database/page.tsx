import { getDatabaseInfo } from '@/lib/actions/database';
import { auth } from '@/lib/auth';
import { Database, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { getSafeUserContext, canAccess } from '@/lib/iam/permissions';
import { redirect } from 'next/navigation';

export const maxDuration = 60;

export default async function DatabaseSettingsPage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const ctx = await getSafeUserContext(session.user.id);
    const canView = canAccess(ctx, 'FEATURE:SETTINGS', 'VIEW');
    if (!canView) {
        redirect('/dashboard');
    }

    const info = await getDatabaseInfo();

    if ('error' in info) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg flex items-center gap-3 text-red-800 dark:text-red-200">
                <AlertCircle className="w-5 h-5" />
                <p>Failed to load database information: {info.error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex items-center gap-2">
                                <Database className="w-5 h-5 text-indigo-500" />
                                Database Configuration
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Overview of the current database connection and status.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Connection Status */}
                        <div className="col-span-full mb-4">
                            <div className={`flex items-center gap-3 p-4 rounded-md border ${info.status === 'Connected'
                                ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
                                : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
                                }`}>
                                {info.status === 'Connected' ? (
                                    <CheckCircle className="w-6 h-6" />
                                ) : (
                                    <AlertCircle className="w-6 h-6" />
                                )}
                                <div>
                                    <h4 className="font-semibold text-lg">{info.status}</h4>
                                    {info.status === 'Connected' && (
                                        <p className="text-sm opacity-90 flex items-center gap-1 mt-1">
                                            <Clock className="w-4 h-4" />
                                            Latency: {info.latency}ms
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Connection Details */}
                        <div className="col-span-full bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                                Connection Details
                            </h4>
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                                <div className="flex justify-between md:block">
                                    <dt className="text-sm text-gray-600 dark:text-gray-300">Type</dt>
                                    <dd className="text-sm font-medium text-gray-900 dark:text-white capitalize">{info.type}</dd>
                                </div>
                                <div className="flex justify-between md:block">
                                    <dt className="text-sm text-gray-600 dark:text-gray-300">Host</dt>
                                    <dd className="text-sm font-medium text-gray-900 dark:text-white font-mono">{info.host}</dd>
                                </div>
                                <div className="flex justify-between md:block">
                                    <dt className="text-sm text-gray-600 dark:text-gray-300">Port</dt>
                                    <dd className="text-sm font-medium text-gray-900 dark:text-white font-mono">{info.port}</dd>
                                </div>
                                <div className="flex justify-between md:block">
                                    <dt className="text-sm text-gray-600 dark:text-gray-300">User</dt>
                                    <dd className="text-sm font-medium text-gray-900 dark:text-white font-mono">{info.user}</dd>
                                </div>
                                <div className="flex justify-between md:block">
                                    <dt className="text-sm text-gray-600 dark:text-gray-300">Database Name</dt>
                                    <dd className="text-sm font-medium text-gray-900 dark:text-white font-mono">{info.database}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
