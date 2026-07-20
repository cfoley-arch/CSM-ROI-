import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { inputClass, labelClass, primaryButtonClass, secondaryLinkClass } from "@/components/formStyles";
import { AtsModule } from "@/lib/modules/ats";
import { saveAtsSnapshot } from "../../../actions";

export default async function AtsEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const account = await prisma.account.findFirst({ where: { id, ownerId: session.user.id } });
  if (!account) notFound();

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="max-w-lg mx-auto px-6 py-10">
      <Link href={`/accounts/${account.id}`} className={secondaryLinkClass}>
        &larr; {account.name}
      </Link>
      <h1 className="font-display text-3xl mt-4 mb-1">Log ATS usage</h1>
      <p className="text-cc-steel mb-6">
        Adds a new dated snapshot. The statement compares this against the account&apos;s most recent prior
        snapshot as the baseline (Section 5).
      </p>

      <form action={saveAtsSnapshot} className="flex flex-col gap-4">
        <input type="hidden" name="accountId" value={account.id} />

        <label className={labelClass}>
          As-of date
          <input name="capturedAt" type="date" defaultValue={today} required className={inputClass} />
        </label>

        {AtsModule.metricFields.map((field) => (
          <label key={field.key} className={labelClass}>
            {field.label}
            <input name={field.key} type="number" step="1" className={inputClass} />
            {field.notes && <span className="block text-xs text-cc-steel mt-1">{field.notes}</span>}
          </label>
        ))}

        <button type="submit" className={`${primaryButtonClass} self-start`}>
          Save snapshot
        </button>
      </form>
    </main>
  );
}
