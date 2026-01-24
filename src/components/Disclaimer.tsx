import { Info } from 'lucide-react';

export function Disclaimer() {
  return (
    <div className="flex items-start gap-3 border border-border bg-muted/30 px-4 py-3">
      <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Similarity results are relative to the indexed academic literature and do not 
        constitute a plagiarism verdict. This tool assists academic understanding and 
        does not perform judgment or enforcement.
      </p>
    </div>
  );
}
