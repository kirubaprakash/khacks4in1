import { Analysis, SimilarityMatch, ResearchOverview, GuidanceSuggestion } from '@/types/analysis';

export interface ReportData {
  analysis: Analysis;
  matches: SimilarityMatch[];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getUniquenessLabel(level: string | null | undefined): string {
  switch (level) {
    case 'high': return 'High Uniqueness';
    case 'medium': return 'Medium Uniqueness';
    case 'low': return 'Low Uniqueness';
    default: return 'Not Assessed';
  }
}

export function generateTextReport(data: ReportData): string {
  const { analysis, matches } = data;
  const overview = analysis.research_overview as ResearchOverview | null;
  const suggestions = analysis.guidance_suggestions as GuidanceSuggestion[] | null;
  
  const referencedCount = matches.filter(m => m.is_referenced).length;
  const unreferencedCount = matches.filter(m => !m.is_referenced).length;
  
  let report = `
================================================================================
ACADEMIC RESEARCH SIMILARITY & ORIGINALITY ANALYSIS REPORT
================================================================================

ANALYSIS DETAILS
--------------------------------------------------------------------------------
Title: ${analysis.title}
Date: ${formatDate(analysis.created_at)}
Input Type: ${analysis.input_type === 'pdf' ? 'PDF Document' : 'Text Input'}
Status: ${analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1)}

ORIGINALITY ASSESSMENT
--------------------------------------------------------------------------------
Overall Similarity Score: ${analysis.overall_similarity_score !== null ? `${analysis.overall_similarity_score.toFixed(1)}%` : 'N/A'}
Uniqueness Level: ${getUniquenessLabel(analysis.uniqueness_level)}
Reference Detection: ${analysis.reference_detection_status === 'success' ? 'Successful' : 'Failed'}

Properly Referenced Matches: ${referencedCount}
Unreferenced Matches: ${unreferencedCount}
`;

  if (overview) {
    report += `
RESEARCH OVERVIEW
--------------------------------------------------------------------------------
Problem Summary: ${overview.problem_summary || 'N/A'}
Methodology: ${overview.methodology || 'N/A'}
Contribution: ${overview.contribution || 'N/A'}
Research Domain: ${overview.domain || 'N/A'}
`;
  }

  if (matches.length > 0) {
    report += `
SIMILARITY MATCHES
--------------------------------------------------------------------------------
`;
    matches.forEach((match, index) => {
      report += `
[${index + 1}] ${match.paper_title}
    Source: ${match.paper_source}
    Similarity: ${match.similarity_percentage.toFixed(1)}%
    Status: ${match.is_referenced ? 'Properly Referenced' : 'UNREFERENCED'}
    Section: ${match.section_name || 'Unknown'}
    ${match.paper_url ? `URL: ${match.paper_url}` : ''}
    
    Your Text: "${match.matched_text_user}"
    Matched Concept: "${match.matched_text_paper}"
`;
    });
  }

  if (suggestions && suggestions.length > 0) {
    report += `
RECOMMENDATIONS
--------------------------------------------------------------------------------
`;
    suggestions.forEach((suggestion, index) => {
      const typeLabel = suggestion.type === 'positive' ? '✓' : suggestion.type === 'citation' ? '!' : '→';
      report += `${typeLabel} ${suggestion.message}\n`;
    });
  }

  report += `
================================================================================
DISCLAIMER
--------------------------------------------------------------------------------
Similarity results are relative to the indexed academic literature and do not 
constitute a plagiarism verdict. This analysis is provided for academic guidance 
purposes only.
================================================================================
`;

  return report;
}

export function downloadReport(data: ReportData): void {
  const report = generateTextReport(data);
  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${data.analysis.title.replace(/[^a-z0-9]/gi, '_')}_report.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateCSVReport(data: ReportData): string {
  const { analysis, matches } = data;
  
  let csv = 'Paper Title,Source,Similarity %,Referenced,Section,Your Text,Matched Text,URL\n';
  
  matches.forEach(match => {
    const row = [
      `"${match.paper_title.replace(/"/g, '""')}"`,
      match.paper_source,
      match.similarity_percentage.toFixed(1),
      match.is_referenced ? 'Yes' : 'No',
      match.section_name || 'Unknown',
      `"${match.matched_text_user.replace(/"/g, '""')}"`,
      `"${match.matched_text_paper.replace(/"/g, '""')}"`,
      match.paper_url || '',
    ];
    csv += row.join(',') + '\n';
  });
  
  return csv;
}

export function downloadCSV(data: ReportData): void {
  const csv = generateCSVReport(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${data.analysis.title.replace(/[^a-z0-9]/gi, '_')}_matches.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
