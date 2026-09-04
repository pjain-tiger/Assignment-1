import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  StoreMasterRecord,
  WeeklySalesRecord,
  EnrichedRecord,
  AggregatedKPIs,
  RegionMetric,
  FormatMetric,
  WeeklyTrendPoint,
  StoreAggregatedPerformance,
  ActionItem,
  Region,
  StoreFormat,
} from '../types';
import { INITIAL_STORES, INITIAL_WEEKLY_SALES } from '../data/sampleData';

export function enrichSalesRecords(
  weeklySales: WeeklySalesRecord[],
  storeMaster: StoreMasterRecord[]
): EnrichedRecord[] {
  const storeMap = new Map<string, StoreMasterRecord>();
  storeMaster.forEach((s) => {
    storeMap.set(s.store_id.trim().toUpperCase(), s);
  });

  const enriched: EnrichedRecord[] = [];

  weeklySales.forEach((sale) => {
    const store = storeMap.get(sale.store_id.trim().toUpperCase());
    if (store) {
      enriched.push({
        ...sale,
        store_name: store.store_name,
        region: store.region,
        format: store.format,
        size_sqft: store.size_sqft,
        city: store.city,
        state: store.state,
        manager: store.manager,
      });
    }
  });

  return enriched;
}

export function deduplicateStores(stores: StoreMasterRecord[]): StoreMasterRecord[] {
  const map = new Map<string, StoreMasterRecord>();
  for (const s of stores) {
    if (!s || !s.store_id) continue;
    const cleanId = String(s.store_id).trim();
    if (!cleanId) continue;
    const existing = map.get(cleanId);
    if (!existing) {
      map.set(cleanId, {
        ...s,
        store_id: cleanId,
        store_name: String(s.store_name || `Store ${cleanId}`).trim(),
      });
    } else {
      if (existing.store_name.startsWith('Store ') && !s.store_name.startsWith('Store ')) {
        existing.store_name = String(s.store_name).trim();
      }
      if (existing.city === 'Metro Area' && s.city && s.city !== 'Metro Area') {
        existing.city = String(s.city).trim();
      }
      if (existing.state === 'US' && s.state && s.state !== 'US') {
        existing.state = String(s.state).trim();
      }
      if (existing.manager === 'Store Manager' && s.manager && s.manager !== 'Store Manager') {
        existing.manager = String(s.manager).trim();
      }
      if (s.size_sqft > 0 && existing.size_sqft === 15000) {
        existing.size_sqft = s.size_sqft;
      }
      if (existing.format === 'Standard' && s.format !== 'Standard') {
        existing.format = s.format;
      }
    }
  }
  return Array.from(map.values());
}

export function calculateAggregatedKPIs(
  records: EnrichedRecord[],
  stores: StoreMasterRecord[]
): AggregatedKPIs {
  const uniqueStores = deduplicateStores(stores);

  if (records.length === 0) {
    return {
      totalSales: 0,
      targetSales: 0,
      achievementRate: 0,
      salesVariance: 0,
      totalTransactions: 0,
      avgBasket: 0,
      unitsSold: 0,
      salesPerSqFt: 0,
      wowGrowth: 0,
      storeCount: uniqueStores.length,
      underperformingStoreCount: 0,
      topPerformingStoreCount: 0,
    };
  }

  const totalSales = records.reduce((sum, r) => sum + r.sales, 0);
  const targetSales = records.reduce((sum, r) => sum + r.target_sales, 0);
  const totalTransactions = records.reduce((sum, r) => sum + r.transactions, 0);
  const unitsSold = records.reduce((sum, r) => sum + r.units_sold, 0);

  // Total square footage of active stores in the filtered set
  const activeStoreIds = new Set(records.map((r) => r.store_id));
  const activeStores = uniqueStores.filter((s) => activeStoreIds.has(s.store_id));
  const totalSqFt = activeStores.reduce((sum, s) => sum + s.size_sqft, 0);

  const achievementRate = targetSales > 0 ? Number(((totalSales / targetSales) * 100).toFixed(1)) : 0;
  const salesVariance = totalSales - targetSales;
  const avgBasket = totalTransactions > 0 ? Number((totalSales / totalTransactions).toFixed(2)) : 0;
  const salesPerSqFt = totalSqFt > 0 ? Number((totalSales / totalSqFt).toFixed(1)) : 0;

  // Calculate WoW growth based on latest two distinct weeks
  const distinctWeeks = Array.from(new Set(records.map((r) => r.week))).sort();
  let wowGrowth = 0;
  if (distinctWeeks.length >= 2) {
    const latestWeek = distinctWeeks[distinctWeeks.length - 1];
    const prevWeek = distinctWeeks[distinctWeeks.length - 2];

    const latestSales = records
      .filter((r) => r.week === latestWeek)
      .reduce((sum, r) => sum + r.sales, 0);
    const prevSales = records
      .filter((r) => r.week === prevWeek)
      .reduce((sum, r) => sum + r.sales, 0);

    if (prevSales > 0) {
      wowGrowth = Number((((latestSales - prevSales) / prevSales) * 100).toFixed(1));
    }
  }

  // Count store statuses
  const storeAgg = calculateStorePerformances(records, stores);
  const underperformingStoreCount = storeAgg.filter((s) => s.status === 'Underperforming').length;
  const topPerformingStoreCount = storeAgg.filter((s) => s.status === 'Exceeding').length;

  return {
    totalSales,
    targetSales,
    achievementRate,
    salesVariance,
    totalTransactions,
    avgBasket,
    unitsSold,
    salesPerSqFt,
    wowGrowth,
    storeCount: activeStores.length,
    underperformingStoreCount,
    topPerformingStoreCount,
  };
}

