"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/db/client";

/**
 * Self-service CSM login creation. The seed script creates the demo login
 * for local dev, but a deployed instance needs a real way in — individual
 * logins per CSM (Section 9, #5) shouldn't require running a script.
 */
export async function registerAction(formData: FormData) {
  const name = formData.get("name")?.toString().trim() || null;
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    redirect("/register?error=missing");
  }
  if (password.length < 8) {
    redirect("/register?error=short");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect("/register?error=taken");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { email, name, passwordHash } });

  try {
    await signIn("credentials", { email, password, redirectTo: "/accounts" });
  } catch (err) {
    if (err instanceof AuthError) {
      redirect("/login");
    }
    throw err;
  }
}
