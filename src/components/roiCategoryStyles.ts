import type { RoiCategory } from "@/lib/modules/types";

/**
 * Secondary-palette color per ROI category, for "supporting UI, charts,
 * category breakdowns" (Section 6). Purely a display concern — not
 * specified by the build doc, so kept out of the calc engine.
 */
export const ROI_CATEGORY_STYLE: Record<RoiCategory, { label: string; bg: string; fg: string }> = {
  TIME_SAVED: { label: "Time Saved", bg: "bg-cc-verdigris/20", fg: "text-cc-steel" },
  COST_AVOIDED: { label: "Cost Avoided", bg: "bg-cc-brass/25", fg: "text-cc-bronze" },
  REVENUE_ENABLED: { label: "Revenue Enabled", bg: "bg-cc-alloy/25", fg: "text-cc-bronze" },
  RISK_REDUCED: { label: "Risk Reduced", bg: "bg-cc-pewter/25", fg: "text-cc-steel" },
};
