import { getModule } from "@/lib/modules/registry";
import type { ReportParseResult } from "./types";

export interface MergedFieldSource {
  reportLabel: string;
  value: number;
}

export interface MergedField {
  moduleKey: string;
  moduleLabel: string;
  metricKey: string;
  label: string;
  /** Default value for the preview input. When multiple uploaded reports set the same field, this is the last-uploaded one's value — all contributing values are still listed in `sources` so a conflict is visible, not silently hidden. */
  value: number;
  sources: MergedFieldSource[];
}

export interface MergedImportPreview {
  fields: MergedField[];
  uploads: Array<{ reportLabel: string; missingLabels: string[] }>;
}

/** Combines parse results from however many report PDFs were uploaded in one go into a single preview, grouped by (module, metric). */
export function mergeReportResults(results: ReportParseResult[]): MergedImportPreview {
  const byKey = new Map<string, MergedField>();

  for (const result of results) {
    for (const field of result.fields) {
      const key = `${field.moduleKey}.${field.metricKey}`;
      const mod = getModule(field.moduleKey);
      const metricField = mod.metricFields.find((f) => f.key === field.metricKey);
      const label = metricField?.label ?? field.metricKey;

      const existing = byKey.get(key);
      if (existing) {
        existing.sources.push({ reportLabel: result.reportLabel, value: field.value });
        existing.value = field.value;
      } else {
        byKey.set(key, {
          moduleKey: field.moduleKey,
          moduleLabel: mod.label,
          metricKey: field.metricKey,
          label,
          value: field.value,
          sources: [{ reportLabel: result.reportLabel, value: field.value }],
        });
      }
    }
  }

  return {
    fields: Array.from(byKey.values()),
    uploads: results.map((r) => ({ reportLabel: r.reportLabel, missingLabels: r.missingLabels })),
  };
}
