import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { calculateGrandTotal } from "@/lib/modules/registry";
import { resolveModuleResultForAccount } from "@/lib/modules/resolve";
import type { ClientContext, ModuleResult } from "@/lib/modules/types";

const currency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const account = await prisma.account.findFirst({
    where: { id, ownerId: session.user.id },
    include: { modules: true },
  });
  if (!account) notFound();

  const context: ClientContext = {
    hrHourlyRate: account.hrHourlyRate,
    costOfVacancyPerDay: account.costOfVacancyPerDay,
    platformCostPerYear: account.platformCostPerYear,
  };

  const activeModules = account.modules.filter((m) => m.isActive);
  const moduleResults: ModuleResult[] = [];

  for (const accountModule of activeModules) {
    const { result } = await resolveModuleResultForAccount({
      accountId: account.id,
      moduleKey: accountModule.moduleKey,
      context,
      configOverrides: (accountModule.config as Record<string, unknown>) ?? {},
    });
    moduleResults.push(result);
  }

  const grandTotal = calculateGrandTotal(moduleResults);

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", fontFamily: "system-ui" }}>
      <p>
        <Link href="/accounts">&larr; All accounts</Link>
      </p>
      <h1>{account.name}</h1>
      <p style={{ color: "#666" }}>{account.industry ?? "Industry unknown"}</p>

      <section style={{ margin: "24px 0", padding: 16, background: "#FAF8F5", borderRadius: 8 }}>
        <h3>Client context</h3>
        <ul>
          <li>HR hourly rate: {account.hrHourlyRate ? currency(account.hrHourlyRate) : "not set"}</li>
          <li>Cost of vacancy per day: {account.costOfVacancyPerDay ? currency(account.costOfVacancyPerDay) : "not set"}</li>
          <li>Platform cost per year: {account.platformCostPerYear ? currency(account.platformCostPerYear) : "not set"}</li>
        </ul>
        {(account.hrHourlyRate === null || account.costOfVacancyPerDay === null) && (
          <p style={{ color: "#a1613a" }}>
            Set the missing client-context fields above to see dollarized ROI instead of $0 placeholder lines.
          </p>
        )}
      </section>

      {moduleResults.length === 0 && <p>No active modules for this account yet.</p>}

      {moduleResults.map((result) => (
        <section key={result.moduleKey} style={{ margin: "24px 0" }}>
          <h2>{result.moduleLabel}</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
                <th>Line item</th>
                <th>Category</th>
                <th style={{ textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {result.lineItems.map((item) => (
                <tr key={item.key} style={{ borderBottom: "1px solid #eee" }}>
                  <td>
                    {item.label}
                    <div style={{ fontSize: 12, color: "#888" }}>{item.methodology}</div>
                  </td>
                  <td>{item.category.replace("_", " ")}</td>
                  <td style={{ textAlign: "right" }}>{currency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ textAlign: "right", fontWeight: "bold" }}>
            {result.moduleLabel} total: {currency(result.totalAnnualRoi)}
          </p>
        </section>
      ))}

      <section style={{ marginTop: 32, padding: 16, background: "#37352A", color: "#FFA680", borderRadius: 8 }}>
        <h2 style={{ margin: 0 }}>Total measured value delivered</h2>
        <p style={{ fontSize: 32, fontWeight: "bold", margin: "8px 0" }}>{currency(grandTotal.totalAnnualRoi)}</p>
      </section>
    </main>
  );
}
