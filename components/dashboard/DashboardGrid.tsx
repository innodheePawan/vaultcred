'use client';

import { DashboardStats } from '@/lib/actions/dashboard';
import StatCard from './StatCard';
import { CategoryPieChart, EnvironmentBarChart } from './Charts';
import { Lock, Share2, AlertTriangle, Clock } from 'lucide-react';
import React from 'react';

interface DashboardGridProps {
    stats: DashboardStats;
    userRole?: string;
}

export default function DashboardGrid({ stats, userRole }: DashboardGridProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)] min-h-[500px]">
            {/* --- LEFT COLUMN: Cards (3 Rows x 2 Cols) --- */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
                {/* Row 1: Personal */}
                <div className="grid grid-cols-2 gap-4 flex-1">
                    <StatCard
                        title="My Credentials"
                        value={stats.personal.total}
                        icon={Lock}
                        color="text-indigo-600"
                        href="/credentials?scope=personal"
                    />
                    <StatCard
                        title="My Expiring (60d)"
                        value={stats.personal.expiringSoon}
                        icon={Clock}
                        color="text-amber-600"
                        href="/credentials?expiry=near_expiry&scope=personal"
                        description="Action Needed"
                    />
                </div>

                {/* Row 2: Shared */}
                <div className="grid grid-cols-2 gap-4 flex-1">
                    <StatCard
                        title="Accessible"
                        value={stats.shared.total}
                        icon={Share2}
                        color="text-green-600"
                        href="/credentials?scope=shared"
                    />
                    <StatCard
                        title="Shared Expiring"
                        value={stats.shared.expiringSoon}
                        icon={Clock}
                        color="text-amber-600"
                        href="/credentials?expiry=near_expiry&scope=shared"
                    />
                </div>

                {/* Row 3: Risk */}
                <div className="grid grid-cols-2 gap-4 flex-1">
                    <StatCard
                        title="Expired"
                        value={stats.risk.totalExpired}
                        icon={AlertTriangle}
                        color="text-red-700"
                        href="/credentials?expiry=expired"
                        trend="down"
                        trendValue="Critical"
                    />
                    <StatCard
                        title="Near Expiry (All)"
                        value={stats.risk.totalNearExpiry}
                        icon={Clock}
                        color="text-amber-600"
                        href="/credentials?expiry=near_expiry"
                        description="Global Watch"
                    />
                </div>
            </div>

            {/* --- RIGHT COLUMN: Stacked Charts --- */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 h-full">
                {/* Top Chart: Category Donut */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-100 dark:border-gray-700 flex-1 flex flex-col min-h-[250px]">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Credential Distribution by Category</h3>
                    <div className="flex-1 min-h-0">
                        <CategoryPieChart data={stats.shared.byCategory} />
                    </div>
                </div>

                {/* Bottom Chart: Environment Bars */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-100 dark:border-gray-700 flex-1 flex flex-col min-h-[200px]">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Distribution by Environment</h3>
                    <div className="flex-1 min-h-0">
                        <EnvironmentBarChart data={stats.shared.byEnvironment} />
                    </div>
                </div>
            </div>
        </div>
    );
}