export function calculateRegionalMetrics(
  records: EnrichedRecord[],
  stores: StoreMasterRecord[]
): RegionMetric[] {
  const uniqueStores = deduplicateStores(stores);
  const regions: Region[] = ['North', 'South', 'East', 'West', 'Central'];
  const results: RegionMetric[] = [];

  regions.forEach((region) => {
    const regRecords = records.filter((r) => r.region === region);
    const regStores = uniqueStores.filter((s) => s.region === region);

    if (regStores.length === 0 && regRecords.length === 0) return;

    const totalSales = regRecords.reduce((sum, r) => sum + r.sales, 0);
    const targetSales = regRecords.reduce((sum, r) => sum + r.target_sales, 0);
    const transactions = regRecords.reduce((sum, r) => sum + r.transactions, 0);
    const totalSqFt = regStores.reduce((sum, s) => sum + s.size_sqft, 0);

    const achievementRate = targetSales > 0 ? Number(((totalSales / targetSales) * 100).toFixed(1)) : 0;
    const salesPerSqFt = totalSqFt > 0 ? Number((totalSales / totalSqFt).toFixed(1)) : 0;
    const avgBasket = transactions > 0 ? Number((totalSales / transactions).toFixed(2)) : 0;

    // WoW for region
    const distinctWeeks = Array.from(new Set(regRecords.map((r) => r.week))).sort();
    let wowGrowth = 0;
    if (distinctWeeks.length >= 2) {
      const latestWeek = distinctWeeks[distinctWeeks.length - 1];
      const prevWeek = distinctWeeks[distinctWeeks.length - 2];
      const latestSales = regRecords
        .filter((r) => r.week === latestWeek)
        .reduce((sum, r) => sum + r.sales, 0);
      const prevSales = regRecords
        .filter((r) => r.week === prevWeek)
        .reduce((sum, r) => sum + r.sales, 0);
      if (prevSales > 0) {
        wowGrowth = Number((((latestSales - prevSales) / prevSales) * 100).toFixed(1));
      }
    }

    // Identify top and bottom store in region
    const storeMap = new Map<string, { name: string; sales: number; target: number }>();
    regRecords.forEach((r) => {
      const cur = storeMap.get(r.store_id) || { name: r.store_name, sales: 0, target: 0 };
      cur.sales += r.sales;
      cur.target += r.target_sales;
      storeMap.set(r.store_id, cur);
    });

    let topStore = 'N/A';
    let topAch = -1;
    let underStore = 'N/A';
    let underAch = 99999;

    storeMap.forEach((val) => {
      const ach = val.target > 0 ? (val.sales / val.target) * 100 : 0;
      if (ach > topAch) {
        topAch = ach;
        topStore = `${val.name} (${ach.toFixed(0)}%)`;
      }
      if (ach < underAch) {
        underAch = ach;
        underStore = `${val.name} (${ach.toFixed(0)}%)`;
      }
    });

    results.push({
      region,
      totalSales,
      targetSales,
      achievementRate,
      storeCount: regStores.length,
      totalSqFt,
      salesPerSqFt,
      transactions,
      avgBasket,
      wowGrowth,
      topStore,
      underperformingStore: underStore,
    });
  });

  return results;
}

export function calculateFormatMetrics(
  records: EnrichedRecord[],
  stores: StoreMasterRecord[]
): FormatMetric[] {
  const uniqueStores = deduplicateStores(stores);
  const formats: StoreFormat[] = ['Flagship', 'Superstore', 'Standard', 'Express'];
  const results: FormatMetric[] = [];

  formats.forEach((format) => {
    const fRecords = records.filter((r) => r.format === format);
    const fStores = uniqueStores.filter((s) => s.format === format);

    if (fStores.length === 0 && fRecords.length === 0) return;

    const totalSales = fRecords.reduce((sum, r) => sum + r.sales, 0);
    const targetSales = fRecords.reduce((sum, r) => sum + r.target_sales, 0);
    const transactions = fRecords.reduce((sum, r) => sum + r.transactions, 0);
    const totalSqFt = fStores.reduce((sum, s) => sum + s.size_sqft, 0);

    const achievementRate = targetSales > 0 ? Number(((totalSales / targetSales) * 100).toFixed(1)) : 0;
    const salesPerSqFt = totalSqFt > 0 ? Number((totalSales / totalSqFt).toFixed(1)) : 0;
    const avgBasket = transactions > 0 ? Number((totalSales / transactions).toFixed(2)) : 0;

    results.push({
      format,
      totalSales,
      targetSales,
      achievementRate,
      storeCount: fStores.length,
      totalSqFt,
      salesPerSqFt,
      avgBasket,
    });
  });

  return results;
}

export function calculateWeeklyTrends(records: EnrichedRecord[]): WeeklyTrendPoint[] {
  const weekMap = new Map<string, { week_date: string; sales: number; target_sales: number; transactions: number; regions: Record<string, number> }>();

  records.forEach((r) => {
    if (!weekMap.has(r.week)) {
      weekMap.set(r.week, {
        week_date: r.week_date,
        sales: 0,
        target_sales: 0,
        transactions: 0,
        regions: { North: 0, South: 0, East: 0, West: 0, Central: 0 },
      });
    }
    const item = weekMap.get(r.week)!;
    item.sales += r.sales;
    item.target_sales += r.target_sales;
    item.transactions += r.transactions;
    if (r.region) {
      item.regions[r.region] = (item.regions[r.region] || 0) + r.sales;
    }
  });

  const weeks = Array.from(weekMap.keys()).sort();
  return weeks.map((week) => {
    const data = weekMap.get(week)!;
    const achievementRate = data.target_sales > 0 ? Number(((data.sales / data.target_sales) * 100).toFixed(1)) : 0;

    return {
      week,
      week_date: data.week_date,
      sales: data.sales,
      target_sales: data.target_sales,
      achievementRate,
      transactions: data.transactions,
      North: data.regions.North || 0,
      South: data.regions.South || 0,
      East: data.regions.East || 0,
      West: data.regions.West || 0,
      Central: data.regions.Central || 0,
    };
  });
}

