import { AtsAssumptions } from "./schema";

/**
 * Default "minutes saved per action," editable per account (Section 5).
 * texts/offers/backgroundChecks are given verbatim in the build doc; the
 * rest are this build's proposed defaults, confirmed before implementation.
 */
export const ATS_DEFAULT_ASSUMPTIONS: AtsAssumptions = {
  minutesPerText: 2,
  minutesPerEmailAutomated: 3,
  minutesPerInterviewScheduled: 10,
  minutesPerOfferSent: 15,
  minutesPerBackgroundCheck: 10,
  minutesPerWorkflowAutomation: 5,
  minutesPerScorecardSent: 5,
  minutesPerOnboardingPacket: 10,
};
