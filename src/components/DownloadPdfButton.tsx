"use client";

import { DownloadSimple } from "@phosphor-icons/react";
import { primaryButtonClass } from "./formStyles";

/**
 * PDF export (Section 3) — the browser's native print-to-PDF on this same
 * page, so the exported file is pixel-identical to the on-screen statement.
 * Hidden from the print output itself via `print:hidden`.
 */
export function DownloadPdfButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`${primaryButtonClass} inline-flex items-center gap-1.5 print:hidden`}
    >
      <DownloadSimple size={14} />
      Download PDF
    </button>
  );
}
