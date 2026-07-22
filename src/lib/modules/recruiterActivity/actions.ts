import type { ModuleMetricField } from "../types";
import type { RecruiterActivityAssumptions, RecruiterActivityMetrics } from "./schema";

/**
 * The nine granular actions behind Recruiter Activity's admin time savings,
 * each tying one metric field to its minutes-saved assumption. All nine come
 * from ClearCompany's own "Recruiter Activity Report" (see
 * src/lib/reportImport/recruiterActivityReport.ts) — there's no manual-entry
 * path for this module yet since it only exists to receive PDF-imported
 * data, unlike ATS which started manual-first.
 */
export interface RecruiterActivityAction {
  metricKey: keyof RecruiterActivityMetrics;
  assumptionKey: keyof RecruiterActivityAssumptions;
  label: string;
  sources: ModuleMetricField["sources"];
  notes?: string;
}

export const RECRUITER_ACTIVITY_ACTIONS: RecruiterActivityAction[] = [
  {
    metricKey: "reviewed",
    assumptionKey: "minutesPerReviewed",
    label: "Candidates reviewed",
    sources: ["PDF_REPORT"],
    notes: "From ClearCompany's Recruiter Activity Report PDF (Candidate Activity: Reviewed).",
  },
  {
    metricKey: "dispositioned",
    assumptionKey: "minutesPerDispositioned",
    label: "Candidates dispositioned",
    sources: ["PDF_REPORT"],
    notes: "From the Recruiter Activity Report PDF (Candidate Activity: Dispositioned).",
  },
  {
    metricKey: "screened",
    assumptionKey: "minutesPerScreened",
    label: "Candidates screened",
    sources: ["PDF_REPORT"],
    notes: "From the Recruiter Activity Report PDF (Candidate Activity: Screened).",
  },
  {
    metricKey: "activelySourced",
    assumptionKey: "minutesPerActivelySourced",
    label: "Candidates actively sourced",
    sources: ["PDF_REPORT"],
    notes: "From the Recruiter Activity Report PDF (Candidate Activity: Actively Sourced).",
  },
  {
    metricKey: "notesTaken",
    assumptionKey: "minutesPerNotesTaken",
    label: "Notes taken",
    sources: ["PDF_REPORT"],
    notes: "From the Recruiter Activity Report PDF (Candidate Activity: Notes Taken).",
  },
  {
    metricKey: "offerMade",
    assumptionKey: "minutesPerOfferMade",
    label: "Offers made",
    sources: ["PDF_REPORT"],
    notes:
      "From the Recruiter Activity Report PDF (Candidate Activity: Offer Made) — distinct from ATS's Offers Sent (Offer Letters Sent).",
  },
  {
    metricKey: "reqUpdates",
    assumptionKey: "minutesPerReqUpdate",
    label: "Requisition updates",
    sources: ["PDF_REPORT"],
    notes: "From the Recruiter Activity Report PDF (Requisition Activity: Updates).",
  },
  {
    metricKey: "draftsCreated",
    assumptionKey: "minutesPerDraftCreated",
    label: "Requisition drafts created",
    sources: ["PDF_REPORT"],
    notes: "From the Recruiter Activity Report PDF (Requisition Activity: Drafts Created).",
  },
  {
    metricKey: "emailsSent",
    assumptionKey: "minutesPerEmailSent",
    label: "Emails sent",
    sources: ["PDF_REPORT"],
    notes:
      "From the Recruiter Activity Report PDF (Candidate Activity: Emails sent) — distinct from ATS's automated-email field.",
  },
];
