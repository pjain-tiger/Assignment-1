// Shared analytical summary engine for client-side and server-side fallback
export function generateAnalyticalSummary(
  summaryMetrics: any,
  regionalPerformance: any[],
  topPerformers: any[],
  bottomPerformers: any[],
  focusRegion?: string
): string {
  const ach = summaryMetrics?.achievementRate || 100;
  const achStatus = ach >= 100 ? "exceeding target budget" : "tracking slightly behind target budget";
  const bestRegion = regionalPerformance && regionalPerformance.length > 0
    ? regionalPerformance.reduce((prev, curr) => (curr.achievementRate > prev.achievementRate ? curr : prev), regionalPerformance[0])
    : null;
  const lagRegion = regionalPerformance && regionalPerformance.length > 0
    ? regionalPerformance.reduce((prev, curr) => (curr.achievementRate < prev.achievementRate ? curr : prev), regionalPerformance[0])
    : null;

  const topStoreNames = topPerformers?.map((s: any) => `${s.store_name} (${s.region})`).join(", ") || "N/A";
  const bottomStoreNames = bottomPerformers?.map((s: any) => `${s.store_name} (${s.region})`).join(", ") || "N/A";

  return `### Executive Scorecard & Commercial Health
Overall network performance stands at **$${Number(summaryMetrics?.totalSales || 0).toLocaleString()}** against a target budget of **$${Number(summaryMetrics?.targetSales || 0).toLocaleString()}**, representing a **${ach}%** realization rate (${achStatus}). Total footprint productivity is averaging **$${summaryMetrics?.salesPerSqFt || 0}/sq ft** with an average basket value of **$${summaryMetrics?.avgBasket || 0}**.

### Regional Highlights & Disparities
${bestRegion ? `* **Leading Territory**: **${bestRegion.region} Region** leads operational momentum with an achievement rate of **${bestRegion.achievementRate}%** ($${Number(bestRegion.totalSales).toLocaleString()} total sales).` : ""}
${lagRegion && lagRegion.region !== bestRegion?.region ? `* **Territory Under Pressure**: **${lagRegion.region} Region** exhibits drag, realizing **${lagRegion.achievementRate}%** of plan. Immediate review of local foot traffic and markdown sensitivity is recommended.` : ""}
* **Regional Disparity Index**: The spread between top and bottom regional fulfillment indicates uneven category distribution and potential localized stock-outs.

### Store Outliers
${topPerformers && topPerformers.length > 0 ? `* **Top Revenue Drivers**: ${topStoreNames} demonstrated strong conversion and premium basket sizes.` : ""}
${bottomPerformers && bottomPerformers.length > 0 ? `* **Underperforming Units Requiring Intervention**: ${bottomStoreNames} experienced basket pressure and lower transaction frequencies relative to store square footage.` : ""}

### Immediate 30-60 Day Action Plan
1. **Inventory Rebalancing**: Shift fast-moving inventory and promotional SKUs from low-velocity locations into top-performing Flagship and Superstore formats.
2. **Targeted Traffic Driver in ${lagRegion ? lagRegion.region : "Lagging"} Region**: Initiate targeted localized digital promotional campaigns and loyalty perks to lift weekday transaction count.
3. **Basket Size Optimization**: Train floor associates and place high-margin impulse endcaps near checkout to lift basket size from $${summaryMetrics?.avgBasket || 0} toward regional benchmarks.
4. **Weekly Store Manager Check-in**: Institute weekly operational reviews for stores under 90% budget target to troubleshoot staffing and replenishment bottlenecks.`;
}
