import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { TrendingUp, ArrowLeft, Clock, BarChart3, Target, Zap, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CreditConversionFunnelPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 md:px-6 py-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {/* Header */}
      <div className="text-center py-4">
        <Badge className="bg-amber-100 text-amber-700 mb-3">
          <Clock className="h-3 w-3 mr-1" />
          Coming Soon
        </Badge>
        <h1 className="text-2xl font-bold text-slate-900">Conversion Funnel</h1>
        <p className="text-sm text-slate-600 mt-1">Track application pipeline and conversion rates</p>
      </div>

      {/* Features Preview */}
      <Card className="border-slate-100">
        <CardHeader>
          <CardTitle>What's Coming</CardTitle>
          <CardDescription>Features in development</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center gap-3 p-3 rounded-md bg-emerald-50">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="font-medium text-sm">Conversion Tracking</p>
                <p className="text-xs text-muted-foreground">Application-to-disbursement rates</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-md bg-blue-50">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-sm">Bottleneck Analysis</p>
                <p className="text-xs text-muted-foreground">Identify process bottlenecks</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-md bg-purple-50">
              <Zap className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium text-sm">Drop-off Analysis</p>
                <p className="text-xs text-muted-foreground">Analyze drop-off points</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-md bg-cyan-50">
              <Calendar className="h-5 w-5 text-cyan-600" />
              <div>
                <p className="font-medium text-sm">Period Comparison</p>
                <p className="text-xs text-muted-foreground">Compare across periods</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground mb-3">In the meantime, explore your portfolio</p>
        <Button onClick={() => navigate('/credit/portfolio')} className="bg-emerald-600 hover:bg-emerald-700">
          <TrendingUp className="h-4 w-4 mr-2" />
          View My Portfolio
        </Button>
      </div>
    </div>
  );
}
