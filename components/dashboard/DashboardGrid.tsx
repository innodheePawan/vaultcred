'use client';

import { DashboardStats } from '@/lib/actions/dashboard';
import { CategoryPieChart, EnvironmentBarChart } from './Charts';
import { Lock, Share2, AlertTriangle, Clock, TrendingUp, Shield, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';

interface DashboardGridProps {
    stats: DashboardStats;
    userRole?: string;
    userName?: string;
}

function AnimatedStat({ value, label, sub }: { value: number; label: string; sub?: string }) {
    return (
        <div>
            <p className="text-3xl font-extrabold tracking-tight">{value}</p>
            <p className="text-sm font-medium opacity-80 mt-0.5">{label}</p>
            {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
        </div>
    );
}

export default function DashboardGrid({ stats, userRole, userName }: DashboardGridProps) {
    const [showPersonal, setShowPersonal] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('dashboard_show_personal');
        if (saved !== null) setShowPersonal(saved === 'true');
    }, []);

    const togglePersonal = () => {
        setShowPersonal(prev => {
            const next = !prev;
            localStorage.setItem('dashboard_show_personal', String(next));
            return next;
        });
    };

    const totalCredentials = stats.personal.total + stats.shared.total;
    const totalAtRisk = stats.risk.totalExpired + stats.risk.totalNearExpiry;
    const healthPercent = totalCredentials > 0
        ? Math.round(((totalCredentials - totalAtRisk) / totalCredentials) * 100)
        : 100;

    const greeting = (() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    })();

    return (
        <div className="space-y-5">
            {/* Greeting + Toggle row */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {greeting}, {userName || 'there'} 👋
                    </h1>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                        Here&apos;s your credential vault overview
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={togglePersonal}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                    >
                        {showPersonal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {showPersonal ? 'Hide Personal' : 'Show Personal'}
                    </button>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium hidden sm:block">
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
            </div>

            {/* ── Row 1: Hero Stats ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Credentials */}
                <Link href="/credentials" className="group">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 p-5 text-white shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-0.5 h-[144px] flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform duration-500" />
                        <div className="relative flex items-start justify-between">
                            <AnimatedStat value={totalCredentials} label="Total Credentials" />
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Shield className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="relative mt-3 flex items-center gap-1 text-xs font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                            <span>View all</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </div>
                </Link>

                {/* My Credentials - toggleable */}
                {showPersonal && (
                    <Link href="/credentials?scope=personal" className="group">
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 p-5 text-white shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-300 hover:-translate-y-0.5">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform duration-500" />
                            <div className="relative flex items-start justify-between">
                                <AnimatedStat value={stats.personal.total} label="My Credentials" sub={`${stats.personal.expiringSoon} expiring soon`} />
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <Lock className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="relative mt-3 flex items-center gap-1 text-xs font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                                <span>View personal</span>
                                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </div>
                    </Link>
                )}

                {/* Shared / Accessible */}
                <Link href="/credentials?scope=shared" className="group">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-5 text-white shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 hover:-translate-y-0.5">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform duration-500" />
                        <div className="relative flex items-start justify-between">
                            <AnimatedStat value={stats.shared.total} label="Accessible" sub={`${stats.shared.expiringSoon} expiring soon`} />
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Share2 className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="relative mt-3 flex items-center gap-1 text-xs font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                            <span>View shared</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </div>
                </Link>

                {/* Vault Health */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 to-gray-950 p-5 text-white shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
                    <div className="relative flex items-start justify-between">
                        <div>
                            <p className="text-3xl font-extrabold tracking-tight">{healthPercent}<span className="text-lg font-bold opacity-60">%</span></p>
                            <p className="text-sm font-medium opacity-80 mt-0.5">Vault Health</p>
                            <p className="text-xs opacity-60 mt-0.5">{totalAtRisk} need attention</p>
                        </div>
                        <div className="p-2 bg-white/10 rounded-xl">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="relative mt-3">
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-1000"
                                style={{
                                    width: `${healthPercent}%`,
                                    background: healthPercent >= 80 ? '#34D399' : healthPercent >= 50 ? '#FBBF24' : '#EF4444'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Row 2: Risk Cards (Red + Amber + Violet gradient) ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Expired - RED gradient */}
                <Link href="/credentials?expiry=expired" className="group">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 p-5 text-white shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 hover:-translate-y-0.5">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform duration-500" />
                        <div className="relative flex items-start justify-between">
                            <AnimatedStat value={stats.risk.totalExpired} label="Expired" sub="Immediate action needed" />
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="relative mt-3 flex items-center gap-1 text-xs font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                            <span>View expired</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </div>
                </Link>

                {/* Expiring Soon - AMBER gradient */}
                <Link href="/credentials?expiry=near_expiry" className="group">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300 hover:-translate-y-0.5">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform duration-500" />
                        <div className="relative flex items-start justify-between">
                            <AnimatedStat value={stats.risk.totalNearExpiry} label="Expiring Soon" sub="Within next 60 days" />
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Clock className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="relative mt-3 flex items-center gap-1 text-xs font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                            <span>View expiring</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </div>
                </Link>

                {/* My Expiring - toggleable */}
                {showPersonal && (
                    <Link href="/credentials?expiry=near_expiry&scope=personal" className="group">
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-700 p-5 text-white shadow-lg shadow-fuchsia-500/20 hover:shadow-xl hover:shadow-fuchsia-500/30 transition-all duration-300 hover:-translate-y-0.5">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform duration-500" />
                            <div className="relative flex items-start justify-between">
                                <AnimatedStat value={stats.personal.expiringSoon} label="My Expiring" sub="Personal credentials" />
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <Lock className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="relative mt-3 flex items-center gap-1 text-xs font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                                <span>View my expiring</span>
                                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </div>
                    </Link>
                )}
            </div>

            {/* ── Row 3: Charts with explicit heights ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Category Donut Chart */}
                <div className="rounded-2xl bg-white dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Credentials by Category</h3>
                        <span className="text-xs text-gray-400 dark:text-gray-500">Click to filter</span>
                    </div>
                    <div style={{ height: '280px' }}>
                        <CategoryPieChart data={stats.shared.byCategory} />
                    </div>
                </div>

                {/* Environment Bar Chart */}
                <div className="rounded-2xl bg-white dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Credentials by Environment</h3>
                        <span className="text-xs text-gray-400 dark:text-gray-500">Click to filter</span>
                    </div>
                    <div style={{ height: '280px' }}>
                        <EnvironmentBarChart data={stats.shared.byEnvironment} />
                    </div>
                </div>
            </div>
        </div>
    );
}
