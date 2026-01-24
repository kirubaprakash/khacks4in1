interface OriginalityScoreProps {
  score: number;
  uniquenessLevel: 'high' | 'medium' | 'low';
  referencedCount: number;
  unreferencedCount: number;
}

export function OriginalityScore({ 
  score, 
  uniquenessLevel, 
  referencedCount, 
  unreferencedCount 
}: OriginalityScoreProps) {
  return (
    <div className="border-b border-border bg-muted/20 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Originality Score (Unreferenced Similarity)
          </h3>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-3xl font-semibold ${
              score <= 20 
                ? 'text-originality-unique' 
                : score <= 50
                ? 'text-originality-referenced'
                : 'text-originality-risk'
            }`}>
              {(100 - score).toFixed(1)}%
            </span>
            <span className="text-sm text-muted-foreground">original</span>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="text-center">
            <span className="block text-2xl font-semibold text-originality-unique">
              {referencedCount}
            </span>
            <span className="text-xs text-muted-foreground">Properly Referenced</span>
          </div>
          <div className="text-center">
            <span className="block text-2xl font-semibold text-originality-risk">
              {unreferencedCount}
            </span>
            <span className="text-xs text-muted-foreground">Unreferenced</span>
          </div>
        </div>

        <div className={`rounded px-4 py-2 ${
          uniquenessLevel === 'high' 
            ? 'bg-originality-unique-bg text-originality-unique' 
            : uniquenessLevel === 'medium'
            ? 'bg-originality-referenced-bg text-originality-referenced'
            : 'bg-originality-risk-bg text-originality-risk'
        }`}>
          <span className="text-sm font-medium">
            {uniquenessLevel.charAt(0).toUpperCase() + uniquenessLevel.slice(1)} Uniqueness
          </span>
        </div>
      </div>
    </div>
  );
}