export function calculateStorePerformances(
  records: EnrichedRecord[],
  stores: StoreMasterRecord[]
): StoreAggregatedPerformance[] {
  const uniqueStores = deduplicateStores(stores);
  const storeAggMap = new Map<string, {
    totalSales: number;
    targetSales: number;
    transactions: number;
    unitsSold: number;
  }>();

  records.forEach((r) => {
    const key = r.store_id.trim();
    const cur = storeAggMap.get(key) || { totalSales: 0, targetSales: 0, transactions: 0, unitsSold: 0 };
    cur.totalSales += r.sales;
    cur.targetSales += r.target_sales;
    cur.transactions += r.transactions;
    cur.unitsSold += r.units_sold;
    storeAggMap.set(key, cur);
  });

  const list: StoreAggregatedPerformance[] = [];

  uniqueStores.forEach((store) => {
    const agg = storeAggMap.get(store.store_id.trim());
    if (!agg) return;

    const achievementRate = agg.targetSales > 0 ? Number(((agg.totalSales / agg.targetSales) * 100).toFixed(1)) : 0;
    const salesVariance = agg.totalSales - agg.targetSales;
    const salesPerSqFt = store.size_sqft > 0 ? Number((agg.totalSales / store.size_sqft).toFixed(1)) : 0;
    const avgBasket = agg.transactions > 0 ? Number((agg.totalSales / agg.transactions).toFixed(2)) : 0;

    let status: 'Exceeding' | 'On Track' | 'Underperforming' = 'On Track';
    if (achievementRate >= 103) {
      status = 'Exceeding';
    } else if (achievementRate < 97) {
      status = 'Underperforming';
    }

    list.push({
      store_id: store.store_id,
      store_name: store.store_name,
      region: store.region,
      format: store.format,
      city: store.city,
      state: store.state,
      manager: store.manager,
      size_sqft: store.size_sqft,
      totalSales: agg.totalSales,
      targetSales: agg.targetSales,
      achievementRate,
      salesVariance,
      salesPerSqFt,
      transactions: agg.transactions,
      avgBasket,
      unitsSold: agg.unitsSold,
      status,
    });
  });

  return list.sort((a, b) => b.totalSales - a.totalSales);
}

export function generateActionableInsights(
  kpis: AggregatedKPIs,
  regions: RegionMetric[],
  storePerformances: StoreAggregatedPerformance[]
): ActionItem[] {
  const actions: ActionItem[] = [];

  // Regional triggers
  const laggingRegion = [...regions].sort((a, b) => a.achievementRate - b.achievementRate)[0];
  if (laggingRegion && laggingRegion.achievementRate < 98) {
    actions.push({
      id: 'ACT-01',
      title: `Remediate ${laggingRegion.region} Regional Sales Deficit`,
      category: 'Promotions',
      impact: 'High',
      region: laggingRegion.region,
      description: `${laggingRegion.region} is trailing overall plan at ${laggingRegion.achievementRate}% achievement. Deploy targeted digital flyer promotions and weekend flash markdowns to stimulate local foot traffic.`,
      metricTrigger: `Target realization: ${laggingRegion.achievementRate}% (Below threshold 98%)`,
    });
  }

  const topRegion = [...regions].sort((a, b) => b.achievementRate - a.achievementRate)[0];
  if (topRegion && topRegion.achievementRate >= 104) {
    actions.push({
      id: 'ACT-02',
      title: `Capitalize on ${topRegion.region} High-Velocity Demand`,
      category: 'Inventory',
      impact: 'High',
      region: topRegion.region,
      description: `${topRegion.region} is outperforming at ${topRegion.achievementRate}%. Increase replenishment safety stock by 15% across key hero categories to avoid out-of-stock lost revenue.`,
      metricTrigger: `Outperforming plan by +${(topRegion.achievementRate - 100).toFixed(1)}%`,
    });
  }

  // Store-level triggers
  const underStores = storePerformances.filter((s) => s.status === 'Underperforming');
  if (underStores.length > 0) {
    const bottomStore = underStores[underStores.length - 1];
    actions.push({
      id: 'ACT-03',
      title: `Operational Diagnostic for ${bottomStore.store_name}`,
      category: 'Operations',
      impact: 'High',
      region: bottomStore.region,
      description: `${bottomStore.store_name} (${bottomStore.city}, ${bottomStore.state}) is operating at ${bottomStore.achievementRate}% achievement with a sales variance of -$${Math.abs(bottomStore.salesVariance).toLocaleString()}. Review floor labor schedules and customer conversion rates with Manager ${bottomStore.manager}.`,
      metricTrigger: `Store achievement: ${bottomStore.achievementRate}% (${bottomStore.format})`,
    });
  }

  // Basket size optimization
  actions.push({
    id: 'ACT-04',
    title: 'Merchandising Basket Expansion Initiative',
    category: 'Merchandising',
    impact: 'Medium',
    region: 'All Regions',
    description: `Current network average basket size is $${kpis.avgBasket}. Mandate high-margin cross-merchandised grab-and-go displays at point-of-sale to target a +$3.50 basket lift across all formats.`,
    metricTrigger: `Network average transaction: $${kpis.avgBasket}`,
  });

  // Space productivity
  const lowSqFtStore = [...storePerformances].sort((a, b) => a.salesPerSqFt - b.salesPerSqFt)[0];
  if (lowSqFtStore) {
    actions.push({
      id: 'ACT-05',
      title: `Space Productivity Review for ${lowSqFtStore.store_name}`,
      category: 'Inventory',
      impact: 'Medium',
      region: lowSqFtStore.region,
      description: `Sales density at ${lowSqFtStore.store_name} is $${lowSqFtStore.salesPerSqFt}/sq ft, lowest in network. Reallocate dead floor space to fast-turning seasonal displays or ship-from-store fulfillment.`,
      metricTrigger: `Sales density: $${lowSqFtStore.salesPerSqFt}/sq ft`,
    });
  }

  return actions;
}

