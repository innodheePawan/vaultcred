'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    currentLimit: number;
}

export function PaginationControls({ currentPage, totalPages, totalItems, currentLimit }: PaginationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [goToPage, setGoToPage] = useState(currentPage.toString());

    // Sync input when page changes natively
    useEffect(() => {
        setGoToPage(currentPage.toString());
    }, [currentPage]);

    const updateQuery = (page: number, limit: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', page.toString());
        params.set('limit', limit.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleGoToPage = (e: React.FormEvent) => {
        e.preventDefault();
        let target = parseInt(goToPage, 10);
        if (isNaN(target) || target < 1) target = 1;
        if (target > totalPages) target = totalPages;
        updateQuery(target, currentLimit);
    };

    if (totalItems <= 10 && currentLimit === 10) return null; // Hide entirely if not needed on default

    return (
        <div className="flex flex-col lg:flex-row items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 mt-4 rounded-b-xl gap-4">
            <div className="flex flex-col sm:flex-row w-full flex-1 items-center justify-between gap-4">
                
                {/* Left Side: Stats and Rows Dropdown */}
                <div className="flex items-center space-x-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        Showing <span className="font-medium">{(currentPage - 1) * currentLimit + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(currentPage * currentLimit, totalItems)}</span> of{' '}
                        <span className="font-medium">{totalItems}</span> results
                    </p>
                    
                    <div className="flex items-center space-x-2 border-l border-gray-300 dark:border-gray-600 pl-4">
                        <label htmlFor="limit" className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">Rows:</label>
                        <select
                            id="limit"
                            value={currentLimit}
                            onChange={(e) => updateQuery(1, parseInt(e.target.value, 10))}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full px-2 py-1.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>

                {/* Right Side: Go to Page and Prev/Next */}
                <div className="flex items-center space-x-4">
                    <form onSubmit={handleGoToPage} className="flex items-center space-x-2">
                         <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">Go to:</span>
                         <input
                             type="number"
                             min={1}
                             max={totalPages}
                             value={goToPage}
                             onChange={(e) => setGoToPage(e.target.value)}
                             className="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                         />
                    </form>

                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                            onClick={() => updateQuery(currentPage - 1, currentLimit)}
                            disabled={currentPage <= 1}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed bg-white dark:bg-gray-800"
                        >
                            <span className="sr-only">Previous</span>
                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:outline-offset-0 bg-white dark:bg-gray-800">
                            {currentPage} / {totalPages > 0 ? totalPages : 1}
                        </span>
                        <button
                            onClick={() => updateQuery(currentPage + 1, currentLimit)}
                            disabled={currentPage >= totalPages}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed bg-white dark:bg-gray-800"
                        >
                            <span className="sr-only">Next</span>
                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    );
}
