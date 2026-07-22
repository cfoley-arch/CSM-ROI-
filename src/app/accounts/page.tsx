import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db/client";
import { formatDate } from "@/lib/format";
import { Wordmark } from "@/components/Wordmark";

export default async function AccountsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const accounts = await prisma.account.findMany({
    where: { ownerId: session.user.id },
    orderBy: { name: "asc" },
    include: { modules: true },
  });

  // Batch-fetch saved-statement existence and last-data-update timestamps for
  // the whole list in three grouped queries (independent of account count)
  // instead of one query per row.
  const accountIds = accounts.map((a) => a.id);
  const [statementRows, snapshotMaxRows, moduleMaxRows] = await Promise.all([
    prisma.roiStatement.findMany({
      where: { accountId: { in: accountIds } },
      select: { accountId: true },
      distinct: ["accountId"],
    }),
    prisma.metricSnapshot.groupBy({
      by: ["accountId"],
      where: { accountId: { in: accountIds } },
      _max: { createdAt: true },
    }),
    prisma.accountModule.groupBy({
      by: ["accountId"],
      where: { accountId: { in: accountIds } },
      _max: { updatedAt: true },
    }),
  ]);

  const savedAccountIds = new Set(statementRows.map((r) => r.accountId));
  const lastSnapshotByAccount = new Map(snapshotMaxRows.map((r) => [r.accountId, r._max.createdAt]));
  const lastModuleByAccount = new Map(moduleMaxRows.map((r) => [r.accountId, r._max.updatedAt]));

  function lastDataUpdate(account: (typeof accounts)[number]): Date | null {
    // Account.updatedAt is set at creation too, so only count it as a real
    // "financials updated" signal once it's actually moved past createdAt.
    const financialsUpdatedAt =
      account.updatedAt.getTime() !== account.createdAt.getTime() ? account.updatedAt : null;
    const candidates = [
      financialsUpdatedAt,
      lastSnapshotByAccount.get(account.id) ?? null,
      lastModuleByAccount.get(account.id) ?? null,
    ].filter((d): d is Date => d !== null);
    if (candidates.length === 0) return null;
    return new Date(Math.max(...candidates.map((d) => d.getTime())));
  }

  async function logoutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <Wordmark />
        <form action={logoutAction}>
          <button type="submit" className="text-sm text-cc-steel hover:text-cc-cast-iron">
            Sign out
          </button>
        </form>
      </div>

      <div className="flex items-center justify-between gap-4 mb-1">
        <h1 className="font-display text-3xl">Accounts</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/accounts/import"
            className="rounded-md border border-cc-cast-iron text-cc-cast-iron py-1.5 px-3 text-sm font-medium hover:bg-cc-platinum transition-colors"
          >
            Import CSV
          </Link>
          <Link
            href="/accounts/new"
            className="rounded-md bg-cc-cast-iron text-cc-white py-1.5 px-3 text-sm font-medium hover:bg-cc-bronze transition-colors"
          >
            + New account
          </Link>
        </div>
      </div>
      <p className="text-cc-steel mb-6">
        {accounts.length} accounts owned by {session.user.name ?? session.user.email}
      </p>

      <ul className="divide-y divide-cc-brass/30 rounded-lg border border-cc-brass/30">
        {accounts.map((account) => {
          const isSaved = savedAccountIds.has(account.id);
          const lastUpdated = lastDataUpdate(account);
          return (
            <li key={account.id}>
              <Link
                href={`/accounts/${account.id}`}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 hover:bg-cc-platinum"
              >
                <span className="font-medium">{account.name}</span>
                <span className="hidden sm:inline text-sm text-cc-steel">
                  {account.industry ?? "Industry unknown"} —{" "}
                  {account.modules.filter((m) => m.isActive).map((m) => m.moduleKey).join(", ") || "no active modules"}
                </span>
                <span className="ml-auto sm:ml-0 flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isSaved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {isSaved ? "Saved" : "Not saved yet"}
                  </span>
                  <span className="text-xs text-cc-steel whitespace-nowrap">
                    {lastUpdated ? `Updated ${formatDate(lastUpdated)}` : "No data yet"}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
