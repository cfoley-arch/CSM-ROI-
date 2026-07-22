"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { importCatalystCsv } from "@/lib/csv/catalystImport";

/**
 * The in-app half of Section 3's "Data entry via manual input and CSV
 * upload" — previously importCatalystCsv only ran from the seed script
 * against a local file. This is the same importer, driven from a browser
 * upload instead, so a deployed instance (no filesystem access to a CSM's
 * laptop) can still ingest the Catalyst export.
 */
export async function importCsvAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/accounts/import?error=${encodeURIComponent("Choose a CSV file first.")}`);
  }

  let errorMessage: string | null = null;
  let result: Awaited<ReturnType<typeof importCatalystCsv>> | null = null;
  try {
    const csvText = await file.text();
    result = await importCatalystCsv({
      csvText,
      fileName: file.name,
      importedById: session.user.id,
    });
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Unknown error parsing CSV.";
  }

  if (errorMessage) {
    redirect(`/accounts/import?error=${encodeURIComponent(errorMessage)}`);
  }

  redirect(
    `/accounts/import?created=${result!.accountsCreated}&updated=${result!.accountsUpdated}&warnings=${result!.warnings.length}`,
  );
}
