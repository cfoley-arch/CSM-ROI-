import type { ClientContext, ModuleResult, RoiLineItem } from "../types";
import { RECRUITER_ACTIVITY_ACTIONS } from "./actions";
import type { RecruiterActivityAssumptions, RecruiterActivityMetrics } from "./schema";

const currency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

/**
 * Recruiter Activity calc engine. One TIME_SAVED line per action, driven by
 * the CURRENT period's volume only — same "minutes saved" already encodes
 * "vs. doing this manually" reasoning as the ATS module's per-action lines,
 * so baseline isn't used here either. No delta-based line (unlike ATS's
 * Faster Hiring Productivity) since every metric this module tracks is a
 * simple action count, not something with a meaningful before/after change.
 */
export function calculateRecruiterActivity(params: {
  baseline: RecruiterActivityMetrics;
  current: RecruiterActivityMetrics;
  assumptions: RecruiterActivityAssumptions;
  context: ClientContext;
}): ModuleResult {
  const { current, assumptions, context } = params;
  const lineItems: RoiLineItem[] = [];

  for (const action of RECRUITER_ACTIVITY_ACTIONS) {
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
        hours: hoursSaved,
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
      hours: hoursSaved,
      methodology: `${count.toLocaleString()} × ${minutesPerAction} min saved = ${hoursSaved.toFixed(
        1,
      )} hrs × ${currency(context.hrHourlyRate)}/hr = ${currency(amount)}`,
    });
  }

  const totalAnnualRoi = lineItems.reduce((sum, item) => sum + item.amount, 0);

  return {
    moduleKey: "RECRUITER_ACTIVITY",
    moduleLabel: "Recruiter Activity",
    lineItems,
    totalAnnualRoi,
  };
}