// Helper to safely format dates from either Excel serials, Date objects, or string representations
export function formatExcelDate(val: any, fallback = '2026-01-01'): string {
  if (val === undefined || val === null || val === '') return fallback;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return fallback;
    return val.toISOString().slice(0, 10);
  }
  if (typeof val === 'number') {
    // Excel base date Dec 30, 1899 serial date check
    if (val > 1000 && val < 90000) {
      try {
        const utcDays = Math.floor(val - 25569);
        const utcValue = utcDays * 86400;
        const dateInfo = new Date(utcValue * 1000);
        const fractionalDay = val - Math.floor(val) + 0.0000001;
        const totalSeconds = Math.floor(86400 * fractionalDay);
        dateInfo.setSeconds(dateInfo.getSeconds() + totalSeconds);
        if (!isNaN(dateInfo.getTime())) {
          return dateInfo.toISOString().slice(0, 10);
        }
      } catch {
        // Fall back to string conversion
      }
    }
  }
  const str = String(val).trim();
  return str || fallback;
}

// Unified Store Master Row Parser (accepts parsed objects from CSV or Excel)
export function parseStoreMasterRows(rows: any[]): { data: StoreMasterRecord[]; errors: string[] } {
  const errors: string[] = [];
  const data: StoreMasterRecord[] = [];

  rows.forEach((row, idx) => {
    // Broad header alias support to eliminate need for manual file editing
    const rawStoreId =
      row.store_id ??
      row['Store ID'] ??
      row['Store Id'] ??
      row['Store_ID'] ??
      row.STORE_ID ??
      row.Store ??
      row.store ??
      row.ID ??
      row.Id ??
      row['Store #'] ??
      row['Store No'] ??
      row['Store Number'] ??
      row['Store_Number'] ??
      row['Location ID'] ??
      row['Location_ID'] ??
      row.Location ??
      row.location ??
      row['Branch ID'] ??
      row.Branch ??
      row.branch ??
      row['Outlet ID'] ??
      row.Outlet ??
      row.outlet ??
      row.Site ??
      row.site ??
      row.Shop ??
      row.shop ??
      row.Unit ??
      row.unit ??
      row.Code ??
      row.code;

    const rawStoreName =
      row.store_name ??
      row['Store Name'] ??
      row['Store_Name'] ??
      row.STORE_NAME ??
      row.name ??
      row.Name ??
      row.Location ??
      row.location ??
      row.Branch ??
      row.Outlet ??
      row.Shop;

    const store_id = rawStoreId
      ? String(rawStoreId).trim()
      : rawStoreName
      ? `STR-${String(rawStoreName).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}`
      : `STR-${String(idx + 1).padStart(3, '0')}`;

    const store_name = rawStoreName
      ? String(rawStoreName).trim()
      : `Store ${store_id}`;

    let rawRegion = String(
      row.region ??
      row.Region ??
      row['REGION'] ??
      row['Store Region'] ??
      row.Zone ??
      row.zone ??
      row.Territory ??
      row.Market ??
      row.District ??
      ''
    ).trim();

    let finalRegion: Region = 'Central';
    const lowerRegion = rawRegion.toLowerCase();
    if (lowerRegion.includes('north') || lowerRegion === 'n' || lowerRegion.includes('ne') || lowerRegion.includes('nw')) {
      finalRegion = 'North';
    } else if (lowerRegion.includes('south') || lowerRegion === 's' || lowerRegion.includes('se') || lowerRegion.includes('sw')) {
      finalRegion = 'South';
    } else if (lowerRegion.includes('east') || lowerRegion === 'e' || lowerRegion.includes('atlantic')) {
      finalRegion = 'East';
    } else if (lowerRegion.includes('west') || lowerRegion === 'w' || lowerRegion.includes('pacific')) {
      finalRegion = 'West';
    } else if (lowerRegion.includes('central') || lowerRegion === 'c' || lowerRegion.includes('midwest')) {
      finalRegion = 'Central';
    } else {
      const fallbackRegions: Region[] = ['North', 'South', 'East', 'West', 'Central'];
      finalRegion = fallbackRegions[idx % fallbackRegions.length];
    }

    let rawFormat = String(
      row.format ??
      row.Format ??
      row['FORMAT'] ??
      row.type ??
      row.Type ??
      row['Store Type'] ??
      row['Store Format'] ??
      row.tier ??
      ''
    ).trim();

    let finalFormat: StoreFormat = 'Standard';
    const lowerFormat = rawFormat.toLowerCase();
    if (lowerFormat.includes('flagship') || lowerFormat.includes('flag')) {
      finalFormat = 'Flagship';
    } else if (lowerFormat.includes('super') || lowerFormat.includes('hyper')) {
      finalFormat = 'Superstore';
    } else if (lowerFormat.includes('express') || lowerFormat.includes('mini') || lowerFormat.includes('small')) {
      finalFormat = 'Express';
    } else {
      finalFormat = 'Standard';
    }

    const rawSize =
      row.size_sqft ??
      row.sqft ??
      row['Size SqFt'] ??
      row['Size_SqFt'] ??
      row['Size'] ??
      row['Square Footage'] ??
      row['SIZE_SQFT'] ??
      (finalFormat === 'Flagship' ? 32000 : finalFormat === 'Superstore' ? 24000 : finalFormat === 'Express' ? 6500 : 15000);
    const size_sqft = Number(String(rawSize).replace(/[^0-9.]/g, ''));

    const city = row.city ?? row.City ?? row.CITY ?? 'Metro Area';
    const state = row.state ?? row.State ?? row.STATE ?? 'US';
    const manager = row.manager ?? row.Manager ?? row.MANAGER ?? row['Store Manager'] ?? 'Store Manager';
    const rawOpenDate = row.open_date ?? row['Open Date'] ?? row['Open_Date'] ?? row.OPEN_DATE ?? '2020-01-01';
    const open_date = formatExcelDate(rawOpenDate, '2020-01-01');

    data.push({
      store_id: String(store_id).trim(),
      store_name: String(store_name).trim(),
      region: finalRegion,
      format: finalFormat,
      size_sqft: isNaN(size_sqft) || size_sqft <= 0 ? 15000 : Math.round(size_sqft),
      city: String(city).trim(),
      state: String(state).trim(),
      manager: String(manager).trim(),
      open_date: String(open_date).trim(),
    });
  });

  return { data: deduplicateStores(data), errors };
}

