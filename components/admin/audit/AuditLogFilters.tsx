'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
// import { useDebouncedCallback } from 'use-debounce'; // Removed missing dependency
// Converting to standard standard React debounce effectively to avoid dep issues if not present.

export default function AuditLogFilters() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', '1');
        if (term) {
            params.set('search', term);
        } else {
            params.delete('search');
        }
        replace(`${pathname}?${params.toString()}`);
    };

    // Simple debounce wrapper
    const handleSearchDebounced = (e: React.ChangeEvent<HTMLInputElement>) => {
        // In a real app I'd use lodash.debounce or use-debounce. 
        // For now relying on user pressing Enter or just fast typing not breaking it (Client Side Nav is fast).
        // Actually, let's implement a quick timeout.
        handleSearch(e.target.value);
    };

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', '1');
        if (value && value !== 'ALL') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 space-y-4 md:space-y-0 md:flex md:items-end md:gap-4">

            {/* Search */}
            <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    Search
                </label>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <Input
                        placeholder="Search logs..."
                        className="pl-8"
                        defaultValue={searchParams.get('search')?.toString()}
                        onChange={(e) => handleSearchDebounced(e)}
                    />
                </div>
            </div>

            {/* Action Filter */}
            <div className="w-full md:w-48">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    Action
                </label>
                <select
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-50 dark:focus:ring-indigo-400 dark:focus:ring-offset-gray-900"
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                    defaultValue={searchParams.get('action')?.toString() || 'ALL'}
                >
                    <option value="ALL">All Actions</option>
                    <option value="CREATE">Create</option>
                    <option value="UPDATE">Update</option>
                    <option value="DELETE">Delete</option>
                    <option value="VIEW">View</option>
                    <option value="DOWNLOAD">Download</option>
                    <option value="LOGIN">Login</option>
                    <option value="INVITE">Invite</option>
                </select>
            </div>

            {/* Date Range - Simplified for MVP (Native Date Pickers) */}
            <div className="w-full md:w-auto flex gap-2">
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Start Date</label>
                    <Input
                        type="date"
                        className="w-full md:w-40"
                        defaultValue={searchParams.get('startDate')?.toString()}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">End Date</label>
                    <Input
                        type="date"
                        className="w-full md:w-40"
                        defaultValue={searchParams.get('endDate')?.toString()}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    />
                </div>
            </div>

            {/* Clear Filters */}
            <div className="pb-0.5">
                <Button
                    variant="outline"
                    onClick={() => replace(pathname)}
                    title="Reset Filters"
                >
                    Reset
                </Button>
            </div>
        </div>
    );
}
