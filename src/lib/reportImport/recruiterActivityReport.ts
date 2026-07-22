import type { ReportImporter } from "./types";
import { extractLabeledBreakdown } from "./textPatterns";

/**
 * Maps this report's Candidate Activity + Requisition Activity breakdown
 * labels to the Recruiter Activity module's metric keys. Deliberately
 * excludes labels that either duplicate an ATS module field (Hired, Offer
 * Letters Sent, Interviewed) or aren't a repeatable admin action with a
 * time-saved story (Current Number of Open Reqs, Positions Filled, Closed,
 * Opened, Put On Hold) — confirmed with the user before implementation.
 */
const FIELD_MAP: Record<string, string> = {
  Reviewed: "reviewed",
  Dispositioned: "dispositioned",
  Screened: "screened",
  "Actively Sourced": "activelySourced",
  "Notes Taken": "notesTaken",
  "Offer Made": "offerMade",
  Updates: "reqUpdates",
  "Drafts Created": "draftsCreated",
  "Emails sent": "emailsSent",
};

export const recruiterActivityReportImporter: ReportImporter = {
  key: "RECRUITER_ACTIVITY_REPORT",
  label: "Recruiter Activity Report",
  detect: (text) => text.startsWith("Recruiter Activity Report\n"),
  parse: (text) => {
    const breakdown = extractLabeledBreakdown(text);
    const fields = [];
    const missingLabels: string[] = [];

    for (const [reportLabel, metricKey] of Object.entries(FIELD_MAP)) {
      const value = breakdown.get(reportLabel);
      if (value === undefined) {
        missingLabels.push(reportLabel);
      } else {
        fields.push({ moduleKey: "RECRUITER_ACTIVITY", metricKey, value });
      }
    }

    return { reportLabel: "Recruiter Activity Report", fields, missingLabels };
  },
};
