import type { ReportImporter } from "./types";
import { extractHeadlineTile } from "./textPatterns";

/**
 * Resolves the ATS module's long-manual `timeToFillDays` and `hires` fields
 * (Section 9 #12, pending ClearInsights/ThoughtSpot API) — this report is
 * that data, straight from ClearCompany's own liveboard. "Openings Filled"
 * maps to `hires` since it's the same req-based fill count the ATS module's
 * Faster Hiring Productivity line expects (as opposed to Funnel Analysis's
 * candidate-apply-based "Hires", which counts differently over the same
 * window — see funnelAnalysis.ts).
 */
export const timeToFillImporter: ReportImporter = {
  key: "TIME_TO_FILL",
  label: "Time to Fill",
  detect: (text) => text.startsWith("Time to Fill\n"),
  parse: (text) => {
    const fields = [];
    const missingLabels: string[] = [];

    const timeToFillDays = extractHeadlineTile(text, "Average Time-to-Fill (Days)");
    if (timeToFillDays !== null) {
      fields.push({ moduleKey: "ATS", metricKey: "timeToFillDays", value: timeToFillDays });
    } else {
      missingLabels.push("Average Time-to-Fill (Days)");
    }

    const hires = extractHeadlineTile(text, "Openings Filled");
    if (hires !== null) {
      fields.push({ moduleKey: "ATS", metricKey: "hires", value: hires });
    } else {
      missingLabels.push("Openings Filled");
    }

    return { reportLabel: "Time to Fill", fields, missingLabels };
  },
};
