/** One value this importer successfully pulled out of a report PDF. */
export interface ParsedReportField {
  /** Which module this value belongs to (e.g. "ATS", "RECRUITER_ACTIVITY"). */
  moduleKey: string;
  /** The metric key within that module's schema. */
  metricKey: string;
  value: number;
}

export interface ReportParseResult {
  reportLabel: string;
  fields: ParsedReportField[];
  /** Labels this importer looked for but didn't find — report format may have changed, or the export had an empty section. Never fails the whole import. */
  missingLabels: string[];
}

/**
 * One ClearCompany liveboard report PDF this app knows how to read. Adding a
 * new report type later means adding one new object here (plus a registry
 * entry) — same additive shape as the module system itself.
 */
export interface ReportImporter {
  key: string;
  label: string;
  /** Cheap text check to identify which importer applies to an uploaded PDF's extracted text. */
  detect(text: string): boolean;
  /** Parse the text into field values. Only called after detect() returns true. */
  parse(text: string): ReportParseResult;
}
