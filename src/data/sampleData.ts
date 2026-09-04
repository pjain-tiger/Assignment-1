import { StoreMasterRecord, WeeklySalesRecord, Region, StoreFormat } from '../types';

export const INITIAL_STORES: StoreMasterRecord[] = [
  // North Region (5 stores)
  { store_id: "STR-N01", store_name: "Michigan Ave Flagship", region: "North", format: "Flagship", size_sqft: 38000, city: "Chicago", state: "IL", manager: "Sarah Jenkins", open_date: "2018-04-12" },
  { store_id: "STR-N02", store_name: "Mall of America Supercenter", region: "North", format: "Superstore", size_sqft: 28500, city: "Bloomington", state: "MN", manager: "David Lindqvist", open_date: "2019-09-20" },
  { store_id: "STR-N03", store_name: "Mayfair Galleria", region: "North", format: "Standard", size_sqft: 16500, city: "Wauwatosa", state: "WI", manager: "Elena Rostova", open_date: "2020-03-15" },
  { store_id: "STR-N04", store_name: "Somerset Collection", region: "North", format: "Standard", size_sqft: 18000, city: "Troy", state: "MI", manager: "Marcus Vance", open_date: "2021-06-10" },
  { store_id: "STR-N05", store_name: "Grand Central Suburbs", region: "North", format: "Express", size_sqft: 9200, city: "Grand Rapids", state: "MI", manager: "Chloe Bennett", open_date: "2022-11-01" },

  // South Region (5 stores)
  { store_id: "STR-S01", store_name: "Peachtree Promenade", region: "South", format: "Flagship", size_sqft: 35000, city: "Atlanta", state: "GA", manager: "Robert Sterling", open_date: "2017-10-05" },
  { store_id: "STR-S02", store_name: "Galleria Dallas", region: "South", format: "Superstore", size_sqft: 32000, city: "Dallas", state: "TX", manager: "Maria Hernandez", open_date: "2018-08-14" },
  { store_id: "STR-S03", store_name: "Brickell City Centre", region: "South", format: "Standard", size_sqft: 15500, city: "Miami", state: "FL", manager: "Carlos Mendez", open_date: "2021-02-18" },
  { store_id: "STR-S04", store_name: "SouthPark Pavilion", region: "South", format: "Standard", size_sqft: 17200, city: "Charlotte", state: "NC", manager: "Amanda Hayes", open_date: "2020-07-22" },
  { store_id: "STR-S05", store_name: "Memorial City Point", region: "South", format: "Express", size_sqft: 8800, city: "Houston", state: "TX", manager: "Jamal Washington", open_date: "2023-01-15" },

  // East Region (5 stores)
  { store_id: "STR-E01", store_name: "Fifth Avenue Premier", region: "East", format: "Flagship", size_sqft: 42000, city: "New York", state: "NY", manager: "Alexander Wright", open_date: "2016-05-18" },
  { store_id: "STR-E02", store_name: "Prudential Center Mall", region: "East", format: "Superstore", size_sqft: 29000, city: "Boston", state: "MA", manager: "Emily Chen", open_date: "2018-11-09" },
  { store_id: "STR-E03", store_name: "King of Prussia Plaza", region: "East", format: "Superstore", size_sqft: 31000, city: "King of Prussia", state: "PA", manager: "Thomas O'Connor", open_date: "2019-04-25" },
  { store_id: "STR-E04", store_name: "Tysons Corner Galleria", region: "East", format: "Standard", size_sqft: 19500, city: "McLean", state: "VA", manager: "Rachel Goldberg", open_date: "2020-10-12" },
  { store_id: "STR-E05", store_name: "Inner Harbor Express", region: "East", format: "Express", size_sqft: 9800, city: "Baltimore", state: "MD", manager: "Kevin Bradley", open_date: "2022-03-30" },

  // West Region (5 stores)
  { store_id: "STR-W01", store_name: "Beverly Center Flagship", region: "West", format: "Flagship", size_sqft: 40000, city: "Los Angeles", state: "CA", manager: "Sophia Laurent", open_date: "2017-02-14" },
  { store_id: "STR-W02", store_name: "Union Square Metro", region: "West", format: "Superstore", size_sqft: 30500, city: "San Francisco", state: "CA", manager: "Derek Tanaka", open_date: "2018-06-20" },
  { store_id: "STR-W03", store_name: "Pacific Place Downtown", region: "West", format: "Standard", size_sqft: 18500, city: "Seattle", state: "WA", manager: "Hannah Larson", open_date: "2019-12-08" },
  { store_id: "STR-W04", store_name: "Fashion Valley Plaza", region: "West", format: "Standard", size_sqft: 16800, city: "San Diego", state: "CA", manager: "Mateo Alvarez", open_date: "2021-08-19" },
  { store_id: "STR-W05", store_name: "Pearl District Express", region: "West", format: "Express", size_sqft: 9100, city: "Portland", state: "OR", manager: "Zoe Miller", open_date: "2022-05-11" },

  // Central Region (5 stores)
  { store_id: "STR-C01", store_name: "Cherry Creek Grand", region: "Central", format: "Flagship", size_sqft: 36000, city: "Denver", state: "CO", manager: "Tyler Brooks", open_date: "2018-01-22" },
  { store_id: "STR-C02", store_name: "Country Club Plaza", region: "Central", format: "Superstore", size_sqft: 27000, city: "Kansas City", state: "MO", manager: "Olivia Scott", open_date: "2019-07-16" },
  { store_id: "STR-C03", store_name: "Keystone Crossing", region: "Central", format: "Standard", size_sqft: 17500, city: "Indianapolis", state: "IN", manager: "Lucas Meyer", open_date: "2020-09-04" },
  { store_id: "STR-C04", store_name: "Easton Town Center", region: "Central", format: "Standard", size_sqft: 18200, city: "Columbus", state: "OH", manager: "Grace Campbell", open_date: "2021-04-14" },
  { store_id: "STR-C05", store_name: "Plaza Frontenac Hub", region: "Central", format: "Express", size_sqft: 8500, city: "St. Louis", state: "MO", manager: "Ethan Murphy", open_date: "2022-08-27" },
];

