import type { ReportImporter } from "./types";
import { extractHeadlineTile } from "./textPatterns";

/** Feeds ATS's `offersSent` as an additional source alongside the Catalyst CSV. */
export const offerLetterProcessVisibilityImporter: ReportImporter = {
  key: "OFFER_LETTER_PROCESS_VISIBILITY",
  label: "Offer Letter Process Visibility",
  detect: (text) => text.startsWith("Offer Letter Process Visibility\n"),
  parse: (text) => {
    const fields = [];
    const missingLabels: string[] = [];

    const offersSent = extractHeadlineTile(text, "Offers Sent to Candidates");
    if (offersSent !== null) {
      fields.push({ moduleKey: "ATS", metricKey: "offersSent", value: offersSent });
    } else {
      missingLabels.push("Offers Sent to Candidates");
    }

    return { reportLabel: "Offer Letter Process Visibility", fields, missingLabels };
  },
};
