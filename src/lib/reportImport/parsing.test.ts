import { describe, expect, it } from "vitest";
import { funnelAnalysisImporter } from "./funnelAnalysis";
import { offerLetterProcessVisibilityImporter } from "./offerLetterProcessVisibility";
import { recruiterActivityReportImporter } from "./recruiterActivityReport";
import { detectReportImporter } from "./registry";
import { timeToFillImporter } from "./timeToFill";

// Snippets below are trimmed excerpts of real pdf-parse output from actual
// ClearCompany exports (verified against the source PDFs during
// implementation) — not synthetic data.

const RECRUITER_ACTIVITY_TEXT = `Recruiter Activity Report
07/22/2026 13:48:08 UTC

Candidate Processing Activities
17,855
Hired Activities
69
Current Number of Open Reqs
12
Reqs Opened
325
Candidate Activity
Reviewed - 5,667 (31.74%)
Dispositioned - 5,663 (31.72%)
Emails sent - 2,845 (15.93%)
Screened - 1,447 (8.1%)
Actively Sourced - 1,359 (7.61%)
Notes Taken - 510 (2.86%)
Interviewed - 173 (0.97%)
Offer Letters Sent - 113 (0.63%)
Hired - 69 (0.39%)
Offer Made - 9 (0.05%)
Requisition Activity
Updates - 134 (41.23%)
Positions Filled - 71 (21.85%)
Closed - 29 (8.92%)
Opened - 29 (8.92%)
Created - 25 (7.69%)
Drafts Created - 22 (6.77%)
Put On Hold - 15 (4.62%)`;

const TIME_TO_FILL_TEXT = `Time to Fill
07/22/2026 13:58:36 UTC

Average Time-to-Fill (Days)
104.15
Openings Filled
59
Average Days to Fill by Recruiter (Min 5 hires)`;

const OFFER_LETTER_TEXT = `Offer Letter Process Visibility
07/22/2026 13:56:48 UTC

Accepted Offers
98
Offers Sent to Candidates
112
Median Offer Approval Time (hrs)
0.00`;

const FUNNEL_ANALYSIS_TEXT = `Funnel Analysis
07/22/2026 13:57:58 UTC

Average Days to Hire
18.82
Hires
44
Days to Hire by Role`;

describe("recruiterActivityReportImporter", () => {
  it("detects the report by its title", () => {
    expect(recruiterActivityReportImporter.detect(RECRUITER_ACTIVITY_TEXT)).toBe(true);
    expect(recruiterActivityReportImporter.detect(TIME_TO_FILL_TEXT)).toBe(false);
  });

  it("extracts the 9 confirmed actions and excludes overlapping/non-actionable metrics", () => {
    const result = recruiterActivityReportImporter.parse(RECRUITER_ACTIVITY_TEXT);
    const byKey = Object.fromEntries(result.fields.map((f) => [f.metricKey, f.value]));

    expect(byKey.reviewed).toBe(5667);
    expect(byKey.dispositioned).toBe(5663);
    expect(byKey.emailsSent).toBe(2845);
    expect(byKey.screened).toBe(1447);
    expect(byKey.activelySourced).toBe(1359);
    expect(byKey.notesTaken).toBe(510);
    expect(byKey.offerMade).toBe(9);
    expect(byKey.reqUpdates).toBe(134);
    expect(byKey.draftsCreated).toBe(22);
    expect(result.fields).toHaveLength(9);
    expect(result.fields.every((f) => f.moduleKey === "RECRUITER_ACTIVITY")).toBe(true);
    expect(result.missingLabels).toHaveLength(0);

    // Hired, Offer Letters Sent, Interviewed, and the req-lifecycle/outcome
    // metrics must never appear — confirmed exclusions.
    expect(byKey.hired).toBeUndefined();
    expect(byKey.offerLettersSent).toBeUndefined();
    expect(byKey.interviewed).toBeUndefined();
  });
});

describe("timeToFillImporter", () => {
  it("maps into ATS's timeToFillDays and hires", () => {
    expect(timeToFillImporter.detect(TIME_TO_FILL_TEXT)).toBe(true);
    const result = timeToFillImporter.parse(TIME_TO_FILL_TEXT);
    expect(result.fields).toEqual([
      { moduleKey: "ATS", metricKey: "timeToFillDays", value: 104.15 },
      { moduleKey: "ATS", metricKey: "hires", value: 59 },
    ]);
    expect(result.missingLabels).toHaveLength(0);
  });
});

describe("offerLetterProcessVisibilityImporter", () => {
  it("maps Offers Sent to Candidates into ATS's offersSent", () => {
    const result = offerLetterProcessVisibilityImporter.parse(OFFER_LETTER_TEXT);
    expect(result.fields).toEqual([{ moduleKey: "ATS", metricKey: "offersSent", value: 112 }]);
  });
});

describe("funnelAnalysisImporter", () => {
  it("maps Hires into ATS's hires but never Average Days to Hire into timeToFillDays", () => {
    const result = funnelAnalysisImporter.parse(FUNNEL_ANALYSIS_TEXT);
    expect(result.fields).toEqual([{ moduleKey: "ATS", metricKey: "hires", value: 44 }]);
    expect(result.fields.some((f) => f.metricKey === "timeToFillDays")).toBe(false);
  });
});

describe("detectReportImporter", () => {
  it("routes each sample text to exactly the right importer", () => {
    expect(detectReportImporter(RECRUITER_ACTIVITY_TEXT)?.key).toBe("RECRUITER_ACTIVITY_REPORT");
    expect(detectReportImporter(TIME_TO_FILL_TEXT)?.key).toBe("TIME_TO_FILL");
    expect(detectReportImporter(OFFER_LETTER_TEXT)?.key).toBe("OFFER_LETTER_PROCESS_VISIBILITY");
    expect(detectReportImporter(FUNNEL_ANALYSIS_TEXT)?.key).toBe("FUNNEL_ANALYSIS");
  });

  it("returns null for an unrecognized report", () => {
    expect(detectReportImporter("Some Other Report\n01/01/2026")).toBeNull();
  });
});
