import { AlertCircle } from 'lucide-react';

export interface IdentifiedAssumptions {
  assumptions: {
    statement: string;
    category: string;
  }[];
}

interface AssumptionsPanelProps {
  assumptions: IdentifiedAssumptions;
}

export function AssumptionsPanel({ assumptions }: AssumptionsPanelProps) {
  if (!assumptions.assumptions?.length) {
    return null;
  }

  // Group assumptions by category
  const groupedAssumptions = assumptions.assumptions.reduce((acc, item) => {
    const category = item.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item.statement);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Identified Assumptions in the Submitted Work</h3>
      </div>
      
      <p className="text-sm text-muted-foreground">
        The following assumptions were identified in the submitted content. These observations are presented neutrally for consideration.
      </p>
      
      <div className="space-y-4">
        {Object.entries(groupedAssumptions).map(([category, items]) => (
          <div key={category}>
            <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
            <ul className="mt-1 list-disc space-y-1 pl-5 font-academic text-foreground">
              {items.map((statement, index) => (
                <li key={index}>{statement}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
