import { Hono } from "https://deno.land/x/hono@v4.3.11/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SemanticScholarPaper {
  paperId: string;
  title: string;
  abstract: string;
  url: string;
  authors: { name: string }[];
  year: number;
}

interface ArxivEntry {
  id: string[];
  title: string[];
  summary: string[];
  author?: { name: string[] }[];
}

const app = new Hono();

app.options('*', (c) => new Response(null, { headers: corsHeaders }));

app.post('/analyze-research', async (c) => {
  console.log('[analyze-research] Starting analysis');
  
  try {
    const authHeader = c.req.header('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || '' } },
    });

    const { analysisId, text, pdfExtractionStatus } = await c.req.json();
    console.log(`[analyze-research] Processing analysis: ${analysisId}`);

    if (!analysisId || !text) {
      return c.json({ error: 'Missing analysisId or text' }, 400);
    }

    // Extract references section
    const { bodyText, referencesText, detectionStatus } = extractReferences(text);
    console.log(`[analyze-research] Reference detection status: ${detectionStatus}`);

    // Fetch papers from Semantic Scholar and arXiv
    const papers = await fetchAcademicPapers(text.slice(0, 500));
    console.log(`[analyze-research] Fetched ${papers.length} papers`);

    // Generate research overview using AI
    const researchOverview = await generateResearchOverview(bodyText, lovableApiKey);
    console.log('[analyze-research] Generated research overview');

    // Generate novelty analysis
    const noveltyAnalysis = await generateNoveltyAnalysis(bodyText, lovableApiKey);
    console.log('[analyze-research] Generated novelty analysis');

    // Identify assumptions
    const identifiedAssumptions = await identifyAssumptions(bodyText, lovableApiKey);
    console.log('[analyze-research] Identified assumptions');

    // Perform similarity analysis using AI
    const { matches, overallScore, uniquenessLevel } = await performSimilarityAnalysis(
      bodyText,
      referencesText,
      papers,
      lovableApiKey
    );
    console.log(`[analyze-research] Found ${matches.length} matches, score: ${overallScore}`);

    // Generate dynamic guidance suggestions based on specific content
    const guidanceSuggestions = await generateDynamicGuidance(
      bodyText,
      matches,
      overallScore,
      uniquenessLevel,
      noveltyAnalysis,
      identifiedAssumptions,
      lovableApiKey
    );
    console.log('[analyze-research] Generated dynamic guidance');

    // Update analysis record
    const { error: updateError } = await supabase
      .from('analyses')
      .update({
        body_text: bodyText,
        references_text: referencesText,
        reference_detection_status: detectionStatus,
        pdf_extraction_status: pdfExtractionStatus || 'not_applicable',
        overall_similarity_score: overallScore,
        uniqueness_level: uniquenessLevel,
        research_overview: researchOverview,
        novelty_analysis: noveltyAnalysis,
        identified_assumptions: identifiedAssumptions,
        guidance_suggestions: guidanceSuggestions,
        status: 'completed',
      })
      .eq('id', analysisId);

    if (updateError) {
      console.error('[analyze-research] Update error:', updateError);
      throw updateError;
    }

    // Insert similarity matches
    if (matches.length > 0) {
      const matchRecords = matches.map((match) => ({
        analysis_id: analysisId,
        paper_title: match.paperTitle,
        paper_source: match.paperSource,
        paper_url: match.paperUrl,
        matched_text_user: match.matchedTextUser,
        matched_text_paper: match.matchedTextPaper,
        similarity_percentage: match.similarityPercentage,
        is_referenced: match.isReferenced,
        section_name: match.sectionName,
      }));

      const { error: matchError } = await supabase
        .from('similarity_matches')
        .insert(matchRecords);

      if (matchError) {
        console.error('[analyze-research] Match insert error:', matchError);
      }
    }

    return c.json({ success: true }, 200);
  } catch (error) {
    console.error('[analyze-research] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

function extractReferences(text: string): {
  bodyText: string;
  referencesText: string;
  detectionStatus: 'success' | 'failed';
} {
  const refPatterns = [
    /\n\s*(References|Bibliography|Works Cited|Literature Cited)\s*\n/i,
    /\n\s*REFERENCES\s*\n/,
  ];

  for (const pattern of refPatterns) {
    const match = text.match(pattern);
    if (match && match.index) {
      const bodyText = text.slice(0, match.index).trim();
      const referencesText = text.slice(match.index).trim();
      return { bodyText, referencesText, detectionStatus: 'success' };
    }
  }

  // Try position-based detection (last 20% of document)
  const lastQuarter = Math.floor(text.length * 0.8);
  const lastSection = text.slice(lastQuarter);
  
  if (lastSection.includes('[1]') || lastSection.includes('(1)') || /\d+\.\s+[A-Z]/.test(lastSection)) {
    return {
      bodyText: text.slice(0, lastQuarter).trim(),
      referencesText: lastSection.trim(),
      detectionStatus: 'success',
    };
  }

  return { bodyText: text, referencesText: '', detectionStatus: 'failed' };
}

async function fetchAcademicPapers(query: string): Promise<Array<{
  title: string;
  abstract: string;
  source: string;
  url: string;
}>> {
  const papers: Array<{ title: string; abstract: string; source: string; url: string }> = [];
  
  // Extract key terms for search
  const searchQuery = query
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 10)
    .join(' ');

  // Fetch from Semantic Scholar
  try {
    const ssResponse = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(searchQuery)}&limit=10&fields=title,abstract,url,authors,year`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (ssResponse.ok) {
      const ssData = await ssResponse.json();
      if (ssData.data) {
        for (const paper of ssData.data) {
          if (paper.title && paper.abstract) {
            papers.push({
              title: paper.title,
              abstract: paper.abstract,
              source: 'Semantic Scholar',
              url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('[fetchAcademicPapers] Semantic Scholar error:', err);
  }

  // Fetch from arXiv
  try {
    const arxivResponse = await fetch(
      `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(searchQuery)}&max_results=8`
    );
    
    if (arxivResponse.ok) {
      const arxivText = await arxivResponse.text();
      const entries = arxivText.match(/<entry>([\s\S]*?)<\/entry>/g) || [];
      
      for (const entry of entries) {
        const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
        const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
        const idMatch = entry.match(/<id>([\s\S]*?)<\/id>/);
        
        if (titleMatch && summaryMatch) {
          papers.push({
            title: titleMatch[1].replace(/\n/g, ' ').trim(),
            abstract: summaryMatch[1].replace(/\n/g, ' ').trim(),
            source: 'arXiv',
            url: idMatch ? idMatch[1].trim() : '',
          });
        }
      }
    }
  } catch (err) {
    console.error('[fetchAcademicPapers] arXiv error:', err);
  }

  console.log(`[fetchAcademicPapers] Total papers fetched: ${papers.length}`);
  return papers;
}

async function generateResearchOverview(text: string, apiKey: string | undefined): Promise<{
  problem_summary: string;
  methodology: string;
  contribution: string;
  domain: string;
}> {
  if (!apiKey) {
    return {
      problem_summary: 'Unable to generate overview - API key not configured',
      methodology: 'N/A',
      contribution: 'N/A',
      domain: 'Unknown',
    };
  }

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are an academic research analyst. Extract a neutral overview from the provided research text. Return ONLY valid JSON with these exact keys:
- problem_summary: A 1-2 sentence summary of the research problem
- methodology: A brief description of the approach or methods
- contribution: The intended contribution or impact
- domain: The research domain/field classification

Be factual and derive everything from the text. Do not speculate.`,
          },
          {
            role: 'user',
            content: text.slice(0, 4000),
          },
        ],
        temperature: 0.3,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
  } catch (err) {
    console.error('[generateResearchOverview] Error:', err);
  }

  return {
    problem_summary: 'Overview generation unavailable',
    methodology: 'Please review the text manually',
    contribution: 'Manual assessment required',
    domain: 'Unknown',
  };
}

