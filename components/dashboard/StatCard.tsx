import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    href?: string;
    description?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    color?: string; // Tailwind text color class, e.g., 'text-blue-600'
}

export default function StatCard({ title, value, icon: Icon, href, description, trend, trendValue, color = 'text-indigo-600' }: StatCardProps) {
    const content = (
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="p-5">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <Icon className={`h-6 w-6 ${color} dark:text-gray-300`} aria-hidden="true" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">
                                {title}
                            </dt>
                            <dd>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {value}
                                </div>
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
            {(description || trendValue) && (
                <div className="bg-gray-50 dark:bg-gray-900/50 px-5 py-3">
                    <div className="text-sm">
                        <div className="font-medium text-gray-700 dark:text-gray-300 flex justify-between">
                            <span>{description}</span>
                            {trendValue && (
                                <span className={trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}>
                                    {trendValue}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="block group">
                {content}
            </Link>
        );
    }

    return content;
}
