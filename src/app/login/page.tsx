import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { Wordmark } from "@/components/Wordmark";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function loginAction(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/accounts",
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect("/login?error=1");
      }
      throw err;
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-cc-platinum">
      <div className="w-full max-w-sm rounded-xl bg-cc-white p-8 shadow-sm">
        <Wordmark />
        <h1 className="font-display text-2xl mt-4 mb-1">CSM ROI Statement</h1>
        <p className="text-sm text-cc-steel mb-6">Sign in to view your accounts.</p>
        <form action={loginAction} className="flex flex-col gap-4">
          <label className="text-sm">
            Email
            <input
              name="email"
              type="email"
              required
              className="block w-full mt-1 rounded-md border border-cc-brass/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cc-copper/40"
            />
          </label>
          <label className="text-sm">
            Password
            <input
              name="password"
              type="password"
              required
              className="block w-full mt-1 rounded-md border border-cc-brass/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cc-copper/40"
            />
          </label>
          {error && <p className="text-sm text-cc-bronze">Invalid email or password.</p>}
          <button
            type="submit"
            className="rounded-md bg-cc-cast-iron text-cc-white py-2 text-sm font-medium hover:bg-cc-bronze transition-colors"
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