async function generateNoveltyAnalysis(text: string, apiKey: string | undefined): Promise<{
  novel_aspects: string[];
  contrast_with_existing: string;
  summary: string;
}> {
  if (!apiKey) {
    return {
      novel_aspects: [],
      contrast_with_existing: '',
      summary: 'Novelty analysis unavailable - API key not configured',
    };
  }

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are an academic research analyst specializing in identifying novel contributions. Analyze the provided research text and identify what appears to be novel or unique about the proposed solution or approach.

Return ONLY valid JSON with these exact keys:
- novel_aspects: An array of strings, each describing a specific novel aspect identified in the work (max 5 items)
- contrast_with_existing: A 1-2 sentence description of how this work differs from commonly existing approaches
- summary: A concise 2-3 sentence summary of the novelty of the proposed solution

IMPORTANT:
- Derive everything only from the provided text - do not speculate or hallucinate
- Use neutral, academic language
- If insufficient content exists to identify novelty, return empty arrays and acknowledge limitations`,
          },
          {
            role: 'user',
            content: text.slice(0, 5000),
          },
        ],
        temperature: 0.3,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
  } catch (err) {
    console.error('[generateNoveltyAnalysis] Error:', err);
  }

  return {
    novel_aspects: [],
    contrast_with_existing: '',
    summary: 'Novelty analysis could not be completed',
  };
}

async function identifyAssumptions(text: string, apiKey: string | undefined): Promise<{
  assumptions: Array<{ statement: string; category: string }>;
}> {
  if (!apiKey) {
    return { assumptions: [] };
  }

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are an academic research analyst specializing in identifying assumptions in research work. Analyze the provided text and identify statements that assume conditions, availability of data, or system behavior.

Look for assumptions such as:
- Availability of datasets
- Reliability of external APIs or services
- Scalability or generalization claims
- Performance expectations
- Environmental or contextual conditions

Return ONLY valid JSON with this structure:
{
  "assumptions": [
    { "statement": "This work assumes...", "category": "Data Availability" },
    { "statement": "The approach relies on...", "category": "System Reliability" }
  ]
}

Categories should be one of: "Data Availability", "System Reliability", "Scalability", "Performance", "Environmental Conditions", "Generalization", "Resource Requirements", "Other"

IMPORTANT:
- Present assumptions as neutral observations, not criticism
- Derive only from the provided text
- Maximum 8 assumptions
- If no clear assumptions are found, return empty array`,
          },
          {
            role: 'user',
            content: text.slice(0, 5000),
          },
        ],
        temperature: 0.3,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
  } catch (err) {
    console.error('[identifyAssumptions] Error:', err);
  }

  return { assumptions: [] };
}

