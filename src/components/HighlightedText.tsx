import { useState } from 'react';
import { HighlightedSegment } from '@/types/analysis';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HighlightedTextProps {
  segments: HighlightedSegment[];
}

export function HighlightedText({ segments }: HighlightedTextProps) {
  return (
    <div className="font-academic text-base leading-relaxed">
      {segments.map((segment, index) => {
        if (segment.type === 'unique') {
          return (
            <span key={index} className="highlight-unique">
              {segment.text}
            </span>
          );
        }

        const highlightClass = segment.type === 'referenced' 
          ? 'highlight-referenced cursor-help' 
          : 'highlight-risk cursor-help';

        return (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <span className={highlightClass}>
                {segment.text}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-sm">
              {segment.matchInfo && (
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{segment.matchInfo.paperTitle}</p>
                  <p className="text-muted-foreground">
                    Source: {segment.matchInfo.paperSource}
                  </p>
                  <p className="text-muted-foreground">
                    Similarity: {segment.matchInfo.similarityPercentage.toFixed(1)}%
                  </p>
                  <p className={segment.matchInfo.isReferenced 
                    ? 'text-originality-unique' 
                    : 'text-originality-risk'
                  }>
                    {segment.matchInfo.isReferenced 
                      ? '✓ Properly cited in references' 
                      : '⚠ No citation found'}
                  </p>
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
