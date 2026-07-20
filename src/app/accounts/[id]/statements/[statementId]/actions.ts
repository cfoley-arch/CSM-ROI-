"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import type { StatementResults } from "@/lib/modules/accountStatement";
import { generateNarrative } from "@/lib/narrative/generateNarrative";

/**
 * Generates the QBR email + talk track for a saved statement (Section 6,
 * resolved "yes" for v1 in Section 9 #9) and persists it to
 * RoiStatement.narrative. Never throws to the caller — any failure
 * (missing API key, rate limit, etc.) redirects back with a query param the
 * page renders as a banner, so a narrative-generation problem never takes
 * down the statement view itself.
 */
export async function generateNarrativeAction(formData: FormData) {
  const statementId = formData.get("statementId");
  if (typeof statementId !== "string") throw new Error("Missing statementId.");

  const session = await auth();
  if (!session?.user) redirect("/login");

  const statement = await prisma.roiStatement.findFirst({
    where: { id: statementId, account: { ownerId: session.user.id } },
    include: { account: true },
  });
  if (!statement) throw new Error("Statement not found, or not owned by the current user.");

  const results = statement.results as unknown as StatementResults;

  let errorMessage: string | null = null;
  try {
    const narrative = await generateNarrative({
      accountName: statement.account.name,
      industry: statement.account.industry,
      periodLabel: statement.statementPeriodLabel ?? "this period",
      results,
    });

    await prisma.roiStatement.update({
      where: { id: statement.id },
      data: { narrative: JSON.parse(JSON.stringify(narrative)) },
    });
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Unknown error generating narrative.";
  }

  const base = `/accounts/${statement.accountId}/statements/${statement.id}`;
  redirect(errorMessage ? `${base}?narrativeError=${encodeURIComponent(errorMessage)}` : base);
}

/**
 * Retags a saved statement's audience persona(s) (Section 7 / Section 9
 * #10). Presentation only — this never touches resolvedInputs or results,
 * so the frozen numbers stay exactly as generated; only which categories
 * the Financial Translation section leads with changes.
 */
export async function updatePersonaTagsAction(formData: FormData) {
  const statementId = formData.get("statementId");
  if (typeof statementId !== "string") throw new Error("Missing statementId.");

  const session = await auth();
  if (!session?.user) redirect("/login");

  const statement = await prisma.roiStatement.findFirst({
    where: { id: statementId, account: { ownerId: session.user.id } },
  });
  if (!statement) throw new Error("Statement not found, or not owned by the current user.");

  const personaTags = formData.getAll("persona").filter((v): v is string => typeof v === "string");

  await prisma.roiStatement.update({
    where: { id: statement.id },
    data: { personaTags: personaTags.length > 0 ? personaTags : [] },
  });

  redirect(`/accounts/${statement.accountId}/statements/${statement.id}`);
}
