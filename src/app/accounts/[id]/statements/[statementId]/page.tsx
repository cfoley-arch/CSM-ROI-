import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, LockSimple } from "@phosphor-icons/react/dist/ssr";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { formatDate } from "@/lib/format";
import { secondaryLinkClass } from "@/components/formStyles";
import { StatementView } from "@/components/StatementView";
import { getModule } from "@/lib/modules/registry";
import type { OutcomeModule, StatementResolvedInputs, StatementResults } from "@/lib/modules/accountStatement";

export default async function SavedStatementPage({
  params,
}: {
  params: Promise<{ id: string; statementId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id, statementId } = await params;
  const statement = await prisma.roiStatement.findFirst({
    where: { id: statementId, accountId: id, account: { ownerId: session.user.id } },
    include: { account: true, createdBy: true },
  });
  if (!statement) notFound();

  const resolvedInputs = statement.resolvedInputs as unknown as StatementResolvedInputs;
  const results = statement.results as unknown as StatementResults;

  const outcomesByModule: OutcomeModule[] = Object.entries(resolvedInputs.modules).map(([moduleKey, inputs]) => {
    const mod = getModule(moduleKey);
    return {
      moduleKey,
      moduleLabel: mod.label,
      rows: mod.metricFields.map((field) => ({
        key: field.key,
        label: field.label,
        baseline: inputs.baseline[field.key] ?? null,
        current: inputs.current[field.key] ?? null,
      })),
    };
  });

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <Link
        href={`/accounts/${statement.account.id}/statements`}
        className={`inline-flex items-center gap-1 ${secondaryLinkClass}`}
      >
        <ArrowLeft size={14} /> Statement history
      </Link>

      <StatementView
        accountName={statement.account.name}
        industry={statement.account.industry}
        periodLabel={statement.statementPeriodLabel ?? "Not recorded"}
        platformCostPerYear={results.net.platformCostPerYear}
        outcomesByModule={outcomesByModule}
        moduleResults={results.moduleResults}
        totalAnnualRoi={results.totalAnnualRoi}
        net={results.net}
        banner={
          <div className="flex items-center gap-2 text-sm text-cc-bronze bg-cc-white-gold/60 rounded-md px-3 py-2">
            <LockSimple size={14} />
            Saved statement — generated {formatDate(statement.createdAt)} by{" "}
            {statement.createdBy.name ?? statement.createdBy.email}. These numbers are frozen and won&apos;t change
            even if the account&apos;s live data changes later.
          </div>
        }
      />
    </main>
  );
}
