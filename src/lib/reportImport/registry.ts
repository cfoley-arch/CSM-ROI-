import { funnelAnalysisImporter } from "./funnelAnalysis";
import { offerLetterProcessVisibilityImporter } from "./offerLetterProcessVisibility";
import { recruiterActivityReportImporter } from "./recruiterActivityReport";
import { timeToFillImporter } from "./timeToFill";
import type { ReportImporter } from "./types";

export const REPORT_IMPORTERS: ReportImporter[] = [
  recruiterActivityReportImporter,
  timeToFillImporter,
  offerLetterProcessVisibilityImporter,
  funnelAnalysisImporter,
];

export function detectReportImporter(text: string): ReportImporter | null {
  return REPORT_IMPORTERS.find((importer) => importer.detect(text)) ?? null;
}
