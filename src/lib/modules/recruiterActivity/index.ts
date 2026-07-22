import type { ModuleAssumptionField, ModuleDefinition } from "../types";
import { RECRUITER_ACTIVITY_ACTIONS } from "./actions";
import { calculateRecruiterActivity } from "./calculate";
import { RECRUITER_ACTIVITY_DEFAULT_ASSUMPTIONS } from "./defaults";
import {
  EMPTY_RECRUITER_ACTIVITY_METRICS,
  recruiterActivityAssumptionsSchema,
  recruiterActivityMetricsSchema,
  type RecruiterActivityAssumptions,
  type RecruiterActivityMetrics,
} from "./schema";

const assumptionFields: ModuleAssumptionField[] = RECRUITER_ACTIVITY_ACTIONS.map((action) => ({
  key: action.assumptionKey,
  label: `Minutes saved per ${action.label.toLowerCase()}`,
  unit: "minutes",
}));

export const RecruiterActivityModule: ModuleDefinition<RecruiterActivityMetrics, RecruiterActivityAssumptions> = {
  key: "RECRUITER_ACTIVITY",
  label: "Recruiter Activity",
  description:
    "Admin time savings from ClearCompany's own Recruiter Activity Report — candidate review, disposition, sourcing, and requisition-management actions distinct from the ATS module's Catalyst-sourced metrics.",

  metricsSchema: recruiterActivityMetricsSchema,
  assumptionsSchema: recruiterActivityAssumptionsSchema,
  defaultAssumptions: RECRUITER_ACTIVITY_DEFAULT_ASSUMPTIONS,
  emptyMetrics: EMPTY_RECRUITER_ACTIVITY_METRICS,

  metricFields: RECRUITER_ACTIVITY_ACTIONS.map((action) => ({
    key: action.metricKey,
    label: action.label,
    sources: action.sources,
    notes: action.notes,
  })),
  assumptionFields,

  calculate: calculateRecruiterActivity,
};
