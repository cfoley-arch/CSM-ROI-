import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { researchMarketBenchmarks, ResearchUnavailableError } from "@/lib/research/researchBenchmarks";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { id } = await params;
  const account = await prisma.account.findFirst({ where: { id, ownerId: session.user.id } });
  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  try {
    const result = await researchMarketBenchmarks({
      accountName: account.name,
      industry: account.industry,
      website: account.website,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ResearchUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error("Benchmark research failed:", err);
    return NextResponse.json({ error: "Research failed unexpectedly." }, { status: 500 });
  }
}