async function performSimilarityAnalysis(
  bodyText: string,
  referencesText: string,
  papers: Array<{ title: string; abstract: string; source: string; url: string }>,
  apiKey: string | undefined
): Promise<{
  matches: Array<{
    paperTitle: string;
    paperSource: string;
    paperUrl: string;
    matchedTextUser: string;
    matchedTextPaper: string;
    similarityPercentage: number;
    isReferenced: boolean;
    sectionName: string;
  }>;
  overallScore: number;
  uniquenessLevel: 'high' | 'medium' | 'low';
}> {
  if (!apiKey || papers.length === 0) {
    return { matches: [], overallScore: 0, uniquenessLevel: 'high' };
  }

  const matches: Array<{
    paperTitle: string;
    paperSource: string;
    paperUrl: string;
    matchedTextUser: string;
    matchedTextPaper: string;
    similarityPercentage: number;
    isReferenced: boolean;
    sectionName: string;
  }> = [];

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are an academic similarity analyzer. Compare the user's research text against the provided academic papers.

For each paper where you find conceptual or textual similarity:
1. Identify the similar portion from the user's text (quote exactly)
2. Identify the matching concept from the paper abstract
3. Estimate similarity percentage (0-100)
4. Mark the section of the user's text (introduction, methodology, results, discussion)

Return ONLY valid JSON array with objects containing:
- paperIndex: index of the matched paper (0-based)
- matchedTextUser: exact quote from user text (max 100 chars)
- matchedTextPaper: matching concept from paper (max 100 chars)
- similarityPercentage: number 0-100
- sectionName: string

Only include matches with similarity > 25%. Return empty array [] if no significant matches.`,
          },
          {
            role: 'user',
            content: JSON.stringify({
              userText: bodyText.slice(0, 3000),
              papers: papers.slice(0, 12).map((p, i) => ({
                index: i,
                title: p.title,
                abstract: p.abstract.slice(0, 500),
              })),
            }),
          },
        ],
        temperature: 0.2,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '[]';
      
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const rawMatches = JSON.parse(jsonMatch[0]);
        
        for (const m of rawMatches) {
          if (m.paperIndex !== undefined && m.paperIndex < papers.length) {
            const paper = papers[m.paperIndex];
            const isReferenced = checkIfReferenced(paper.title, referencesText);
            
            matches.push({
              paperTitle: paper.title,
              paperSource: paper.source,
              paperUrl: paper.url,
              matchedTextUser: m.matchedTextUser || '',
              matchedTextPaper: m.matchedTextPaper || '',
              similarityPercentage: m.similarityPercentage || 0,
              isReferenced,
              sectionName: m.sectionName || 'Unknown',
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('[performSimilarityAnalysis] Error:', err);
  }

  // Calculate overall score (only unreferenced similarity counts)
  const unreferencedMatches = matches.filter(m => !m.isReferenced);
  const overallScore = unreferencedMatches.length > 0
    ? unreferencedMatches.reduce((sum, m) => sum + m.similarityPercentage, 0) / unreferencedMatches.length
    : 0;

  const uniquenessLevel: 'high' | 'medium' | 'low' = 
    overallScore <= 20 ? 'high' : overallScore <= 50 ? 'medium' : 'low';

  return { matches, overallScore, uniquenessLevel };
}

function checkIfReferenced(paperTitle: string, referencesText: string): boolean {
  if (!referencesText) return false;
  
  // Normalize both texts
  const normalizedRef = referencesText.toLowerCase();
  const words = paperTitle.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  
  // Check if significant title words appear in references
  const matchingWords = words.filter(word => normalizedRef.includes(word));
  return matchingWords.length >= Math.min(3, words.length * 0.5);
}

async function generateDynamicGuidance(
  bodyText: string,
  matches: Array<{ paperTitle: string; isReferenced: boolean; sectionName: string; similarityPercentage: number }>,
  overallScore: number,
  uniquenessLevel: 'high' | 'medium' | 'low',
  noveltyAnalysis: { novel_aspects: string[]; contrast_with_existing: string; summary: string },
  assumptions: { assumptions: Array<{ statement: string; category: string }> },
  apiKey: string | undefined
): Promise<Array<{ type: 'citation' | 'rewrite' | 'positive'; section?: string; message: string }>> {
  if (!apiKey) {
    return generateFallbackGuidance(matches, overallScore, uniquenessLevel);
  }

  try {
    const unreferencedMatches = matches.filter(m => !m.isReferenced);
    const referencedMatches = matches.filter(m => m.isReferenced);
    
    // Build context about the specific paper
    const analysisContext = {
      overallScore: Math.round(overallScore),
      uniquenessLevel,
      unreferencedMatchCount: unreferencedMatches.length,
      referencedMatchCount: referencedMatches.length,
      affectedSections: [...new Set(unreferencedMatches.map(m => m.sectionName))],
      matchedPapers: unreferencedMatches.slice(0, 5).map(m => ({
        title: m.paperTitle,
        section: m.sectionName,
        similarity: m.similarityPercentage
      })),
      novelAspects: noveltyAnalysis.novel_aspects.slice(0, 3),
      hasAssumptions: assumptions.assumptions.length > 0,
      assumptionCategories: [...new Set(assumptions.assumptions.map(a => a.category))]
    };

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are an academic writing advisor providing constructive, specific guidance. Based on the analysis context provided, generate 3-6 unique guidance suggestions that are specific to this particular research work.

Return ONLY valid JSON array with objects containing:
- type: "positive" | "citation" | "rewrite"
- section: (optional) specific section name if applicable
- message: A specific, actionable suggestion (1-2 sentences, max 150 chars)

Guidelines:
1. Each suggestion must be unique - no duplicates or near-duplicates
2. Be specific to the content - reference actual matched papers, sections, or identified aspects
3. Balance positive observations with constructive advice
4. For high uniqueness (${uniquenessLevel === 'high' ? 'this paper' : 'not this paper'}): emphasize strengths
5. For low uniqueness: focus on specific areas needing improvement
6. Consider the novel aspects and assumptions when giving advice
7. Never be accusatory - maintain supportive, academic tone
8. Vary the phrasing - do not repeat similar sentence structures`
          },
          {
            role: 'user',
            content: JSON.stringify({
              context: analysisContext,
              textSample: bodyText.slice(0, 1500)
            })
          }
        ],
        temperature: 0.6, // Higher temperature for more varied responses
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '[]';
      
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]);
        
        // Validate and deduplicate
        const validSuggestions: Array<{ type: 'citation' | 'rewrite' | 'positive'; section?: string; message: string }> = [];
        const seenMessages = new Set<string>();
        
        for (const s of suggestions) {
          if (s.type && s.message && !seenMessages.has(s.message.toLowerCase())) {
            validSuggestions.push({
              type: s.type,
              section: s.section || undefined,
              message: s.message
            });
            seenMessages.add(s.message.toLowerCase());
          }
        }
        
        if (validSuggestions.length >= 2) {
          return validSuggestions;
        }
      }
    }
  } catch (err) {
    console.error('[generateDynamicGuidance] Error:', err);
  }

  // Fall back to rule-based guidance
  return generateFallbackGuidance(matches, overallScore, uniquenessLevel);
}

