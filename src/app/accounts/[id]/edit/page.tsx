import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { inputClass, labelClass, primaryButtonClass, secondaryLinkClass } from "@/components/formStyles";
import { updateAccountContext } from "../../actions";

export default async function EditAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const account = await prisma.account.findFirst({ where: { id, ownerId: session.user.id } });
  if (!account) notFound();

  return (
    <main className="max-w-lg mx-auto px-6 py-10">
      <Link href={`/accounts/${account.id}`} className={secondaryLinkClass}>
        &larr; {account.name}
      </Link>
      <h1 className="font-display text-3xl mt-4 mb-1">Edit account</h1>
      <p className="text-cc-steel mb-6">Client context applies across every active module (Section 5).</p>

      <form action={updateAccountContext} className="flex flex-col gap-4">
        <input type="hidden" name="accountId" value={account.id} />

        <label className={labelClass}>
          Account name
          <input name="name" defaultValue={account.name} required className={inputClass} />
        </label>
        <label className={labelClass}>
          Industry
          <input name="industry" defaultValue={account.industry ?? ""} className={inputClass} />
        </label>
        <label className={labelClass}>
          Website
          <input name="website" type="url" defaultValue={account.website ?? ""} className={inputClass} />
        </label>
        <label className={labelClass}>
          HR / recruiter hourly rate ($)
          <input
            name="hrHourlyRate"
            type="number"
            step="0.01"
            defaultValue={account.hrHourlyRate ?? ""}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Cost of vacancy per day ($)
          <input
            name="costOfVacancyPerDay"
            type="number"
            step="0.01"
            defaultValue={account.costOfVacancyPerDay ?? ""}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          ClearCo platform cost for the period ($)
          <input
            name="platformCostPerYear"
            type="number"
            step="0.01"
            defaultValue={account.platformCostPerYear ?? ""}
            className={inputClass}
          />
          <span className="block text-xs text-cc-steel mt-1">Used to calculate net ROI on the statement.</span>
        </label>

        <button type="submit" className={`${primaryButtonClass} self-start`}>
          Save
        </button>
      </form>
    </main>
  );
}
