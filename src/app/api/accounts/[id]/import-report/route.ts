import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { extractPdfText, InvalidPdfError } from "@/lib/reportImport/extractPdfText";
import { mergeReportResults } from "@/lib/reportImport/mergeResults";
import { detectReportImporter } from "@/lib/reportImport/registry";
import type { ReportParseResult } from "@/lib/reportImport/types";

/**
 * Accepts one or more report PDFs at once (the whole point is loading in a
 * month's worth of ClearCompany exports in a single pass), parses whichever
 * ones it recognizes, and returns a merged preview — never writes to the
 * database. The caller reviews/edits the preview and saves separately via
 * the saveModuleSnapshotAction server action.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { id } = await params;
  const account = await prisma.account.findFirst({ where: { id, ownerId: session.user.id } });
  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const formData = await request.formData();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files were uploaded." }, { status: 400 });
  }

  const results: ReportParseResult[] = [];
  const unrecognizedFiles: string[] = [];
  const invalidFiles: string[] = [];

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    let text: string;
    try {
      text = await extractPdfText(buffer);
    } catch (err) {
      if (err instanceof InvalidPdfError) {
        invalidFiles.push(file.name);
        continue;
      }
      throw err;
    }

    const importer = detectReportImporter(text);
    if (!importer) {
      unrecognizedFiles.push(file.name);
      continue;
    }
    results.push(importer.parse(text));
  }

  const preview = mergeReportResults(results);

  return NextResponse.json({
    ...preview,
    unrecognizedFiles,
    invalidFiles,
  });
}
