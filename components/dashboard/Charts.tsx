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

const COLORS = ['#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444'];
// Matching the dark mode vibe: Green, Orange, Indigo/Purple

interface ChartData {
    name: string;
    value: number;
    expiring: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload as ChartData;
        return (
            <div className="bg-gray-800 text-white p-3 rounded-lg shadow-xl border border-gray-700 text-xs">
                <p className="font-bold mb-1">{data.name}</p>
                <div className="space-y-1">
                    <p className="flex justify-between gap-4">
                        <span className="text-gray-400">Total:</span>
                        <span>{data.value}</span>
                    </p>
                    {data.expiring > 0 && (
                        <p className="flex justify-between gap-4 text-amber-400">
                            <span>Expiring:</span>
                            <span>{data.expiring}</span>
                        </p>
                    )}
                </div>
            </div>
        );
    }
    return null;
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
        <div className="h-full w-full min-h-[250px]">
            {/* Title integrated in parent, just chart here */}
            <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
                    <Pie
                        data={data}
                        cx="40%" // Left align pie
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="90%"
                        paddingAngle={4}
                        dataKey="value"
                        onClick={(data, index) => handleClick(data.payload)}
                        cursor="pointer"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ fontSize: '12px', lineHeight: '24px', right: 0 }}
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
        <div className="h-full w-full min-h-[200px]">
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
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar
                        dataKey="value"
                        radius={[0, 4, 4, 0]}
                        barSize={24}
                        cursor="pointer"
                        onClick={handleBarClick}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
