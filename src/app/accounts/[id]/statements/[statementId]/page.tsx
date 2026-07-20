import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, LockSimple, Sparkle, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { formatDate } from "@/lib/format";
import { primaryButtonClass, secondaryLinkClass } from "@/components/formStyles";
import { StatementView } from "@/components/StatementView";
import { getModule } from "@/lib/modules/registry";
import type { OutcomeModule, StatementResolvedInputs, StatementResults } from "@/lib/modules/accountStatement";
import type { Narrative } from "@/lib/narrative/generateNarrative";
import { generateNarrativeAction } from "./actions";

export default async function SavedStatementPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; statementId: string }>;
  searchParams: Promise<{ narrativeError?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id, statementId } = await params;
  const { narrativeError } = await searchParams;
  const statement = await prisma.roiStatement.findFirst({
    where: { id: statementId, accountId: id, account: { ownerId: session.user.id } },
    include: { account: true, createdBy: true },
  });
  if (!statement) notFound();

  const resolvedInputs = statement.resolvedInputs as unknown as StatementResolvedInputs;
  const results = statement.results as unknown as StatementResults;
  const narrative = statement.narrative as unknown as Narrative | null;

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

      {/* AI-generated narrative (Section 6) — QBR email draft + talk track, powered server-side by the Anthropic API */}
      <section className="mt-10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkle size={16} className="text-cc-copper" weight="fill" />
          <h2 className="font-display text-xl">AI-generated narrative</h2>
        </div>

        {narrativeError && (
          <div className="flex items-start gap-2 text-sm text-cc-bronze bg-cc-white-gold/60 rounded-md px-3 py-2 mb-4">
            <WarningCircle size={16} className="mt-0.5 shrink-0" />
            <span>Couldn&apos;t generate narrative: {narrativeError}</span>
          </div>
        )}

        {narrative ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-cc-cast-iron text-cc-white p-5">
              <p className="text-xs uppercase tracking-wide text-cc-alloy mb-2">Talk track</p>
              <p className="text-lg font-display leading-snug">{narrative.talkTrack}</p>
            </div>
            <div className="rounded-lg bg-cc-platinum p-5">
              <p className="text-xs uppercase tracking-wide text-cc-steel mb-2">QBR email draft</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{narrative.qbrEmail}</p>
            </div>
            <form action={generateNarrativeAction}>
              <input type="hidden" name="statementId" value={statement.id} />
              <button type="submit" className="text-sm text-cc-steel hover:text-cc-cast-iron">
                Regenerate
              </button>
            </form>
          </div>
        ) : (
          <form action={generateNarrativeAction}>
            <input type="hidden" name="statementId" value={statement.id} />
            <p className="text-sm text-cc-steel mb-3">
              Generate a QBR email draft and a spoken talk track from this statement&apos;s numbers.
            </p>
            <button type="submit" className={primaryButtonClass}>
              Generate QBR narrative
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
