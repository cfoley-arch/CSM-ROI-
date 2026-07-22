/**
 * Shared text-extraction helpers for ClearCompany liveboard PDF exports.
 * Every report we've seen uses one of two layouts for its numbers:
 *
 * 1. A headline KPI tile: the label on its own line, with the number on the
 *    very next line (e.g. "Average Time-to-Fill (Days)\n104.15").
 * 2. A labeled breakdown line: "Label - 1,234 (12.34%)", one per line,
 *    inside a pie-chart or donut-chart legend.
 *
 * Matching on label text (rather than fixed coordinates) is deliberate —
 * chart positions shift slightly between exports, but the label strings are
 * stable.
 */

export function extractHeadlineTile(text: string, label: string): number | null {
  const lines = text.split("\n").map((l) => l.trim());
  const idx = lines.findIndex((l) => l === label);
  if (idx === -1 || idx + 1 >= lines.length) return null;
  const raw = lines[idx + 1].replace(/,/g, "");
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function extractLabeledBreakdown(text: string): Map<string, number> {
  const values = new Map<string, number>();
  const pattern = /^([A-Za-z][A-Za-z ]*) - ([\d,]+(?:\.\d+)?) \([\d.]+%\)$/gm;
  for (const match of text.matchAll(pattern)) {
    const label = match[1].trim();
    const value = Number(match[2].replace(/,/g, ""));
    if (Number.isFinite(value)) values.set(label, value);
  }
  return values;
}
