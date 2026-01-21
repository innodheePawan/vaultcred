import { getCredentials } from '@/lib/actions/credentials';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Folder, Key, Lock, Terminal, FileText, ArrowUp, ArrowDown } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Suspense } from 'react';
import CredentialFilters from '@/components/credentials/CredentialFilters';

function getIconForType(type: string) {
    switch (type) {
        case 'PASSWORD': return <Lock className="w-4 h-4" />;
        case 'API_OAUTH': return <Key className="w-4 h-4" />;
        case 'KEY_CERT': return <FileText className="w-4 h-4" />;
        case 'TOKEN': return <Terminal className="w-4 h-4" />;
        case 'FILE': return <Folder className="w-4 h-4" />;
        case 'SECURE_NOTE': return <FileText className="w-4 h-4" />;
        default: return <Folder className="w-4 h-4" />;
    }
}

type SortOrder = 'asc' | 'desc';

function SortableHeader({
    column,
    label,
    currentSort,
    currentOrder,
    searchParams
}: {
    column: string,
    label: string,
    currentSort?: string,
    currentOrder?: string,
    searchParams: any
}) {
    const isSorted = currentSort === column;
    const nextOrder = isSorted && currentOrder === 'asc' ? 'desc' : 'asc';

    // Construct URL Params manually to keep other filters
    const params = new URLSearchParams(searchParams);
    params.set('sort', column);
    params.set('order', nextOrder);

    return (
        <Link href={`/credentials?${params.toString()}`} className="group flex items-center gap-1 hover:text-gray-900 dark:hover:text-white">
            {label}
            <span className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200">
                {isSorted ? (
                    currentOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                ) : (
                    <ArrowDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                )}
            </span>
        </Link>
    );
}

export default async function CredentialsPage(props: {
    searchParams: Promise<{
        q?: string,
        type?: string,
        category?: string,
        environment?: string,
        sort?: string,
        order?: 'asc' | 'desc'
    }>
}) {
    const searchParams = await props.searchParams;
    const { q, type, category, environment, sort, order } = searchParams;

    const credentials = await getCredentials({
        query: q,
        type,
        category,
        environment,
        sort,
        order
    });

    const createLink = type ? `/credentials/create?type=${type}` : '/credentials/create';

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
                        Credentials
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Manage your secure passwords, keys, and tokens.
                    </p>
                </div>
                <Link href={createLink}>
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add New
                    </Button>
                </Link>
            </div>

            <Suspense fallback={<div>Loading filters...</div>}>
                <CredentialFilters />
            </Suspense>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                {credentials.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                        <p>No credentials found matching your filters.</p>
                        {(q || type || category || environment) && (
                            <Link href="/credentials" className="text-indigo-600 hover:underline mt-2 inline-block">
                                Clear all filters
                            </Link>
                        )}
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    <SortableHeader column="name" label="Name" currentSort={sort} currentOrder={order} searchParams={searchParams} />
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    <SortableHeader column="type" label="Type" currentSort={sort} currentOrder={order} searchParams={searchParams} />
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    <SortableHeader column="category" label="Category" currentSort={sort} currentOrder={order} searchParams={searchParams} />
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    <SortableHeader column="environment" label="Env" currentSort={sort} currentOrder={order} searchParams={searchParams} />
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    <SortableHeader column="lastModifiedOn" label="Last Modified" currentSort={sort} currentOrder={order} searchParams={searchParams} />
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Access</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {credentials.map((cred: any) => (
                                <tr key={cred.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                                                {getIconForType(cred.type)}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    <Link href={`/credentials/${cred.id}`} className="hover:underline">
                                                        {cred.name}
                                                    </Link>
                                                </div>
                                                <div className="flex gap-1 mt-1">
                                                    {cred.isPersonal && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800">
                                                            Personal
                                                        </span>
                                                    )}
                                                    {cred.expiryDate && new Date(cred.expiryDate) < new Date() && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-200 dark:border-red-800">
                                                            Expired
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                            {cred.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {cred.category || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${cred.environment === 'Prod' ? 'bg-red-100 text-red-800' :
                                            cred.environment === 'QA' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                            {cred.environment || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {cred.lastModifiedOn ? formatDate(cred.lastModifiedOn) : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link href={`/credentials/${cred.id}`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

