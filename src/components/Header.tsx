import React from 'react';
import {
  Store,
  UploadCloud,
  FileSpreadsheet,
  Download,
  RotateCcw,
  Sparkles,
  MapPin,
  TrendingUp,
  Plus,
} from 'lucide-react';

interface HeaderProps {
  storeCount: number;
  regionCount: number;
  weekCount: number;
  totalSales: number;
  onOpenUpload: () => void;
  onResetData: () => void;
  onDownloadTemplates: () => void;
  onScrollToExecutiveSummary: () => void;
  onAddStore?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  storeCount,
  regionCount,
  weekCount,
  totalSales,
  onOpenUpload,
  onResetData,
  onDownloadTemplates,
  onScrollToExecutiveSummary,
  onAddStore,
}) => {
  return (
    <header className="border-b border-[#e2e8f0] bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3.5 gap-3">
          {/* Brand & Context */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#3b82f6] rounded-md flex items-center justify-center text-white shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold tracking-[-0.01em] text-slate-900">
                  OmniRetail Regional Analytics
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                  5 Regions Active
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {storeCount} Stores in {regionCount} Regions
                </span>
                <span className="text-slate-300">•</span>
                <span>{weekCount} Weekly Periods</span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-slate-900">
                  ${(totalSales / 1000000).toFixed(2)}M Total Sales
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              id="btn-ai-summary"
              onClick={onScrollToExecutiveSummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-[#e2e8f0] rounded-md transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#3b82f6]" />
              Actionable Briefing
            </button>

            <button
              id="btn-download-templates"
              onClick={onDownloadTemplates}
              title="Download sample Excel (.xlsx) workbook template with Store Master and Weekly Sales sheets"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-[#e2e8f0] rounded-md transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#3b82f6]" />
              <span className="hidden sm:inline">Excel</span> Template
            </button>

            {onAddStore && (
              <button
                id="btn-add-store-nav"
                onClick={onAddStore}
                title="Add a store directly in the dashboard without modifying files"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-[#e2e8f0] rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#3b82f6]" />
                <span>+ Add Store</span>
              </button>
            )}

            <button
              id="btn-upload-data"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-[#3b82f6] hover:bg-blue-600 rounded-md transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5 text-white" />
              + Upload Dataset
            </button>

            <button
              id="btn-reset-sample"
              onClick={onResetData}
              title="Reload the 5-Region 25-Store benchmark dataset"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors border border-transparent hover:border-[#e2e8f0]"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
