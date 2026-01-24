import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Table } from 'lucide-react';
import { Analysis, SimilarityMatch } from '@/types/analysis';
import { downloadReport, downloadCSV } from '@/lib/reportExporter';
import { useToast } from '@/hooks/use-toast';

interface ReportExportButtonProps {
  analysis: Analysis;
  matches: SimilarityMatch[];
}

export function ReportExportButton({ analysis, matches }: ReportExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExportText = async () => {
    setIsExporting(true);
    try {
      downloadReport({ analysis, matches });
      toast({
        title: 'Report exported',
        description: 'Full analysis report has been downloaded.',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      downloadCSV({ analysis, matches });
      toast({
        title: 'CSV exported',
        description: 'Similarity matches exported to CSV file.',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to generate CSV. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting} className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportText} className="gap-2">
          <FileText className="h-4 w-4" />
          Full Report (TXT)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportCSV} className="gap-2">
          <Table className="h-4 w-4" />
          Matches Only (CSV)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
