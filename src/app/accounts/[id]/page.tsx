import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { computeLiveStatement } from "@/lib/modules/accountStatement";
import { StatementView } from "@/components/StatementView";
import { primaryButtonClass, secondaryLinkClass } from "@/components/formStyles";
import { mergedCategoryOrder, PERSONAS } from "@/lib/personas";
import { generateStatement } from "../actions";

export default async function AccountDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ persona?: string | string[] }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const { persona } = await searchParams;
  const selectedPersonas = persona === undefined ? [] : Array.isArray(persona) ? persona : [persona];

  const account = await prisma.account.findFirst({
    where: { id, ownerId: session.user.id },
    include: { modules: true },
  });
  if (!account) notFound();

  const live = await computeLiveStatement(account);

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <Link href="/accounts" className={`inline-flex items-center gap-1 ${secondaryLinkClass}`}>
        <ArrowLeft size={14} /> All accounts
      </Link>

      {/* Section 7: persona-aware framing — doesn't change the math, just which categories lead */}
      <div className="mt-6 rounded-lg border border-cc-brass/30 p-4">
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-cc-steel mb-2">
          <UsersThree size={15} /> Statement audience (optional)
        </p>
        <form method="get" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {PERSONAS.map((p) => (
            <label key={p.key} className="inline-flex items-center gap-1.5 text-sm">
              <input type="checkbox" name="persona" value={p.key} defaultChecked={selectedPersonas.includes(p.key)} />
              {p.label}
            </label>
          ))}
          <button type="submit" className="text-sm text-cc-copper hover:underline">
            Preview framing
          </button>
        </form>
      </div>

      <StatementView
        accountName={account.name}
        industry={account.industry}
        periodLabel={live.periodLabel}
        platformCostPerYear={account.platformCostPerYear}
        outcomesByModule={live.outcomesByModule}
        moduleResults={live.moduleResults}
        totalAnnualRoi={live.totalAnnualRoi}
        net={live.net}
        categoryOrder={mergedCategoryOrder(selectedPersonas)}
        personaSummary={
          selectedPersonas.length > 0 ? (
            <p className="mt-2 text-sm text-cc-copper">
              Framed for: {selectedPersonas.map((key) => PERSONAS.find((p) => p.key === key)?.label ?? key).join(", ")}
            </p>
          ) : undefined
        }
        headerActions={
          <>
            <Link href={`/accounts/${account.id}/edit`} className="hover:text-cc-cast-iron">
              Edit account
            </Link>
            <Link href={`/accounts/${account.id}/ats/entry`} className="hover:text-cc-cast-iron">
              Log ATS usage
            </Link>
            <Link href={`/accounts/${account.id}/ats/assumptions`} className="hover:text-cc-cast-iron">
              Edit ATS assumptions
            </Link>
            <Link href={`/accounts/${account.id}/statements`} className="hover:text-cc-cast-iron">
              Statement history
            </Link>
          </>
        }
      />

      <form action={generateStatement} className="mt-6 flex items-center justify-between">
        <input type="hidden" name="accountId" value={account.id} />
        {selectedPersonas.map((key) => (
          <input key={key} type="hidden" name="persona" value={key} />
        ))}
        <p className="text-sm text-cc-steel">
          This is a live preview — it recalculates as data changes. Save it to freeze exactly this version for a QBR.
        </p>
        <button type="submit" className={`${primaryButtonClass} shrink-0 ml-4`}>
          Save this statement
        </button>
      </form>
    </main>
  );
}
