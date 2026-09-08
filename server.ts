import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { generateAnalyticalSummary } from "./src/utils/analyticalSummary";

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
