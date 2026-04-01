import { getAuditLogs } from '@/lib/actions/audit';
import { getApiLogs } from '@/lib/actions/api-logs';
import AuditLogTable from '@/components/admin/audit/AuditLogTable';
import ApiLogTable from '@/components/admin/audit/ApiLogTable';
import AuditLogFilters from '@/components/admin/audit/AuditLogFilters';
import Link from 'next/link';

export default async function AuditLogPage(props: { searchParams: Promise<any> }) {
    const searchParams = await props.searchParams;
    const page = Number(searchParams?.page) || 1;
    const limit = 20;
    const search = searchParams?.search || '';
    const startDate = searchParams?.startDate;
    const endDate = searchParams?.endDate;
    const action = searchParams?.action;
    const status = searchParams?.status;
    const sortBy = searchParams?.sortBy || (searchParams?.tab === 'api' ? 'timestamp' : 'performedOn');
    const sortOrder = searchParams?.sortOrder || 'desc';
    const currentTab = searchParams?.tab || 'system';

    const buildTabUrl = (tabStr: string) => {
        const p = new URLSearchParams(searchParams);
        p.set('tab', tabStr);
        p.delete('page');
        return `?${p.toString()}`;
    };

    let logData, logTotal, logTotalPages, logError;

    if (currentTab === 'api') {
        const res = await getApiLogs({
            page, limit, search, startDate, endDate, status, sortBy, sortOrder
        });
        logData = res.data; logTotal = res.total; logTotalPages = res.totalPages; logError = res.error;
    } else {
        const res = await getAuditLogs({
            page, limit, search, startDate, endDate, action, sortBy, sortOrder
        });
        logData = res.data; logTotal = res.total; logTotalPages = res.totalPages; logError = res.error;
    }

    if (logError) {
        return <div className="p-8 text-red-500">Error: {logError}</div>;
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit & Activity Logs</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Track system modifications, access controls, and external integrations.
                    </p>
                </div>
                
                <div className="flex mt-4 sm:mt-0 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    <Link 
                        href={buildTabUrl('system')} 
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${currentTab !== 'api' ? 'bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                    >
                        System Logs
                    </Link>
                    <Link 
                        href={buildTabUrl('api')} 
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${currentTab === 'api' ? 'bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                    >
                        API Logs
                    </Link>
                </div>
            </div>

            <AuditLogFilters isApiTab={currentTab === 'api'} />

            {currentTab === 'api' ? (
                <ApiLogTable data={logData || []} page={page} totalPages={logTotalPages || 1} searchParams={searchParams} />
            ) : (
                <AuditLogTable data={logData || []} page={page} totalPages={logTotalPages || 1} />
            )}
        </div>
    );
}
