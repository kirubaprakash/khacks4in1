import { SimilarityMatch } from '@/types/analysis';
import { ExternalLink, Check, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface SideBySideComparisonProps {
  matches: SimilarityMatch[];
}

export function SideBySideComparison({ matches }: SideBySideComparisonProps) {
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);

  if (matches.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No similarity matches found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => (
        <div 
          key={match.id} 
          className={`rounded border ${
            match.is_referenced 
              ? 'border-originality-referenced/30 bg-originality-referenced-bg/50' 
              : 'border-originality-risk/30 bg-originality-risk-bg/50'
          }`}
        >
          {/* Header */}
          <button
            onClick={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {match.is_referenced ? (
                  <Check className="h-4 w-4 flex-shrink-0 text-originality-unique" />
                ) : (
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 text-originality-risk" />
                )}
                <span className="truncate font-medium text-sm">{match.paper_title}</span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="rounded bg-muted px-1.5 py-0.5">{match.paper_source}</span>
                <span className={`font-mono ${
                  match.similarity_percentage > 70 
                    ? 'text-originality-risk' 
                    : match.similarity_percentage > 40 
                    ? 'text-originality-referenced' 
                    : ''
                }`}>
                  {match.similarity_percentage.toFixed(1)}% similar
                </span>
                {match.section_name && (
                  <span>Section: {match.section_name}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-2">
              {match.paper_url && (
                <a 
                  href={match.paper_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-primary hover:underline p-1"
                  title="View paper"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              {expandedMatch === match.id ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>

          {/* Expanded Content - Side by Side */}
          {expandedMatch === match.id && (
            <div className="border-t border-border/50 px-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                {/* User's Text */}
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Your Text
                  </h4>
                  <div className={`rounded border p-3 text-sm font-academic leading-relaxed ${
                    match.is_referenced 
                      ? 'border-originality-referenced/50 bg-originality-referenced-bg' 
                      : 'border-originality-risk/50 bg-originality-risk-bg'
                  }`}>
                    "{match.matched_text_user}"
                  </div>
                </div>

                {/* Paper's Text */}
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Matched Paper Content
                  </h4>
                  <div className="rounded border border-border bg-muted/30 p-3 text-sm font-academic leading-relaxed">
                    "{match.matched_text_paper}"
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className={`inline-flex items-center gap-1.5 ${
                  match.is_referenced ? 'text-originality-unique' : 'text-originality-risk'
                }`}>
                  {match.is_referenced ? (
                    <>
                      <Check className="h-4 w-4" />
                      This similarity is properly referenced in your citations
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4" />
                      Consider adding a citation to reduce originality risk
                    </>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
