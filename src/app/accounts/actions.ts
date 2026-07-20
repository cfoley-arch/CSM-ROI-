"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { parseFormNumber, parseFormString } from "@/lib/forms";
import { ATS_ACTIONS } from "@/lib/modules/ats/actions";
import { ATS_DEFAULT_ASSUMPTIONS } from "@/lib/modules/ats/defaults";

async function requireOwnedAccount(accountId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not signed in.");

  const account = await prisma.account.findFirst({
    where: { id: accountId, ownerId: session.user.id },
  });
  if (!account) throw new Error("Account not found, or not owned by the current user.");

  return { session, account };
}

export async function createAccount(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not signed in.");

  const name = parseFormString(formData.get("name"));
  if (!name) throw new Error("Account name is required.");

  const account = await prisma.account.create({
    data: {
      name,
      industry: parseFormString(formData.get("industry")),
      website: parseFormString(formData.get("website")),
      ownerId: session.user.id,
    },
  });

  redirect(`/accounts/${account.id}`);
}

export async function updateAccountContext(formData: FormData) {
  const accountId = formData.get("accountId");
  if (typeof accountId !== "string") throw new Error("Missing accountId.");
  const { account } = await requireOwnedAccount(accountId);

  await prisma.account.update({
    where: { id: account.id },
    data: {
      name: parseFormString(formData.get("name")) ?? account.name,
      industry: parseFormString(formData.get("industry")),
      website: parseFormString(formData.get("website")),
      hrHourlyRate: parseFormNumber(formData.get("hrHourlyRate")),
      costOfVacancyPerDay: parseFormNumber(formData.get("costOfVacancyPerDay")),
      platformCostPerYear: parseFormNumber(formData.get("platformCostPerYear")),
    },
  });

  redirect(`/accounts/${account.id}`);
}

/** Manual-entry ATS usage snapshot — auto-activates the ATS module if it wasn't already. */
export async function saveAtsSnapshot(formData: FormData) {
  const accountId = formData.get("accountId");
  if (typeof accountId !== "string") throw new Error("Missing accountId.");
  const { account } = await requireOwnedAccount(accountId);

  const capturedAtRaw = parseFormString(formData.get("capturedAt"));
  const capturedAt = capturedAtRaw ? new Date(capturedAtRaw) : new Date();

  const metrics = {
    textsSent: parseFormNumber(formData.get("textsSent")),
    emailsSentAutomated: parseFormNumber(formData.get("emailsSentAutomated")),
    interviewsScheduled: parseFormNumber(formData.get("interviewsScheduled")),
    offersSent: parseFormNumber(formData.get("offersSent")),
    backgroundChecksInitiated: parseFormNumber(formData.get("backgroundChecksInitiated")),
    workflowAutomationsTriggered: parseFormNumber(formData.get("workflowAutomationsTriggered")),
    scorecardsSent: parseFormNumber(formData.get("scorecardsSent")),
    onboardingPacketsLaunched: parseFormNumber(formData.get("onboardingPacketsLaunched")),
    timeToFillDays: parseFormNumber(formData.get("timeToFillDays")),
    hires: parseFormNumber(formData.get("hires")),
  };

  await prisma.metricSnapshot.create({
    data: {
      accountId: account.id,
      moduleKey: "ATS",
      source: "MANUAL",
      capturedAt,
      metrics,
    },
  });

  await prisma.accountModule.upsert({
    where: { accountId_moduleKey: { accountId: account.id, moduleKey: "ATS" } },
    create: { accountId: account.id, moduleKey: "ATS", isActive: true, config: {} },
    update: { isActive: true },
  });

  redirect(`/accounts/${account.id}`);
}

export async function updateAtsAssumptions(formData: FormData) {
  const accountId = formData.get("accountId");
  if (typeof accountId !== "string") throw new Error("Missing accountId.");
  const { account } = await requireOwnedAccount(accountId);

  const config: Record<string, number> = {};
  for (const action of ATS_ACTIONS) {
    config[action.assumptionKey] =
      parseFormNumber(formData.get(action.assumptionKey)) ?? ATS_DEFAULT_ASSUMPTIONS[action.assumptionKey];
  }

  await prisma.accountModule.upsert({
    where: { accountId_moduleKey: { accountId: account.id, moduleKey: "ATS" } },
    create: { accountId: account.id, moduleKey: "ATS", isActive: true, config },
    update: { config },
  });

  redirect(`/accounts/${account.id}`);
}
