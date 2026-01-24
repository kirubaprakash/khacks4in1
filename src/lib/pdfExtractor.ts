import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
  extractedPages: number;
  status: 'success' | 'partial' | 'failed';
  error?: string;
}

export async function extractTextFromPDF(file: File): Promise<PDFExtractionResult> {
  let extractedPages = 0;
  let pageCount = 0;
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    pageCount = pdf.numPages;
    
    let fullText = '';
    const failedPages: number[] = [];
    
    for (let i = 1; i <= pageCount; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        if (pageText.trim()) {
          fullText += pageText + '\n\n';
          extractedPages++;
        }
      } catch (pageError) {
        console.error(`PDF extraction error on page ${i}:`, pageError);
        failedPages.push(i);
      }
    }
    
    const trimmedText = fullText.trim();
    
    // Determine extraction status
    if (extractedPages === 0 || !trimmedText) {
      return {
        text: '',
        pageCount,
        extractedPages: 0,
        status: 'failed',
        error: 'No text could be extracted from the PDF. The document may be image-based or protected.',
      };
    }
    
    if (extractedPages < pageCount || failedPages.length > 0) {
      return {
        text: trimmedText,
        pageCount,
        extractedPages,
        status: 'partial',
        error: `Extracted ${extractedPages} of ${pageCount} pages. Some pages could not be processed.`,
      };
    }
    
    // Validate extraction quality - check for minimum content
    const wordCount = trimmedText.split(/\s+/).length;
    if (wordCount < 50) {
      return {
        text: trimmedText,
        pageCount,
        extractedPages,
        status: 'partial',
        error: 'Limited text extracted. The document may contain primarily images or non-standard formatting.',
      };
    }
    
    return {
      text: trimmedText,
      pageCount,
      extractedPages,
      status: 'success',
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    return {
      text: '',
      pageCount,
      extractedPages: 0,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Failed to extract PDF text',
    };
  }
}
