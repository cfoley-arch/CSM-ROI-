import { formatDate } from "@/lib/format";
import { calculateGrandTotal, getModule } from "./registry";
import { computeNetRoi } from "./netRoi";
import { resolveModuleResultForAccount } from "./resolve";
import type { ClientContext, ModuleResult } from "./types";

export interface OutcomeRow {
  key: string;
  label: string;
  baseline: number | null;
  current: number | null;
}

export interface OutcomeModule {
  moduleKey: string;
  moduleLabel: string;
  rows: OutcomeRow[];
}

export interface StatementNet {
  netAnnualRoi: number | null;
  platformCostPerYear: number | null;
}

export interface StatementModuleInputs {
  assumptions: Record<string, number>;
  baseline: Record<string, number | null>;
  current: Record<string, number | null>;
  baselineCapturedAt: string | null;
  currentCapturedAt: string | null;
}

export interface StatementResolvedInputs {
  context: ClientContext;
  modules: Record<string, StatementModuleInputs>;
}

export interface StatementResults {
  moduleResults: ModuleResult[];
  totalAnnualRoi: number;
  net: StatementNet;
}

export interface LiveStatement {
  outcomesByModule: OutcomeModule[];
  moduleResults: ModuleResult[];
  totalAnnualRoi: number;
  net: StatementNet;
  periodLabel: string;
  baselineSnapshotIds: Record<string, string | null>;
  currentSnapshotIds: Record<string, string | null>;
  resolvedInputs: StatementResolvedInputs;
}

type AccountForStatement = {
  id: string;
  hrHourlyRate: number | null;
  costOfVacancyPerDay: number | null;
  platformCostPerYear: number | null;
  modules: Array<{ moduleKey: string; isActive: boolean; config: unknown }>;
};

/**
 * Computes the ROI statement live, from whatever the account's current
 * snapshots and assumptions are right now. Both the live account-detail
 * preview and `generateStatement` (which freezes this into a RoiStatement
 * row) go through here, so "what you saved" always starts from exactly
 * "what you were looking at."
 */
export async function computeLiveStatement(account: AccountForStatement): Promise<LiveStatement> {
  const context: ClientContext = {
    hrHourlyRate: account.hrHourlyRate,
    costOfVacancyPerDay: account.costOfVacancyPerDay,
    platformCostPerYear: account.platformCostPerYear,
  };

  const activeModules = account.modules.filter((m) => m.isActive);
  const moduleResults: ModuleResult[] = [];
  const outcomesByModule: OutcomeModule[] = [];
  const baselineSnapshotIds: Record<string, string | null> = {};
  const currentSnapshotIds: Record<string, string | null> = {};
  const resolvedModules: Record<string, StatementModuleInputs> = {};
  const allCapturedDates: Date[] = [];

  for (const accountModule of activeModules) {
    const configOverrides = (accountModule.config as Record<string, unknown>) ?? {};
    const resolved = await resolveModuleResultForAccount({
      accountId: account.id,
      moduleKey: accountModule.moduleKey,
      context,
      configOverrides,
    });
    moduleResults.push(resolved.result);

    const mod = getModule(accountModule.moduleKey);
    outcomesByModule.push({
      moduleKey: accountModule.moduleKey,
      moduleLabel: mod.label,
      rows: mod.metricFields.map((field) => ({
        key: field.key,
        label: field.label,
        baseline: resolved.baseline[field.key],
        current: resolved.current[field.key],
      })),
    });

    baselineSnapshotIds[accountModule.moduleKey] = resolved.baselineSnapshotId;
    currentSnapshotIds[accountModule.moduleKey] = resolved.currentSnapshotId;
    resolvedModules[accountModule.moduleKey] = {
      assumptions: mod.assumptionsSchema.parse({ ...mod.defaultAssumptions, ...configOverrides }),
      baseline: resolved.baseline,
      current: resolved.current,
      baselineCapturedAt: resolved.baselineCapturedAt?.toISOString() ?? null,
      currentCapturedAt: resolved.currentCapturedAt?.toISOString() ?? null,
    };

    if (resolved.baselineCapturedAt) allCapturedDates.push(resolved.baselineCapturedAt);
    if (resolved.currentCapturedAt) allCapturedDates.push(resolved.currentCapturedAt);
  }

  const grandTotal = calculateGrandTotal(moduleResults);
  const net = computeNetRoi(grandTotal.totalAnnualRoi, account.platformCostPerYear);

  const periodLabel =
    allCapturedDates.length > 0
      ? `${formatDate(new Date(Math.min(...allCapturedDates.map((d) => d.getTime()))))} — ${formatDate(
          new Date(Math.max(...allCapturedDates.map((d) => d.getTime()))),
        )}`
      : "No dated usage data yet";

  return {
    outcomesByModule,
    moduleResults,
    totalAnnualRoi: grandTotal.totalAnnualRoi,
    net,
    periodLabel,
    baselineSnapshotIds,
    currentSnapshotIds,
    resolvedInputs: { context, modules: resolvedModules },
  };
}
