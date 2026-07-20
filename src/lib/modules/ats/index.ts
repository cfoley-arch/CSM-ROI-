import type { ModuleAssumptionField, ModuleDefinition } from "../types";
import { ATS_ACTIONS } from "./actions";
import { calculateAts } from "./calculate";
import { ATS_DEFAULT_ASSUMPTIONS } from "./defaults";
import {
  atsAssumptionsSchema,
  atsMetricsSchema,
  EMPTY_ATS_METRICS,
  type AtsAssumptions,
  type AtsMetrics,
} from "./schema";

const assumptionFields: ModuleAssumptionField[] = ATS_ACTIONS.map((action) => ({
  key: action.assumptionKey,
  label: `Minutes saved per ${action.label.toLowerCase()}`,
  unit: "minutes",
}));

export const AtsModule: ModuleDefinition<AtsMetrics, AtsAssumptions> = {
  key: "ATS",
  label: "Applicant Tracking System",
  description:
    "Granular per-action admin time savings plus faster-hiring productivity from reduced time-to-fill (Section 4, Module 1).",

  metricsSchema: atsMetricsSchema,
  assumptionsSchema: atsAssumptionsSchema,
  defaultAssumptions: ATS_DEFAULT_ASSUMPTIONS,
  emptyMetrics: EMPTY_ATS_METRICS,

  metricFields: [
    ...ATS_ACTIONS.map((action) => ({
      key: action.metricKey,
      label: action.label,
      sources: action.sources,
      notes: action.notes,
    })),
    {
      key: "timeToFillDays",
      label: "Time-to-fill (days)",
      sources: ["MANUAL"] as const,
      notes: "Manual-entry only until Section 9 #12 (ClearInsights/ThoughtSpot API) is resolved.",
    },
    {
      key: "hires",
      label: "Hires (count)",
      sources: ["MANUAL"] as const,
      notes: "Manual-entry only until Section 9 #12 (ClearInsights/ThoughtSpot API) is resolved.",
    },
  ],
  assumptionFields,

  calculate: calculateAts,
};