function generateFallbackGuidance(
  matches: Array<{ isReferenced: boolean; sectionName: string; similarityPercentage: number }>,
  overallScore: number,
  uniquenessLevel: 'high' | 'medium' | 'low'
): Array<{ type: 'citation' | 'rewrite' | 'positive'; section?: string; message: string }> {
  const suggestions: Array<{ type: 'citation' | 'rewrite' | 'positive'; section?: string; message: string }> = [];
  
  const unreferencedMatches = matches.filter(m => !m.isReferenced);
  const referencedCount = matches.filter(m => m.isReferenced).length;

  // Positive feedback for high uniqueness
  if (uniquenessLevel === 'high') {
    suggestions.push({
      type: 'positive',
      message: 'Your research demonstrates strong originality with minimal overlap to indexed literature.',
    });
  } else if (uniquenessLevel === 'medium') {
    suggestions.push({
      type: 'positive',
      message: 'Your work shows a reasonable level of originality while building on established research.',
    });
  }

  // Identify specific sections needing attention
  const sectionCounts = new Map<string, number>();
  for (const m of unreferencedMatches) {
    if (m.sectionName && m.sectionName !== 'Unknown') {
      sectionCounts.set(m.sectionName, (sectionCounts.get(m.sectionName) || 0) + 1);
    }
  }

  // Add section-specific suggestions (max 2)
  const sortedSections = [...sectionCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);
  for (const [section] of sortedSections) {
    suggestions.push({
      type: 'citation',
      section,
      message: `The ${section.toLowerCase()} section contains unreferenced similar content. Consider reviewing and adding appropriate citations.`,
    });
  }

  // Add rewrite suggestion for high similarity
  if (overallScore > 40 && unreferencedMatches.length > 0) {
    suggestions.push({
      type: 'rewrite',
      message: 'Some passages show notable similarity to existing work. Consider rephrasing to better highlight your unique perspective.',
    });
  }

  // Acknowledge properly referenced content
  if (referencedCount > 0) {
    suggestions.push({
      type: 'positive',
      message: `${referencedCount} similar passage${referencedCount > 1 ? 's are' : ' is'} properly attributed, reflecting good citation practice.`,
    });
  }

  return suggestions;
}

Deno.serve(app.fetch);
