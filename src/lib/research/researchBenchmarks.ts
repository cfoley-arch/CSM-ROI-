import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const BenchmarkValueSchema = z.object({
  value: z.number(),
  source: z.string().nullable(),
  sourceUrl: z.string().nullable(),
});

const BenchmarksSchema = z.object({
  hrHourlyRate: BenchmarkValueSchema,
  costOfVacancyPerDay: BenchmarkValueSchema,
});

export type MarketBenchmarks = z.infer<typeof BenchmarksSchema>;

/** Thrown for any reason benchmark research didn't produce a usable result — missing/invalid API key, rate limit, unparseable output, etc. Caught by the caller and shown as an inline error, never a crash. */
export class ResearchUnavailableError extends Error {}

function buildPrompt(params: { accountName: string; industry: string | null; website: string | null }): string {
  return `Research current, realistic market benchmark values for the following account:

Account: ${params.accountName}
Industry: ${params.industry ?? "unknown — use general hiring/recruiting benchmarks"}
${params.website ? `Website: ${params.website}` : ""}

Find two numbers, in USD:
1. The average hourly pay rate for an HR generalist or in-house recruiter in this industry.
2. The average fully-loaded cost of a vacant position per day for this industry (lost productivity, overtime, temp coverage, etc. — often published as "cost of vacancy").

Use web search to find current, credible sources (e.g. SHRM, U.S. Bureau of Labor Statistics, industry salary surveys, staffing industry reports). Prefer recent data and cite where each number came from.

Once you've finished researching, respond with ONLY a single JSON object — no markdown code fences, no explanation before or after it — in exactly this shape:

{"hrHourlyRate": {"value": <number>, "source": "<short source name>", "sourceUrl": "<url or null>"}, "costOfVacancyPerDay": {"value": <number>, "source": "<short source name>", "sourceUrl": "<url or null>"}}

If sources disagree, use your best judgment to pick a single representative number. Never fabricate a source — only cite sources you actually found via search.`;
}

function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new ResearchUnavailableError("The model's response did not contain a JSON object.");
  try {
    return JSON.parse(match[0]);
  } catch {
    throw new ResearchUnavailableError("The model's response was not valid JSON.");
  }
}

export async function researchMarketBenchmarks(params: {
  accountName: string;
  industry: string | null;
  website: string | null;
}): Promise<MarketBenchmarks> {
  // Same upfront check as generateNarrative: a deployed server has no `ant
  // auth login` profile on disk, so an explicit env var is the only real
  // credential path — check before the SDK's generic "could not resolve
  // auth" error leaks its raw message to the UI.
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    throw new ResearchUnavailableError(
      "Anthropic API credentials are not configured for this environment. Set ANTHROPIC_API_KEY to enable benchmark research.",
    );
  }

  const client = new Anthropic();
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: buildPrompt(params) }];

  try {
    let finalMessage: Anthropic.Message | undefined;
    // Claude's server-side web search loop pauses after 10 internal tool
    // iterations (stop_reason: "pause_turn"); resume by re-sending the same
    // history with the paused assistant turn appended — no new user message.
    for (let i = 0; i < 3; i++) {
      const stream = client.messages.stream({
        model: "claude-opus-4-8",
        max_tokens: 4096,
        thinking: { type: "adaptive" },
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
        messages,
      });
      finalMessage = await stream.finalMessage();
      if (finalMessage.stop_reason !== "pause_turn") break;
      messages.push({ role: "assistant", content: finalMessage.content });
    }

    if (!finalMessage) {
      throw new ResearchUnavailableError("No response was returned from the model.");
    }

    const textBlocks = finalMessage.content.filter((b): b is Anthropic.TextBlock => b.type === "text");
    const lastText = textBlocks.at(-1)?.text;
    if (!lastText) {
      throw new ResearchUnavailableError("The model didn't return a text response.");
    }

    const parsed = BenchmarksSchema.safeParse(extractJson(lastText));
    if (!parsed.success) {
      throw new ResearchUnavailableError("The model's response didn't match the expected shape.");
    }
    return parsed.data;
  } catch (err) {
    if (err instanceof ResearchUnavailableError) throw err;
    if (err instanceof Anthropic.AuthenticationError) {
      throw new ResearchUnavailableError("The Anthropic API key is invalid or missing permissions.");
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new ResearchUnavailableError("Anthropic API rate limit hit — try again shortly.");
    }
    if (err instanceof Anthropic.APIError) {
      throw new ResearchUnavailableError(`Anthropic API error: ${err.message}`);
    }
    throw err;
  }
}
