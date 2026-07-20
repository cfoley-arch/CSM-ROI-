import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { inputClass, labelClass, primaryButtonClass } from "@/components/formStyles";
import { registerAction } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  missing: "Email and password are required.",
  short: "Password must be at least 8 characters.",
  taken: "That email is already registered — sign in instead.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : null;

  return (
    <main className="min-h-screen flex items-center justify-center bg-cc-platinum">
      <div className="w-full max-w-sm rounded-xl bg-cc-white p-8 shadow-sm">
        <Wordmark />
        <h1 className="font-display text-2xl mt-4 mb-1">Create your CSM login</h1>
        <p className="text-sm text-cc-steel mb-6">Individual logins per CSM, so your accounts stay yours.</p>
        <form action={registerAction} className="flex flex-col gap-4">
          <label className={labelClass}>
            Name
            <input name="name" type="text" className={inputClass} />
          </label>
          <label className={labelClass}>
            Email
            <input name="email" type="email" required className={inputClass} />
          </label>
          <label className={labelClass}>
            Password
            <input name="password" type="password" required minLength={8} className={inputClass} />
          </label>
          {errorMessage && <p className="text-sm text-cc-bronze">{errorMessage}</p>}
          <button type="submit" className={primaryButtonClass}>
            Create account
          </button>
        </form>
        <p className="text-sm text-cc-steel mt-4">
          Already have a login?{" "}
          <Link href="/login" className="text-cc-copper hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
