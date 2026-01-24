import { Lightbulb } from 'lucide-react';

export interface NoveltyAnalysis {
  novel_aspects: string[];
  contrast_with_existing: string;
  summary: string;
}

interface NoveltyAnalysisPanelProps {
  novelty: NoveltyAnalysis;
}

export function NoveltyAnalysisPanel({ novelty }: NoveltyAnalysisPanelProps) {
  if (!novelty.novel_aspects?.length && !novelty.summary) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Novelty of the Proposed Solution</h3>
      </div>
      
      <div className="space-y-3">
        {novelty.summary && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Summary</h4>
            <p className="mt-1 font-academic text-foreground">{novelty.summary}</p>
          </div>
        )}
        
        {novelty.novel_aspects && novelty.novel_aspects.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Novel Aspects Identified</h4>
            <ul className="mt-1 list-disc space-y-1 pl-5 font-academic text-foreground">
              {novelty.novel_aspects.map((aspect, index) => (
                <li key={index}>{aspect}</li>
              ))}
            </ul>
          </div>
        )}
        
        {novelty.contrast_with_existing && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Contrast with Existing Approaches</h4>
            <p className="mt-1 font-academic text-foreground">{novelty.contrast_with_existing}</p>
          </div>
        )}
      </div>
    </div>
  );
}
