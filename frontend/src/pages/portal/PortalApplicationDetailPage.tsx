import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { portalService } from '../../services/portalService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, FileText, Clock, CheckCircle, XCircle, Upload } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface ApplicationDetail {
  id: string;
  applicationNumber: string;
  status: string;
  requestedAmount: number;
  requestedTermMonths: number;
  purpose?: string;
  productName: string;
  submittedAt?: string;
  approvedPrincipal?: number;
  approvedTermMonths?: number;
  approvedInterestRate?: number;
  rejectionReason?: string;
  rejectionNotes?: string;
  documents?: Array<{
    id: string;
    documentType: string;
    fileName: string;
    uploadedAt: string;
    reviewStatus: string;
  }>;
  checklistItems?: Array<{
    id: string;
    itemKey: string;
    itemLabel: string;
    status: string;
  }>;
}

export default function PortalApplicationDetailPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!applicationId) return;
      try {
        setLoading(true);
        const data = await portalService.getLoanApplicationDetail(applicationId);
        setApplication(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load application');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [applicationId]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return { icon: FileText, color: 'text-slate-600', bg: 'bg-slate-100', label: 'Draft' };
      case 'SUBMITTED':
        return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Submitted' };
      case 'UNDER_REVIEW':
        return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Under Review' };
      case 'APPROVED':
        return { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Approved' };
      case 'REJECTED':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Rejected' };
      default:
        return { icon: FileText, color: 'text-slate-500', bg: 'bg-slate-100', label: status };
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/portal/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Application not found'}
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(application.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/portal/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Loan Application
            </h1>
            <p className="text-sm text-slate-500">
              {application.applicationNumber} • {application.productName}
            </p>
          </div>
        </div>
        <Badge className={`${statusConfig.bg} ${statusConfig.color} border-0 px-3 py-1`}>
          <StatusIcon className="h-4 w-4 mr-1" />
          {statusConfig.label}
        </Badge>
      </div>

      {/* Status Banner */}
      {application.status === 'APPROVED' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
            <div>
              <h3 className="font-semibold text-emerald-800">Application Approved!</h3>
              <p className="text-sm text-emerald-700">
                Your loan has been approved for {formatCurrency(application.approvedPrincipal || 0)} over {application.approvedTermMonths} months at {application.approvedInterestRate}% interest.
              </p>
            </div>
          </div>
        </div>
      )}

      {application.status === 'REJECTED' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <XCircle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-800">Application Rejected</h3>
              {application.rejectionReason && (
                <p className="text-sm text-red-700">Reason: {application.rejectionReason}</p>
              )}
              {application.rejectionNotes && (
                <p className="text-sm text-red-600 mt-1">{application.rejectionNotes}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {(application.status === 'SUBMITTED' || application.status === 'UNDER_REVIEW') && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-800">Application Under Review</h3>
              <p className="text-sm text-blue-700">
                Your application is being reviewed by our team. We'll notify you once a decision is made.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Application Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Loan Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Requested Amount</p>
                <p className="font-semibold text-lg">{formatCurrency(application.requestedAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Term</p>
                <p className="font-semibold text-lg">{application.requestedTermMonths} months</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Purpose</p>
                <p className="font-medium">{application.purpose || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Submitted</p>
                <p className="font-medium">{formatDate(application.submittedAt)}</p>
              </div>
            </div>

            {application.approvedPrincipal && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-emerald-700 mb-2">Approved Terms</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Principal</p>
                    <p className="font-semibold text-emerald-600">{formatCurrency(application.approvedPrincipal)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Term</p>
                    <p className="font-semibold">{application.approvedTermMonths} months</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Interest Rate</p>
                    <p className="font-semibold">{application.approvedInterestRate}%</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Documents
            </CardTitle>
            <CardDescription>
              Documents submitted with this application
            </CardDescription>
          </CardHeader>
          <CardContent>
            {application.documents && application.documents.length > 0 ? (
              <div className="space-y-2">
                {application.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="font-medium text-sm">{doc.documentType.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-slate-500">{doc.fileName}</p>
                      </div>
                    </div>
                    <Badge
                      variant={doc.reviewStatus === 'VERIFIED' ? 'default' : 'secondary'}
                      className={doc.reviewStatus === 'VERIFIED' ? 'bg-emerald-600' : ''}
                    >
                      {doc.reviewStatus || 'PENDING'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No documents uploaded</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Checklist Status */}
      {application.checklistItems && application.checklistItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Application Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              {application.checklistItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    item.status === 'COMPLETED'
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  {item.status === 'COMPLETED' ? (
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-amber-600" />
                  )}
                  <span className={`text-sm ${item.status === 'COMPLETED' ? 'text-emerald-800' : 'text-amber-800'}`}>
                    {item.itemLabel}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {application.status === 'DRAFT' && (
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/portal/apply?continue=${application.id}`)}
          >
            Continue Application
          </Button>
        </div>
      )}
    </div>
  );
}
