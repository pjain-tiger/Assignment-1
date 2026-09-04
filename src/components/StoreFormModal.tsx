import React, { useState, useEffect } from 'react';
import { StoreMasterRecord, Region, StoreFormat } from '../types';
import { X, Store, MapPin, User, Check, Trash2, TrendingUp, Sliders } from 'lucide-react';

interface StoreFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialStore?: StoreMasterRecord | null;
  currentWeeklySalesAvg?: number;
  currentWeeklyTargetAvg?: number;
  onClose: () => void;
  onSave: (
    store: StoreMasterRecord,
    options?: {
      targetAdjustmentPct?: number;
      initialWeeklySales?: number;
      initialTargetSales?: number;
    }
  ) => void;
  onDelete?: (storeId: string) => void;
}

const REGIONS: Region[] = ['North', 'South', 'East', 'West', 'Central'];
const FORMATS: StoreFormat[] = ['Flagship', 'Superstore', 'Standard', 'Express'];

export const StoreFormModal: React.FC<StoreFormModalProps> = ({
  isOpen,
  mode,
  initialStore,
  currentWeeklySalesAvg = 200000,
  currentWeeklyTargetAvg = 210000,
  onClose,
  onSave,
  onDelete,
}) => {
  const [storeId, setStoreId] = useState('');
  const [storeName, setStoreName] = useState('');
  const [region, setRegion] = useState<Region>('Central');
  const [format, setFormat] = useState<StoreFormat>('Standard');
  const [sizeSqft, setSizeSqft] = useState(15000);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [manager, setManager] = useState('');
  const [openDate, setOpenDate] = useState('2022-01-15');

  // Performance adjustment parameters
  const [targetAdjustmentPct, setTargetAdjustmentPct] = useState(100); // 100 = 100% (no change)
  const [newWeeklySales, setNewWeeklySales] = useState(200000);
  const [newTargetSales, setNewTargetSales] = useState(210000);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialStore) {
        setStoreId(initialStore.store_id);
        setStoreName(initialStore.store_name);
        setRegion(initialStore.region);
        setFormat(initialStore.format);
        setSizeSqft(initialStore.size_sqft);
        setCity(initialStore.city);
        setState(initialStore.state);
        setManager(initialStore.manager);
        setOpenDate(initialStore.open_date || '2022-01-15');
        setTargetAdjustmentPct(100);
      } else {
        const randId = `STR-${String(Math.floor(Math.random() * 900) + 100)}`;
        setStoreId(randId);
        setStoreName('New Retail Location');
        setRegion('North');
        setFormat('Standard');
        setSizeSqft(15000);
        setCity('Austin');
        setState('TX');
        setManager('Store Operations Lead');
        setOpenDate(new Date().toISOString().split('T')[0]);
        setNewWeeklySales(185000);
        setNewTargetSales(190000);
      }
      setError(null);
    }
  }, [isOpen, mode, initialStore]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId.trim()) {
      setError('Store ID is required');
      return;
    }
    if (!storeName.trim()) {
      setError('Store Name is required');
      return;
    }

    const updatedStore: StoreMasterRecord = {
      store_id: storeId.trim(),
      store_name: storeName.trim(),
      region,
      format,
      size_sqft: Number(sizeSqft) || 15000,
      city: city.trim() || 'Metro',
      state: state.trim() || 'US',
      manager: manager.trim() || 'Store Manager',
      open_date: openDate || '2022-01-01',
    };

    onSave(updatedStore, {
      targetAdjustmentPct: mode === 'edit' ? targetAdjustmentPct / 100 : undefined,
      initialWeeklySales: mode === 'create' ? newWeeklySales : undefined,
      initialTargetSales: mode === 'create' ? newTargetSales : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#3b82f6] flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                {mode === 'create' ? 'Add New Store' : `Edit Store: ${storeId}`}
              </h3>
              <p className="text-xs text-slate-500">
                Update store configuration and performance targets directly in the app
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Store ID
              </label>
              <input
                type="text"
                value={storeId}
                disabled={mode === 'edit'}
                onChange={(e) => setStoreId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 font-mono"
                placeholder="STR-001"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Store Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="Downtown Flagship"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as Region)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r} Region
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as StoreFormat)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
              >
                {FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Size (Sq Ft)
              </label>
              <input
                type="number"
                value={sizeSqft}
                onChange={(e) => setSizeSqft(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="Dallas"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="TX"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Store Manager
              </label>
              <input
                type="text"
                value={manager}
                onChange={(e) => setManager(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="Alex Rivera"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Opening Date
              </label>
              <input
                type="date"
                value={openDate}
                onChange={(e) => setOpenDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Performance & Target adjustment section */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Sliders className="w-3.5 h-3.5 text-[#3b82f6]" />
              <span className="text-xs font-semibold text-slate-800">
                {mode === 'edit' ? 'Adjust Performance Targets' : 'Initial Sales Benchmarks'}
              </span>
            </div>

            {mode === 'edit' ? (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Weekly Target Multiplier:</span>
                  <span className="font-semibold text-slate-800">{targetAdjustmentPct}%</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="130"
                  step="5"
                  value={targetAdjustmentPct}
                  onChange={(e) => setTargetAdjustmentPct(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#3b82f6]"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>-30% Lower Target</span>
                  <span>Baseline (100%)</span>
                  <span>+30% Stretch Target</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">
                    Avg Weekly Sales ($)
                  </label>
                  <input
                    type="number"
                    value={newWeeklySales}
                    onChange={(e) => setNewWeeklySales(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">
                    Weekly Target ($)
                  </label>
                  <input
                    type="number"
                    value={newTargetSales}
                    onChange={(e) => setNewTargetSales(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {mode === 'edit' && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to remove store ${storeId}?`)) {
                    onDelete(storeId);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Store</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-[#3b82f6] hover:bg-blue-600 rounded-lg shadow-xs transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{mode === 'create' ? 'Add Store to Dashboard' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
