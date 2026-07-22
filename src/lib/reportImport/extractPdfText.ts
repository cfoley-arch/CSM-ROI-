import { PDFParse } from "pdf-parse";

/** Thrown when the uploaded file can't be read as a PDF at all — corrupted, password-protected, or not actually a PDF. Never thrown for "PDF parsed fine but we didn't recognize the report" — that's handled by detectReportImporter returning null instead. */
export class InvalidPdfError extends Error {}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.text;
  } catch (err) {
    console.error("extractPdfText failed:", err);
    throw new InvalidPdfError(
      "Could not read this file as a PDF — it may be corrupted, password-protected, or not actually a PDF.",
    );
  } finally {
    await parser.destroy();
  }
}
