import type { ReactNode } from "react";
import { CalendarBlank, CurrencyDollar, Minus, Sparkle, TrendDown, TrendUp } from "@phosphor-icons/react/dist/ssr";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { OutcomeModule } from "@/lib/modules/accountStatement";
import { ROI_CATEGORIES, type ModuleResult, type RoiCategory } from "@/lib/modules/types";
import { ROI_CATEGORY_STYLE } from "./roiCategoryStyles";
import { Wordmark } from "./Wordmark";

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
  totalAnnualRoi,
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
            <h3 className="text-sm font-semibold text-cc-steel mb-2">{result.moduleLabel}</h3>
            <table className="w-full text-sm border-collapse">
              <tbody>
                {result.lineItems.map((item) => {
                  const style = ROI_CATEGORY_STYLE[item.category];
                  return (
                    <tr key={item.key} className="border-b border-cc-brass/15 align-top">
                      <td className="py-2 pr-3">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-cc-steel mt-0.5">{item.methodology}</div>
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${style.bg} ${style.fg}`}>{style.label}</span>
                      </td>
                      <td className="py-2 text-right whitespace-nowrap font-medium">{formatCurrency(item.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-right font-semibold mt-2">
              {result.moduleLabel} subtotal: {formatCurrency(result.totalAnnualRoi)}
            </p>
          </div>
        ))}
      </section>

      {/* 4. ROI verdict */}
      <section className="rounded-xl bg-cc-cast-iron text-cc-white p-8">
        <div className="flex items-center gap-2 text-cc-copper text-sm font-semibold uppercase tracking-wide">
          <Sparkle size={16} weight="fill" /> ROI verdict
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <CurrencyDollar size={28} className="text-cc-alloy" />
          <span className="font-display text-5xl text-cc-alloy">{formatCurrency(totalAnnualRoi)}</span>
        </div>
        <p className="text-cc-pewter mt-1">Total measured value delivered (gross)</p>

        <div className="mt-5 pt-5 border-t border-white/15 flex items-baseline justify-between">
          <span className="text-cc-pewter">Net of platform cost</span>
          <span className="font-display text-2xl">
            {net.netAnnualRoi !== null ? formatCurrency(net.netAnnualRoi) : "set platform cost to calculate"}
          </span>
        </div>
      </section>
    </>
  );
}
