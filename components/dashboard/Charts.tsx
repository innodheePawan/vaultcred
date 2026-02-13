'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { useRouter } from 'next/navigation';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4'];

interface ChartData {
    name: string;
    value: number;
    expiring: number;
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload as ChartData;
        return (
            <div className="bg-gray-900/95 backdrop-blur-sm text-white px-4 py-3 rounded-xl shadow-2xl border border-gray-700/50 text-xs">
                <p className="font-bold text-sm mb-1.5">{data.name}</p>
                <div className="space-y-1">
                    <p className="flex justify-between gap-6">
                        <span className="text-gray-400">Total</span>
                        <span className="font-semibold">{data.value}</span>
                    </p>
                    {data.expiring > 0 && (
                        <p className="flex justify-between gap-6 text-amber-400">
                            <span>Expiring</span>
                            <span className="font-semibold">{data.expiring}</span>
                        </p>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

// Custom legend with better styling
const CustomLegend = ({ payload }: any) => {
    if (!payload) return null;
    return (
        <div className="flex flex-col gap-2 pl-2">
            {payload.map((entry: any, index: number) => (
                <div key={index} className="flex items-center gap-2 text-xs cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-gray-600 dark:text-gray-400 truncate">{entry.value}</span>
                </div>
            ))}
        </div>
    );
};

// ---- Category Pie Chart ----
export function CategoryPieChart({ data }: { data: ChartData[] }) {
    const router = useRouter();

    const handleClick = (entry: any) => {
        if (entry && entry.name) {
            router.push(`/credentials?category=${encodeURIComponent(entry.name)}&scope=shared`);
        }
    };

    return (
        <div className="h-full w-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
                    <Pie
                        data={data}
                        cx="38%"
                        cy="50%"
                        innerRadius="55%"
                        outerRadius="88%"
                        paddingAngle={3}
                        dataKey="value"
                        onClick={(data) => handleClick(data.payload)}
                        cursor="pointer"
                        stroke="none"
                        animationDuration={800}
                        animationBegin={100}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                                className="hover:opacity-80 transition-opacity duration-200"
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        content={<CustomLegend />}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

// ---- Environment Bar Chart ----
export function EnvironmentBarChart({ data }: { data: ChartData[] }) {
    const router = useRouter();

    const handleBarClick = (entry: any) => {
        if (entry && entry.name) {
            router.push(`/credentials?environment=${encodeURIComponent(entry.name)}&scope=shared`);
        }
    };

    return (
        <div className="h-full w-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="name"
                        type="category"
                        width={60}
                        tick={{ fontSize: 12, fill: '#9CA3AF' }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }} />
                    <Bar
                        dataKey="value"
                        radius={[0, 8, 8, 0]}
                        barSize={28}
                        cursor="pointer"
                        onClick={handleBarClick}
                        animationDuration={800}
                        animationBegin={200}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                                className="hover:opacity-80 transition-opacity duration-200"
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
