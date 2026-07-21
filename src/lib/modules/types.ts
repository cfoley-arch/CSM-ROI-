import { z } from "zod";

/**
 * The four ROI anchors every module's output rolls up into (Section 1).
 * "Customers don't renew software — they renew outcomes": every dollarized
 * line in a statement must be traceable to one of these.
 */
export const ROI_CATEGORIES = [
  "TIME_SAVED",
  "COST_AVOIDED",
  "REVENUE_ENABLED",
  "RISK_REDUCED",
] as const;

export type RoiCategory = (typeof ROI_CATEGORIES)[number];

/** One labeled, dollarized line item within a module's result (e.g. "Admin Time Savings"). */
export interface RoiLineItem {
  key: string;
  label: string;
  category: RoiCategory;
  amount: number;
  /** Human-readable breakdown of how `amount` was derived, for the "show the math" requirement (Section 6). */
  methodology: string;
  /** Raw hours this line represents, when the underlying math is time-based — omitted for lines that aren't (e.g. vacancy-cost lines). Presentation-only aggregate; never affects `amount`. */
  hours?: number;
}

/** A module's full computed output for one account + one statement period. */
export interface ModuleResult {
  moduleKey: string;
  moduleLabel: string;
  lineItems: RoiLineItem[];
  totalAnnualRoi: number;
}

/** Client-context fields that apply across every module (Section 5). */
export interface ClientContext {
  hrHourlyRate: number | null;
  costOfVacancyPerDay: number | null;
  platformCostPerYear: number | null;
}

/**
 * A self-contained module config: input schema, assumptions schema, and a
 * pure calculation function. Per Section 8, adding a new module later means
 * writing one new object that satisfies this interface — no changes to the
 * database shape or existing screens.
 */
export interface ModuleDefinition<
  TMetrics extends Record<string, number | null> = Record<string, number | null>,
  TAssumptions extends Record<string, number> = Record<string, number>,
> {
  key: string;
  label: string;
  description: string;

  metricsSchema: z.ZodType<TMetrics>;
  assumptionsSchema: z.ZodType<TAssumptions>;
  defaultAssumptions: TAssumptions;
  /** All-null-shaped metrics, used when an account has no snapshot yet for a period. */
  emptyMetrics: TMetrics;

  /** Field-level metadata used to render manual-entry forms and CSV mapping notes. */
  metricFields: ModuleMetricField[];
  assumptionFields: ModuleAssumptionField[];

  calculate(params: {
    /** Previous period's metrics — used for delta-based lines (e.g. days-reduced-in-time-to-fill), never for volume-based lines. */
    baseline: TMetrics;
    /** Current period's metrics — drives every volume-based line. */
    current: TMetrics;
    assumptions: TAssumptions;
    context: ClientContext;
  }): ModuleResult;
}

export interface ModuleMetricField {
  key: string;
  label: string;
  /** Where this field's value can come from today. */
  sources: Array<"MANUAL" | "CSV_CATALYST" | "GONG">;
  notes?: string;
}

export interface ModuleAssumptionField {
  key: string;
  label: string;
  unit: string;
}
