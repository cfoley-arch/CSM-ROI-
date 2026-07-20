import { prisma } from "@/lib/db/client";
import { getModule } from "./registry";
import type { ClientContext, ModuleResult } from "./types";

/**
 * Loads an account's two most recent snapshots for a module (current +
 * baseline, per Section 5's "the app becomes the timeline" solve) and runs
 * the module's calc engine against them.
 */
export async function resolveModuleResultForAccount(params: {
  accountId: string;
  moduleKey: string;
  context: ClientContext;
  configOverrides?: Record<string, unknown>;
}): Promise<{
  result: ModuleResult;
  baselineSnapshotId: string | null;
  currentSnapshotId: string | null;
}> {
  const mod = getModule(params.moduleKey);

  const snapshots = await prisma.metricSnapshot.findMany({
    where: { accountId: params.accountId, moduleKey: params.moduleKey },
    orderBy: { capturedAt: "desc" },
    take: 2,
  });

  const [currentSnap, baselineSnap] = snapshots;

  const current = currentSnap ? mod.metricsSchema.parse(currentSnap.metrics) : mod.emptyMetrics;
  const baseline = baselineSnap ? mod.metricsSchema.parse(baselineSnap.metrics) : mod.emptyMetrics;

  const assumptions = mod.assumptionsSchema.parse({
    ...mod.defaultAssumptions,
    ...(params.configOverrides ?? {}),
  });

  const result = mod.calculate({ baseline, current, assumptions, context: params.context });

  return {
    result,
    baselineSnapshotId: baselineSnap?.id ?? null,
    currentSnapshotId: currentSnap?.id ?? null,
  };
}
