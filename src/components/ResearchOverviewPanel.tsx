import { ResearchOverview } from '@/types/analysis';

interface ResearchOverviewPanelProps {
  overview: ResearchOverview;
}

export function ResearchOverviewPanel({ overview }: ResearchOverviewPanelProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Research Overview</h3>
      
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Research Problem</h4>
          <p className="mt-1 font-academic text-foreground">{overview.problem_summary}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Methodology / Approach</h4>
          <p className="mt-1 font-academic text-foreground">{overview.methodology}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Intended Contribution</h4>
          <p className="mt-1 font-academic text-foreground">{overview.contribution}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Research Domain</h4>
          <p className="mt-1">
            <span className="rounded bg-primary/10 px-2 py-1 text-sm font-medium text-primary">
              {overview.domain}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
