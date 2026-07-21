"use client";

import { useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { inputClass, labelClass } from "./formStyles";

interface BenchmarkValue {
  value: number;
  source: string | null;
  sourceUrl: string | null;
}

interface BenchmarkResult {
  hrHourlyRate: BenchmarkValue;
  costOfVacancyPerDay: BenchmarkValue;
}

type Source = { label: string; url: string | null };

function SourceNote({ source }: { source: Source | null }) {
  if (!source) return null;
  return (
    <span className="block text-xs text-cc-steel mt-1">
      Source:{" "}
      {source.url ? (
        <a href={source.url} target="_blank" rel="noreferrer" className="underline">
          {source.label}
        </a>
      ) : (
        source.label
      )}
    </span>
  );
}

/**
 * The two market-benchmark fields on the Edit account form, plus a "Research
 * values" button that fills them in from a web-search-backed lookup. Kept as
 * one client component (rather than a plain server-rendered pair of inputs)
 * because populating and disabling the fields during the lookup requires
 * controlled state — the inputs still carry their original `name` attributes
 * so the enclosing server-rendered `<form>` picks them up on submit as usual.
 */
export function BenchmarkFields({
  accountId,
  defaultHrHourlyRate,
  defaultCostOfVacancyPerDay,
}: {
  accountId: string;
  defaultHrHourlyRate: number | null;
  defaultCostOfVacancyPerDay: number | null;
}) {
  const [hrValue, setHrValue] = useState(defaultHrHourlyRate?.toString() ?? "");
  const [covValue, setCovValue] = useState(defaultCostOfVacancyPerDay?.toString() ?? "");
  const [hrSource, setHrSource] = useState<Source | null>(null);
  const [covSource, setCovSource] = useState<Source | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResearch() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/accounts/${accountId}/research`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Research failed.");

      const result = data as BenchmarkResult;
      setHrValue(String(result.hrHourlyRate.value));
      setCovValue(String(result.costOfVacancyPerDay.value));
      setHrSource(
        result.hrHourlyRate.source ? { label: result.hrHourlyRate.source, url: result.hrHourlyRate.sourceUrl } : null,
      );
      setCovSource(
        result.costOfVacancyPerDay.source
          ? { label: result.costOfVacancyPerDay.source, url: result.costOfVacancyPerDay.sourceUrl }
          : null,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Research failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Market benchmarks</span>
        <button
          type="button"
          onClick={handleResearch}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-sm text-cc-copper hover:text-cc-cast-iron disabled:opacity-50"
        >
          <MagnifyingGlass size={14} />
          {loading ? "Researching…" : "Research values"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}

      <label className={labelClass}>
        HR / recruiter hourly rate ($)
        <input
          name="hrHourlyRate"
          type="number"
          step="0.01"
          value={hrValue}
          onChange={(e) => setHrValue(e.target.value)}
          disabled={loading}
          className={inputClass}
        />
        <SourceNote source={hrSource} />
      </label>
      <label className={labelClass}>
        Cost of vacancy per day ($)
        <input
          name="costOfVacancyPerDay"
          type="number"
          step="0.01"
          value={covValue}
          onChange={(e) => setCovValue(e.target.value)}
          disabled={loading}
          className={inputClass}
        />
        <SourceNote source={covSource} />
      </label>
    </>
  );
}
