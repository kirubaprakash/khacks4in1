export function HighlightLegend() {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <span className="text-xs font-medium text-muted-foreground">Legend:</span>
      <div className="flex items-center gap-3">
        <span className="highlight-unique px-1.5 py-0.5 text-xs">Unique</span>
        <span className="highlight-referenced px-1.5 py-0.5 text-xs">Referenced</span>
        <span className="highlight-risk px-1.5 py-0.5 text-xs">Unreferenced</span>
      </div>
    </div>
  );
}
