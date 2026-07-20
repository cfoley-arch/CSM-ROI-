import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db/client";

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
    <main style={{ maxWidth: 720, margin: "40px auto", fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1>Accounts</h1>
        <form action={logoutAction}>
          <button type="submit">Sign out</button>
        </form>
      </div>
      <p>{accounts.length} accounts owned by {session.user.name ?? session.user.email}</p>
      <ul>
        {accounts.map((account) => (
          <li key={account.id} style={{ marginBottom: 8 }}>
            <Link href={`/accounts/${account.id}`}>{account.name}</Link>{" "}
            <span style={{ color: "#666" }}>
              — {account.industry ?? "Industry unknown"} —{" "}
              {account.modules.filter((m) => m.isActive).map((m) => m.moduleKey).join(", ") || "no active modules"}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
