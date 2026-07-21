import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/db/client";
import { EMPTY_ATS_METRICS, type AtsMetrics } from "@/lib/modules/ats/schema";

/**
 * Maps the Catalyst "Whitespace Map" export (real format reviewed in
 * Section 5) onto the ATS module's metrics. Only columns Section 5
 * confirms are covered get mapped; everything else stays null so the CSM
 * fills it in manually (emails sent, workflow automations, time-to-fill,
 * hires).
 *
 * Texts sent maps from "Do Not Use: Texts - Sent Last 30" — the export's
 * only 30-day texts-sent column, despite its "Do Not Use" name (verified
 * usable; confirmed with the CSM lead before mapping it).
 *
 * All the covered columns are 30-day rolling windows, so a snapshot from
 * this importer represents "last 30 days as of the import date" — matching
 * Section 5's recommended monthly-import cadence.
 */
const CATALYST_COLUMNS = {
  objectId: "Object Id",
  name: "Name",
  industry: "Industry",
  csmName: "Customer Success Manager",
  recruitingSubscriptions: "Recruiting Subscriptions",
  textsSent30d: "Do Not Use: Texts - Sent Last 30",
  offersSent30d: "Offer Letters Sent Last 30 Days (pendo)",
  interviews1on1Scheduled30d: "1:1 Interviews Scheduled Within 30 Days",
  interviewsMultiScheduled30d: "Multi Interviewer Scheduled Within 30 Days",
  backgroundChecksRunLastMonth: "Bgc By Cc Run Last Month",
  scorecardsCompleted30d: "Scorecards Completed Over Last 30 Days",
  onboardingPacketsAssigned30d: "Packets Assigned Last 30 Days (snowflake)",
} as const;

export interface CatalystRow {
  [column: string]: string;
}

export interface MappedCatalystAccount {
  catalystObjectId: string;
  name: string;
  industry: string | null;
  csmName: string | null;
  /** Recruiting Subscriptions > 0 — used as a proxy for "ATS module active." */
  atsActive: boolean;
  ats: AtsMetrics;
}

function parseNullableNumber(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed.toLowerCase() === "null") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function sumNullable(...values: Array<number | null>): number | null {
  const present = values.filter((v): v is number => v !== null);
  if (present.length === 0) return null;
  return present.reduce((a, b) => a + b, 0);
}

export function parseCatalystCsv(csvText: string): CatalystRow[] {
  return parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CatalystRow[];
}

export function mapCatalystRow(row: CatalystRow): MappedCatalystAccount {
  const objectId = row[CATALYST_COLUMNS.objectId]?.trim();
  const name = row[CATALYST_COLUMNS.name]?.trim();
  if (!objectId || !name) {
    throw new Error(`Row is missing Object Id or Name: ${JSON.stringify(row)}`);
  }

  const industry = row[CATALYST_COLUMNS.industry]?.trim() || null;
  const csmName = row[CATALYST_COLUMNS.csmName]?.trim() || null;
  const recruitingSubscriptions = parseNullableNumber(row[CATALYST_COLUMNS.recruitingSubscriptions]);

  const ats: AtsMetrics = {
    ...EMPTY_ATS_METRICS,
    textsSent: parseNullableNumber(row[CATALYST_COLUMNS.textsSent30d]),
    offersSent: parseNullableNumber(row[CATALYST_COLUMNS.offersSent30d]),
    interviewsScheduled: sumNullable(
      parseNullableNumber(row[CATALYST_COLUMNS.interviews1on1Scheduled30d]),
      parseNullableNumber(row[CATALYST_COLUMNS.interviewsMultiScheduled30d]),
    ),
    backgroundChecksInitiated: parseNullableNumber(row[CATALYST_COLUMNS.backgroundChecksRunLastMonth]),
    scorecardsSent: parseNullableNumber(row[CATALYST_COLUMNS.scorecardsCompleted30d]),
    onboardingPacketsLaunched: parseNullableNumber(row[CATALYST_COLUMNS.onboardingPacketsAssigned30d]),
  };

  return {
    catalystObjectId: objectId,
    name,
    industry,
    csmName,
    atsActive: (recruitingSubscriptions ?? 0) > 0,
    ats,
  };
}

export interface ImportCatalystCsvResult {
  importBatchId: string;
  accountsCreated: number;
  accountsUpdated: number;
  snapshotsCreated: number;
  warnings: string[];
}

/**
 * Imports a Catalyst Whitespace Map CSV: upserts one Account per row (keyed
 * on catalystObjectId), ensures each has an ATS AccountModule row, and
 * records one dated MetricSnapshot per account for this import. Per
 * Section 5's resolved solve, re-importing later (e.g. next month) just
 * adds another snapshot — "the app becomes the timeline," not Catalyst.
 */
export async function importCatalystCsv(params: {
  csvText: string;
  fileName: string;
  importedById: string;
  /** The as-of date these snapshots represent; defaults to now. */
  capturedAt?: Date;
}): Promise<ImportCatalystCsvResult> {
  const { csvText, fileName, importedById, capturedAt = new Date() } = params;
  const rows = parseCatalystCsv(csvText);
  const warnings: string[] = [];

  const users = await prisma.user.findMany({ select: { id: true, name: true } });
  const userByName = new Map(users.filter((u) => u.name).map((u) => [u.name!.toLowerCase(), u.id]));

  const batch = await prisma.importBatch.create({
    data: {
      source: "CATALYST_WHITESPACE_MAP",
      fileName,
      importedById,
      rowCount: rows.length,
    },
  });

  let accountsCreated = 0;
  let accountsUpdated = 0;
  let snapshotsCreated = 0;

  for (const row of rows) {
    let mapped: MappedCatalystAccount;
    try {
      mapped = mapCatalystRow(row);
    } catch (err) {
      warnings.push(err instanceof Error ? err.message : String(err));
      continue;
    }

    let ownerId = importedById;
    if (mapped.csmName) {
      const matched = userByName.get(mapped.csmName.toLowerCase());
      if (matched) {
        ownerId = matched;
      } else {
        warnings.push(
          `No user found for CSM "${mapped.csmName}" on account "${mapped.name}" — assigned to the importing user instead.`,
        );
      }
    }

    const existing = await prisma.account.findUnique({
      where: { catalystObjectId: mapped.catalystObjectId },
    });

    const account = await prisma.account.upsert({
      where: { catalystObjectId: mapped.catalystObjectId },
      create: {
        catalystObjectId: mapped.catalystObjectId,
        name: mapped.name,
        industry: mapped.industry,
        ownerId,
      },
      update: {
        name: mapped.name,
        industry: mapped.industry ?? undefined,
      },
    });

    if (existing) {
      accountsUpdated += 1;
    } else {
      accountsCreated += 1;
    }

    await prisma.accountModule.upsert({
      where: { accountId_moduleKey: { accountId: account.id, moduleKey: "ATS" } },
      create: {
        accountId: account.id,
        moduleKey: "ATS",
        isActive: mapped.atsActive,
        config: {},
      },
      update: {
        isActive: mapped.atsActive,
      },
    });

    await prisma.metricSnapshot.create({
      data: {
        accountId: account.id,
        moduleKey: "ATS",
        source: "CSV_CATALYST",
        capturedAt,
        metrics: mapped.ats,
        importBatchId: batch.id,
      },
    });
    snapshotsCreated += 1;
  }

  return {
    importBatchId: batch.id,
    accountsCreated,
    accountsUpdated,
    snapshotsCreated,
    warnings,
  };
}
