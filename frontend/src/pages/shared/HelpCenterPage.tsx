import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { LifeBuoy, ArrowLeft, Clock, Mail, Phone, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HelpCenterPage() {
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
            <LifeBuoy className="h-8 w-8 text-slate-400" />
          </div>
          <CardTitle className="text-2xl">Help Center</CardTitle>
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
              The Help Center will provide:
            </p>
            <ul className="text-left space-y-2 pl-4">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">✓</span>
                Searchable knowledge base and FAQs
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">✓</span>
                Video tutorials and walkthroughs
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">✓</span>
                Submit and track support tickets
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">✓</span>
                Live chat with support team
              </li>
            </ul>
          </div>

          <div className="border-t pt-6 mt-6">
            <p className="text-sm text-slate-600 mb-4">Need help now? Contact us:</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" size="sm" onClick={() => window.open('mailto:support@kenelsbureau.co.ke')}>
                <Mail className="h-4 w-4 mr-2" />
                support@kenelsbureau.co.ke
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open('tel:+254759599124')}>
                <Phone className="h-4 w-4 mr-2" />
                +254 759 599 124
              </Button>
              <Button variant="outline" size="sm" disabled>
                <MessageCircle className="h-4 w-4 mr-2" />
                Live Chat
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