// Unified Weekly Sales Row Parser (accepts parsed objects from CSV or Excel)
export function parseWeeklySalesRows(rows: any[]): { data: WeeklySalesRecord[]; errors: string[] } {
  const errors: string[] = [];
  const data: WeeklySalesRecord[] = [];

  rows.forEach((row, idx) => {
    const rawStoreId =
      row.store_id ??
      row['Store ID'] ??
      row['Store Id'] ??
      row['Store_ID'] ??
      row.STORE_ID ??
      row.Store ??
      row.store ??
      row.ID ??
      row.Id ??
      row['Store #'] ??
      row['Store No'] ??
      row['Store Number'] ??
      row['Location ID'] ??
      row['Location_ID'] ??
      row.Location ??
      row.location ??
      row['Branch ID'] ??
      row.Branch ??
      row.branch ??
      row.Outlet ??
      row.Site ??
      row.Shop ??
      row.Unit ??
      row.Code ??
      row.code;

    const rawStoreName =
      row.store_name ??
      row['Store Name'] ??
      row['Store_Name'] ??
      row.STORE_NAME ??
      row.name ??
      row.Name;

    const store_id = rawStoreId
      ? String(rawStoreId).trim()
      : rawStoreName
      ? `STR-${String(rawStoreName).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}`
      : `STR-${String((idx % 25) + 1).padStart(3, '0')}`;

    const rawWeek =
      row.week ??
      row.Week ??
      row['Week ID'] ??
      row['Week_ID'] ??
      row.WEEK ??
      row['Fiscal Week'] ??
      row['Week No'] ??
      row['Week Number'] ??
      row.Wk;

    const rawWeekDate =
      row.week_date ??
      row['Week Date'] ??
      row['Week_Date'] ??
      row.date ??
      row.Date ??
      row.WEEK_DATE ??
      row.Period ??
      row.Day ??
      '2026-01-05';

    const week_date = formatExcelDate(rawWeekDate, '2026-01-05');
    const week = rawWeek
      ? String(rawWeek).trim()
      : `2026-W${String((idx % 12) + 1).padStart(2, '0')}`;

    const cleanNum = (val: any, fallback = 0): number => {
      if (val === undefined || val === null || val === '') return fallback;
      const parsed = Number(String(val).replace(/[^0-9.-]/g, ''));
      return isNaN(parsed) ? fallback : parsed;
    };

    const sales = cleanNum(
      row.sales ??
      row.Sales ??
      row['Weekly Sales'] ??
      row['Weekly_Sales'] ??
      row.revenue ??
      row.Revenue ??
      row.SALES ??
      row['Gross Sales'] ??
      row['Net Sales'] ??
      row['Total Sales'] ??
      row.Amount ??
      row.amount ??
      row.Actual ??
      row.Turnover,
      0
    );

    const target_sales = cleanNum(
      row.target_sales ??
      row.Target ??
      row['Target Sales'] ??
      row['Target_Sales'] ??
      row.target ??
      row.budget ??
      row.Budget ??
      row.TARGET_SALES ??
      row.Plan ??
      row.plan ??
      row.Goal ??
      row.Forecast,
      sales > 0 ? Math.round(sales * 0.98) : 0
    );

    const transactions = cleanNum(
      row.transactions ??
      row.Transactions ??
      row.Txns ??
      row.footfall ??
      row.traffic ??
      row.TRANSACTIONS ??
      row.Orders ??
      row.orders ??
      row.Customers ??
      row.Bills ??
      row.Receipts,
      sales > 0 ? Math.max(1, Math.round(sales / 62)) : 0
    );

    const units_sold = cleanNum(
      row.units_sold ??
      row['Units Sold'] ??
      row['Units_Sold'] ??
      row.units ??
      row.Units ??
      row.volume ??
      row.UNITS_SOLD ??
      row.Quantity ??
      row.qty ??
      row.Qty ??
      row.Items,
      transactions * 2
    );

    const markdown_pct = cleanNum(
      row.markdown_pct ??
      row.markdown ??
      row.discount ??
      row['Markdown %'] ??
      row['Discount %'] ??
      row.MARKDOWN_PCT ??
      row.Discount,
      0
    );

    data.push({
      store_id: String(store_id).trim(),
      week: String(week).trim(),
      week_date: String(week_date).trim(),
      sales,
      target_sales,
      transactions,
      units_sold,
      markdown_pct,
    });
  });

  return { data, errors };
}

