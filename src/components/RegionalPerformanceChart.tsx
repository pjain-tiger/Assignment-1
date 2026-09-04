import React from 'react';
import { RegionMetric } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { MapPin, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

interface RegionalPerformanceChartProps {
  regionalMetrics: RegionMetric[];
  selectedRegion: string;
  onSelectRegion: (region: string) => void;
}

export const RegionalPerformanceChart: React.FC<RegionalPerformanceChartProps> = ({
  regionalMetrics,
  selectedRegion,
  onSelectRegion,
}) => {
  const chartData = regionalMetrics.map((r) => ({
    region: r.region,
    actualSales: Math.round(r.totalSales / 1000),
    targetSales: Math.round(r.targetSales / 1000),
    rawSales: r.totalSales,
    rawTarget: r.targetSales,
    achievementRate: r.achievementRate,
    salesPerSqFt: r.salesPerSqFt,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs border border-slate-700">
          <p className="font-bold text-sm mb-1.5 border-b border-slate-700 pb-1">
            {label} Region
          </p>
          <div className="space-y-1">
            <p className="flex justify-between gap-4 text-slate-300">
              <span>Actual Sales:</span>
              <span className="font-semibold text-white">
                ${(data.rawSales / 1000000).toFixed(2)}M
              </span>
            </p>
            <p className="flex justify-between gap-4 text-slate-300">
              <span>Target Budget:</span>
              <span className="font-semibold text-slate-300">
                ${(data.rawTarget / 1000000).toFixed(2)}M
              </span>
            </p>
            <p className="flex justify-between gap-4 text-slate-300">
              <span>Target Achievement:</span>
              <span
                className={`font-semibold ${
                  data.achievementRate >= 100 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {data.achievementRate}%
              </span>
            </p>
            <p className="flex justify-between gap-4 text-slate-300 pt-1 border-t border-slate-800">
              <span>Sales Density:</span>
              <span className="font-semibold text-indigo-300">
                ${data.salesPerSqFt}/sq ft
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#3b82f6]" />
            Sales Performance by Region
          </h3>
          <p className="text-xs text-[#64748b] mt-0.5">
            Weekly Aggregate ($ USD in thousands) • Actual Net Sales vs. Target Budget
          </p>
        </div>
        {selectedRegion !== 'All' && (
          <button
            onClick={() => onSelectRegion('All')}
            className="text-xs text-[#3b82f6] font-medium hover:underline self-start sm:self-auto"
          >
            Show All 5 Regions
          </button>
        )}
      </div>

      {/* Recharts Bar Chart */}
      <div className="h-64 sm:h-72 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
            barGap={6}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="region"
              tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', paddingBottom: '12px' }}
            />
            <Bar
              dataKey="actualSales"
              name="Actual Sales"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="targetSales"
              name="Target Plan"
              fill="#e2e8f0"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Regional Scorecard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-5 pt-4 border-t border-[#e2e8f0]">
        {regionalMetrics.map((r, rIdx) => {
          const isSelected = selectedRegion === r.region;
          const isOver = r.achievementRate >= 100;
          return (
            <div
              key={`reg-${r.region}-${rIdx}`}
              onClick={() => onSelectRegion(isSelected ? 'All' : r.region)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? 'border-[#3b82f6] bg-blue-50/30 ring-1 ring-[#3b82f6]'
                  : 'border-[#e2e8f0] bg-white hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-900">{r.region}</span>
                <span
                  className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                    isOver
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {r.achievementRate}%
                </span>
              </div>

              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between text-[#64748b]">
                  <span>Sales:</span>
                  <span className="font-semibold text-slate-900">
                    ${(r.totalSales / 1000000).toFixed(2)}M
                  </span>
                </div>
                <div className="flex justify-between text-[#64748b]">
                  <span>Density:</span>
                  <span className="font-medium text-slate-800">${r.salesPerSqFt}/sq ft</span>
                </div>
                <div className="flex justify-between text-[#64748b]">
                  <span>Basket:</span>
                  <span className="font-medium text-slate-800">${r.avgBasket}</span>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-[#e2e8f0] text-[11px] text-[#64748b]">
                <div className="truncate">
                  Top: <span className="font-medium text-slate-900">{r.topStore}</span>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-end text-[10px] font-medium text-[#3b82f6]">
                <span>{isSelected ? 'Filtered' : 'Select'}</span>
                <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
