import type { ReactNode } from "react";
import {
  Buildings,
  CalendarBlank,
  ChartLineUp,
  Clock,
  Coins,
  CurrencyDollar,
  Minus,
  Percent,
  Sparkle,
  TrendDown,
  TrendUp,
  Wallet,
} from "@phosphor-icons/react/dist/ssr";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { OutcomeModule } from "@/lib/modules/accountStatement";
import { ROI_CATEGORIES, type ModuleResult, type RoiCategory } from "@/lib/modules/types";
import { ROI_CATEGORY_STYLE } from "./roiCategoryStyles";
import { Wordmark } from "./Wordmark";

/** A phosphor-icons component — every icon in the set shares this prop shape. */
type PhosphorIcon = typeof Sparkle;

/** Icon per ROI category for the Financial Translation cards: clock for time-based, building for the (currently vacancy-only) cost-avoided line, dollar sign as the general cost/value fallback. */
const CATEGORY_ICON: Record<RoiCategory, PhosphorIcon> = {
  TIME_SAVED: Clock,
  COST_AVOIDED: Buildings,
  REVENUE_ENABLED: CurrencyDollar,
  RISK_REDUCED: CurrencyDollar,
};

function ScorecardCard({
  icon: Icon,
  label,
  value,
  description,
  emphasized,
}: {
  icon: PhosphorIcon;
  label: string;
  value: string;
  description: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className={
        emphasized
          ? "rounded-lg p-4 bg-gradient-to-br from-cc-cast-iron to-cc-bronze text-cc-white"
          : "rounded-lg p-4 bg-cc-platinum"
      }
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-xs font-semibold uppercase tracking-wide ${emphasized ? "text-cc-copper" : "text-cc-steel"}`}
        >
          {label}
        </span>
        <Icon size={18} className={emphasized ? "text-cc-copper" : "text-cc-steel"} />
      </div>
      <div className="font-display text-2xl mt-2">{value}</div>
      <p className={`text-xs mt-1 ${emphasized ? "text-cc-pewter" : "text-cc-steel"}`}>{description}</p>
    </div>
  );
}

export interface StatementViewProps {
  accountName: string;
  industry: string | null;
  periodLabel: string;
  platformCostPerYear: number | null;
  outcomesByModule: OutcomeModule[];
  moduleResults: ModuleResult[];
  totalAnnualRoi: number;
  net: { netAnnualRoi: number | null; platformCostPerYear: number | null };
  /** Header-right links — present on the live preview, absent on saved statements. */
  headerActions?: ReactNode;
  /** e.g. "Saved Jul 20, 2026 by Colin Foley" on a saved statement, or a "Save this statement" button on the live preview. */
  banner?: ReactNode;
  /**
   * Section 7's persona-aware framing: which ROI categories to lead with in
   * the Financial Translation section. Presentation only — reorders each
   * module's line items, never recomputes them. Defaults to the natural
   * (module-defined) order when omitted.
   */
  categoryOrder?: RoiCategory[];
  /** e.g. a "Framed for: CHRO" chip row, rendered just under the header. */
  personaSummary?: ReactNode;
}

/**
 * The "Value Review" statement (Section 6): total cost of ownership,
 * measurable outcomes (usage deltas), financial translation (the math),
 * and the ROI verdict — in that order, so a CSM's champion can defend the
 * number to their own CFO without the CSM in the room.
 *
 * Purely presentational — the live preview and a saved (frozen)
 * RoiStatement both render through this same component, from either
 * live-computed or persisted data.
 */
export function StatementView({
  accountName,
  industry,
  periodLabel,
  platformCostPerYear,
  outcomesByModule,
  moduleResults,
  net,
  headerActions,
  banner,
  categoryOrder,
  personaSummary,
}: StatementViewProps) {
  const order = categoryOrder ?? ROI_CATEGORIES;
  const categoryRank = new Map<RoiCategory, number>(order.map((category, i) => [category, i]));
  const orderedModuleResults = moduleResults.map((result) => ({
    ...result,
    lineItems: [...result.lineItems].sort(
      (a, b) => (categoryRank.get(a.category) ?? 99) - (categoryRank.get(b.category) ?? 99),
    ),
  }));

  // ROI verdict scorecard aggregates — presentation-only rollups of the same
  // per-line-item amounts already computed above; never recomputed here.
  const allLineItems = orderedModuleResults.flatMap((result) => result.lineItems);
  const totalHoursSaved = allLineItems.reduce((sum, item) => sum + (item.hours ?? 0), 0);
  const laborValueCreated = allLineItems
    .filter((item) => item.category === "TIME_SAVED")
    .reduce((sum, item) => sum + item.amount, 0);
  const vacancyCostAvoided = allLineItems
    .filter((item) => item.category === "COST_AVOIDED")
    .reduce((sum, item) => sum + item.amount, 0);
  const totalValueCreated = laborValueCreated + vacancyCostAvoided;
  const roiMultiple = platformCostPerYear ? totalValueCreated / platformCostPerYear : null;
  const roiPercentage = platformCostPerYear && net.netAnnualRoi !== null ? (net.netAnnualRoi / platformCostPerYear) * 100 : null;

  return (
    <>
      <header className="mt-6 mb-6 flex items-start justify-between border-b border-cc-brass/40 pb-6">
        <div>
          <Wordmark />
          <h1 className="font-display text-4xl mt-3">{accountName}</h1>
          <p className="text-cc-steel mt-1">{industry ?? "Industry not set"}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-cc-steel">
            <CalendarBlank size={14} /> Statement period: {periodLabel}
          </p>
          {personaSummary}
        </div>
        {headerActions && <nav className="flex flex-col items-end gap-1.5 text-sm text-cc-steel">{headerActions}</nav>}
      </header>

      {banner && <div className="mb-8">{banner}</div>}

      {/* 1. Total cost of ownership */}
      <section className="mb-10">
        <h2 className="font-display text-xl mb-3">Total cost of ownership</h2>
        <div className="rounded-lg bg-cc-platinum p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-cc-steel">ClearCo platform cost (this period)</span>
            <span className="font-display text-2xl">
              {platformCostPerYear !== null ? formatCurrency(platformCostPerYear) : "not set"}
            </span>
          </div>
          {platformCostPerYear === null && (
            <p className="text-sm text-cc-bronze mt-2">
              Set the account&apos;s platform cost to see net ROI below instead of gross-only.
            </p>
          )}
        </div>
      </section>

      {/* 2. Measurable outcomes */}
      <section className="mb-10">
        <h2 className="font-display text-xl mb-3">Measurable outcomes</h2>
        {outcomesByModule.map((outcome) => (
          <div key={outcome.moduleKey} className="mb-4">
            <h3 className="text-sm font-semibold text-cc-steel mb-2">{outcome.moduleLabel}</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left border-b border-cc-brass/40 text-cc-steel">
                  <th className="py-1.5 font-normal">Metric</th>
                  <th className="py-1.5 font-normal text-right">Baseline</th>
                  <th className="py-1.5 font-normal text-right">Current</th>
                  <th className="py-1.5 font-normal text-right">Change</th>
                </tr>
              </thead>
              <tbody>
                {outcome.rows.map((row) => {
                  const delta = row.baseline !== null && row.current !== null ? row.current - row.baseline : null;
                  return (
                    <tr key={row.key} className="border-b border-cc-brass/15">
                      <td className="py-1.5">{row.label}</td>
                      <td className="py-1.5 text-right text-cc-steel">
                        {row.baseline !== null ? formatNumber(row.baseline) : "—"}
                      </td>
                      <td className="py-1.5 text-right">{row.current !== null ? formatNumber(row.current) : "—"}</td>
                      <td className="py-1.5 text-right">
                        {delta === null ? (
                          <span className="text-cc-steel">—</span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 ${
                              delta > 0 ? "text-cc-verdigris" : delta < 0 ? "text-cc-bronze" : "text-cc-steel"
                            }`}
                          >
                            {delta > 0 ? <TrendUp size={13} /> : delta < 0 ? <TrendDown size={13} /> : <Minus size={13} />}
                            {formatNumber(Math.abs(delta))}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
        {outcomesByModule.length === 0 && <p className="text-cc-steel">No active modules for this account yet.</p>}
      </section>

      {/* 3. Financial translation */}
      <section className="mb-10">
        <h2 className="font-display text-xl mb-3">Financial translation</h2>
        {orderedModuleResults.map((result) => (
          <div key={result.moduleKey} className="mb-6">
            <h3 className="text-sm font-semibold text-cc-steel mb-3">{result.moduleLabel}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {result.lineItems.map((item) => {
                const style = ROI_CATEGORY_STYLE[item.category];
                const Icon = CATEGORY_ICON[item.category];
                return (
                  <div key={item.key} className={`rounded-lg p-4 ${style.bg}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-cc-steel">{item.label}</div>
                        <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-white/60 ${style.fg}`}>
                          {style.label}
                        </span>
                      </div>
                      <Icon size={18} className={style.fg} />
                    </div>
                    <div className="font-display text-2xl mt-3">{formatCurrency(item.amount)}</div>
                    <p className="text-xs text-cc-steel mt-1">{item.methodology}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-right font-semibold mt-3">
              {result.moduleLabel} subtotal: {formatCurrency(result.totalAnnualRoi)}
            </p>
          </div>
        ))}
      </section>

      {/* 4. ROI verdict scorecard */}
      <section>
        <h2 className="font-display text-xl mb-3">ROI verdict</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ScorecardCard
            icon={Clock}
            label="Total hours saved"
            value={`${formatNumber(Math.round(totalHoursSaved * 10) / 10)} hrs`}
            description="Admin time returned to the team"
          />
          <ScorecardCard
            icon={CurrencyDollar}
            label="Labor value created"
            value={formatCurrency(laborValueCreated)}
            description="Dollarized time savings"
          />
          <ScorecardCard
            icon={Buildings}
            label="Vacancy cost avoided"
            value={formatCurrency(vacancyCostAvoided)}
            description="From faster time-to-fill"
          />
          <ScorecardCard
            icon={Wallet}
            label="ClearCo cost"
            value={platformCostPerYear !== null ? formatCurrency(platformCostPerYear) : "not set"}
            description="Platform cost for the period"
          />
          <ScorecardCard
            icon={Coins}
            label="Total value created"
            value={formatCurrency(totalValueCreated)}
            description="Labor value + vacancy cost avoided"
          />
          <ScorecardCard
            icon={Sparkle}
            label="Net ROI"
            value={net.netAnnualRoi !== null ? formatCurrency(net.netAnnualRoi) : formatCurrency(totalValueCreated)}
            description={net.netAnnualRoi !== null ? "Total value minus ClearCo cost" : "Gross only — set ClearCo cost for net"}
            emphasized
          />
          <ScorecardCard
            icon={ChartLineUp}
            label="ROI multiple"
            value={roiMultiple !== null ? `${roiMultiple.toFixed(1)}×` : "—"}
            description="Value per dollar spent"
          />
          <ScorecardCard
            icon={Percent}
            label="ROI percentage"
            value={roiPercentage !== null ? `${roiPercentage.toFixed(0)}%` : "—"}
            description="Net return on platform spend"
          />
        </div>
      </section>
    </>
  );
}
