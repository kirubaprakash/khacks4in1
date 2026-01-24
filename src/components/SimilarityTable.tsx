import { SimilarityMatch } from '@/types/analysis';
import { ExternalLink, Check, AlertTriangle } from 'lucide-react';

interface SimilarityTableProps {
  matches: SimilarityMatch[];
}

export function SimilarityTable({ matches }: SimilarityTableProps) {
  if (matches.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No similarity matches found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="academic-table">
        <thead>
          <tr>
            <th>Paper Title</th>
            <th>Source</th>
            <th>Similarity</th>
            <th>Reference Status</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((match) => (
            <tr key={match.id}>
              <td className="max-w-xs">
                <div className="flex items-start gap-2">
                  <span className="line-clamp-2 font-medium">{match.paper_title}</span>
                  {match.paper_url && (
                    <a 
                      href={match.paper_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </td>
              <td>
                <span className="rounded bg-muted px-2 py-1 text-xs font-medium">
                  {match.paper_source}
                </span>
              </td>
              <td>
                <span className={`font-mono text-sm ${
                  match.similarity_percentage > 70 
                    ? 'text-originality-risk' 
                    : match.similarity_percentage > 40 
                    ? 'text-originality-referenced' 
                    : 'text-foreground'
                }`}>
                  {match.similarity_percentage.toFixed(1)}%
                </span>
              </td>
              <td>
                {match.is_referenced ? (
                  <span className="inline-flex items-center gap-1 text-originality-unique">
                    <Check className="h-4 w-4" />
                    Properly Referenced
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-originality-risk">
                    <AlertTriangle className="h-4 w-4" />
                    Unreferenced
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
