import { BookX } from 'lucide-react';

interface ReferenceDetectionWarningProps {
  status: 'pending' | 'success' | 'failed';
  inputType: 'text' | 'pdf';
}

export function ReferenceDetectionWarning({ status, inputType }: ReferenceDetectionWarningProps) {
  if (status !== 'failed') {
    return null;
  }

  return (
    <div className="flex items-start gap-3 rounded border border-originality-risk/30 bg-originality-risk-bg px-4 py-3">
      <BookX className="mt-0.5 h-5 w-5 flex-shrink-0 text-originality-risk" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-originality-risk">
          Reference detection failed for this document.
        </p>
        <p className="text-sm text-originality-risk/80">
          Similarity classification between referenced and unreferenced content may be unreliable.
        </p>
      </div>
    </div>
  );
}
