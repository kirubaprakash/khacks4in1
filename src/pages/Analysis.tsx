import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HighlightLegend } from '@/components/HighlightLegend';
import { SimilarityTable } from '@/components/SimilarityTable';
import { SideBySideComparison } from '@/components/SideBySideComparison';
import { ResearchOverviewPanel } from '@/components/ResearchOverviewPanel';
import { NoveltyAnalysisPanel, NoveltyAnalysis } from '@/components/NoveltyAnalysisPanel';
import { AssumptionsPanel, IdentifiedAssumptions } from '@/components/AssumptionsPanel';
import { PDFExtractionWarning } from '@/components/PDFExtractionWarning';
import { ReferenceDetectionWarning } from '@/components/ReferenceDetectionWarning';
import { GuidancePanel } from '@/components/GuidancePanel';
import { OriginalityScore } from '@/components/OriginalityScore';
import { HighlightedText } from '@/components/HighlightedText';
import { Disclaimer } from '@/components/Disclaimer';
import { ReportExportButton } from '@/components/ReportExportButton';
import { Analysis, SimilarityMatch, HighlightedSegment, ResearchOverview, GuidanceSuggestion } from '@/types/analysis';
import { Upload, FileText, AlertTriangle, Loader2, Table, Columns } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { extractTextFromPDF } from '@/lib/pdfExtractor';
export default function AnalysisPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [inputType, setInputType] = useState<'text' | 'pdf'>('text');
  const [title, setTitle] = useState('');
  const [textInput, setTextInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [matches, setMatches] = useState<SimilarityMatch[]>([]);
  const [highlightedSegments, setHighlightedSegments] = useState<HighlightedSegment[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (id && user) {
      fetchAnalysis(id);
    }
  }, [id, user]);

  // Poll for analysis completion when status is processing
  useEffect(() => {
    if (!analysis || analysis.status !== 'processing') return;

    const pollInterval = setInterval(async () => {
      const { data: updatedAnalysis } = await supabase
        .from('analyses')
        .select('status')
        .eq('id', analysis.id)
        .single();

      if (updatedAnalysis && updatedAnalysis.status !== 'processing') {
        // Refetch full analysis when completed
        fetchAnalysis(analysis.id);
        clearInterval(pollInterval);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [analysis?.id, analysis?.status]);

  const fetchAnalysis = async (analysisId: string) => {
    const { data: analysisData, error: analysisError } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', analysisId)
      .single();

    if (analysisError || !analysisData) {
      toast({
        title: 'Error',
        description: 'Analysis not found',
        variant: 'destructive',
      });
      navigate('/dashboard');
      return;
    }

    const { data: matchesData } = await supabase
      .from('similarity_matches')
      .select('*')
      .eq('analysis_id', analysisId);

    setAnalysis(analysisData as unknown as Analysis);
    setMatches((matchesData || []) as unknown as SimilarityMatch[]);
    
    // Generate highlighted segments from matches
    generateHighlightedSegments(
      analysisData.body_text || analysisData.original_text, 
      (matchesData || []) as unknown as SimilarityMatch[]
    );
  };

  const generateHighlightedSegments = (text: string, matches: SimilarityMatch[]) => {
    if (matches.length === 0) {
      setHighlightedSegments([{ text, type: 'unique' }]);
      return;
    }

    // Simple segmentation - in production this would be more sophisticated
    const segments: HighlightedSegment[] = [];
    let currentIndex = 0;
    const sortedMatches = [...matches].sort((a, b) => 
      text.indexOf(a.matched_text_user) - text.indexOf(b.matched_text_user)
    );

    for (const match of sortedMatches) {
      const matchIndex = text.indexOf(match.matched_text_user, currentIndex);
      if (matchIndex > currentIndex) {
        segments.push({
          text: text.slice(currentIndex, matchIndex),
          type: 'unique',
        });
      }
      if (matchIndex >= 0) {
        segments.push({
          text: match.matched_text_user,
          type: match.is_referenced ? 'referenced' : 'unreferenced',
          matchInfo: {
            paperTitle: match.paper_title,
            paperSource: match.paper_source,
            similarityPercentage: match.similarity_percentage,
            isReferenced: match.is_referenced,
          },
        });
        currentIndex = matchIndex + match.matched_text_user.length;
      }
    }

    if (currentIndex < text.length) {
      segments.push({
        text: text.slice(currentIndex),
        type: 'unique',
      });
    }

    setHighlightedSegments(segments);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace('.pdf', ''));
      }
    } else {
      toast({
        title: 'Invalid file',
        description: 'Please upload a PDF file',
        variant: 'destructive',
      });
    }
  };

  const handleAnalyze = async () => {
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for your analysis',
        variant: 'destructive',
      });
      return;
    }

    if (inputType === 'text' && !textInput.trim()) {
      toast({
        title: 'Content required',
        description: 'Please enter your research text',
        variant: 'destructive',
      });
      return;
    }

    if (inputType === 'pdf' && !selectedFile) {
      toast({
        title: 'File required',
        description: 'Please upload a PDF file',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      let originalText = textInput;
      let pdfExtractionStatus: 'success' | 'partial' | 'failed' | 'not_applicable' = 'not_applicable';
      
      // For PDF, extract text using pdfjs-dist
      if (inputType === 'pdf' && selectedFile) {
        toast({
          title: 'Extracting PDF',
          description: 'Extracting text from your PDF document...',
        });
        
        const extractionResult = await extractTextFromPDF(selectedFile);
        pdfExtractionStatus = extractionResult.status;
        
        if (extractionResult.status === 'failed' || !extractionResult.text) {
          toast({
            title: 'PDF Extraction Failed',
            description: extractionResult.error || 'Could not extract text from PDF',
            variant: 'destructive',
          });
          setIsAnalyzing(false);
          return;
        }
        
        if (extractionResult.status === 'partial') {
          toast({
            title: 'Partial PDF Extraction',
            description: extractionResult.error || `Extracted ${extractionResult.extractedPages} of ${extractionResult.pageCount} pages.`,
          });
        } else {
          toast({
            title: 'PDF Extracted',
            description: `Extracted ${extractionResult.pageCount} pages. Starting analysis...`,
          });
        }
        
        originalText = extractionResult.text;
      }

      const { data: analysisData, error: insertError } = await supabase
        .from('analyses')
        .insert({
          user_id: user!.id,
          title: title.trim(),
          input_type: inputType,
          original_text: originalText,
          pdf_extraction_status: pdfExtractionStatus,
          status: 'processing',
        })
        .select()
        .single();

      if (insertError || !analysisData) {
        throw new Error('Failed to create analysis');
      }

      // Navigate immediately to the analysis page - it will poll for results
      navigate(`/analysis/${analysisData.id}`);

      // Call the analysis edge function in the background (fire and forget)
      supabase.functions.invoke('analyze-research', {
        body: {
          analysisId: analysisData.id,
          text: originalText,
          pdfExtractionStatus,
        },
      }).then(({ error: fnError }) => {
        if (fnError) {
          console.error('Analysis error:', fnError);
          supabase
            .from('analyses')
            .update({ status: 'failed' })
            .eq('id', analysisData.id);
        }
      }).catch((error) => {
        console.error('Edge function error:', error);
        supabase
          .from('analyses')
          .update({ status: 'failed' })
          .eq('id', analysisData.id);
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to start analysis. Please try again.',
        variant: 'destructive',
      });
      setIsAnalyzing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="flex h-[calc(100vh-65px)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  const referencedCount = matches.filter(m => m.is_referenced).length;
  const unreferencedCount = matches.filter(m => !m.is_referenced).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex h-[calc(100vh-65px)]">
        {/* Left Panel - Input */}
        <div className="w-1/2 overflow-y-auto border-r border-border p-6">
          {!analysis ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">New Analysis</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Submit your research idea or paper for originality analysis
                </p>
              </div>

              <div>
                <Label htmlFor="title">Analysis Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Deep Learning for Climate Prediction"
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant={inputType === 'text' ? 'default' : 'outline'}
                  onClick={() => setInputType('text')}
                  className="flex-1 gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Paste Text
                </Button>
                <Button
                  variant={inputType === 'pdf' ? 'default' : 'outline'}
                  onClick={() => setInputType('pdf')}
                  className="flex-1 gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload PDF
                </Button>
              </div>

              {inputType === 'text' ? (
                <div>
                  <Label htmlFor="research-text">Research Content</Label>
                  <Textarea
                    id="research-text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Paste your research idea, abstract, or paper content here..."
                    className="mt-1 min-h-[300px] font-academic"
                  />
                </div>
              ) : (
                <div className="mt-4">
                  <Label htmlFor="pdf-upload">Upload PDF</Label>
                  <div className="mt-1 flex items-center justify-center rounded border-2 border-dashed border-border px-6 py-12">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="mt-4">
                        <label
                          htmlFor="pdf-upload"
                          className="cursor-pointer font-medium text-primary hover:underline"
                        >
                          Upload a PDF file
                        </label>
                        <input
                          id="pdf-upload"
                          type="file"
                          accept=".pdf"
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </div>
                      {selectedFile && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Selected: {selectedFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Start Analysis'
                )}
              </Button>

              <Disclaimer />
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">{analysis.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {analysis.input_type === 'pdf' ? 'PDF Analysis' : 'Text Analysis'}
                </p>
              </div>

              {/* PDF Extraction Warning */}
              {analysis.input_type === 'pdf' && analysis.pdf_extraction_status && (
                <PDFExtractionWarning 
                  status={analysis.pdf_extraction_status as 'success' | 'partial' | 'failed' | 'not_applicable'} 
                />
              )}

              {/* Reference Detection Warning */}
              <ReferenceDetectionWarning 
                status={analysis.reference_detection_status as 'pending' | 'success' | 'failed'} 
                inputType={analysis.input_type}
              />

              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                  Analyzed Content
                </h3>
                <div className="max-h-96 overflow-y-auto rounded border border-border bg-muted/20 p-4">
                  <HighlightedText segments={highlightedSegments} />
                </div>
              </div>

              <Disclaimer />
            </div>
          )}
        </div>

        {/* Right Panel - Results */}
        <div className="w-1/2 overflow-y-auto bg-muted/10">
          {!analysis ? (
            <div className="flex h-full items-center justify-center p-6">
              <div className="text-center">
                <FileText className="mx-auto h-16 w-16 text-muted-foreground/30" />
                <p className="mt-4 text-muted-foreground">
                  Submit your research to see analysis results
                </p>
              </div>
            </div>
          ) : analysis.status === 'processing' ? (
            <div className="flex h-full items-center justify-center p-6">
              <div className="text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">
                  Analyzing your research...
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Comparing against academic literature
                </p>
              </div>
            </div>
          ) : analysis.status === 'failed' ? (
            <div className="flex h-full items-center justify-center p-6">
              <div className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-originality-risk" />
                <p className="mt-4 font-medium text-foreground">
                  Analysis Failed
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  There was an error processing your research
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/analysis')}
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-border px-6 py-3">
                <HighlightLegend />
                <ReportExportButton analysis={analysis} matches={matches} />
              </div>
              
              {analysis.overall_similarity_score !== null && 
               analysis.overall_similarity_score !== undefined && 
               analysis.uniqueness_level && (
                <OriginalityScore
                  score={analysis.overall_similarity_score}
                  uniquenessLevel={analysis.uniqueness_level}
                  referencedCount={referencedCount}
                  unreferencedCount={unreferencedCount}
                />
              )}

              <div className="space-y-6 p-6">
                {analysis.research_overview && (
                  <ResearchOverviewPanel 
                    overview={analysis.research_overview as ResearchOverview} 
                  />
                )}

                {/* Novelty Analysis Section */}
                {analysis.novelty_analysis && (
                  <NoveltyAnalysisPanel 
                    novelty={analysis.novelty_analysis as NoveltyAnalysis} 
                  />
                )}

                {/* Identified Assumptions Section */}
                {analysis.identified_assumptions && (
                  <AssumptionsPanel 
                    assumptions={analysis.identified_assumptions as IdentifiedAssumptions} 
                  />
                )}

                <div>
                  <Tabs defaultValue="comparison" className="w-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Similarity Matches</h3>
                      <TabsList>
                        <TabsTrigger value="comparison" className="gap-1.5">
                          <Columns className="h-4 w-4" />
                          Side-by-Side
                        </TabsTrigger>
                        <TabsTrigger value="table" className="gap-1.5">
                          <Table className="h-4 w-4" />
                          Table
                        </TabsTrigger>
                      </TabsList>
                    </div>
                    <TabsContent value="comparison">
                      <SideBySideComparison matches={matches} />
                    </TabsContent>
                    <TabsContent value="table">
                      <SimilarityTable matches={matches} />
                    </TabsContent>
                  </Tabs>
                </div>

                {analysis.guidance_suggestions && (
                  <GuidancePanel 
                    suggestions={analysis.guidance_suggestions as GuidanceSuggestion[]}
                    uniquenessLevel={analysis.uniqueness_level}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
