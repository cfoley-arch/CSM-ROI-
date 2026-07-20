import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarBlank,
  CurrencyDollar,
  Minus,
  Sparkle,
  TrendDown,
  TrendUp,
} from "@phosphor-icons/react/dist/ssr";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { calculateGrandTotal, getModule } from "@/lib/modules/registry";
import { computeNetRoi } from "@/lib/modules/netRoi";
import { resolveModuleResultForAccount } from "@/lib/modules/resolve";
import type { ClientContext, ModuleResult } from "@/lib/modules/types";
import { ROI_CATEGORY_STYLE } from "@/components/roiCategoryStyles";
import { Wordmark } from "@/components/Wordmark";

/**
 * The "Value Review" statement (Section 6): total cost of ownership,
 * measurable outcomes (usage deltas), financial translation (the math),
 * and the ROI verdict — in that order, so a CSM's champion can defend the
 * number to their own CFO without the CSM in the room.
 */
export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const account = await prisma.account.findFirst({
    where: { id, ownerId: session.user.id },
    include: { modules: true },
  });
  if (!account) notFound();

  const context: ClientContext = {
    hrHourlyRate: account.hrHourlyRate,
    costOfVacancyPerDay: account.costOfVacancyPerDay,
    platformCostPerYear: account.platformCostPerYear,
  };

  const activeModules = account.modules.filter((m) => m.isActive);
  const moduleResults: ModuleResult[] = [];
  const outcomesByModule: Array<{
    moduleKey: string;
    moduleLabel: string;
    baselineCapturedAt: Date | null;
    currentCapturedAt: Date | null;
    rows: Array<{ key: string; label: string; baseline: number | null; current: number | null }>;
  }> = [];

  for (const accountModule of activeModules) {
    const resolved = await resolveModuleResultForAccount({
      accountId: account.id,
      moduleKey: accountModule.moduleKey,
      context,
      configOverrides: (accountModule.config as Record<string, unknown>) ?? {},
    });
    moduleResults.push(resolved.result);

    const mod = getModule(accountModule.moduleKey);
    outcomesByModule.push({
      moduleKey: accountModule.moduleKey,
      moduleLabel: mod.label,
      baselineCapturedAt: resolved.baselineCapturedAt,
      currentCapturedAt: resolved.currentCapturedAt,
      rows: mod.metricFields.map((field) => ({
        key: field.key,
        label: field.label,
        baseline: resolved.baseline[field.key],
        current: resolved.current[field.key],
      })),
    });
  }

  const grandTotal = calculateGrandTotal(moduleResults);
  const net = computeNetRoi(grandTotal.totalAnnualRoi, account.platformCostPerYear);

  const allCapturedDates = outcomesByModule.flatMap((o) => [o.baselineCapturedAt, o.currentCapturedAt]).filter(
    (d): d is Date => d !== null,
  );
  const periodLabel =
    allCapturedDates.length > 0
      ? `${formatDate(new Date(Math.min(...allCapturedDates.map((d) => d.getTime()))))} — ${formatDate(
          new Date(Math.max(...allCapturedDates.map((d) => d.getTime()))),
        )}`
      : "No dated usage data yet";

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <Link href="/accounts" className="inline-flex items-center gap-1 text-sm text-cc-steel hover:text-cc-cast-iron">
        <ArrowLeft size={14} /> All accounts
      </Link>

      <header className="mt-6 mb-10 flex items-start justify-between border-b border-cc-brass/40 pb-6">
        <div>
          <Wordmark />
          <h1 className="font-display text-4xl mt-3">{account.name}</h1>
          <p className="text-cc-steel mt-1">{account.industry ?? "Industry not set"}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-cc-steel">
            <CalendarBlank size={14} /> Statement period: {periodLabel}
          </p>
        </div>
      </header>

      {/* 1. Total cost of ownership */}
      <section className="mb-10">
        <h2 className="font-display text-xl mb-3">Total cost of ownership</h2>
        <div className="rounded-lg bg-cc-platinum p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-cc-steel">ClearCo platform cost (this period)</span>
            <span className="font-display text-2xl">
              {account.platformCostPerYear !== null ? formatCurrency(account.platformCostPerYear) : "not set"}
            </span>
          </div>
          {account.platformCostPerYear === null && (
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
                  const delta =
                    row.baseline !== null && row.current !== null ? row.current - row.baseline : null;
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
        {moduleResults.map((result) => (
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
                        <span className={`text-xs px-2 py-0.5 rounded-full ${style.bg} ${style.fg}`}>
                          {style.label}
                        </span>
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
          <span className="font-display text-5xl text-cc-alloy">{formatCurrency(grandTotal.totalAnnualRoi)}</span>
        </div>
        <p className="text-cc-pewter mt-1">Total measured value delivered (gross)</p>

        <div className="mt-5 pt-5 border-t border-white/15 flex items-baseline justify-between">
          <span className="text-cc-pewter">Net of platform cost</span>
          <span className="font-display text-2xl">
            {net.netAnnualRoi !== null ? formatCurrency(net.netAnnualRoi) : "set platform cost to calculate"}
          </span>
        </div>
      </section>
    </main>
  );
}
