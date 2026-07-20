import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";

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
    <main style={{ maxWidth: 360, margin: "80px auto", fontFamily: "system-ui" }}>
      <h1>CSM ROI — Sign in</h1>
      <form action={loginAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label>
          Email
          <input name="email" type="email" required style={{ display: "block", width: "100%" }} />
        </label>
        <label>
          Password
          <input name="password" type="password" required style={{ display: "block", width: "100%" }} />
        </label>
        {error && <p style={{ color: "crimson" }}>Invalid email or password.</p>}
        <button type="submit">Sign in</button>
      </form>
    </main>
  );
}
