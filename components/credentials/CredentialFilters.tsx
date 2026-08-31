'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Search, X } from 'lucide-react';

export default function CredentialFilters() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const [isPending, startTransition] = useTransition();

    const filters = [
        { key: 'type', label: 'Type', options: ['PASSWORD', 'API_OAUTH', 'KEY_CERT', 'TOKEN', 'SECURE_NOTE', 'FILE'] },
        { key: 'category', label: 'Category', options: ['Application', 'Infra', 'Integration'] },
        { key: 'environment', label: 'Env', options: ['Dev', 'QA', 'Prod'] },
    ];

    function handleParamChange(key: string, value: string) {
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        startTransition(() => {
            replace(`${pathname}?${params.toString()}`);
        });
    }

    function clearFilters() {
        startTransition(() => {
            replace(pathname);
        });
    }

    const hasFilters = searchParams.toString().length > 0;

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-center mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            {/* Search */}
            <div className="relative flex-grow w-full sm:max-w-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </div>
                <input
                    type="text"
                    className="block w-full rounded-md border border-gray-300 dark:border-gray-600 pl-10 pr-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:border-indigo-500 focus:ring-indigo-500 shadow-xs"
                    placeholder="Search name, username..."
                    defaultValue={searchParams.get('q')?.toString()}
                    onChange={(e) => handleParamChange('q', e.target.value)}
                />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {filters.map((filter) => (
                    <select
                        key={filter.key}
                        className="rounded-md border border-gray-300 dark:border-gray-600 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 shadow-xs"
                        value={searchParams.get(filter.key) || ''}
                        onChange={(e) => handleParamChange(filter.key, e.target.value)}
                    >
                        <option value="">All {filter.label}</option>
                        {filter.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                ))}

                {hasFilters && (
                    <button
                        onClick={clearFilters}
                        className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1 px-2 py-2"
                    >
                        <X className="w-4 h-4" />
                        Clear
                    </button>
                )}
            </div>
        </div>
    );
}
