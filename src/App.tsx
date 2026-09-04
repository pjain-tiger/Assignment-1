import React, { useState, useMemo } from 'react';
import {
  StoreMasterRecord,
  WeeklySalesRecord,
  Region,
} from './types';
import {
  INITIAL_STORES,
  INITIAL_WEEKLY_SALES,
  getStoreMasterCSVTemplate,
  getWeeklySalesCSVTemplate,
} from './data/sampleData';
import {
  enrichSalesRecords,
  deduplicateStores,
  calculateAggregatedKPIs,
  calculateRegionalMetrics,
  calculateFormatMetrics,
  calculateWeeklyTrends,
  calculateStorePerformances,
  generateActionableInsights,
  generateExcelWorkbookTemplate,
} from './utils/dataProcessor';
import { Header } from './components/Header';
import { KPIBanner } from './components/KPIBanner';
import { FilterBar } from './components/FilterBar';
import { RegionalPerformanceChart } from './components/RegionalPerformanceChart';
import { WeeklyTrendChart } from './components/WeeklyTrendChart';
import { StorePerformanceMatrix } from './components/StorePerformanceMatrix';
import { ExecutiveSummaryPanel } from './components/ExecutiveSummaryPanel';
import { StoreDetailTable } from './components/StoreDetailTable';
import { DataUploadModal } from './components/DataUploadModal';
import { StoreFormModal } from './components/StoreFormModal';

