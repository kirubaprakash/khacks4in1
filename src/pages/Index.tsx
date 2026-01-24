import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { FileText, Search, Shield, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            Academic Research Idea Similarity & Originality Analysis
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Understand how your research compares to existing academic literature. 
            Distinguish between properly cited content and potential originality concerns.
          </p>

          <div className="mt-10">
            <Link to={user ? "/analysis" : "/auth"}>
              <Button size="lg" className="px-8">
                {user ? "Start New Analysis" : "Get Started"}
              </Button>
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-20 max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-semibold">How It Works</h2>
          
          <div className="grid gap-8 md:grid-cols-2">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Submit Your Research</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Paste your research idea directly or upload a PDF document. 
                  The system extracts and processes the full text automatically.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Compare to Literature</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your content is compared against real academic papers from 
                  Semantic Scholar and arXiv using semantic analysis.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Reference-Aware Results</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Similar content is classified as properly cited or unreferenced. 
                  Only unreferenced similarity affects your originality score.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Actionable Guidance</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Receive constructive suggestions to improve originality 
                  and strengthen your citations where needed.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-20 max-w-2xl border border-border bg-muted/20 p-6">
          <p className="text-center text-sm text-muted-foreground">
            <strong>Disclaimer:</strong> Similarity results are relative to indexed academic 
            literature and do not constitute a plagiarism verdict. This tool assists 
            academic understanding and does not perform judgment or enforcement.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
