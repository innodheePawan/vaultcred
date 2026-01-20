import { getAuditLogs } from '@/lib/actions/audit';
import AuditLogTable from '@/components/admin/audit/AuditLogTable';
import AuditLogFilters from '@/components/admin/audit/AuditLogFilters';

export default async function AuditLogPage({ searchParams }: { searchParams: any }) {
    const page = Number(searchParams?.page) || 1;
    const limit = 20;
    const search = searchParams?.search || '';
    const startDate = searchParams?.startDate;
    const endDate = searchParams?.endDate;
    const action = searchParams?.action;
    const sortBy = searchParams?.sortBy || 'performedOn';
    const sortOrder = searchParams?.sortOrder || 'desc';

    const { data, total, totalPages, error } = await getAuditLogs({
        page,
        limit,
        search,
        startDate,
        endDate,
        action,
        sortBy,
        sortOrder
    });

    if (error) {
        return <div className="p-8 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Track all system activities, access, and modifications.
                </p>
            </div>

            <AuditLogFilters />

            {/* Summary Stats Optional */}

            <AuditLogTable
                data={data}
                page={page}
                totalPages={totalPages}
            />
        </div>
    );
}
