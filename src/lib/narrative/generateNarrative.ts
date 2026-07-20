import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { formatCurrency } from "@/lib/format";
import type { StatementResults } from "@/lib/modules/accountStatement";

/**
 * Section 6's optional AI narrative layer, resolved "yes" for v1 (Section 9
 * #9): QBR email drafts and talk tracks, server-side via the Anthropic API
 * (not client-side Gemini, per Section 8's architecture note).
 */
const NarrativeSchema = z.object({
  qbrEmail: z
    .string()
    .describe(
      "A QBR summary email draft the CSM can send to their champion, 3-5 short paragraphs, referencing the specific numbers and methodology so it holds up to scrutiny from the champion's own CFO.",
    ),
  talkTrack: z
    .string()
    .describe(
      'A short, spoken talk track (2-4 sentences) the CSM can say out loud live in the meeting, leading with the single most impactful number — in the style of: "By cutting time-to-fill by 15 days, you avoided roughly $120K in vacancy costs this year."',
    ),
});

export type Narrative = z.infer<typeof NarrativeSchema>;

/** Thrown for any reason narrative generation didn't produce a result — missing/invalid API key, rate limit, etc. Caught by the caller and shown as a banner, never a crash. */
export class NarrativeUnavailableError extends Error {}

function buildPrompt(params: {
  accountName: string;
  industry: string | null;
  periodLabel: string;
  results: StatementResults;
}): string {
  const lineItemsText = params.results.moduleResults
    .flatMap((m) => m.lineItems.map((li) => `- ${li.label}: ${formatCurrency(li.amount)} (${li.methodology})`))
    .join("\n");

  const netLine =
    params.results.net.netAnnualRoi !== null
      ? `Net of platform cost: ${formatCurrency(params.results.net.netAnnualRoi)}`
      : "";

  return `Account: ${params.accountName}
Industry: ${params.industry ?? "unknown"}
Statement period: ${params.periodLabel}

Line items:
${lineItemsText}

Total measured value delivered (gross): ${formatCurrency(params.results.totalAnnualRoi)}
${netLine}

Write a QBR email draft and a talk track from the numbers above.

Voice: Welcoming, Purposeful, Empowering — confident and human, not salesy or robotic. Use only the numbers given above; never invent or round to a number not shown.`;
}

export async function generateNarrative(params: {
  accountName: string;
  industry: string | null;
  periodLabel: string;
  results: StatementResults;
}): Promise<Narrative> {
  // A deployed server has no `ant auth login` profile on disk, so the only
  // real credential path here is an explicit env var — check upfront rather
  // than let the SDK's client-side "could not resolve auth" validation error
  // (a generic Error, not AuthenticationError) leak its raw message to the UI.
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    throw new NarrativeUnavailableError(
      "Anthropic API credentials are not configured for this environment. Set ANTHROPIC_API_KEY to enable narrative generation.",
    );
  }

  const client = new Anthropic();

  try {
    const response = await client.messages.parse(
      {
        model: "claude-opus-4-8",
        max_tokens: 2048,
        messages: [{ role: "user", content: buildPrompt(params) }],
        output_config: {
          format: zodOutputFormat(NarrativeSchema),
        },
      },
      // Server action should fail fast rather than hang the request indefinitely.
      { timeout: 30_000 },
    );

    if (!response.parsed_output) {
      throw new NarrativeUnavailableError("The model did not return parseable output.");
    }
    return response.parsed_output;
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      throw new NarrativeUnavailableError("The Anthropic API key is invalid or missing permissions.");
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new NarrativeUnavailableError("Anthropic API rate limit hit — try again shortly.");
    }
    if (err instanceof Anthropic.APIError) {
      throw new NarrativeUnavailableError(`Anthropic API error: ${err.message}`);
    }
    throw err;
  }
}