// Helper to generate 12 weeks of realistic sales data for each store
export function generateInitialWeeklySales(): WeeklySalesRecord[] {
  const weeks = [
    { week: "2026-W01", date: "2026-01-05", factor: 0.95 },
    { week: "2026-W02", date: "2026-01-12", factor: 0.92 },
    { week: "2026-W03", date: "2026-01-19", factor: 0.96 },
    { week: "2026-W04", date: "2026-01-26", factor: 0.98 },
    { week: "2026-W05", date: "2026-02-02", factor: 1.02 },
    { week: "2026-W06", date: "2026-02-09", factor: 1.12 }, // Super Bowl / Valentine bump
    { week: "2026-W07", date: "2026-02-16", factor: 1.08 }, // Presidents Day promo
    { week: "2026-W08", date: "2026-02-23", factor: 1.01 },
    { week: "2026-W09", date: "2026-03-02", factor: 1.03 },
    { week: "2026-W10", date: "2026-03-09", factor: 1.06 },
    { week: "2026-W11", date: "2026-03-16", factor: 1.09 },
    { week: "2026-W12", date: "2026-03-23", factor: 1.15 }, // Spring launch
  ];

  // Base parameters per format
  const formatBase: Record<StoreFormat, { baseSales: number; target: number; baseTxn: number; avgItem: number }> = {
    Flagship: { baseSales: 165000, target: 160000, baseTxn: 2400, avgItem: 68.75 },
    Superstore: { baseSales: 118000, target: 115000, baseTxn: 1850, avgItem: 63.80 },
    Standard: { baseSales: 72000, target: 70000, baseTxn: 1200, avgItem: 60.00 },
    Express: { baseSales: 48000, target: 46000, baseTxn: 950, avgItem: 50.50 },
  };

  // Regional multipliers to simulate realistic operational dynamics
  const regionMultiplier: Record<Region, { salesMult: number; targetMult: number }> = {
    East: { salesMult: 1.08, targetMult: 1.00 }, // Outperforming (~108%)
    West: { salesMult: 1.05, targetMult: 1.00 }, // Strong (~105%)
    North: { salesMult: 1.01, targetMult: 1.00 }, // Solid on-target (~101%)
    Central: { salesMult: 0.98, targetMult: 1.00 }, // Close (~98%)
    South: { salesMult: 0.93, targetMult: 1.00 }, // Lagging target (~93%)
  };

  const records: WeeklySalesRecord[] = [];

  INITIAL_STORES.forEach((store, storeIdx) => {
    const fConfig = formatBase[store.format];
    const rConfig = regionMultiplier[store.region];

    // Seeded store variation factor between 0.93 and 1.07
    const storeVar = 0.94 + ((storeIdx * 7) % 15) / 100;

    weeks.forEach((w, wIdx) => {
      // Intentional story elements:
      // STR-E01 (NYC) and STR-W01 (LA) are top performers
      // STR-S05 (Houston Express) and STR-S03 (Miami) have footfall challenges
      let customBoost = 1.0;
      if (store.store_id === "STR-E01") customBoost = 1.14;
      if (store.store_id === "STR-W01") customBoost = 1.10;
      if (store.store_id === "STR-S03") customBoost = 0.88;
      if (store.store_id === "STR-S05") customBoost = 0.84;

      const target_sales = Math.round(fConfig.target * rConfig.targetMult * w.factor);
      const sales = Math.round(fConfig.baseSales * rConfig.salesMult * w.factor * storeVar * customBoost);
      
      const transactions = Math.round(fConfig.baseTxn * (sales / fConfig.baseSales) * (0.97 + ((wIdx * 3) % 7) / 100));
      const units_sold = Math.round(transactions * (2.2 + ((storeIdx + wIdx) % 5) * 0.15));
      const markdown_pct = Number((3.5 + ((wIdx + storeIdx) % 6) * 1.2).toFixed(1));

      records.push({
        store_id: store.store_id,
        week: w.week,
        week_date: w.date,
        sales,
        target_sales,
        transactions,
        units_sold,
        markdown_pct,
      });
    });
  });

  return records;
}

export const INITIAL_WEEKLY_SALES: WeeklySalesRecord[] = generateInitialWeeklySales();

// Generate ready-to-download CSV templates for user convenience
export function getStoreMasterCSVTemplate(): string {
  const headers = "store_id,store_name,region,format,size_sqft,city,state,manager,open_date";
  const rows = INITIAL_STORES.slice(0, 10).map(s => 
    `"${s.store_id}","${s.store_name}","${s.region}","${s.format}",${s.size_sqft},"${s.city}","${s.state}","${s.manager}","${s.open_date}"`
  );
  return [headers, ...rows].join("\n");
}

export function getWeeklySalesCSVTemplate(): string {
  const headers = "store_id,week,week_date,sales,target_sales,transactions,units_sold,markdown_pct";
  const rows = INITIAL_WEEKLY_SALES.slice(0, 15).map(s => 
    `"${s.store_id}","${s.week}","${s.week_date}",${s.sales},${s.target_sales},${s.transactions},${s.units_sold},${s.markdown_pct || 0}`
  );
  return [headers, ...rows].join("\n");
}
