import type { RecruiterActivityAssumptions } from "./schema";

/**
 * Default "minutes saved per action," editable per account. Starting
 * defaults proposed and confirmed with the user before implementation —
 * this module isn't in the original build doc, so none of these come from
 * Section 5 (unlike the ATS module's texts/offers/backgroundChecks values).
 */
export const RECRUITER_ACTIVITY_DEFAULT_ASSUMPTIONS: RecruiterActivityAssumptions = {
  minutesPerReviewed: 3,
  minutesPerDispositioned: 2,
  minutesPerScreened: 10,
  minutesPerActivelySourced: 5,
  minutesPerNotesTaken: 2,
  minutesPerOfferMade: 5,
  minutesPerReqUpdate: 2,
  minutesPerDraftCreated: 10,
  minutesPerEmailSent: 3,
};