export default function App() {
  // Primary datasets
  const [storeMaster, setStoreMaster] = useState<StoreMasterRecord[]>(INITIAL_STORES);
  const [weeklySales, setWeeklySales] = useState<WeeklySalesRecord[]>(INITIAL_WEEKLY_SALES);

  // Filter states
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedFormat, setSelectedFormat] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected store for drill-down inspection
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  // Direct in-app store editor modal state (allows editing without modifying files)
  const [isStoreModalOpen, setIsStoreModalOpen] = useState<boolean>(false);
  const [storeModalMode, setStoreModalMode] = useState<'create' | 'edit'>('create');
  const [storeToEdit, setStoreToEdit] = useState<StoreMasterRecord | null>(null);

  // Enriched records (Weekly Sales + Store Master joined)
  const enrichedSales = useMemo(() => {
    return enrichSalesRecords(weeklySales, storeMaster);
  }, [weeklySales, storeMaster]);

  // Filtered dataset based on user controls
  const filteredRecords = useMemo(() => {
    return enrichedSales.filter((r) => {
      // Region filter
      if (selectedRegion !== 'All' && r.region !== selectedRegion) return false;
      // Format filter
      if (selectedFormat !== 'All' && r.format !== selectedFormat) return false;
      // Search query (store name, store ID, city, state)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = r.store_name.toLowerCase().includes(q);
        const matchId = r.store_id.toLowerCase().includes(q);
        const matchCity = r.city.toLowerCase().includes(q);
        const matchState = r.state.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchCity && !matchState) return false;
      }
      return true;
    });
  }, [enrichedSales, selectedRegion, selectedFormat, searchQuery]);

  // Stores in active filter
  const filteredStores = useMemo(() => {
    const unique = deduplicateStores(storeMaster);
    return unique.filter((s) => {
      if (selectedRegion !== 'All' && s.region !== selectedRegion) return false;
      if (selectedFormat !== 'All' && s.format !== selectedFormat) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = s.store_name.toLowerCase().includes(q);
        const matchId = s.store_id.toLowerCase().includes(q);
        const matchCity = s.city.toLowerCase().includes(q);
        const matchState = s.state.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchCity && !matchState) return false;
      }
      return true;
    });
  }, [storeMaster, selectedRegion, selectedFormat, searchQuery]);

  // Overall KPIs
  const aggregatedKPIs = useMemo(() => {
    return calculateAggregatedKPIs(filteredRecords, filteredStores);
  }, [filteredRecords, filteredStores]);

  // Regional metrics (across the 5 regions)
  const regionalMetrics = useMemo(() => {
    return calculateRegionalMetrics(enrichedSales, storeMaster);
  }, [enrichedSales, storeMaster]);

  // Store format metrics
  const formatMetrics = useMemo(() => {
    return calculateFormatMetrics(filteredRecords, filteredStores);
  }, [filteredRecords, filteredStores]);

  // Weekly trend series
  const weeklyTrends = useMemo(() => {
    return calculateWeeklyTrends(filteredRecords);
  }, [filteredRecords]);

  // Store-level aggregated performances
  const rawStorePerformances = useMemo(() => {
    return calculateStorePerformances(filteredRecords, filteredStores);
  }, [filteredRecords, filteredStores]);

  // Filtered by performance tier if selected
  const storePerformances = useMemo(() => {
    if (selectedStatus === 'All') return rawStorePerformances;
    return rawStorePerformances.filter((s) => s.status === selectedStatus);
  }, [rawStorePerformances, selectedStatus]);

  // Dynamic tactical action items
  const actionItems = useMemo(() => {
    return generateActionableInsights(aggregatedKPIs, regionalMetrics, rawStorePerformances);
  }, [aggregatedKPIs, regionalMetrics, rawStorePerformances]);

  // Available regions
  const availableRegions = useMemo(() => {
    const set = new Set(storeMaster.map((s) => s.region));
    return Array.from(set).sort();
  }, [storeMaster]);

  // Weeks count
  const distinctWeeksCount = useMemo(() => {
    return new Set(weeklySales.map((w) => w.week)).size;
  }, [weeklySales]);

  // Handlers
  const handleResetData = () => {
    setStoreMaster(INITIAL_STORES);
    setWeeklySales(INITIAL_WEEKLY_SALES);
    setSelectedRegion('All');
    setSelectedFormat('All');
    setSelectedStatus('All');
    setSearchQuery('');
  };

  const handleApplyUploadedData = (
    newStores: StoreMasterRecord[],
    newSales: WeeklySalesRecord[]
  ) => {
    if (newStores.length > 0) {
      setStoreMaster(deduplicateStores(newStores));
    }
    if (newSales.length > 0) {
      setWeeklySales(newSales);
    }
    setSelectedStoreId(null);
    setSelectedRegion('All');
    setSelectedFormat('All');
    setSelectedStatus('All');
    setSearchQuery('');
  };

  const handleDownloadTemplates = () => {
    const blob = generateExcelWorkbookTemplate(storeMaster, weeklySales);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Retail_Performance_Dataset_Template.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleScrollToExecutiveSummary = () => {
    const element = document.getElementById('executive-summary-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleResetFilters = () => {
    setSelectedRegion('All');
    setSelectedFormat('All');
    setSelectedStatus('All');
    setSearchQuery('');
  };

  // Direct in-app store CRUD (enables users to add or edit stores/targets without touching source files)
  const handleSaveStore = (
    store: StoreMasterRecord,
    options?: {
      targetAdjustmentPct?: number;
      initialWeeklySales?: number;
      initialTargetSales?: number;
    }
  ) => {
    if (storeModalMode === 'create') {
      setStoreMaster((prev) =>
        deduplicateStores([
          store,
          ...prev.filter((s) => s.store_id.trim().toUpperCase() !== store.store_id.trim().toUpperCase()),
        ])
      );

      const distinctWeeks: string[] = Array.from(new Set<string>(weeklySales.map((w) => w.week))).sort();
      const baseSales = options?.initialWeeklySales || 185000;
      const baseTarget = options?.initialTargetSales || 190000;

      const weeksToUse: string[] =
        distinctWeeks.length > 0
          ? distinctWeeks
          : ['2026-W01', '2026-W02', '2026-W03', '2026-W04'];

      const newSalesRecords: WeeklySalesRecord[] = weeksToUse.map((wk, idx) => {
        const sales = Math.round(baseSales * (0.95 + ((idx % 5) * 0.03)));
        const target_sales = Math.round(baseTarget);
        const transactions = Math.max(1, Math.round(sales / 62));
        return {
          store_id: store.store_id,
          week: wk,
          week_date: `2026-01-${String(Math.min(28, 5 + idx * 7)).padStart(2, '0')}`,
          sales,
          target_sales,
          transactions,
          units_sold: Math.round(transactions * 2.2),
          markdown_pct: 0.08,
        };
      });

      setWeeklySales((prev) => [...prev, ...newSalesRecords]);
    } else {
      setStoreMaster((prev) =>
        prev.map((s) => (s.store_id === store.store_id ? store : s))
      );

      if (options?.targetAdjustmentPct && options.targetAdjustmentPct !== 1) {
        const multiplier = options.targetAdjustmentPct;
        setWeeklySales((prev) =>
          prev.map((sale) => {
            if (sale.store_id === store.store_id) {
              return {
                ...sale,
                target_sales: Math.round(sale.target_sales * multiplier),
              };
            }
            return sale;
          })
        );
      }
    }
  };

  const handleDeleteStore = (storeId: string) => {
    setStoreMaster((prev) => prev.filter((s) => s.store_id !== storeId));
    setWeeklySales((prev) => prev.filter((w) => w.store_id !== storeId));
    if (selectedStoreId === storeId) {
      setSelectedStoreId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      {/* Top Application Header */}
      <Header
        storeCount={storeMaster.length}
        regionCount={availableRegions.length}
        weekCount={distinctWeeksCount}
        totalSales={aggregatedKPIs.totalSales}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onResetData={handleResetData}
        onDownloadTemplates={handleDownloadTemplates}
        onScrollToExecutiveSummary={handleScrollToExecutiveSummary}
        onAddStore={() => {
          setStoreToEdit(null);
          setStoreModalMode('create');
          setIsStoreModalOpen(true);
        }}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Core KPI Ribbon */}
        <KPIBanner
          kpis={aggregatedKPIs}
          activeRegion={selectedRegion}
        />

        {/* Dynamic Filter Bar */}
        <FilterBar
          selectedRegion={selectedRegion}
          onSelectRegion={setSelectedRegion}
          selectedFormat={selectedFormat}
          onSelectFormat={setSelectedFormat}
          selectedStatus={selectedStatus}
          onSelectStatus={setSelectedStatus}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onResetFilters={handleResetFilters}
          availableRegions={availableRegions}
        />

        {/* Visual Insights Grid: Regional Matrix + Weekly Trajectory */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <RegionalPerformanceChart
            regionalMetrics={regionalMetrics}
            selectedRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
          />
          <WeeklyTrendChart
            trendData={weeklyTrends}
            selectedRegion={selectedRegion}
          />
        </div>

        {/* Store Performance Matrix & Format Breakdown */}
        <StorePerformanceMatrix
          stores={rawStorePerformances}
          formatMetrics={formatMetrics}
          onSelectStore={(id) => setSelectedStoreId(id)}
        />

        {/* Action-Oriented Business Summaries & AI Intelligence */}
        <ExecutiveSummaryPanel
          kpis={aggregatedKPIs}
          regionalMetrics={regionalMetrics}
          storePerformances={rawStorePerformances}
          actionItems={actionItems}
          selectedRegion={selectedRegion}
        />

        {/* Store Master & Weekly Sales Performance Register */}
        <StoreDetailTable
          stores={storePerformances}
          weeklySales={weeklySales}
          selectedStoreId={selectedStoreId}
          onSelectStore={setSelectedStoreId}
          onAddStore={() => {
            setStoreToEdit(null);
            setStoreModalMode('create');
            setIsStoreModalOpen(true);
          }}
          onEditStore={(store) => {
            setStoreToEdit(store);
            setStoreModalMode('edit');
            setIsStoreModalOpen(true);
          }}
        />
      </main>

      {/* Upload Data Modal */}
      <DataUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onApplyData={handleApplyUploadedData}
        onResetToSample={handleResetData}
        currentStoreCount={storeMaster.length}
        currentSalesCount={weeklySales.length}
      />

      {/* Direct In-App Store & Target Editor Modal */}
      <StoreFormModal
        isOpen={isStoreModalOpen}
        mode={storeModalMode}
        initialStore={storeToEdit}
        onClose={() => setIsStoreModalOpen(false)}
        onSave={handleSaveStore}
        onDelete={handleDeleteStore}
      />

      {/* Footer */}
      <footer className="border-t border-[#e2e8f0] bg-white py-6 text-center text-xs text-[#64748b]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Retail Sales Performance Analytics • Operating across North, South, East, West, and Central Regions
          </span>
          <span className="font-mono text-[#64748b]">
            Store Master Reference & Weekly Sales Sync v2.4
          </span>
        </div>
      </footer>
    </div>
  );
}
