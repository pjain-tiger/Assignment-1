import React from 'react';
import { Region, StoreFormat } from '../types';
import { Filter, Search, RotateCcw } from 'lucide-react';

interface FilterBarProps {
  selectedRegion: string;
  onSelectRegion: (region: string) => void;
  selectedFormat: string;
  onSelectFormat: (format: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onResetFilters: () => void;
  availableRegions: string[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedRegion,
  onSelectRegion,
  selectedFormat,
  onSelectFormat,
  selectedStatus,
  onSelectStatus,
  searchQuery,
  onSearchChange,
  onResetFilters,
  availableRegions,
}) => {
  const isFiltered =
    selectedRegion !== 'All' ||
    selectedFormat !== 'All' ||
    selectedStatus !== 'All' ||
    searchQuery.trim() !== '';

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-3.5 mb-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Region Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <span className="text-xs font-semibold text-[#64748b] mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Region:
          </span>
          <button
            id="filter-region-all"
            onClick={() => onSelectRegion('All')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors shrink-0 ${
              selectedRegion === 'All'
                ? 'bg-[#3b82f6] text-white'
                : 'bg-slate-100 text-[#64748b] hover:bg-slate-200'
            }`}
          >
            All 5 Regions
          </button>
          {availableRegions.map((reg) => (
            <button
              key={reg}
              id={`filter-region-${reg.toLowerCase()}`}
              onClick={() => onSelectRegion(reg)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors shrink-0 ${
                selectedRegion === reg
                  ? 'bg-[#3b82f6] text-white'
                  : 'bg-slate-100 text-[#64748b] hover:bg-slate-200'
              }`}
            >
              {reg}
            </button>
          ))}
        </div>

        {/* Right: Dropdowns & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Format selector */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-[#64748b] font-medium">Format:</span>
            <select
              id="filter-format-select"
              value={selectedFormat}
              onChange={(e) => onSelectFormat(e.target.value)}
              className="text-xs font-medium bg-white border border-[#e2e8f0] rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-[#3b82f6]"
            >
              <option value="All">All Formats</option>
              <option value="Flagship">Flagship</option>
              <option value="Superstore">Superstore</option>
              <option value="Standard">Standard</option>
              <option value="Express">Express</option>
            </select>
          </div>

          {/* Performance Status */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-[#64748b] font-medium">Tier:</span>
            <select
              id="filter-status-select"
              value={selectedStatus}
              onChange={(e) => onSelectStatus(e.target.value)}
              className="text-xs font-medium bg-white border border-[#e2e8f0] rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-[#3b82f6]"
            >
              <option value="All">All Tiers</option>
              <option value="Exceeding">Exceeding (≥103%)</option>
              <option value="On Track">On Track (97-102%)</option>
              <option value="Underperforming">Underperforming (&lt;97%)</option>
            </select>
          </div>

          {/* Search input */}
          <div className="relative min-w-[170px] sm:min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-store-search"
              type="text"
              placeholder="Search store, city, state..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-white border border-[#e2e8f0] rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3b82f6]"
            />
          </div>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              id="btn-reset-filters"
              onClick={onResetFilters}
              title="Reset all filters"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
