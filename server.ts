import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Server-side Gemini initialization
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// API endpoint for generating action-oriented executive business summaries
app.post("/api/insights/generate", async (req, res) => {
  try {
    const {
      summaryMetrics,
      regionalPerformance,
      topPerformers,
      bottomPerformers,
      weeklyTrendSummary,
      userPrompt,
      focusRegion,
    } = req.body;

    const ai = getGeminiClient();

    if (!ai) {
      // Graceful analytical synthesis fallback if no API key is provided
      const fallbackSummary = generateAnalyticalSummary(
        summaryMetrics,
        regionalPerformance,
        topPerformers,
        bottomPerformers,
        focusRegion
      );
      return res.json({
        source: "rule-based",
        summary: fallbackSummary,
        note: "Generated using built-in retail diagnostic engine.",
      });
    }

    const promptText = `
You are a Principal Retail Strategy and Merchandising Analyst for a multi-region retail chain operating across five regions (North, South, East, West, Central).
Analyze the provided weekly sales and store master performance data. Provide an executive-ready, highly actionable business review.

DATA CONTEXT:
Focus Region: ${focusRegion || "All 5 Regions"}
Overall Metrics:
- Total Sales: $${Number(summaryMetrics?.totalSales || 0).toLocaleString()}
- Target Sales: $${Number(summaryMetrics?.targetSales || 0).toLocaleString()}
- Target Achievement: ${summaryMetrics?.achievementRate || 0}%
- Same-Store / WoW Growth: ${summaryMetrics?.wowGrowth || 0}%
- Total Stores: ${summaryMetrics?.storeCount || 0}
- Average Sales per Sq Ft: $${summaryMetrics?.salesPerSqFt || 0}
- Average Transaction Value (Basket Size): $${summaryMetrics?.avgBasket || 0}

Regional Breakdown:
${JSON.stringify(regionalPerformance || [], null, 2)}

Top 3 Performing Stores:
${JSON.stringify(topPerformers || [], null, 2)}

Bottom 3 Stores Needing Attention:
${JSON.stringify(bottomPerformers || [], null, 2)}

Weekly Trend Notes:
${weeklyTrendSummary || "12-week trending across all stores"}

Specific Focus or User Question:
${userPrompt || "Generate a comprehensive executive diagnosis, root causes, and immediate action items."}

INSTRUCTIONS:
Structure your analysis cleanly with these sections:
1. **Executive Scorecard & Commercial Health**: 2-3 concise sentences diagnosing top-line vs budget achievement.
2. **Regional Highlights & Disparities**: Call out which of the 5 regions are driving margin/sales, and which regions are lagging.
3. **Store Format & Merchandising Insights**: Footfall, basket size, and space productivity (Sales/sqft) observations.
4. **Immediate 30-60 Day Action Plan**: 4 specific, operational recommendations (e.g. inventory rebalancing, promotional cadence, store-level labor alignment, markdown strategy).

Keep tone professional, crisp, and direct. Use bullet points and bolding for scannability.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: promptText,
    });

    res.json({
      source: "gemini",
      summary: response.text || "No summary generated.",
    });
  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    // Return gracefully so UI never breaks
    const fallbackSummary = generateAnalyticalSummary(
      req.body.summaryMetrics,
      req.body.regionalPerformance,
      req.body.topPerformers,
      req.body.bottomPerformers,
      req.body.focusRegion
    );
    res.json({
      source: "rule-based-fallback",
      summary: fallbackSummary,
      errorNotice: error.message || "Failed to reach AI service; loaded local diagnostic analysis.",
    });
  }
});

// Built-in robust diagnostic generator for offline / fallback scenarios
function generateAnalyticalSummary(
  summaryMetrics: any,
  regionalPerformance: any[],
  topPerformers: any[],
  bottomPerformers: any[],
  focusRegion?: string
) {
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
* **Top Revenue Drivers**: ${topStoreNames} demonstrated strong conversion and premium basket sizes.
* **Underperforming Units Requiring Intervention**: ${bottomStoreNames} experienced basket pressure and lower transaction frequencies relative to store square footage.

### Immediate 30-60 Day Action Plan
1. **Inventory Rebalancing**: Shift fast-moving inventory and promotional SKUs from low-velocity locations into top-performing Flagship and Superstore formats.
2. **Targeted Traffic Driver in ${lagRegion ? lagRegion.region : "Lagging"} Region**: Initiate targeted localized digital promotional campaigns and loyalty perks to lift weekday transaction count.
3. **Basket Size Optimization**: Train floor associates and place high-margin impulse endcaps near checkout to lift basket size from $${summaryMetrics?.avgBasket || 0} toward regional benchmarks.
4. **Weekly Store Manager Check-in**: Institute weekly operational reviews for stores under 90% budget target to troubleshoot staffing and replenishment bottlenecks.`;
}

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
