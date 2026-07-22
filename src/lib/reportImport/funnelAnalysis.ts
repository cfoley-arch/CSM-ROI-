import type { ReportImporter } from "./types";
import { extractHeadlineTile } from "./textPatterns";

/**
 * Feeds ATS's `hires` as an additional source. Deliberately does NOT map
 * this report's "Average Days to Hire" into `timeToFillDays` — it's a
 * different metric (candidate apply-to-hire time, not req-based
 * time-to-fill) with a materially different value over the same window;
 * conflating them would silently corrupt the Faster Hiring Productivity
 * calc. Use the dedicated Time to Fill report for that field instead.
 */
export const funnelAnalysisImporter: ReportImporter = {
  key: "FUNNEL_ANALYSIS",
  label: "Funnel Analysis",
  detect: (text) => text.startsWith("Funnel Analysis\n"),
  parse: (text) => {
    const fields = [];
    const missingLabels: string[] = [];

    const hires = extractHeadlineTile(text, "Hires");
    if (hires !== null) {
      fields.push({ moduleKey: "ATS", metricKey: "hires", value: hires });
    } else {
      missingLabels.push("Hires");
    }

    return { reportLabel: "Funnel Analysis", fields, missingLabels };
  },
};
