import { describe, expect, it } from "vitest";
import { calculateGrandTotal } from "../registry";
import type { ClientContext } from "../types";
import { calculateAts } from "./calculate";
import { ATS_DEFAULT_ASSUMPTIONS } from "./defaults";
import { EMPTY_ATS_METRICS } from "./schema";

const context: ClientContext = {
  hrHourlyRate: 40,
  costOfVacancyPerDay: 500,
  platformCostPerYear: 20000,
};

describe("calculateAts", () => {
  it("computes granular admin time savings from CURRENT-period volumes only, per Section 4/5", () => {
    // Baseline volumes are deliberately different from current to prove
    // they're ignored for the per-action lines (confirmed semantics: the
    // "minutes saved" assumption already encodes "vs. doing it manually").
    const baseline = {
      ...EMPTY_ATS_METRICS,
      textsSent: 5000,
      timeToFillDays: 32,
    };
    const current = {
      ...EMPTY_ATS_METRICS,
      textsSent: 900,
      emailsSentAutomated: 400,
      interviewsScheduled: 120,
      offersSent: 42,
      backgroundChecksInitiated: 60,
      workflowAutomationsTriggered: 80,
      scorecardsSent: 95,
      onboardingPacketsLaunched: 30,
      timeToFillDays: 24,
      hires: 18,
    };

    const result = calculateAts({ baseline, current, assumptions: ATS_DEFAULT_ASSUMPTIONS, context });

    const byKey = Object.fromEntries(result.lineItems.map((li) => [li.key, li.amount]));
    expect(byKey.textsSent).toBeCloseTo((900 * 2) / 60 * 40, 5); // $1,200
    expect(byKey.emailsSentAutomated).toBeCloseTo((400 * 3) / 60 * 40, 5); // $800
    expect(byKey.interviewsScheduled).toBeCloseTo((120 * 10) / 60 * 40, 5); // $800
    expect(byKey.offersSent).toBeCloseTo((42 * 15) / 60 * 40, 5); // $420
    expect(byKey.backgroundChecksInitiated).toBeCloseTo((60 * 10) / 60 * 40, 5); // $400
    expect(byKey.workflowAutomationsTriggered).toBeCloseTo((80 * 5) / 60 * 40, 5);
    expect(byKey.scorecardsSent).toBeCloseTo((95 * 5) / 60 * 40, 5);
    expect(byKey.onboardingPacketsLaunched).toBeCloseTo((30 * 10) / 60 * 40, 5);

    // Faster Hiring Productivity IS delta-based: (baseline TTF - current TTF) x hires x cost/day.
    expect(byKey.fasterHiringProductivity).toBeCloseTo(18 * (32 - 24) * 500, 5); // $72,000

    expect(result.totalAnnualRoi).toBeCloseTo(4403.3333333 + 72000, 4);
    expect(result.moduleKey).toBe("ATS");
  });

  it("does not floor a worsening time-to-fill at zero — shows the true (negative) math", () => {
    const baseline = { ...EMPTY_ATS_METRICS, timeToFillDays: 20 };
    const current = { ...EMPTY_ATS_METRICS, timeToFillDays: 25, hires: 10 };

    const result = calculateAts({ baseline, current, assumptions: ATS_DEFAULT_ASSUMPTIONS, context });
    const line = result.lineItems.find((li) => li.key === "fasterHiringProductivity")!;

    expect(line.amount).toBeCloseTo(10 * (20 - 25) * 500, 5); // -$25,000
    expect(line.methodology).toContain("increased");
  });

  it("flags missing manual-entry fields instead of guessing", () => {
    const baseline = { ...EMPTY_ATS_METRICS }; // no baseline time-to-fill entered yet
    const current = { ...EMPTY_ATS_METRICS, hires: 10, timeToFillDays: 25 };

    const result = calculateAts({ baseline, current, assumptions: ATS_DEFAULT_ASSUMPTIONS, context });
    const line = result.lineItems.find((li) => li.key === "fasterHiringProductivity")!;

    expect(line.amount).toBe(0);
    expect(line.methodology).toContain("Missing");
    expect(line.methodology).toContain("baseline time-to-fill");
  });

  it("surfaces (rather than silently drops) a missing HR hourly rate", () => {
    const noRateContext: ClientContext = { ...context, hrHourlyRate: null };
    const current = { ...EMPTY_ATS_METRICS, textsSent: 100 };
    const baseline = { ...EMPTY_ATS_METRICS };

    const result = calculateAts({ baseline, current, assumptions: ATS_DEFAULT_ASSUMPTIONS, context: noRateContext });
    const line = result.lineItems.find((li) => li.key === "textsSent")!;

    expect(line.amount).toBe(0);
    expect(line.methodology).toContain("hourly rate");
  });
});

describe("calculateGrandTotal", () => {
  it("sums whichever modules are active, per Section 4's Exec Slide rollup", () => {
    const result = calculateAts({
      baseline: EMPTY_ATS_METRICS,
      current: { ...EMPTY_ATS_METRICS, textsSent: 100 },
      assumptions: ATS_DEFAULT_ASSUMPTIONS,
      context,
    });

    const grandTotal = calculateGrandTotal([result, result]);
    expect(grandTotal.totalAnnualRoi).toBeCloseTo(result.totalAnnualRoi * 2, 5);
  });
});
