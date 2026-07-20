/** Empty string (an untouched optional number field) becomes null, not NaN. */
export function parseFormNumber(value: FormDataEntryValue | null): number | null {
  if (value === null) return null;
  const trimmed = value.toString().trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function parseFormString(value: FormDataEntryValue | null): string | null {
  if (value === null) return null;
  const trimmed = value.toString().trim();
  return trimmed === "" ? null : trimmed;
}
