import type { ModuleMetricField } from "../types";
import type { AtsAssumptions, AtsMetrics } from "./schema";

/**
 * The eight granular actions behind "Admin Time Savings" (Section 4's note
 * on the ATS module + Section 5's usage-metrics table). Each ties one
 * `AtsMetrics` field to the `AtsAssumptions` field holding its
 * minutes-saved assumption, plus where that count can come from today.
 */
export interface AtsAction {
  metricKey: keyof AtsMetrics;
  assumptionKey: keyof AtsAssumptions;
  label: string;
  sources: ModuleMetricField["sources"];
  notes?: string;
}

export const ATS_ACTIONS: AtsAction[] = [
  {
    metricKey: "textsSent",
    assumptionKey: "minutesPerText",
    label: "Texts sent",
    sources: ["MANUAL", "CSV_CATALYST"],
    notes:
      'Catalyst: texts sent (30-day rolling window), from the column labeled ' +
      '"Do Not Use" in the export — verified usable and confirmed with the ' +
      "CSM lead before mapping it.",
  },
  {
    metricKey: "emailsSentAutomated",
    assumptionKey: "minutesPerEmailAutomated",
    label: "Emails sent (automated)",
    sources: ["MANUAL"],
    notes: "Not covered by the Catalyst export — no column exists.",
  },
  {
    metricKey: "interviewsScheduled",
    assumptionKey: "minutesPerInterviewScheduled",
    label: "Interviews scheduled",
    sources: ["MANUAL", "CSV_CATALYST"],
    notes: "Catalyst: 1:1 + multi-interviewer interviews scheduled within 30 days.",
  },
  {
    metricKey: "offersSent",
    assumptionKey: "minutesPerOfferSent",
    label: "Offers sent",
    sources: ["MANUAL", "CSV_CATALYST"],
    notes: "Catalyst: Offer Letters Sent (30/90-day rolling window).",
  },
  {
    metricKey: "backgroundChecksInitiated",
    assumptionKey: "minutesPerBackgroundCheck",
    label: "Background checks initiated",
    sources: ["MANUAL", "CSV_CATALYST"],
    notes: "Catalyst: BGC by CC run last month.",
  },
  {
    metricKey: "workflowAutomationsTriggered",
    assumptionKey: "minutesPerWorkflowAutomation",
    label: "Workflow automations triggered",
    sources: ["MANUAL"],
    notes: "Not covered by the Catalyst export — no column exists.",
  },
  {
    metricKey: "scorecardsSent",
    assumptionKey: "minutesPerScorecardSent",
    label: "Scorecards sent",
    sources: ["MANUAL", "CSV_CATALYST"],
    notes: "Catalyst: Scorecards completed over last 30/90 days.",
  },
  {
    metricKey: "onboardingPacketsLaunched",
    assumptionKey: "minutesPerOnboardingPacket",
    label: "Onboarding packets launched",
    sources: ["MANUAL", "CSV_CATALYST"],
    notes: "Catalyst: Onboarding packets assigned (30/90-day rolling window).",
  },
];
