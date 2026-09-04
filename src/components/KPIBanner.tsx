import React from 'react';
import { AggregatedKPIs } from '../types';
import {
  DollarSign,
  Target,
  ShoppingBag,
  Maximize2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface KPIBannerProps {
  kpis: AggregatedKPIs;
  activeRegion: string;
}

export const KPIBanner: React.FC<KPIBannerProps> = ({ kpis, activeRegion }) => {
  const isTargetAchieved = kpis.achievementRate >= 100;
  const varianceFormatted = Math.abs(kpis.salesVariance) >= 1000000
    ? `$${(Math.abs(kpis.salesVariance) / 1000000).toFixed(2)}M`
    : `$${(Math.abs(kpis.salesVariance) / 1000).toFixed(0)}k`;

  return (
    <section className="mb-6" aria-label="Key Performance Indicators">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#64748b]">
          Core Performance Indicators {activeRegion !== 'All' && `• ${activeRegion} Region`}
        </h2>
        <span className="text-xs text-[#64748b]">
          {kpis.storeCount} active {kpis.storeCount === 1 ? 'store' : 'stores'} represented
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Total Sales & Budget Variance */}
        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748b] uppercase tracking-[0.05em]">
                Total Weekly Sales
              </span>
              <div className="w-6 h-6 rounded bg-blue-50 text-[#3b82f6] flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-[28px] font-bold tracking-tight text-slate-900 mt-2 mb-1">
              ${(kpis.totalSales / 1000000).toFixed(2)}M
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-3 border-t border-[#e2e8f0] mt-2">
            <span className="text-[#64748b]">
              Target: ${(kpis.targetSales / 1000000).toFixed(2)}M
            </span>
            <span
              className={`font-semibold flex items-center gap-1 ${
                kpis.salesVariance >= 0 ? 'text-[#22c55e]' : 'text-rose-600'
              }`}
            >
              {kpis.salesVariance >= 0 ? '▲ +' : '▼ -'}{varianceFormatted}
            </span>
          </div>
        </div>

        {/* KPI 2: Target Achievement Rate */}
        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748b] uppercase tracking-[0.05em]">
                Target Realization
              </span>
              <div className="w-6 h-6 rounded bg-emerald-50 text-[#22c55e] flex items-center justify-center">
                <Target className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2 mb-1">
              <span className="text-[28px] font-bold tracking-tight text-slate-900">
                {kpis.achievementRate}%
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  isTargetAchieved
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {isTargetAchieved ? 'Above Plan' : 'Lagging'}
              </span>
            </div>
          </div>
          <div className="pt-3 border-t border-[#e2e8f0] mt-2">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  isTargetAchieved ? 'bg-[#22c55e]' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(kpis.achievementRate, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 3: Space Productivity */}
        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748b] uppercase tracking-[0.05em]">
                Space Productivity
              </span>
              <div className="w-6 h-6 rounded bg-slate-100 text-slate-600 flex items-center justify-center">
                <Maximize2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-2 mb-1">
              <span className="text-[28px] font-bold tracking-tight text-slate-900">
                ${kpis.salesPerSqFt}
              </span>
              <span className="text-xs text-[#64748b]">/ sq ft</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-3 border-t border-[#e2e8f0] mt-2">
            <span className="text-[#64748b]">Volume Density</span>
            <span className="font-medium text-slate-900">
              {kpis.unitsSold.toLocaleString()} units
            </span>
          </div>
        </div>

        {/* KPI 4: Basket Size & Footfall */}
        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748b] uppercase tracking-[0.05em]">
                Avg. Basket Value
              </span>
              <div className="w-6 h-6 rounded bg-blue-50 text-[#3b82f6] flex items-center justify-center">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2 mb-1">
              <span className="text-[28px] font-bold tracking-tight text-slate-900">
                ${kpis.avgBasket}
              </span>
              <span className="text-xs text-[#64748b]">per order</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-3 border-t border-[#e2e8f0] mt-2">
            <span className="text-[#64748b]">
              {kpis.totalTransactions.toLocaleString()} orders
            </span>
            <span
              className={`font-semibold flex items-center gap-1 ${
                kpis.wowGrowth >= 0 ? 'text-[#22c55e]' : 'text-rose-600'
              }`}
            >
              {kpis.wowGrowth >= 0 ? '▲' : '▼'} {kpis.wowGrowth > 0 ? `+${kpis.wowGrowth}%` : `${kpis.wowGrowth}%`} vs PW
            </span>
          </div>
        </div>
      </div>

      {/* Network Alert Ribbon */}
      <div className="mt-4 bg-white rounded-lg p-3 border border-[#e2e8f0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#64748b]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-800">Store Network Pacing:</span>
          <span className="inline-flex items-center gap-1 text-[#22c55e] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {kpis.topPerformingStoreCount} Outperforming (≥103%)
          </span>
          <span className="text-slate-300">•</span>
          <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            {kpis.underperformingStoreCount} Requiring Attention (&lt;97%)
          </span>
        </div>
        <div className="text-slate-400">
          5 Operating Regions Active
        </div>
      </div>
    </section>
  );
};
