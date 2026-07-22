"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FilePdf } from "@phosphor-icons/react";
import { saveModuleSnapshotsAction } from "@/app/accounts/actions";
import { inputClass, labelClass, primaryButtonClass } from "./formStyles";

interface FieldSource {
  reportLabel: string;
  value: number;
}

interface PreviewField {
  moduleKey: string;
  moduleLabel: string;
  metricKey: string;
  label: string;
  value: number;
  sources: FieldSource[];
}

interface PreviewUpload {
  reportLabel: string;
  missingLabels: string[];
}

interface ImportPreviewResponse {
  fields: PreviewField[];
  uploads: PreviewUpload[];
  unrecognizedFiles: string[];
  invalidFiles: string[];
  error?: string;
}

/**
 * "Load in data as fast as possible": accepts however many ClearCompany
 * report PDFs the CSM has for this month in one go, parses whichever ones
 * are recognized, and shows one combined, editable preview — across
 * whichever modules (ATS, Recruiter Activity, ...) the uploads touch —
 * before a single Save commits all of it.
 */
export function ReportPdfImport({ accountId }: { accountId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [capturedAt, setCapturedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const formData = new FormData();
      for (const file of Array.from(fileList)) {
        formData.append("files", file);
      }
      const res = await fetch(`/api/accounts/${accountId}/import-report`, { method: "POST", body: formData });
      if (!res.headers.get("content-type")?.includes("application/json")) {
        throw new Error("The server didn't respond as expected. Please try again in a moment.");
      }
      const data = (await res.json()) as ImportPreviewResponse;
      if (!res.ok) throw new Error(data.error ?? "Import failed.");
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setLoading(false);
    }
  }

  function updateFieldValue(index: number, value: string) {
    if (!preview) return;
    const parsed = value === "" ? 0 : Number(value);
    const fields = [...preview.fields];
    fields[index] = { ...fields[index], value: Number.isFinite(parsed) ? parsed : fields[index].value };
    setPreview({ ...preview, fields });
  }

  async function handleSave() {
    if (!preview) return;
    setSaving(true);
    setError(null);
    try {
      const moduleMetrics: Record<string, Record<string, number | null>> = {};
      for (const field of preview.fields) {
        moduleMetrics[field.moduleKey] ??= {};
        moduleMetrics[field.moduleKey][field.metricKey] = field.value;
      }
      await saveModuleSnapshotsAction({ accountId, capturedAt, moduleMetrics });
      router.push(`/accounts/${accountId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
      setSaving(false);
    }
  }

  const fieldsByModule = new Map<string, PreviewField[]>();
  for (const field of preview?.fields ?? []) {
    const list = fieldsByModule.get(field.moduleLabel) ?? [];
    list.push(field);
    fieldsByModule.set(field.moduleLabel, list);
  }

  return (
    <div className="rounded-lg border border-cc-brass/30 p-5">
      <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-cc-steel mb-1">
        <FilePdf size={15} /> Import from report PDF
      </p>
      <p className="text-xs text-cc-steel mb-3">
        Upload one or more ClearCompany report exports (Recruiter Activity Report, Time to Fill, Offer Letter Process
        Visibility, Funnel Analysis) — everything recognized fills in below for review before saving.
      </p>

      <input
        type="file"
        accept="application/pdf"
        multiple
        disabled={loading || saving}
        onChange={(e) => handleFiles(e.target.files)}
        className="block w-full text-sm mb-3"
      />

      {loading && <p className="text-sm text-cc-steel">Parsing…</p>}
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      {preview && (
        <div className="mt-2">
          {preview.unrecognizedFiles.length > 0 && (
            <p className="text-xs text-amber-700 mb-2">
              Not recognized as a supported report: {preview.unrecognizedFiles.join(", ")}
            </p>
          )}
          {preview.invalidFiles.length > 0 && (
            <p className="text-xs text-red-600 mb-2">Could not read as a PDF: {preview.invalidFiles.join(", ")}</p>
          )}
          {preview.uploads.map(
            (upload) =>
              upload.missingLabels.length > 0 && (
                <p key={upload.reportLabel} className="text-xs text-amber-700 mb-2">
                  {upload.reportLabel}: couldn&apos;t find {upload.missingLabels.join(", ")} — left blank.
                </p>
              ),
          )}

          {preview.fields.length === 0 ? (
            <p className="text-sm text-cc-steel">No usable fields found in the uploaded file(s).</p>
          ) : (
            <>
              <label className={`${labelClass} block mb-3`}>
                As-of date
                <input
                  type="date"
                  value={capturedAt}
                  onChange={(e) => setCapturedAt(e.target.value)}
                  className={inputClass}
                />
              </label>

              {Array.from(fieldsByModule.entries()).map(([moduleLabel, fields]) => (
                <div key={moduleLabel} className="mb-4">
                  <h4 className="text-sm font-semibold text-cc-steel mb-2">{moduleLabel}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {fields.map((field) => {
                      const index = preview.fields.indexOf(field);
                      const conflicting = field.sources.length > 1;
                      return (
                        <label key={`${field.moduleKey}.${field.metricKey}`} className={labelClass}>
                          {field.label}
                          <input
                            type="number"
                            value={field.value}
                            onChange={(e) => updateFieldValue(index, e.target.value)}
                            className={inputClass}
                          />
                          <span className="block text-xs text-cc-steel mt-1">
                            Source: {field.sources.map((s) => `${s.reportLabel} (${s.value})`).join(", ")}
                            {conflicting && " — reports disagreed, using the last one uploaded"}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              <button type="button" onClick={handleSave} disabled={saving} className={`${primaryButtonClass} mt-2`}>
                {saving ? "Saving…" : "Save imported snapshot"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
