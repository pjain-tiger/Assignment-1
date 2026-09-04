import React, { useState } from 'react';
import { StoreAggregatedPerformance, WeeklySalesRecord, StoreMasterRecord } from '../types';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Store,
  User,
  MapPin,
  Calendar,
  Maximize2,
  TrendingUp,
  ShoppingBag,
  ExternalLink,
  Plus,
  Pencil,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface StoreDetailTableProps {
  stores: StoreAggregatedPerformance[];
  weeklySales: WeeklySalesRecord[];
  selectedStoreId: string | null;
  onSelectStore: (storeId: string | null) => void;
  onEditStore?: (store: StoreMasterRecord) => void;
  onAddStore?: () => void;
}

type SortField = 'totalSales' | 'achievementRate' | 'salesPerSqFt' | 'avgBasket' | 'store_name';
type SortOrder = 'asc' | 'desc';

export const StoreDetailTable: React.FC<StoreDetailTableProps> = ({
  stores,
  weeklySales,
  selectedStoreId,
  onSelectStore,
  onEditStore,
  onAddStore,
}) => {
  const [sortField, setSortField] = useState<SortField>('totalSales');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedStores = [...stores].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (typeof aVal === 'string') {
      return sortOrder === 'asc'
        ? (aVal as string).localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal as string);
    }
    return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const totalPages = Math.ceil(sortedStores.length / pageSize) || 1;
  const paginatedStores = sortedStores.slice((page - 1) * pageSize, page * pageSize);

  // Active store for drill-down modal
  const activeStore = selectedStoreId
    ? stores.find((s) => s.store_id === selectedStoreId)
    : null;

  const storeWeeklyData = activeStore
    ? weeklySales
        .filter((w) => w.store_id === activeStore.store_id)
        .sort((a, b) => a.week.localeCompare(b.week))
        .map((w) => ({
          week: w.week.replace('2026-', ''),
          sales: Math.round(w.sales / 1000),
          target: Math.round(w.target_sales / 1000),
          rawSales: w.sales,
          rawTarget: w.target_sales,
          transactions: w.transactions,
        }))
    : [];

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-indigo-600" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-600" />
    );
  };

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Store className="w-4 h-4 text-[#3b82f6]" />
            Store Master & Sales Performance Register
          </h3>
          <p className="text-xs text-[#64748b] mt-0.5">
            Granular store-level operational metrics, target variance, and space productivity.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="text-xs text-[#64748b] font-medium">
            Showing {sortedStores.length} stores
          </span>
          {onAddStore && (
            <button
              id="btn-add-store-manual"
              onClick={onAddStore}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#3b82f6] hover:bg-blue-600 rounded-md shadow-xs transition-colors"
              title="Add a store manually without modifying files"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Store</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto border border-[#e2e8f0] rounded-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] font-medium">
            <tr>
              <th
                onClick={() => handleSort('store_name')}
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Store Name & ID</span>
                  {getSortIcon('store_name')}
                </div>
              </th>
              <th className="py-3 px-3">Region</th>
              <th className="py-3 px-3">Format</th>
              <th
                onClick={() => handleSort('totalSales')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Total Sales</span>
                  {getSortIcon('totalSales')}
                </div>
              </th>
              <th className="py-3 px-3 text-right">Target Budget</th>
              <th
                onClick={() => handleSort('achievementRate')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Achievement</span>
                  {getSortIcon('achievementRate')}
                </div>
              </th>
              <th
                onClick={() => handleSort('salesPerSqFt')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Sales / SqFt</span>
                  {getSortIcon('salesPerSqFt')}
                </div>
              </th>
              <th
                onClick={() => handleSort('avgBasket')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Avg Basket</span>
                  {getSortIcon('avgBasket')}
                </div>
              </th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0] bg-white">
            {paginatedStores.map((store, sIdx) => (
              <tr
                key={`${store.store_id}-${(page - 1) * pageSize + sIdx}`}
                className="hover:bg-slate-50 transition-colors group"
              >
                <td className="py-3 px-3.5">
                  <div className="font-semibold text-slate-900 group-hover:text-[#3b82f6] transition-colors">
                    {store.store_name}
                  </div>
                  <div className="text-[11px] text-[#64748b] font-mono mt-0.5">
                    {store.store_id} • {store.city}, {store.state}
                  </div>
                </td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                    {store.region}
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-600 font-medium">
                  {store.format}
                </td>
                <td className="py-3 px-3 text-right font-bold text-slate-900">
                  ${(store.totalSales / 1000).toLocaleString()}k
                </td>
                <td className="py-3 px-3 text-right text-[#64748b]">
                  ${(store.targetSales / 1000).toLocaleString()}k
                </td>
                <td className="py-3 px-3 text-right">
                  <span
                    className={`font-semibold ${
                      store.achievementRate >= 100 ? 'text-[#22c55e]' : 'text-rose-600'
                    }`}
                  >
                    {store.achievementRate}%
                  </span>
                  <div className="text-[10px] text-slate-400">
                    {store.salesVariance >= 0 ? '+' : '-'}$
                    {Math.abs(Math.round(store.salesVariance / 1000))}k
                  </div>
                </td>
                <td className="py-3 px-3 text-right font-medium text-slate-800">
                  ${store.salesPerSqFt}
                </td>
                <td className="py-3 px-3 text-right font-medium text-slate-800">
                  ${store.avgBasket}
                </td>
                <td className="py-3 px-3 text-center">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                      store.status === 'Exceeding'
                        ? 'bg-emerald-50 text-emerald-700'
                        : store.status === 'On Track'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {store.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    {onEditStore && (
                      <button
                        onClick={() =>
                          onEditStore({
                            store_id: store.store_id,
                            store_name: store.store_name,
                            region: store.region,
                            format: store.format,
                            size_sqft: store.size_sqft,
                            city: store.city,
                            state: store.state,
                            manager: store.manager,
                            open_date: store.open_date,
                          })
                        }
                        title="Edit store details and target without modifying files"
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                    <button
                      onClick={() => onSelectStore(store.store_id)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#3b82f6] hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                    >
                      <span>Drilldown</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs text-[#64748b]">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 border border-[#e2e8f0] rounded-md disabled:opacity-40 hover:bg-slate-50 font-medium"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1 border border-[#e2e8f0] rounded-md disabled:opacity-40 hover:bg-slate-50 font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Drill-down Modal Drawer */}
      {activeStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-4 border-b border-[#e2e8f0]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900">
                    {activeStore.store_name}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                    {activeStore.store_id}
                  </span>
                </div>
                <p className="text-xs text-[#64748b] mt-1 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {activeStore.city}, {activeStore.state} • {activeStore.region} Region • {activeStore.format} Format
                </p>
              </div>
              <button
                onClick={() => onSelectStore(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Store Master Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 p-3.5 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Store Manager</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <User className="w-3 h-3 text-slate-400" />
                  {activeStore.manager}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Floor Size</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Maximize2 className="w-3 h-3 text-slate-400" />
                  {activeStore.size_sqft.toLocaleString()} sq ft
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Target Realization</span>
                <span
                  className={`font-semibold mt-0.5 block ${
                    activeStore.achievementRate >= 100 ? 'text-[#22c55e]' : 'text-rose-600'
                  }`}
                >
                  {activeStore.achievementRate}% Plan
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Total Revenue</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  ${(activeStore.totalSales / 1000).toFixed(0)}k
                </span>
              </div>
            </div>

            {/* Weekly Trajectory Chart */}
            <div className="mt-4">
              <h4 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#64748b] mb-2">
                12-Week Store Sales Trajectory ($ in thousands)
              </h4>
              <div className="h-56 w-full border border-[#e2e8f0] rounded-lg p-2 bg-white">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={storeWeeklyData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={(v) => `$${v}k`}
                      axisLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }: any) => {
                        if (active && payload && payload.length) {
                          const p = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-lg">
                              <p className="font-bold">Week {label}</p>
                              <p className="text-[#22c55e]">
                                Sales: ${p.rawSales.toLocaleString()}
                              </p>
                              <p className="text-slate-300">
                                Target: ${p.rawTarget.toLocaleString()}
                              </p>
                              <p className="text-slate-400">
                                Transactions: {p.transactions}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      name="Weekly Sales"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      name="Target"
                      stroke="#94a3b8"
                      strokeDasharray="3 3"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#e2e8f0] flex items-center justify-between">
              {onEditStore && (
                <button
                  onClick={() => {
                    onEditStore({
                      store_id: activeStore.store_id,
                      store_name: activeStore.store_name,
                      region: activeStore.region,
                      format: activeStore.format,
                      size_sqft: activeStore.size_sqft,
                      city: activeStore.city,
                      state: activeStore.state,
                      manager: activeStore.manager,
                      open_date: activeStore.open_date,
                    });
                    onSelectStore(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-blue-500" />
                  <span>Edit Store & Targets</span>
                </button>
              )}
              <button
                onClick={() => onSelectStore(null)}
                className="px-4 py-2 bg-[#3b82f6] hover:bg-blue-600 text-white text-xs font-medium rounded-md transition-colors ml-auto"
              >
                Close Store Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
