import type { ClientContext, ModuleResult, RoiLineItem } from "../types";
import { ATS_ACTIONS } from "./actions";
import type { AtsAssumptions, AtsMetrics } from "./schema";

const currency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

/**
 * ATS module calc engine (Section 4 Module 1, granular version from
 * Section 5). Two line-item families:
 *
 * 1. One "Admin Time Savings" line per action type. Each is driven by the
 *    CURRENT period's volume only — the "minutes saved" assumption already
 *    encodes "vs. doing this manually," so it isn't a before/after delta.
 *    (Confirmed with the CSM lead before implementation.) Baseline is not
 *    used here; it's surfaced elsewhere for adoption-trend comparison.
 *
 * 2. "Faster Hiring Productivity" — the one line that IS delta-based: days
 *    reduced in time-to-fill = baseline time-to-fill minus current
 *    time-to-fill, times current hires, times cost of vacancy per day.
 *    Deliberately not floored at zero — if time-to-fill got worse, the
 *    line goes negative and says so, per the "show the math even when it's
 *    unflattering" credibility principle (Section 1).
 */
export function calculateAts(params: {
  baseline: AtsMetrics;
  current: AtsMetrics;
  assumptions: AtsAssumptions;
  context: ClientContext;
}): ModuleResult {
  const { baseline, current, assumptions, context } = params;
  const lineItems: RoiLineItem[] = [];

  for (const action of ATS_ACTIONS) {
    const count = current[action.metricKey];
    const minutesPerAction = assumptions[action.assumptionKey];

    if (count === null) {
      lineItems.push({
        key: action.metricKey,
        label: action.label,
        category: "TIME_SAVED",
        amount: 0,
        methodology: `${action.label}: no current-period count entered yet.`,
      });
      continue;
    }

    const hoursSaved = (count * minutesPerAction) / 60;

    if (context.hrHourlyRate === null) {
      lineItems.push({
        key: action.metricKey,
        label: action.label,
        category: "TIME_SAVED",
        amount: 0,
        methodology: `${count.toLocaleString()} × ${minutesPerAction} min = ${hoursSaved.toFixed(
          1,
        )} hrs saved — set the account's HR hourly rate to dollarize this line.`,
      });
      continue;
    }

    const amount = hoursSaved * context.hrHourlyRate;
    lineItems.push({
      key: action.metricKey,
      label: action.label,
      category: "TIME_SAVED",
      amount,
      methodology: `${count.toLocaleString()} × ${minutesPerAction} min saved = ${hoursSaved.toFixed(
        1,
      )} hrs × ${currency(context.hrHourlyRate)}/hr = ${currency(amount)}`,
    });
  }

  const hires = current.hires;
  const currentTtf = current.timeToFillDays;
  const baselineTtf = baseline.timeToFillDays;

  if (hires === null || currentTtf === null || baselineTtf === null) {
    const missing = [
      hires === null && "current hires",
      currentTtf === null && "current time-to-fill",
      baselineTtf === null && "baseline time-to-fill",
    ]
      .filter(Boolean)
      .join(", ");
    lineItems.push({
      key: "fasterHiringProductivity",
      label: "Faster Hiring Productivity",
      category: "COST_AVOIDED",
      amount: 0,
      methodology: `Missing: ${missing}. Both are manual-entry fields (see Section 9, #12) until ClearInsights/ThoughtSpot exposes an API.`,
    });
  } else if (context.costOfVacancyPerDay === null) {
    const daysReduced = baselineTtf - currentTtf;
    lineItems.push({
      key: "fasterHiringProductivity",
      label: "Faster Hiring Productivity",
      category: "COST_AVOIDED",
      amount: 0,
      methodology: `${hires.toLocaleString()} hires × ${daysReduced.toFixed(
        1,
      )} days reduced (${baselineTtf} → ${currentTtf}) — set the account's cost of vacancy per day to dollarize this line.`,
    });
  } else {
    const daysReduced = baselineTtf - currentTtf;
    const amount = hires * daysReduced * context.costOfVacancyPerDay;
    const trend = daysReduced >= 0 ? "reduced" : "increased";
    lineItems.push({
      key: "fasterHiringProductivity",
      label: "Faster Hiring Productivity",
      category: "COST_AVOIDED",
      amount,
      methodology: `${hires.toLocaleString()} hires × ${Math.abs(daysReduced).toFixed(
        1,
      )} days ${trend} in time-to-fill (${baselineTtf} → ${currentTtf}) × ${currency(
        context.costOfVacancyPerDay,
      )}/day = ${currency(amount)}`,
    });
  }

  const totalAnnualRoi = lineItems.reduce((sum, item) => sum + item.amount, 0);

  return {
    moduleKey: "ATS",
    moduleLabel: "Applicant Tracking System",
    lineItems,
    totalAnnualRoi,
  };
}