// CSV Parsers that delegate to unified row parsers
export function parseStoreMasterCSV(csvText: string): { data: StoreMasterRecord[]; errors: string[] } {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const errors: string[] = [];
  if (result.errors.length > 0) {
    result.errors.forEach((e) => errors.push(`Row ${e.row || 0}: ${e.message}`));
  }

  const parsed = parseStoreMasterRows(result.data as any[]);
  return { data: parsed.data, errors: [...errors, ...parsed.errors] };
}

export function parseWeeklySalesCSV(csvText: string): { data: WeeklySalesRecord[]; errors: string[] } {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const errors: string[] = [];
  if (result.errors.length > 0) {
    result.errors.forEach((e) => errors.push(`Row ${e.row || 0}: ${e.message}`));
  }

  const parsed = parseWeeklySalesRows(result.data as any[]);
  return { data: parsed.data, errors: [...errors, ...parsed.errors] };
}

// Smart worksheet row reader that automatically scans the first 15 rows to find the actual header row
export function readWorksheetRowsWithSmartHeader(worksheet: XLSX.WorkSheet): any[] {
  const grid = XLSX.utils.sheet_to_json<any[]>(worksheet, {
    header: 1,
    raw: true,
    defval: '',
  });

  if (!grid || grid.length === 0) return [];

  const headerKeywords = [
    'store', 'location', 'region', 'format', 'sale', 'target', 'revenue',
    'date', 'week', 'transaction', 'unit', 'city', 'state', 'manager',
    'sqft', 'size', 'id', 'name', 'budget', 'amount', 'outlet', 'branch',
    'shop', 'site', 'gross', 'net', 'turnover', 'traffic', 'orders',
  ];

  let bestHeaderRowIdx = 0;
  let maxKeywordMatches = 0;
  const maxScan = Math.min(15, grid.length);

  for (let r = 0; r < maxScan; r++) {
    const row = grid[r];
    if (!Array.isArray(row)) continue;

    let matches = 0;
    let nonBlankStrings = 0;

    for (const cell of row) {
      if (cell !== undefined && cell !== null && String(cell).trim().length > 0) {
        nonBlankStrings++;
        const cellLower = String(cell).toLowerCase();
        if (headerKeywords.some((kw) => cellLower.includes(kw))) {
          matches++;
        }
      }
    }

    if (matches > maxKeywordMatches && nonBlankStrings >= 2) {
      maxKeywordMatches = matches;
      bestHeaderRowIdx = r;
    }
  }

  if (maxKeywordMatches === 0) {
    for (let r = 0; r < maxScan; r++) {
      const row = grid[r];
      if (Array.isArray(row)) {
        const nonBlanks = row.filter((c) => c !== undefined && c !== null && String(c).trim().length > 0);
        if (nonBlanks.length >= 2) {
          bestHeaderRowIdx = r;
          break;
        }
      }
    }
  }

  const headerRow = grid[bestHeaderRowIdx] || [];
  const headers = headerRow.map((h, i) =>
    h !== undefined && h !== null && String(h).trim().length > 0 ? String(h).trim() : `Col_${i + 1}`
  );

  const resultRows: any[] = [];
  for (let r = bestHeaderRowIdx + 1; r < grid.length; r++) {
    const row = grid[r];
    if (!Array.isArray(row)) continue;
    const hasData = row.some((c) => c !== undefined && c !== null && String(c).trim().length > 0);
    if (!hasData) continue;

    const rowObj: Record<string, any> = {};
    headers.forEach((hdr, colIdx) => {
      rowObj[hdr] = row[colIdx] !== undefined ? row[colIdx] : '';
    });
    resultRows.push(rowObj);
  }

  return resultRows;
}

// Generate benchmark weekly sales history for any store list
export function generateBenchmarkSalesForStores(
  stores: StoreMasterRecord[],
  weeksCount = 12
): WeeklySalesRecord[] {
  const records: WeeklySalesRecord[] = [];
  const baseDate = new Date(2026, 0, 5); // Jan 5, 2026

  stores.forEach((store, sIdx) => {
    const baseWeekly =
      store.format === 'Flagship'
        ? 340000
        : store.format === 'Superstore'
        ? 260000
        : store.format === 'Express'
        ? 95000
        : 180000;

    const storeFactor = 0.85 + ((sIdx * 37) % 35) / 100;

    for (let w = 1; w <= weeksCount; w++) {
      const weekDate = new Date(baseDate.getTime() + (w - 1) * 7 * 86400000);
      const yyyy = weekDate.getFullYear();
      const mm = String(weekDate.getMonth() + 1).padStart(2, '0');
      const dd = String(weekDate.getDate()).padStart(2, '0');
      const weekStr = `${yyyy}-W${String(w).padStart(2, '0')}`;
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const trend = 1 + Math.sin(w / 2) * 0.08 + (((sIdx + w) % 7) - 3) * 0.02;
      const sales = Math.round(baseWeekly * storeFactor * trend);
      const target_sales = Math.round(sales * (0.95 + (((sIdx * 11 + w) % 15) / 100)));
      const transactions = Math.max(1, Math.round(sales / (store.format === 'Express' ? 38 : 65)));
      const units_sold = Math.round(transactions * (store.format === 'Express' ? 1.8 : 2.4));
      const markdown_pct = Number((0.08 + ((w % 5) * 0.02)).toFixed(2));

      records.push({
        store_id: store.store_id,
        week: weekStr,
        week_date: dateStr,
        sales,
        target_sales,
        transactions,
        units_sold,
        markdown_pct,
      });
    }
  });

  return records;
}

