import { z } from "zod";

/**
 * Granular per-action usage metrics for one period (baseline or current),
 * per Section 5's "Manual entry — ATS Module usage metrics" table. Every
 * field is nullable because a CSM may not have a value yet (not entered
 * manually, not covered by the Catalyst CSV, and not yet resolved via Gong).
 */
export const atsMetricsSchema = z.object({
  textsSent: z.number().nullable(),
  emailsSentAutomated: z.number().nullable(),
  interviewsScheduled: z.number().nullable(),
  offersSent: z.number().nullable(),
  backgroundChecksInitiated: z.number().nullable(),
  workflowAutomationsTriggered: z.number().nullable(),
  scorecardsSent: z.number().nullable(),
  onboardingPacketsLaunched: z.number().nullable(),
  /** Manual-entry only until Section 9 #12 (ClearInsights/ThoughtSpot API) is resolved. */
  timeToFillDays: z.number().nullable(),
  /** Manual-entry only until Section 9 #12 is resolved. */
  hires: z.number().nullable(),
});

export type AtsMetrics = z.infer<typeof atsMetricsSchema>;

export const EMPTY_ATS_METRICS: AtsMetrics = {
  textsSent: null,
  emailsSentAutomated: null,
  interviewsScheduled: null,
  offersSent: null,
  backgroundChecksInitiated: null,
  workflowAutomationsTriggered: null,
  scorecardsSent: null,
  onboardingPacketsLaunched: null,
  timeToFillDays: null,
  hires: null,
};

/**
 * "Minutes saved per action" — editable per Section 5, industry-standard
 * defaults to start. texts/offers/backgroundChecks values are given
 * verbatim in the build doc; the rest are this build's proposed defaults
 * (confirmed with the CSM lead before implementation).
 */
export const atsAssumptionsSchema = z.object({
  minutesPerText: z.number().nonnegative(),
  minutesPerEmailAutomated: z.number().nonnegative(),
  minutesPerInterviewScheduled: z.number().nonnegative(),
  minutesPerOfferSent: z.number().nonnegative(),
  minutesPerBackgroundCheck: z.number().nonnegative(),
  minutesPerWorkflowAutomation: z.number().nonnegative(),
  minutesPerScorecardSent: z.number().nonnegative(),
  minutesPerOnboardingPacket: z.number().nonnegative(),
});

export type AtsAssumptions = z.infer<typeof atsAssumptionsSchema>;
