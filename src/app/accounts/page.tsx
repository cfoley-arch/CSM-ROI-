import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db/client";
import { Wordmark } from "@/components/Wordmark";

export default async function AccountsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const accounts = await prisma.account.findMany({
    where: { ownerId: session.user.id },
    orderBy: { name: "asc" },
    include: { modules: true },
  });

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

      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-3xl">Accounts</h1>
        <Link
          href="/accounts/new"
          className="rounded-md bg-cc-cast-iron text-cc-white py-1.5 px-3 text-sm font-medium hover:bg-cc-bronze transition-colors"
        >
          + New account
        </Link>
      </div>
      <p className="text-cc-steel mb-6">
        {accounts.length} accounts owned by {session.user.name ?? session.user.email}
      </p>

      <ul className="divide-y divide-cc-brass/30 rounded-lg border border-cc-brass/30">
        {accounts.map((account) => (
          <li key={account.id}>
            <Link href={`/accounts/${account.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-cc-platinum">
              <span className="font-medium">{account.name}</span>
              <span className="text-sm text-cc-steel">
                {account.industry ?? "Industry unknown"} —{" "}
                {account.modules.filter((m) => m.isActive).map((m) => m.moduleKey).join(", ") || "no active modules"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
