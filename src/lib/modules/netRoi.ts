/**
 * Section 5: "ClearCo platform cost for the period ($) — needed to
 * calculate net ROI, not just gross value." This is a statement-level
 * calc (platform cost is account-wide client context, not module-specific)
 * so it lives outside any single module's calculate().
 */
export function computeNetRoi(
  grossAnnualRoi: number,
  platformCostPerYear: number | null,
): { netAnnualRoi: number | null; platformCostPerYear: number | null } {
  if (platformCostPerYear === null) {
    return { netAnnualRoi: null, platformCostPerYear: null };
  }
  return {
    netAnnualRoi: grossAnnualRoi - platformCostPerYear,
    platformCostPerYear,
  };
}
