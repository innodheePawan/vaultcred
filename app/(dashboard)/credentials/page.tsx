import { getCredentials } from '@/lib/actions/credentials';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Folder, Key, Lock, Terminal } from 'lucide-react';
import { formatDate } from '@/lib/utils'; // I'll need a date formatter

function getIconForType(type: string) {
    switch (type) {
        case 'PASSWORD': return <Lock className="w-4 h-4" />;
        case 'API_KEY': return <Key className="w-4 h-4" />;
        case 'SSH': return <Terminal className="w-4 h-4" />;
        default: return <Folder className="w-4 h-4" />; // Generic
    }
}

import CredentialSearch from '@/components/credentials/CredentialSearch';

export default async function CredentialsPage(props: { searchParams: Promise<{ q?: string }> }) {
    const searchParams = await props.searchParams;
    const query = searchParams?.q;
    const credentials = await getCredentials(query);

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
                <div className="flex gap-4 items-center">
                    <CredentialSearch />
                    <Link href="/credentials/create">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add New
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                {credentials.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                        <p>No credentials found.</p>
                        <Link href="/credentials/create" className="text-indigo-600 hover:underline mt-2 inline-block">
                            Create your first credential
                        </Link>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Type
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Folder
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Last Updated
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
                                                {/* notes are encrypted, can't show in list view */}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                            {cred.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {cred.folder || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {formatDate(cred.updatedAt)}
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
