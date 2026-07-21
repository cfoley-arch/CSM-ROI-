import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Wordmark } from "@/components/Wordmark";
import { inputClass, labelClass, primaryButtonClass, secondaryLinkClass } from "@/components/formStyles";
import { importCsvAction } from "./actions";

export default async function ImportCsvPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; updated?: string; warnings?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { error, created, updated, warnings } = await searchParams;

  return (
    <main className="max-w-lg mx-auto px-6 py-10">
      <Link href="/accounts" className={secondaryLinkClass}>
        &larr; All accounts
      </Link>
      <Wordmark />
      <h1 className="font-display text-3xl mt-4 mb-1">Import Catalyst CSV</h1>
      <p className="text-sm text-cc-steel mb-6">
        Upload the &quot;Whitespace Map&quot; export. Each row creates or updates one account and
        adds a dated ATS usage snapshot — covering texts sent, offers sent, interviews scheduled,
        background checks initiated, scorecards sent, and onboarding packets launched (Section 5).
        Emails, workflow automations, time-to-fill, and hires stay manual-entry.
      </p>

      {created !== undefined && (
        <div className="rounded-md bg-cc-white-gold/60 text-cc-bronze text-sm px-3 py-2 mb-4">
          Imported: {created} account{created === "1" ? "" : "s"} created, {updated} updated.
          {warnings && Number(warnings) > 0
            ? ` ${warnings} row${warnings === "1" ? "" : "s"} had a warning (e.g. an unmatched CSM name).`
            : ""}
        </div>
      )}
      {error && <div className="rounded-md bg-cc-white-gold/60 text-cc-bronze text-sm px-3 py-2 mb-4">{error}</div>}

      <form action={importCsvAction} encType="multipart/form-data" className="flex flex-col gap-4">
        <label className={labelClass}>
          CSV file
          <input type="file" name="file" accept=".csv,text/csv" required className={inputClass} />
        </label>
        <button type="submit" className={`${primaryButtonClass} self-start`}>
          Import
        </button>
      </form>
    </main>
  );
}
