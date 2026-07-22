import { z } from "zod";

/**
 * Per-action usage metrics from ClearCompany's own "Recruiter Activity
 * Report" liveboard export (distinct from the Catalyst Whitespace Map CSV
 * that feeds the ATS module). Every field is nullable — not every account
 * will have every report type imported yet.
 *
 * Deliberately excludes report metrics that either duplicate an ATS module
 * field (Hired, Offer Letters Sent, Interviewed, Emails sent has its own
 * field here instead since it's a distinct action from ATS's "automated
 * emails") or aren't a repeatable admin action with a time-saved story
 * (Current Number of Open Reqs, Positions Filled, Closed, Opened, Put On
 * Hold) — confirmed with the user before implementation.
 */
export const recruiterActivityMetricsSchema = z.object({
  reviewed: z.number().nullable(),
  dispositioned: z.number().nullable(),
  screened: z.number().nullable(),
  activelySourced: z.number().nullable(),
  notesTaken: z.number().nullable(),
  offerMade: z.number().nullable(),
  reqUpdates: z.number().nullable(),
  draftsCreated: z.number().nullable(),
  emailsSent: z.number().nullable(),
});

export type RecruiterActivityMetrics = z.infer<typeof recruiterActivityMetricsSchema>;

export const EMPTY_RECRUITER_ACTIVITY_METRICS: RecruiterActivityMetrics = {
  reviewed: null,
  dispositioned: null,
  screened: null,
  activelySourced: null,
  notesTaken: null,
  offerMade: null,
  reqUpdates: null,
  draftsCreated: null,
  emailsSent: null,
};

/** "Minutes saved per action" — editable per account, same pattern as the ATS module. Starting defaults proposed and confirmed with the user before implementation; not sourced from the build doc since this module is new. */
export const recruiterActivityAssumptionsSchema = z.object({
  minutesPerReviewed: z.number().nonnegative(),
  minutesPerDispositioned: z.number().nonnegative(),
  minutesPerScreened: z.number().nonnegative(),
  minutesPerActivelySourced: z.number().nonnegative(),
  minutesPerNotesTaken: z.number().nonnegative(),
  minutesPerOfferMade: z.number().nonnegative(),
  minutesPerReqUpdate: z.number().nonnegative(),
  minutesPerDraftCreated: z.number().nonnegative(),
  minutesPerEmailSent: z.number().nonnegative(),
});

export type RecruiterActivityAssumptions = z.infer<typeof recruiterActivityAssumptionsSchema>;
