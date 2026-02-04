import { AlertTriangle, ArrowRight, FileWarning, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';

interface ReturnedItem {
  type: 'document' | 'field';
  documentType?: string;
  field?: string;
  message: string;
}

interface ActionRequiredBannerProps {
  type: 'kyc' | 'application';
  reason: string;
  returnedItems?: ReturnedItem[];
  actionUrl: string;
  applicationNumber?: string;
}

export function ActionRequiredBanner({
  type,
  reason,
  returnedItems = [],
  actionUrl,
  applicationNumber,
}: ActionRequiredBannerProps) {
  const title = type === 'kyc' 
    ? 'Your KYC verification needs correction' 
    : `Loan application ${applicationNumber || ''} needs correction`;

  return (
    <div className="rounded-lg border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 p-4 mb-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
            <RotateCcw className="h-5 w-5 text-orange-600" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <h3 className="font-semibold text-orange-900">Action Required</h3>
          </div>
          <p className="text-sm text-orange-800 font-medium mb-2">{title}</p>
          <p className="text-sm text-orange-700 mb-3">{reason}</p>
          
          {returnedItems.length > 0 && (
            <div className="bg-white/60 rounded-md p-3 mb-3">
              <p className="text-xs font-medium text-orange-800 mb-2">Items needing attention:</p>
              <ul className="space-y-1">
                {returnedItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-orange-700">
                    <FileWarning className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>{item.documentType?.replace(/_/g, ' ') || item.field || 'Item'}:</strong>{' '}
                      {item.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <Link to={actionUrl}>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              Fix Now
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ActionRequiredBanner;
