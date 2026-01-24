import { FileWarning } from 'lucide-react';

interface PDFExtractionWarningProps {
  status: 'success' | 'partial' | 'failed' | 'not_applicable';
}

export function PDFExtractionWarning({ status }: PDFExtractionWarningProps) {
  if (status === 'success' || status === 'not_applicable') {
    return null;
  }

  const messages = {
    partial: 'PDF text extraction was incomplete. Analysis results may be limited.',
    failed: 'PDF text extraction failed. Analysis results may be limited.',
  };

  return (
    <div className="flex items-start gap-3 rounded border border-originality-risk/30 bg-originality-risk-bg px-4 py-3">
      <FileWarning className="mt-0.5 h-5 w-5 flex-shrink-0 text-originality-risk" />
      <p className="text-sm text-originality-risk">
        {messages[status]}
      </p>
    </div>
  );
}
