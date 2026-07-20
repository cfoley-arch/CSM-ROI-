import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { computeLiveStatement } from "@/lib/modules/accountStatement";
import { StatementView } from "@/components/StatementView";
import { primaryButtonClass, secondaryLinkClass } from "@/components/formStyles";
import { generateStatement } from "../actions";

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
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

      <StatementView
        accountName={account.name}
        industry={account.industry}
        periodLabel={live.periodLabel}
        platformCostPerYear={account.platformCostPerYear}
        outcomesByModule={live.outcomesByModule}
        moduleResults={live.moduleResults}
        totalAnnualRoi={live.totalAnnualRoi}
        net={live.net}
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
