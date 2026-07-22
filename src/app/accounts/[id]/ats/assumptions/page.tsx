import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { inputClass, labelClass, primaryButtonClass, secondaryLinkClass } from "@/components/formStyles";
import { ATS_ACTIONS } from "@/lib/modules/ats/actions";
import { ATS_DEFAULT_ASSUMPTIONS } from "@/lib/modules/ats/defaults";
import { updateAtsAssumptions } from "../../../actions";

export default async function AtsAssumptionsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const account = await prisma.account.findFirst({
    where: { id, ownerId: session.user.id },
    include: { modules: { where: { moduleKey: "ATS" } } },
  });
  if (!account) notFound();

  const overrides = (account.modules[0]?.config as Record<string, number>) ?? {};

  return (
    <main className="max-w-lg mx-auto px-6 py-10">
      <Link href={`/accounts/${account.id}`} className={secondaryLinkClass}>
        &larr; {account.name}
      </Link>
      <h1 className="font-display text-3xl mt-4 mb-1">ATS time-saved assumptions</h1>
      <p className="text-cc-steel mb-6">
        Editable per account (Section 5) — these are the &quot;minutes saved per action&quot; assumptions behind
        the Admin Time Savings line. Leave a field blank to use the default.
      </p>

      <form action={updateAtsAssumptions} className="flex flex-col gap-4">
        <input type="hidden" name="accountId" value={account.id} />

        {ATS_ACTIONS.map((action) => (
          <label key={action.assumptionKey} className={labelClass}>
            Minutes saved per {action.label.toLowerCase()}
            <input
              name={action.assumptionKey}
              type="number"
              step="0.5"
              defaultValue={overrides[action.assumptionKey] ?? ATS_DEFAULT_ASSUMPTIONS[action.assumptionKey]}
              className={inputClass}
            />
          </label>
        ))}

        <button type="submit" className={`${primaryButtonClass} self-start`}>
          Save assumptions
        </button>
      </form>
    </main>
  );
}
