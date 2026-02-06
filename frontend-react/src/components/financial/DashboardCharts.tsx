import React from 'react';

interface ChartProps {
    data: any[];
    height?: number;
}

export const TrendChart = ({ data, height = 300 }: ChartProps) => {
    if (!data || data.length === 0) return <div className="flex justify-center items-center h-full text-secondary/50">لا توجد بيانات</div>;

    const padding = 40;
    const chartWidth = 800;
    const chartHeight = height;
    const graphHeight = chartHeight - padding * 2;
    const graphWidth = chartWidth - padding * 2;

    const maxValue = Math.max(
        ...data.map(d => Math.max(Number(d.revenue || 0), Number(d.expenses || 0), Number(d.profit || 0)))
    ) * 1.1; // Add 10% headroom

    const getX = (index: number) => padding + (index * (graphWidth / (data.length - 1 || 1)));
    const getY = (value: number) => chartHeight - padding - ((value / (maxValue || 1)) * graphHeight);

    // Create paths
    const revenuePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.revenue || 0)}`).join(' ');
    const expensesPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.expenses || 0)}`).join(' ');
    const profitPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.profit || 0)}`).join(' ');

    return (
        <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full min-w-[600px]">
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                    <g key={i}>
                        <line
                            x1={padding}
                            y1={getY(maxValue * p)}
                            x2={chartWidth - padding}
                            y2={getY(maxValue * p)}
                            stroke="#e5e7eb"
                            strokeDasharray="4 4"
                        />
                        <text
                            x={padding - 10}
                            y={getY(maxValue * p) + 4}
                            textAnchor="end"
                            fontSize="10"
                            fill="#9ca3af"
                        >
                            {Math.round(maxValue * p / 1000)}k
                        </text>
                    </g>
                ))}

                {/* Lines */}
                <path d={revenuePath} fill="none" stroke="#2563eb" strokeWidth="3" />
                <path d={expensesPath} fill="none" stroke="#dc2626" strokeWidth="3" />
                <path d={profitPath} fill="none" stroke="#16a34a" strokeWidth="3" />

                {/* Data Points */}
                {data.map((d, i) => (
                    <g key={i}>
                        <circle cx={getX(i)} cy={getY(d.revenue || 0)} r="4" fill="#2563eb" className="hover:r-6 transition-all" />
                        <circle cx={getX(i)} cy={getY(d.expenses || 0)} r="4" fill="#dc2626" className="hover:r-6 transition-all" />
                        <circle cx={getX(i)} cy={getY(d.profit || 0)} r="4" fill="#16a34a" className="hover:r-6 transition-all" />

                        {/* X Axis Labels */}
                        <text
                            x={getX(i)}
                            y={chartHeight - padding + 20}
                            textAnchor="middle"
                            fontSize="10"
                            fill="#6b7280"
                        >
                            {d.label}
                        </text>
                    </g>
                ))}
            </svg>
            <div className="flex gap-4 justify-center mt-4">
                <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 bg-blue-600 rounded-full" /> Income
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 bg-red-600 rounded-full" /> Expenses
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 bg-green-600 rounded-full" /> Profit
                </div>
            </div>
        </div>
    );
};

export const BreakdownChart = ({ data }: ChartProps) => {
    if (!data || data.length === 0) return <div className="flex justify-center items-center h-full text-secondary/50">لا توجد بيانات</div>;

    const total = data.reduce((sum, item) => sum + (item.total || 0), 0);
    let currentAngle = 0;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-64 h-64">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {data.map((item, i) => {
                        const percentage = (item.total / total) * 100;
                        const angle = (percentage / 100) * 360;
                        const x1 = 50 + 40 * Math.cos(Math.PI * currentAngle / 180);
                        const y1 = 50 + 40 * Math.sin(Math.PI * currentAngle / 180);
                        const x2 = 50 + 40 * Math.cos(Math.PI * (currentAngle + angle) / 180);
                        const y2 = 50 + 40 * Math.sin(Math.PI * (currentAngle + angle) / 180);

                        const largeArcFlag = percentage > 50 ? 1 : 0;
                        const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                        const el = (
                            <path
                                key={i}
                                d={pathData}
                                fill={item.color || `hsl(${i * 60}, 70%, 50%)`}
                                stroke="white"
                                strokeWidth="2"
                            />
                        );

                        currentAngle += angle;
                        return el;
                    })}
                    <circle cx="50" cy="50" r="25" fill="white" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <div className="text-xs text-secondary/50">الإجمالي</div>
                        <div className="font-bold font-mono">{Number(total).toLocaleString()}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-6 w-full max-w-sm">
                {data.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: item.color || `hsl(${i * 60}, 70%, 50%)` }}
                            />
                            <span>{item.category_name}</span>
                        </div>
                        <span className="font-mono">{Math.round((item.total / total) * 100)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
