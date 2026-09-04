import React, { useState } from 'react';
import { WeeklyTrendPoint } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart,
} from 'recharts';
import { TrendingUp, Calendar, Layers } from 'lucide-react';

interface WeeklyTrendChartProps {
  trendData: WeeklyTrendPoint[];
  selectedRegion: string;
}

export const WeeklyTrendChart: React.FC<WeeklyTrendChartProps> = ({
  trendData,
  selectedRegion,
}) => {
  const [viewMode, setViewMode] = useState<'salesVsTarget' | 'regionalLines'>('salesVsTarget');

  const chartFormatted = trendData.map((d) => ({
    week: d.week.replace('2026-', ''),
    rawWeek: d.week,
    weekDate: d.week_date,
    sales: Math.round(d.sales / 1000),
    target: Math.round(d.target_sales / 1000),
    rawSales: d.sales,
    rawTarget: d.target_sales,
    achievementRate: d.achievementRate,
    North: Math.round((d.North || 0) / 1000),
    South: Math.round((d.South || 0) / 1000),
    East: Math.round((d.East || 0) / 1000),
    West: Math.round((d.West || 0) / 1000),
    Central: Math.round((d.Central || 0) / 1000),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs border border-slate-700">
          <p className="font-bold text-sm mb-1.5 border-b border-slate-700 pb-1">
            Week {label} ({p.weekDate})
          </p>
          {viewMode === 'salesVsTarget' ? (
            <div className="space-y-1">
              <p className="flex justify-between gap-4 text-slate-300">
                <span>Actual Sales:</span>
                <span className="font-semibold text-white">
                  ${(p.rawSales / 1000).toLocaleString()}k
                </span>
              </p>
              <p className="flex justify-between gap-4 text-slate-300">
                <span>Target Plan:</span>
                <span className="font-semibold text-slate-300">
                  ${(p.rawTarget / 1000).toLocaleString()}k
                </span>
              </p>
              <p className="flex justify-between gap-4 text-slate-300">
                <span>Realization:</span>
                <span
                  className={`font-semibold ${
                    p.achievementRate >= 100 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {p.achievementRate}%
                </span>
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {['East', 'West', 'North', 'Central', 'South'].map((reg) => (
                <p key={reg} className="flex justify-between gap-4 text-slate-300">
                  <span>{reg}:</span>
                  <span className="font-semibold text-white">${p[reg]}k</span>
                </p>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#22c55e]" />
            Weekly Sales Trajectory & Seasonality
          </h3>
          <p className="text-xs text-[#64748b] mt-0.5">
            Weekly sales cadence ($ in thousands) identifying peak promotional cycles and demand shifts.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setViewMode('salesVsTarget')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'salesVsTarget'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-[#64748b] hover:text-slate-900'
            }`}
          >
            Sales vs Target
          </button>
          {selectedRegion === 'All' && (
            <button
              onClick={() => setViewMode('regionalLines')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'regionalLines'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-[#64748b] hover:text-slate-900'
              }`}
            >
              5 Regions Breakdown
            </button>
          )}
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'salesVsTarget' ? (
            <ComposedChart
              data={chartFormatted}
              margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: '#64748b' }}
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
              <Area
                type="monotone"
                dataKey="sales"
                name="Weekly Actual Sales"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#salesGradient)"
              />
              <Line
                type="monotone"
                dataKey="target"
                name="Weekly Target Plan"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            </ComposedChart>
          ) : (
            <LineChart
              data={chartFormatted}
              margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: '#64748b' }}
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
              <Line type="monotone" dataKey="East" name="East" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="West" name="West" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="North" name="North" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="Central" name="Central" stroke="#f97316" strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="South" name="South" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-[#64748b] pt-3 border-t border-[#e2e8f0]">
        <span className="flex items-center gap-1 font-medium text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          Period Horizon: 12 Weeks (Q1 Cycle)
        </span>
        <span>
          Peak Demand Week: <strong className="text-slate-900">W12 (Spring Collection Launch)</strong>
        </span>
      </div>
    </div>
  );
};