// Automatically extract both Store Master and Weekly Sales from any single flat file or table
export function extractStoreAndSalesFromAnyRows(rows: any[]): {
  stores: StoreMasterRecord[];
  sales: WeeklySalesRecord[];
  isCombined: boolean;
} {
  if (!rows || rows.length === 0) {
    return { stores: [], sales: [], isCombined: false };
  }

  const parsedSales = parseWeeklySalesRows(rows);
  const hasActualSalesData = parsedSales.data.some((s) => s.sales > 0);

  if (hasActualSalesData && parsedSales.data.length > 0) {
    const storeMap = new Map<string, StoreMasterRecord>();

    rows.forEach((row, idx) => {
      const matchedSale = parsedSales.data[idx];
      const store_id = matchedSale?.store_id || `STR-${String(idx + 1).padStart(3, '0')}`;

      if (!storeMap.has(store_id)) {
        const parsedStore = parseStoreMasterRows([row]).data[0];
        if (parsedStore) {
          storeMap.set(store_id, {
            ...parsedStore,
            store_id,
          });
        }
      }
    });

    const stores = Array.from(storeMap.values());
    return {
      stores,
      sales: parsedSales.data,
      isCombined: true,
    };
  }

  const parsedStores = parseStoreMasterRows(rows);
  if (parsedStores.data.length > 0) {
    const generatedSales = generateBenchmarkSalesForStores(parsedStores.data);
    return {
      stores: parsedStores.data,
      sales: generatedSales,
      isCombined: true,
    };
  }

  return { stores: [], sales: [], isCombined: false };
}

// Direct text parser for pasting table data from Excel / Sheets clipboard
export function parsePastedTableText(text: string): {
  stores: StoreMasterRecord[];
  sales: WeeklySalesRecord[];
  summary: string;
  errors: string[];
} {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      stores: [],
      sales: [],
      summary: 'No text provided',
      errors: ['Please paste data into the text box.'],
    };
  }

  const parsed = Papa.parse(trimmed, {
    header: true,
    skipEmptyLines: true,
    delimiter: '', // Auto-detects tabs (\t) from Excel or commas from CSV
  });

  const errors: string[] = [];
  if (parsed.errors.length > 0) {
    parsed.errors.slice(0, 3).forEach((e) => errors.push(e.message));
  }

  const extracted = extractStoreAndSalesFromAnyRows(parsed.data);
  const summary = `Extracted ${extracted.stores.length} stores and ${extracted.sales.length} sales rows from pasted data.`;

  return {
    stores: extracted.stores,
    sales: extracted.sales,
    summary,
    errors,
  };
}

// Detect dataset schema from sheet name and columns
export function detectSheetType(
  rows: any[],
  sheetName = ''
): 'store_master' | 'weekly_sales' | 'unknown' {
  const lowerName = sheetName.toLowerCase();
  if (
    lowerName.includes('store') ||
    lowerName.includes('master') ||
    lowerName.includes('location') ||
    lowerName.includes('branch') ||
    lowerName.includes('units')
  ) {
    return 'store_master';
  }
  if (
    lowerName.includes('sale') ||
    lowerName.includes('weekly') ||
    lowerName.includes('revenue') ||
    lowerName.includes('transaction')
  ) {
    return 'weekly_sales';
  }

  if (!rows || rows.length === 0) return 'unknown';

  const firstRow = rows[0] || {};
  const keys = Object.keys(firstRow).map((k) => k.toLowerCase().replace(/[\s_-]/g, ''));

  const storeIndicators = ['storeid', 'storename', 'region', 'format', 'sizesqft', 'sqft', 'city', 'state', 'manager'];
  const storeScore = storeIndicators.filter((col) => keys.some((k) => k.includes(col))).length;

  const salesIndicators = ['weeklysales', 'targetsales', 'sales', 'target', 'transactions', 'unitssold', 'markdown', 'week'];
  const salesScore = salesIndicators.filter((col) => keys.some((k) => k.includes(col))).length;

  if (storeScore > salesScore && storeScore >= 2) return 'store_master';
  if (salesScore >= 2) return 'weekly_sales';
  return 'unknown';
}

export interface ExcelWorkbookResult {
  success: boolean;
  storeMaster?: { data: StoreMasterRecord[]; errors: string[]; sheetName: string };
  weeklySales?: { data: WeeklySalesRecord[]; errors: string[]; sheetName: string };
  allSheetNames: string[];
  detectedSheets: {
    sheetName: string;
    detectedType: 'store_master' | 'weekly_sales' | 'unknown';
    rowCount: number;
  }[];
  errors: string[];
  autoExtracted?: boolean;
}

