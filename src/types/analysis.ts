export interface SimilarityMatch {
  id: string;
  paper_title: string;
  paper_source: string;
  paper_url?: string;
  matched_text_user: string;
  matched_text_paper: string;
  similarity_percentage: number;
  is_referenced: boolean;
  section_name?: string;
}

export interface ResearchOverview {
  problem_summary: string;
  methodology: string;
  contribution: string;
  domain: string;
}

export interface GuidanceSuggestion {
  type: 'citation' | 'rewrite' | 'positive';
  section?: string;
  message: string;
}

export interface NoveltyAnalysis {
  novel_aspects: string[];
  contrast_with_existing: string;
  summary: string;
}

export interface IdentifiedAssumptions {
  assumptions: {
    statement: string;
    category: string;
  }[];
}

export interface Analysis {
  id: string;
  user_id: string;
  title: string;
  input_type: 'text' | 'pdf';
  original_text: string;
  body_text?: string;
  references_text?: string;
  reference_detection_status: 'pending' | 'success' | 'failed';
  pdf_extraction_status?: 'success' | 'partial' | 'failed' | 'not_applicable';
  overall_similarity_score?: number;
  uniqueness_level?: 'high' | 'medium' | 'low';
  research_overview?: ResearchOverview;
  novelty_analysis?: NoveltyAnalysis;
  identified_assumptions?: IdentifiedAssumptions;
  guidance_suggestions?: GuidanceSuggestion[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  similarity_matches?: SimilarityMatch[];
}

export interface HighlightedSegment {
  text: string;
  type: 'unique' | 'referenced' | 'unreferenced';
  matchInfo?: {
    paperTitle: string;
    paperSource: string;
    similarityPercentage: number;
    isReferenced: boolean;
  };
}
