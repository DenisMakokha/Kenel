import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { TrendingUp, ArrowLeft, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FinanceCashflowPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 md:px-6 py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card className="border-slate-200">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <TrendingUp className="h-8 w-8 text-slate-400" />
          </div>
          <CardTitle className="text-2xl">Cashflow Report</CardTitle>
          <CardDescription className="text-base">
            This feature is coming soon
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="py-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 text-sm font-medium">
              <Clock className="h-4 w-4" />
              Under Development
            </div>
          </div>

          <div className="max-w-md mx-auto space-y-4 text-sm text-slate-600">
            <p>
              The Cashflow Report module will allow you to:
            </p>
            <ul className="text-left space-y-2 pl-4">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">✓</span>
                View daily, weekly, and monthly cash inflows
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">✓</span>
                Track expected vs actual collections
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">✓</span>
                Forecast future cash flows based on schedules
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">✓</span>
                Visualize trends with interactive charts
              </li>
            </ul>
          </div>

          <div className="pt-4">
            <Button onClick={() => navigate('/finance/collections')} className="bg-emerald-600 hover:bg-emerald-700">
              View Collections Summary
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
