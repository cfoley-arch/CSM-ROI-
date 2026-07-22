import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Wordmark } from "@/components/Wordmark";
import { inputClass, labelClass, primaryButtonClass, secondaryLinkClass } from "@/components/formStyles";
import { createAccount } from "../actions";

export default async function NewAccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="max-w-lg mx-auto px-6 py-10">
      <Link href="/accounts" className={secondaryLinkClass}>
        &larr; All accounts
      </Link>
      <Wordmark />
      <h1 className="font-display text-3xl mt-4 mb-6">New account</h1>

      <form action={createAccount} className="flex flex-col gap-4">
        <label className={labelClass}>
          Account name
          <input name="name" required className={inputClass} />
        </label>
        <label className={labelClass}>
          Industry
          <input name="industry" className={inputClass} placeholder="e.g. Construction & Engineering" />
        </label>
        <label className={labelClass}>
          Website (optional)
          <input name="website" type="url" className={inputClass} placeholder="https://" />
        </label>
        <button type="submit" className={`${primaryButtonClass} self-start`}>
          Create account
        </button>
      </form>
    </main>
  );
}
