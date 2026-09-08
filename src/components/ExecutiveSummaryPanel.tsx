import React, { useState } from 'react';
import {
  AggregatedKPIs,
  RegionMetric,
  StoreAggregatedPerformance,
  ActionItem,
} from '../types';
import { generateAnalyticalSummary } from '../utils/analyticalSummary';
import {
  Sparkles,
  ClipboardCheck,
  Copy,
  Send,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Package,
  BadgePercent,
  RefreshCw,
  FileText,
  HelpCircle,
} from 'lucide-react';

interface ExecutiveSummaryPanelProps {
  kpis: AggregatedKPIs;
  regionalMetrics: RegionMetric[];
  storePerformances: StoreAggregatedPerformance[];
  actionItems: ActionItem[];
  selectedRegion: string;
}

export const ExecutiveSummaryPanel: React.FC<ExecutiveSummaryPanelProps> = ({
  kpis,
  regionalMetrics,
  storePerformances,
  actionItems,
  selectedRegion,
}) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analysisSource, setAnalysisSource] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Top 3 & bottom 3 stores for prompt context
  const topStores = [...storePerformances]
    .sort((a, b) => b.achievementRate - a.achievementRate)
    .slice(0, 3);
  const bottomStores = [...storePerformances]
    .sort((a, b) => a.achievementRate - b.achievementRate)
    .slice(0, 3);

  const handleGenerateSummary = async (promptOverride?: string) => {
    setIsGenerating(true);
    const queryPrompt = promptOverride !== undefined ? promptOverride : customPrompt;

    try {
      const response = await fetch('/api/insights/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summaryMetrics: kpis,
          regionalPerformance: regionalMetrics,
          topPerformers: topStores,
          bottomPerformers: bottomStores,
          focusRegion: selectedRegion !== 'All' ? selectedRegion : undefined,
          userPrompt: queryPrompt || 'Generate an executive 30-day turnaround and growth strategy.',
        }),
      });

      if (!response.ok) {
        throw new Error(`Endpoint returned status ${response.status}`);
      }

      const data = await response.json();
      if (!data || !data.summary) {
        throw new Error('Invalid response structure');
      }

      setAiAnalysis(data.summary);
      setAnalysisSource(data.source === 'gemini' ? 'Gemini 3.8 Flash' : 'Retail Diagnostic Engine');
    } catch (err) {
      console.warn('Backend /api/insights/generate unavailable or errored, utilizing client-side diagnostic engine:', err);
      // High-fidelity client-side analytical summary fallback
      const richFallback = generateAnalyticalSummary(
        kpis,
        regionalMetrics,
        topStores,
        bottomStores,
        selectedRegion !== 'All' ? selectedRegion : undefined
      );
      setAiAnalysis(richFallback);
      setAnalysisSource('Retail Diagnostic Engine (Edge/Local)');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopySummary = () => {
    const textToCopy = aiAnalysis || actionItems.map((a) => `${a.title}: ${a.description}`).join('\n\n');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getCategoryIcon = (cat: ActionItem['category']) => {
    switch (cat) {
      case 'Inventory':
        return <Package className="w-4 h-4 text-amber-600" />;
      case 'Promotions':
        return <BadgePercent className="w-4 h-4 text-emerald-600" />;
      case 'Operations':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'Merchandising':
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div id="executive-summary-section" className="bg-white rounded-xl border border-[#e2e8f0] p-5 sm:p-6 mb-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e2e8f0]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-blue-50 text-[#3b82f6] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              Executive Action Summary & Strategic Recommendations
            </h3>
          </div>
          <p className="text-xs text-[#64748b] mt-1">
            Synthesized commercial takeaways, territory interventions, and automated strategic action plans.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-[#e2e8f0] rounded-md transition-colors"
          >
            {copied ? (
              <>
                <ClipboardCheck className="w-3.5 h-3.5 text-[#22c55e]" />
                <span>Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Summary</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid: Immediate Action Items (Left) + AI Strategic Briefing (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5">
        {/* Left Column: Immediate Action Levers (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#64748b] flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#3b82f6]" />
                Immediate Action Levers
              </h4>
              <span className="text-[11px] text-[#64748b]">
                {actionItems.length} Priorities Identified
              </span>
            </div>

            <div className="space-y-3">
              {actionItems.map((item, aIdx) => (
                <div
                  key={`act-${item.id}-${aIdx}`}
                  className="p-3.5 rounded-lg border border-[#e2e8f0] bg-white hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-[#64748b] tracking-wider uppercase inline-block">
                      {item.region} • {item.category}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        item.impact === 'High'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {item.impact} Priority
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-900 mb-1">
                    {item.title}
                  </div>

                  <p className="text-[13px] text-slate-700 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-[#e2e8f0] flex items-center justify-between text-[11px] text-[#64748b]">
                    <span>Metric Trigger:</span>
                    <span className="font-mono text-slate-600">{item.metricTrigger}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-[#e2e8f0] text-xs text-slate-700">
            <span className="font-semibold block mb-0.5 text-slate-900">Execution Cadence:</span>
            Review and deploy these prioritized interventions during weekly regional director alignment calls.
          </div>
        </div>

        {/* Right Column: AI Executive Strategy Generator (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-[#0f172a] text-white rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#3b82f6]" />
              <h4 className="text-sm font-semibold text-white">
                Executive Strategy Assistant (Gemini 3.8 Flash)
              </h4>
            </div>
            {analysisSource && (
              <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                {analysisSource}
              </span>
            )}
          </div>

          {/* Quick Prompt Chips */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              onClick={() =>
                handleGenerateSummary(
                  'Provide a complete C-suite retail performance assessment with 30-day priorities.'
                )
              }
              disabled={isGenerating}
              className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded transition-colors"
            >
              Full Executive Assessment
            </button>
            <button
              onClick={() =>
                handleGenerateSummary(
                  'Diagnose the trailing regions and propose specific promotional / footfall recovery plans.'
                )
              }
              disabled={isGenerating}
              className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded transition-colors"
            >
              Turnaround Lagging Regions
            </button>
            <button
              onClick={() =>
                handleGenerateSummary(
                  'Recommend inventory reallocation strategies to maximize top-performing formats and avoid stockouts.'
                )
              }
              disabled={isGenerating}
              className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded transition-colors"
            >
              Inventory Allocation Plan
            </button>
            <button
              onClick={() =>
                handleGenerateSummary(
                  'Analyze store space productivity and recommend tactics to increase basket size.'
                )
              }
              disabled={isGenerating}
              className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded transition-colors"
            >
              Basket Size Expansion
            </button>
          </div>

          {/* Custom Prompt Input */}
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              placeholder="Ask custom question (e.g. 'How can Flagship stores lift traffic?')..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isGenerating) {
                  handleGenerateSummary();
                }
              }}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#3b82f6]"
            />
            <button
              onClick={() => handleGenerateSummary()}
              disabled={isGenerating}
              className="px-3.5 py-1.5 bg-[#3b82f6] hover:bg-blue-600 disabled:bg-slate-800 text-white rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Generate
                </>
              )}
            </button>
          </div>

          {/* Analysis Content Display */}
          <div className="mt-4 flex-1 min-h-[220px] max-h-[380px] overflow-y-auto pr-1 text-xs text-slate-200 leading-relaxed bg-slate-950/70 p-4 rounded-md border border-slate-800">
            {isGenerating ? (
              <div className="h-full flex flex-col items-center justify-center py-10 gap-3 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-[#3b82f6]" />
                <p className="text-xs">Synthesizing multi-region sales, target deviations, and store KPIs...</p>
              </div>
            ) : aiAnalysis ? (
              <div className="prose prose-invert prose-xs max-w-none space-y-2 whitespace-pre-wrap">
                {aiAnalysis}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-8 text-center text-slate-400">
                <FileText className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs font-medium text-slate-300">
                  Ready to generate action-oriented executive business summaries.
                </p>
                <p className="text-[11px] text-slate-500 max-w-md mt-1">
                  Click any recommendation chip above or type a specific business inquiry to trigger instant retail intelligence.
                </p>
                <button
                  onClick={() => handleGenerateSummary()}
                  className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-medium border border-slate-700 transition-colors"
                >
                  Generate Initial Executive Diagnosis
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
