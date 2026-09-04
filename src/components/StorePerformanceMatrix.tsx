import React from 'react';
import { StoreAggregatedPerformance, FormatMetric } from '../types';
import {
  Trophy,
  AlertCircle,
  Building2,
  TrendingUp,
  TrendingDown,
  User,
  MapPin,
  ArrowUpRight,
} from 'lucide-react';

interface StorePerformanceMatrixProps {
  stores: StoreAggregatedPerformance[];
  formatMetrics: FormatMetric[];
  onSelectStore: (storeId: string) => void;
}

export const StorePerformanceMatrix: React.FC<StorePerformanceMatrixProps> = ({
  stores,
  formatMetrics,
  onSelectStore,
}) => {
  // Top 3 performers by target achievement rate
  const topStores = [...stores]
    .sort((a, b) => b.achievementRate - a.achievementRate)
    .slice(0, 3);

  // Bottom 3 performers needing attention
  const laggingStores = [...stores]
    .sort((a, b) => a.achievementRate - b.achievementRate)
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
      {/* Column 1: Top Outperforming Units */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-[#3b82f6]" />
              Top Outperforming Stores
            </h3>
            <span className="text-[10px] font-semibold text-[#22c55e] bg-emerald-50 px-2 py-0.5 rounded">
              Pacing &gt; 105%
            </span>
          </div>

          <div className="space-y-2.5 mt-3">
            {topStores.map((s, idx) => (
              <div
                key={`top-${s.store_id}-${idx}`}
                onClick={() => onSelectStore(s.store_id)}
                className="p-3 rounded-lg border border-[#e2e8f0] bg-white hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded bg-blue-50 text-[#3b82f6] text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="text-xs font-semibold text-slate-900 group-hover:text-[#3b82f6] transition-colors">
                        {s.store_name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#64748b] mt-1 pl-5">
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {s.city}, {s.state} ({s.region})
                      </span>
                      <span>•</span>
                      <span>{s.format}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#22c55e] block">
                      {s.achievementRate}%
                    </span>
                    <span className="text-[10px] text-[#64748b] font-medium">
                      +${(s.salesVariance / 1000).toFixed(0)}k vs plan
                    </span>
                  </div>
                </div>

                <div className="mt-2 pl-5 flex items-center justify-between text-[11px] text-[#64748b] pt-2 border-t border-[#e2e8f0]">
                  <span>${s.salesPerSqFt}/sq ft</span>
                  <span className="flex items-center gap-0.5 text-[#3b82f6] font-medium">
                    Basket: ${s.avgBasket}
                    <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-[#64748b] mt-3 pt-2 border-t border-[#e2e8f0]">
          Click any store to inspect complete weekly breakdown.
        </p>
      </div>

      {/* Column 2: Units Needing Attention */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              Stores Requiring Attention
            </h3>
            <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
              Trailing Plan
            </span>
          </div>

          <div className="space-y-2.5 mt-3">
            {laggingStores.map((s, idx) => (
              <div
                key={`lag-${s.store_id}-${idx}`}
                onClick={() => onSelectStore(s.store_id)}
                className="p-3 rounded-lg border border-[#e2e8f0] bg-white hover:bg-rose-50/20 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded bg-rose-50 text-rose-700 text-[10px] font-bold flex items-center justify-center">
                        !
                      </span>
                      <h4 className="text-xs font-semibold text-slate-900 group-hover:text-rose-700 transition-colors">
                        {s.store_name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#64748b] mt-1 pl-5">
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {s.city}, {s.state} ({s.region})
                      </span>
                      <span>•</span>
                      <span>{s.format}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-700 block">
                      {s.achievementRate}%
                    </span>
                    <span className="text-[10px] text-rose-600 font-medium">
                      -${Math.abs(s.salesVariance / 1000).toFixed(0)}k deficit
                    </span>
                  </div>
                </div>

                <div className="mt-2 pl-5 flex items-center justify-between text-[11px] text-[#64748b] pt-2 border-t border-[#e2e8f0]">
                  <span>Mgr: {s.manager}</span>
                  <span className="font-medium text-slate-700">
                    ${s.salesPerSqFt}/sq ft
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-[#64748b] mt-3 pt-2 border-t border-[#e2e8f0]">
          Targeted merchandising & labor realignment recommended.
        </p>
      </div>

      {/* Column 3: Format Dynamics */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#3b82f6]" />
              Format Productivity Dynamics
            </h3>
            <span className="text-[10px] font-semibold text-[#64748b] bg-slate-100 px-2 py-0.5 rounded">
              4 Formats
            </span>
          </div>

          <div className="space-y-2 mt-3">
            {formatMetrics.map((fmt, idx) => (
              <div
                key={`fmt-${fmt.format}-${idx}`}
                className="p-3 rounded-lg border border-[#e2e8f0] bg-white"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-900">{fmt.format}</span>
                    <span className="text-[10px] text-[#64748b]">
                      ({fmt.storeCount} stores)
                    </span>
                  </div>
                  <span
                    className={`font-semibold text-[11px] ${
                      fmt.achievementRate >= 100 ? 'text-[#22c55e]' : 'text-amber-700'
                    }`}
                  >
                    {fmt.achievementRate}% Plan
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] text-[#64748b] mt-2 pt-2 border-t border-[#e2e8f0]">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Sales</span>
                    <span className="font-semibold text-slate-900">
                      ${(fmt.totalSales / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Per SqFt</span>
                    <span className="font-semibold text-slate-900">
                      ${fmt.salesPerSqFt}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Basket</span>
                    <span className="font-semibold text-slate-900">
                      ${fmt.avgBasket}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-[#64748b] mt-3 pt-2 border-t border-[#e2e8f0]">
          Flagship drives volume; Express maximizes space density.
        </div>
      </div>
    </div>
  );
};
