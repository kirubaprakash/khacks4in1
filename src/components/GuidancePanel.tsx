import { GuidanceSuggestion } from '@/types/analysis';
import { Lightbulb, AlertCircle, CheckCircle } from 'lucide-react';

interface GuidancePanelProps {
  suggestions: GuidanceSuggestion[];
  uniquenessLevel?: 'high' | 'medium' | 'low';
}

export function GuidancePanel({ suggestions, uniquenessLevel }: GuidancePanelProps) {
  const getIcon = (type: GuidanceSuggestion['type']) => {
    switch (type) {
      case 'positive':
        return <CheckCircle className="h-5 w-5 text-originality-unique" />;
      case 'citation':
        return <AlertCircle className="h-5 w-5 text-originality-referenced" />;
      case 'rewrite':
        return <Lightbulb className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Research Guidance</h3>
        {uniquenessLevel && (
          <span className={`rounded px-3 py-1 text-sm font-medium ${
            uniquenessLevel === 'high' 
              ? 'bg-originality-unique-bg text-originality-unique' 
              : uniquenessLevel === 'medium'
              ? 'bg-originality-referenced-bg text-originality-referenced'
              : 'bg-originality-risk-bg text-originality-risk'
          }`}>
            {uniquenessLevel.charAt(0).toUpperCase() + uniquenessLevel.slice(1)} Uniqueness
          </span>
        )}
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div 
            key={index}
            className="flex items-start gap-3 rounded border border-border bg-muted/30 p-4"
          >
            {getIcon(suggestion.type)}
            <div>
              {suggestion.section && (
                <span className="mb-1 block text-xs font-medium text-muted-foreground">
                  {suggestion.section}
                </span>
              )}
              <p className="font-academic text-foreground">{suggestion.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
