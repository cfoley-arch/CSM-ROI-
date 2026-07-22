import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { formatCurrency, formatDate } from "@/lib/format";
import { secondaryLinkClass } from "@/components/formStyles";
import type { StatementResults } from "@/lib/modules/accountStatement";

export default async function StatementHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const account = await prisma.account.findFirst({ where: { id, ownerId: session.user.id } });
  if (!account) notFound();

  const statements = await prisma.roiStatement.findMany({
    where: { accountId: account.id },
    orderBy: { createdAt: "desc" },
    include: { createdBy: true },
  });

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <Link href={`/accounts/${account.id}`} className={`inline-flex items-center gap-1 ${secondaryLinkClass}`}>
        <ArrowLeft size={14} /> {account.name}
      </Link>
      <h1 className="font-display text-3xl mt-4 mb-1">Statement history</h1>
      <p className="text-cc-steel mb-6">
        Saved, point-in-time versions of this account&apos;s ROI statement — each one is frozen at the numbers
        shown when it was saved.
      </p>

      {statements.length === 0 && (
        <p className="text-cc-steel">
          No statements saved yet. From the account page, use &quot;Save this statement&quot; to create one.
        </p>
      )}

      <ul className="divide-y divide-cc-brass/30 rounded-lg border border-cc-brass/30">
        {statements.map((statement) => {
          const results = statement.results as unknown as StatementResults;
          return (
            <li key={statement.id}>
              <Link
                href={`/accounts/${account.id}/statements/${statement.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-cc-platinum"
              >
                <span>
                  <span className="font-medium">{formatDate(statement.createdAt)}</span>
                  <span className="text-sm text-cc-steel ml-2">
                    by {statement.createdBy.name ?? statement.createdBy.email}
                  </span>
                  {statement.statementPeriodLabel && (
                    <span className="block text-xs text-cc-steel mt-0.5">
                      Period: {statement.statementPeriodLabel}
                    </span>
                  )}
                </span>
                <span className="font-display text-lg">{formatCurrency(results.totalAnnualRoi)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
