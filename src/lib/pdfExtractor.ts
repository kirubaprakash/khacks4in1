// ✅ Use LEGACY build (required for React / Vite / TS)
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker?url";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

// ✅ Correct worker binding (CRITICAL)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
  extractedPages: number;
  status: "success" | "partial" | "failed";
  error?: string;
}

export async function extractTextFromPDF(
  file: File
): Promise<PDFExtractionResult> {
  let extractedPages = 0;
  let pageCount = 0;

  try {
    const buffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
      data: buffer,
      disableWorker: false,
    }).promise;

    pageCount = pdf.numPages;
    let fullText = "";
    const failedPages: number[] = [];

    for (let i = 1; i <= pageCount; i++) {
      try {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        // ✅ SAFE text extraction
        const pageText = content.items
          .filter((item): item is TextItem => "str" in item)
          .map(item => item.str)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        if (pageText.length > 30) {
          fullText += pageText + "\n\n";
          extractedPages++;
        }
      } catch {
        failedPages.push(i);
      }
    }

    const text = fullText.trim();

    // ❌ No text → scanned / image-based PDF
    if (!text) {
      return {
        text: "",
        pageCount,
        extractedPages: 0,
        status: "failed",
        error:
          "No selectable text found. This PDF appears to be scanned or image-based.",
      };
    }

    // ⚠ Partial extraction
    if (extractedPages < pageCount) {
      return {
        text,
        pageCount,
        extractedPages,
        status: "partial",
        error: `Extracted ${extractedPages} of ${pageCount} pages.`,
      };
    }

    // ✅ Success
    return {
      text,
      pageCount,
      extractedPages,
      status: "success",
    };
  } catch (error) {
    return {
      text: "",
      pageCount,
      extractedPages: 0,
      status: "failed",
      error:
        error instanceof Error
          ? error.message
          : "PDF text extraction failed",
    };
  }
}
