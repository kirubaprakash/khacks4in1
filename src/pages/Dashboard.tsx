import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Analysis } from '@/types/analysis';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Clock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAnalyses();
    }
  }, [user]);

  const fetchAnalyses = async () => {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAnalyses(data as unknown as Analysis[]);
    }
    setLoadingData(false);
  };

  const getUniquenessColor = (level?: string) => {
    switch (level) {
      case 'high':
        return 'bg-originality-unique-bg text-originality-unique';
      case 'medium':
        return 'bg-originality-referenced-bg text-originality-referenced';
      case 'low':
        return 'bg-originality-risk-bg text-originality-risk';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'processing':
        return 'Processing...';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-6 py-16 text-center text-muted-foreground">
          Loading...
        </main>
      </div>
    );
  }

  const completedAnalyses = analyses.filter(a => a.status === 'completed');
  const avgScore = completedAnalyses.length > 0
    ? completedAnalyses.reduce((sum, a) => sum + (100 - (a.overall_similarity_score || 0)), 0) / completedAnalyses.length
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Analysis Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              View your past analyses and originality trends
            </p>
          </div>
          <Link to="/analysis">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Analysis
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Analyses</p>
                <p className="text-2xl font-semibold">{analyses.length}</p>
              </div>
            </div>
          </div>
          
          <div className="border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-originality-unique" />
              <div>
                <p className="text-sm text-muted-foreground">Average Originality</p>
                <p className="text-2xl font-semibold">
                  {avgScore !== null ? `${avgScore.toFixed(1)}%` : '—'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Last Analysis</p>
                <p className="text-2xl font-semibold">
                  {analyses.length > 0 
                    ? format(new Date(analyses[0].created_at), 'MMM d')
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis History */}
        <div className="border border-border">
          <div className="border-b border-border bg-muted/30 px-6 py-4">
            <h2 className="font-semibold">Analysis History</h2>
          </div>
          
          {loadingData ? (
            <div className="px-6 py-12 text-center text-muted-foreground">
              Loading analyses...
            </div>
          ) : analyses.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-muted-foreground">No analyses yet.</p>
              <Link to="/analysis" className="mt-4 inline-block">
                <Button variant="outline" size="sm">
                  Start your first analysis
                </Button>
              </Link>
            </div>
          ) : (
            <table className="academic-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Originality</th>
                  <th>Uniqueness</th>
                </tr>
              </thead>
              <tbody>
                {analyses.map((analysis) => (
                  <tr 
                    key={analysis.id} 
                    className="cursor-pointer"
                    onClick={() => navigate(`/analysis/${analysis.id}`)}
                  >
                    <td className="font-medium">{analysis.title}</td>
                    <td>
                      <span className="rounded bg-muted px-2 py-1 text-xs font-medium uppercase">
                        {analysis.input_type}
                      </span>
                    </td>
                    <td className="text-muted-foreground">
                      {format(new Date(analysis.created_at), 'MMM d, yyyy')}
                    </td>
                    <td>
                      <span className={`text-sm ${
                        analysis.status === 'completed' 
                          ? 'text-originality-unique' 
                          : analysis.status === 'failed'
                          ? 'text-originality-risk'
                          : 'text-muted-foreground'
                      }`}>
                        {getStatusLabel(analysis.status)}
                      </span>
                    </td>
                    <td>
                      {analysis.overall_similarity_score !== null && analysis.overall_similarity_score !== undefined ? (
                        <span className="font-mono">
                          {(100 - analysis.overall_similarity_score).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td>
                      {analysis.uniqueness_level ? (
                        <span className={`rounded px-2 py-1 text-xs font-medium ${getUniquenessColor(analysis.uniqueness_level)}`}>
                          {analysis.uniqueness_level.charAt(0).toUpperCase() + analysis.uniqueness_level.slice(1)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
