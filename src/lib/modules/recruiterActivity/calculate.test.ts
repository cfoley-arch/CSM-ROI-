import { describe, expect, it } from "vitest";
import type { ClientContext } from "../types";
import { calculateRecruiterActivity } from "./calculate";
import { RECRUITER_ACTIVITY_DEFAULT_ASSUMPTIONS } from "./defaults";
import { EMPTY_RECRUITER_ACTIVITY_METRICS } from "./schema";

const context: ClientContext = {
  hrHourlyRate: 40,
  costOfVacancyPerDay: 500,
  platformCostPerYear: 20000,
};

describe("calculateRecruiterActivity", () => {
  it("dollarizes each action from CURRENT-period volume only, using the real Recruiter Activity Report sample values", () => {
    const baseline = { ...EMPTY_RECRUITER_ACTIVITY_METRICS };
    const current = {
      ...EMPTY_RECRUITER_ACTIVITY_METRICS,
      reviewed: 5667,
      dispositioned: 5663,
      screened: 1447,
      activelySourced: 1359,
      notesTaken: 510,
      offerMade: 9,
      reqUpdates: 134,
      draftsCreated: 22,
      emailsSent: 2845,
    };

    const result = calculateRecruiterActivity({
      baseline,
      current,
      assumptions: RECRUITER_ACTIVITY_DEFAULT_ASSUMPTIONS,
      context,
    });

    const byKey = Object.fromEntries(result.lineItems.map((li) => [li.key, li.amount]));
    expect(byKey.reviewed).toBeCloseTo((5667 * 3) / 60 * 40, 5);
    expect(byKey.emailsSent).toBeCloseTo((2845 * 3) / 60 * 40, 5);
    expect(byKey.reqUpdates).toBeCloseTo((134 * 2) / 60 * 40, 5);
    expect(result.moduleKey).toBe("RECRUITER_ACTIVITY");
    expect(result.lineItems.every((li) => li.category === "TIME_SAVED")).toBe(true);
  });

  it("surfaces a missing HR hourly rate instead of silently zeroing", () => {
    const noRateContext: ClientContext = { ...context, hrHourlyRate: null };
    const current = { ...EMPTY_RECRUITER_ACTIVITY_METRICS, reviewed: 100 };

    const result = calculateRecruiterActivity({
      baseline: EMPTY_RECRUITER_ACTIVITY_METRICS,
      current,
      assumptions: RECRUITER_ACTIVITY_DEFAULT_ASSUMPTIONS,
      context: noRateContext,
    });
    const line = result.lineItems.find((li) => li.key === "reviewed")!;

    expect(line.amount).toBe(0);
    expect(line.hours).toBeCloseTo((100 * 3) / 60, 5);
    expect(line.methodology).toContain("hourly rate");
  });

  it("leaves a line at zero with no count entered, rather than guessing", () => {
    const result = calculateRecruiterActivity({
      baseline: EMPTY_RECRUITER_ACTIVITY_METRICS,
      current: EMPTY_RECRUITER_ACTIVITY_METRICS,
      assumptions: RECRUITER_ACTIVITY_DEFAULT_ASSUMPTIONS,
      context,
    });

    expect(result.lineItems).toHaveLength(9);
    expect(result.totalAnnualRoi).toBe(0);
    expect(result.lineItems.every((li) => li.hours === undefined)).toBe(true);
  });
});
