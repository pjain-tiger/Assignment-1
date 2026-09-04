export type Region = 'North' | 'South' | 'East' | 'West' | 'Central';

export type StoreFormat = 'Flagship' | 'Superstore' | 'Standard' | 'Express';

export interface StoreMasterRecord {
  store_id: string;
  store_name: string;
  region: Region;
  format: StoreFormat;
  size_sqft: number;
  city: string;
  state: string;
  manager: string;
  open_date: string;
}

export interface WeeklySalesRecord {
  store_id: string;
  week: string; // e.g. "2026-W01"
  week_date: string; // e.g. "2026-01-05"
  sales: number;
  target_sales: number;
  transactions: number;
  units_sold: number;
  markdown_pct?: number;
}

export interface EnrichedRecord extends WeeklySalesRecord {
  store_name: string;
  region: Region;
  format: StoreFormat;
  size_sqft: number;
  city: string;
  state: string;
  manager: string;
}

export interface AggregatedKPIs {
  totalSales: number;
  targetSales: number;
  achievementRate: number; // e.g. 104.2%
  salesVariance: number; // actual - target
  totalTransactions: number;
  avgBasket: number; // sales / transactions
  unitsSold: number;
  salesPerSqFt: number; // total sales / total sqft
  wowGrowth: number; // week-over-week growth percentage for latest week
  storeCount: number;
  underperformingStoreCount: number;
  topPerformingStoreCount: number;
}

export interface RegionMetric {
  region: Region;
  totalSales: number;
  targetSales: number;
  achievementRate: number;
  storeCount: number;
  totalSqFt: number;
  salesPerSqFt: number;
  transactions: number;
  avgBasket: number;
  wowGrowth: number;
  topStore: string;
  underperformingStore: string;
}

export interface FormatMetric {
  format: StoreFormat;
  totalSales: number;
  targetSales: number;
  achievementRate: number;
  storeCount: number;
  totalSqFt: number;
  salesPerSqFt: number;
  avgBasket: number;
}

export interface WeeklyTrendPoint {
  week: string;
  week_date: string;
  sales: number;
  target_sales: number;
  achievementRate: number;
  transactions: number;
  North?: number;
  South?: number;
  East?: number;
  West?: number;
  Central?: number;
}

export interface StoreAggregatedPerformance {
  store_id: string;
  store_name: string;
  region: Region;
  format: StoreFormat;
  city: string;
  state: string;
  manager: string;
  size_sqft: number;
  totalSales: number;
  targetSales: number;
  achievementRate: number;
  salesVariance: number;
  salesPerSqFt: number;
  transactions: number;
  avgBasket: number;
  unitsSold: number;
  status: 'Exceeding' | 'On Track' | 'Underperforming';
}

export interface ActionItem {
  id: string;
  title: string;
  category: 'Inventory' | 'Promotions' | 'Operations' | 'Merchandising';
  impact: 'High' | 'Medium' | 'Low';
  region: string;
  description: string;
  metricTrigger: string;
}