// Excel Workbook Parser (parses single or multi-sheet .xlsx / .xls files with zero manual file edit requirements)
export function parseExcelWorkbook(buffer: ArrayBuffer): ExcelWorkbookResult {
  const errors: string[] = [];
  let workbook: XLSX.WorkBook;

  try {
    workbook = XLSX.read(buffer, {
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellText: false,
    });
  } catch (err: any) {
    return {
      success: false,
      allSheetNames: [],
      detectedSheets: [],
      errors: [`Failed to read Excel workbook: ${err?.message || 'Invalid or corrupted file'}`],
    };
  }

  const allSheetNames = workbook.SheetNames || [];
  if (allSheetNames.length === 0) {
    return {
      success: false,
      allSheetNames: [],
      detectedSheets: [],
      errors: ['The uploaded Excel workbook has no sheets.'],
    };
  }

  let storeMasterResult: { data: StoreMasterRecord[]; errors: string[]; sheetName: string } | undefined;
  let weeklySalesResult: { data: WeeklySalesRecord[]; errors: string[]; sheetName: string } | undefined;

  const detectedSheets: ExcelWorkbookResult['detectedSheets'] = [];

  // Pass 1: Parse all sheets using smart header reader
  const sheetRowsMap = new Map<string, any[]>();
  for (const sheetName of allSheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    const smartRows = readWorksheetRowsWithSmartHeader(worksheet);
    sheetRowsMap.set(sheetName, smartRows);

    const type = detectSheetType(smartRows, sheetName);
    detectedSheets.push({
      sheetName,
      detectedType: type,
      rowCount: smartRows.length,
    });

    if (type === 'store_master' && !storeMasterResult && smartRows.length > 0) {
      const parsed = parseStoreMasterRows(smartRows);
      storeMasterResult = {
        data: parsed.data,
        errors: parsed.errors,
        sheetName,
      };
    } else if (type === 'weekly_sales' && !weeklySalesResult && smartRows.length > 0) {
      const parsed = parseWeeklySalesRows(smartRows);
      weeklySalesResult = {
        data: parsed.data,
        errors: parsed.errors,
        sheetName,
      };
    }
  }

  // Pass 2: Intelligent Auto-Hydration (Eliminates the requirement for user to manually update or split the file)
  let autoExtracted = false;

  // Case A: If user uploaded a single sheet (or flat file) containing sales, auto-extract Store Master from it!
  if (weeklySalesResult && !storeMasterResult) {
    const sheetRows = sheetRowsMap.get(weeklySalesResult.sheetName) || [];
    const extracted = extractStoreAndSalesFromAnyRows(sheetRows);
    if (extracted.stores.length > 0) {
      storeMasterResult = {
        data: extracted.stores,
        errors: [],
        sheetName: `${weeklySalesResult.sheetName} (Auto-Extracted Stores)`,
      };
      autoExtracted = true;
    }
  }

  // Case B: If user uploaded a file containing only Store Master, auto-generate 12-week benchmark sales!
  if (storeMasterResult && !weeklySalesResult) {
    const generatedSales = generateBenchmarkSalesForStores(storeMasterResult.data);
    weeklySalesResult = {
      data: generatedSales,
      errors: [],
      sheetName: `${storeMasterResult.sheetName} (Benchmark Sales History)`,
    };
    autoExtracted = true;
  }

  // Case C: If neither matched (ambiguous single sheet), run universal extractor on first sheet
  if (!storeMasterResult && !weeklySalesResult && allSheetNames.length > 0) {
    const firstSheetName = allSheetNames[0];
    const sheetRows = sheetRowsMap.get(firstSheetName) || [];
    const extracted = extractStoreAndSalesFromAnyRows(sheetRows);

    if (extracted.stores.length > 0 && extracted.sales.length > 0) {
      storeMasterResult = {
        data: extracted.stores,
        errors: [],
        sheetName: firstSheetName,
      };
      weeklySalesResult = {
        data: extracted.sales,
        errors: [],
        sheetName: firstSheetName,
      };
      autoExtracted = true;
    }
  }

  return {
    success: Boolean(storeMasterResult || weeklySalesResult),
    storeMaster: storeMasterResult,
    weeklySales: weeklySalesResult,
    allSheetNames,
    detectedSheets,
    errors,
    autoExtracted,
  };
}

// Single sheet Excel parser for Store Master
export function parseStoreMasterExcel(buffer: ArrayBuffer): { data: StoreMasterRecord[]; errors: string[]; sheetName: string } {
  const result = parseExcelWorkbook(buffer);
  if (result.storeMaster) {
    return result.storeMaster;
  }
  // Try first sheet directly
  if (result.allSheetNames.length > 0) {
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[result.allSheetNames[0]], { raw: true });
    const parsed = parseStoreMasterRows(rows);
    return { data: parsed.data, errors: parsed.errors, sheetName: result.allSheetNames[0] };
  }
  return { data: [], errors: ['No valid Store Master data detected in Excel file.'], sheetName: '' };
}

// Single sheet Excel parser for Weekly Sales
export function parseWeeklySalesExcel(buffer: ArrayBuffer): { data: WeeklySalesRecord[]; errors: string[]; sheetName: string } {
  const result = parseExcelWorkbook(buffer);
  if (result.weeklySales) {
    return result.weeklySales;
  }
  // Try first sheet directly
  if (result.allSheetNames.length > 0) {
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[result.allSheetNames[0]], { raw: true });
    const parsed = parseWeeklySalesRows(rows);
    return { data: parsed.data, errors: parsed.errors, sheetName: result.allSheetNames[0] };
  }
  return { data: [], errors: ['No valid Weekly Sales data detected in Excel file.'], sheetName: '' };
}

// Generate formatted .xlsx Excel Workbook Blob with both Store Master and Weekly Sales sheets
export function generateExcelWorkbookTemplate(
  stores: StoreMasterRecord[] = INITIAL_STORES,
  sales: WeeklySalesRecord[] = INITIAL_WEEKLY_SALES
): Blob {
  const wb = XLSX.utils.book_new();

  // Tab 1: Store Master
  const storeRows = stores.map((s) => ({
    store_id: s.store_id,
    store_name: s.store_name,
    region: s.region,
    format: s.format,
    size_sqft: s.size_sqft,
    city: s.city,
    state: s.state,
    manager: s.manager,
    open_date: s.open_date,
  }));
  const wsStores = XLSX.utils.json_to_sheet(storeRows);
  XLSX.utils.book_append_sheet(wb, wsStores, 'Store Master');

  // Tab 2: Retail Weekly Sales
  const salesRows = sales.map((s) => ({
    store_id: s.store_id,
    week: s.week,
    week_date: s.week_date,
    sales: s.sales,
    target_sales: s.target_sales,
    transactions: s.transactions,
    units_sold: s.units_sold,
    markdown_pct: s.markdown_pct ?? 0,
  }));
  const wsSales = XLSX.utils.json_to_sheet(salesRows);
  XLSX.utils.book_append_sheet(wb, wsSales, 'Weekly Sales');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

