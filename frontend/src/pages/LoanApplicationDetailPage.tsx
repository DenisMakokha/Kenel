import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loanApplicationService } from '../services/loanApplicationService';
import { loanService } from '../services/loanService';
import { auditLogService } from '../services/auditLogService';
import { useAuthStore } from '../store/authStore';
import { openAuthenticatedFile } from '../lib/api';
import type {
  LoanApplication,
  LoanApplicationChecklistItem,
  LoanApplicationEvent,
  ApproveLoanApplicationDto,
  RejectLoanApplicationDto,
  CreditScore,
  UpsertCreditScoreDto,
} from '../types/loan-application';
import type { AuditLog } from '../types/audit';
import { LoanApplicationStatus, LoanApplicationChecklistStatus } from '../types/loan-application';
import { DocumentType } from '../types/client';
import { UserRole } from '../types/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import PreviewScheduleModal from '../components/loan-products/PreviewScheduleModal';
import { formatDate, mapCreditScoreToGrade } from '../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function LoanApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [checklist, setChecklist] = useState<LoanApplicationChecklistItem[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [events, setEvents] = useState<LoanApplicationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType | 'OTHER'>('OTHER');

  const [scoreForm, setScoreForm] = useState<UpsertCreditScoreDto>({
    repaymentHistoryScore: 3,
    stabilityScore: 3,
    incomeScore: 3,
    obligationScore: 3,
    officerComments: '',
    recommendation: 'APPROVE',
  });
  const [scoreSaving, setScoreSaving] = useState(false);
  const [scoreError, setScoreError] = useState('');

  const [showSchedulePreview, setShowSchedulePreview] = useState(false);

  const [approveData, setApproveData] = useState<ApproveLoanApplicationDto>({
    approvedPrincipal: 0,
    approvedTermMonths: 0,
    approvedInterestRate: 0,
    decisionNotes: '',
  });

  const [rejectData, setRejectData] = useState<RejectLoanApplicationDto>({
    reason: '',
    notes: '',
  });

  const [creatingLoan, setCreatingLoan] = useState(false);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  // Document review state
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewingDoc, setReviewingDoc] = useState<any>(null);
  const [reviewStatus, setReviewStatus] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [showApproveFooter, setShowApproveFooter] = useState(false);
  
  // Return to client state
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);
  // Custom return items (non-document issues)
  const [customReturnItems, setCustomReturnItems] = useState<Array<{ type: string; field: string; message: string }>>([
    { type: 'field', field: '', message: '' }
  ]);

  // Show approve/reject footer when scrolled near bottom
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const nearBottom = scrollTop + windowHeight >= docHeight - 200;
      setShowApproveFooter(nearBottom);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const app = await loanApplicationService.getApplication(id);
        setApplication(app);
        setChecklist(app.checklistItems || []);
        setEvents(app.events || []);
        const docs = await loanApplicationService.getDocuments(id);
        setDocuments(docs);

        if (app.creditScore) {
          const score: CreditScore = app.creditScore;
          setScoreForm({
            repaymentHistoryScore: score.repaymentHistoryScore,
            stabilityScore: score.stabilityScore,
            incomeScore: score.incomeScore,
            obligationScore: score.obligationScore,
            officerComments: score.officerComments || '',
            recommendation: (score.recommendation as UpsertCreditScoreDto['recommendation']) || 'APPROVE',
          });
        }

        // Pre-fill approve data with application's requested values
        const rules = (app.productVersion as any)?.rules;
        const interestRate = rules?.interest?.rate_per_year || 0;
        setApproveData({
          approvedPrincipal: Number(app.requestedAmount) || 0,
          approvedTermMonths: app.requestedTermMonths || 0,
          approvedInterestRate: interestRate,
          decisionNotes: '',
        });

        try {
          setAuditLoading(true);
          const logs = await auditLogService.getForLoanApplication(id, { page: 1, limit: 50 });
          setAuditLogs(logs.data);
        } catch (err: any) {
          setAuditError(err.response?.data?.message || 'Failed to load audit logs');
        } finally {
          setAuditLoading(false);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load application');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const canEditDraft =
    user && application &&
    (user.role === UserRole.ADMIN || user.role === UserRole.CREDIT_OFFICER) &&
    application.status === 'DRAFT';

  const canSubmit = canEditDraft;

  const canMoveToUnderReview =
    user && application &&
    (user.role === UserRole.ADMIN || user.role === UserRole.CREDIT_OFFICER) &&
    application.status === 'SUBMITTED';

  const canApproveOrReject =
    user && application &&
    user.role === UserRole.ADMIN &&
    application.status === 'UNDER_REVIEW';

  const refreshApplication = async () => {
    if (!id) return;
    const app = await loanApplicationService.getApplication(id);
    setApplication(app);
    setChecklist(app.checklistItems || []);
    setEvents(app.events || []);
    if (app.creditScore) {
      const score: CreditScore = app.creditScore;
      setScoreForm({
        repaymentHistoryScore: score.repaymentHistoryScore,
        stabilityScore: score.stabilityScore,
        incomeScore: score.incomeScore,
        obligationScore: score.obligationScore,
        officerComments: score.officerComments || '',
        recommendation: (score.recommendation as UpsertCreditScoreDto['recommendation']) || 'APPROVE',
      });
    }
  };

  const handleSubmit = async () => {
    if (!application || !id) return;
    try {
      setError('');
      await loanApplicationService.submitApplication(id, { notes: undefined });
      await refreshApplication();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit application');
    }
  };

  const handleUploadDocument = async () => {
    if (!id || !selectedFile) return;
    try {
      setError('');
      await loanApplicationService.uploadDocument(id, selectedFile, documentType);
      setShowUploadDialog(false);
      setSelectedFile(null);
      setDocumentType('OTHER');
      const docs = await loanApplicationService.getDocuments(id);
      setDocuments(docs);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload document');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      setError('');
      await loanApplicationService.deleteDocument(id, documentId);
      const docs = await loanApplicationService.getDocuments(id);
      setDocuments(docs);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete document');
    }
  };

  const openReviewDialog = (doc: any) => {
    setReviewingDoc(doc);
    setReviewStatus('VERIFIED');
    setReviewNotes('');
    setShowReviewDialog(true);
  };

  const handleReviewDocument = async () => {
    if (!id || !reviewingDoc) return;
    try {
      setReviewLoading(true);
      setError('');
      await loanApplicationService.reviewDocument(id, reviewingDoc.id, reviewStatus, reviewNotes);
      // Refresh documents and checklist
      const [docs, app] = await Promise.all([
        loanApplicationService.getDocuments(id),
        loanApplicationService.getApplication(id),
      ]);
      setDocuments(docs);
      setChecklist(app.checklistItems || []);
      setShowReviewDialog(false);
      setReviewingDoc(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to review document');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleSaveScore = async () => {
    if (!application || !id) return;
    try {
      setScoreError('');
      setScoreSaving(true);
      await loanApplicationService.upsertScore(id, scoreForm);
      await refreshApplication();
    } catch (err: any) {
      setScoreError(err.response?.data?.message || 'Failed to save score');
    } finally {
      setScoreSaving(false);
    }
  };

  const handleMoveToUnderReview = async () => {
    if (!application || !id) return;
    
    // Check for rejected documents - block submission if any documents are rejected
    const rejectedDocs = documents.filter(d => d.reviewStatus === 'REJECTED');
    if (rejectedDocs.length > 0) {
      setError(`Cannot submit for approval: ${rejectedDocs.length} document(s) have been rejected. Please resolve rejected documents first.`);
      return;
    }
    
    // Check that all documents are verified
    const unverifiedDocs = documents.filter(d => d.reviewStatus !== 'VERIFIED');
    if (unverifiedDocs.length > 0) {
      setError(`Cannot submit for approval: ${unverifiedDocs.length} document(s) have not been verified yet.`);
      return;
    }
    
    try {
      setError('');
      await loanApplicationService.moveToUnderReview(id);
      await refreshApplication();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to move to under review');
    }
  };

  const handleApprove = async () => {
    if (!application || !id) return;
    try {
      setError('');
      await loanApplicationService.approveApplication(id, approveData);
      await refreshApplication();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve application');
    }
  };

  const handleReject = async () => {
    if (!application || !id) return;
    try {
      setError('');
      await loanApplicationService.rejectApplication(id, rejectData);
      await refreshApplication();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject application');
    }
  };

  const handleReturnToClient = async () => {
    if (!application || !id || !returnReason.trim()) return;
    
    // Build return items from rejected documents
    const rejectedDocs = documents.filter(d => d.reviewStatus === 'REJECTED');
    const documentItems = rejectedDocs.map(doc => ({
      type: 'document',
      documentType: doc.documentType,
      message: doc.reviewNotes || `${doc.documentType} was rejected`,
    }));
    
    // Add custom field/other return items (filter out empty ones)
    const validCustomItems = customReturnItems
      .filter(item => item.field.trim() && item.message.trim())
      .map(item => ({
        type: item.type,
        field: item.field.trim(),
        message: item.message.trim(),
      }));
    
    const returnedItems = [...documentItems, ...validCustomItems];
    
    try {
      setReturnLoading(true);
      setError('');
      await loanApplicationService.returnToClient(id, {
        reason: returnReason.trim(),
        returnedItems,
      });
      setShowReturnDialog(false);
      setReturnReason('');
      setCustomReturnItems([{ type: 'field', field: '', message: '' }]);
      await refreshApplication();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to return application to client');
    } finally {
      setReturnLoading(false);
    }
  };

  const handleCreateLoan = async () => {
    if (!application) return;
    try {
      setError('');
      setCreatingLoan(true);
      const loan = await loanService.createFromApplication(application.id);
      await refreshApplication();
      navigate(`/loans/${loan.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create loan');
    } finally {
      setCreatingLoan(false);
    }
  };

  const handleChecklistStatusChange = async (
    item: LoanApplicationChecklistItem,
    status: LoanApplicationChecklistStatus,
  ) => {
    if (!application || !id) return;
    try {
      const updated = await loanApplicationService.updateChecklistItem(id, item.id, { status });
      setChecklist((prev) => prev.map((c) => (c.id === item.id ? updated : c)));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update checklist item');
    }
  };

  const getStatusBadge = (status: LoanApplicationStatus) => {
    const variants: Record<LoanApplicationStatus, any> = {
      DRAFT: 'outline',
      SUBMITTED: 'warning',
      UNDER_REVIEW: 'secondary',
      APPROVED: 'success',
      REJECTED: 'destructive',
      RETURNED: 'warning',
    };

    const labels: Record<LoanApplicationStatus, string> = {
      DRAFT: 'Draft',
      SUBMITTED: 'Submitted',
      UNDER_REVIEW: 'Under Review',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      RETURNED: 'Returned to Client',
    };

    return <Badge variant={variants[status]} className={status === 'RETURNED' ? 'bg-orange-100 text-orange-700 border-orange-200' : ''}>{labels[status]}</Badge>;
  };

  const canManageDocuments =
    user && (user.role === UserRole.ADMIN || user.role === UserRole.CREDIT_OFFICER);

  const canDeleteDocuments = user?.role === UserRole.ADMIN;

  const canManageChecklist =
    user && (user.role === UserRole.ADMIN || user.role === UserRole.CREDIT_OFFICER);

  const canEditScore =
    user && application &&
    (user.role === UserRole.ADMIN || user.role === UserRole.CREDIT_OFFICER) &&
    (application.status === LoanApplicationStatus.SUBMITTED ||
      application.status === LoanApplicationStatus.UNDER_REVIEW);

  const currentTotalScore =
    scoreForm.repaymentHistoryScore +
    scoreForm.stabilityScore +
    scoreForm.incomeScore +
    scoreForm.obligationScore;
  const currentGrade = mapCreditScoreToGrade(currentTotalScore);

  const canCreateLoan =
    user &&
    application &&
    (user.role === UserRole.ADMIN || user.role === UserRole.FINANCE_OFFICER) &&
    application.status === LoanApplicationStatus.APPROVED &&
    !application.loan;

  const scoreEvents = events.filter((evt) => evt.eventType === 'score_saved');

  if (loading) {
    return <div className="container mx-auto py-6">Loading application...</div>;
  }

  if (!application) {
    return (
      <div className="container mx-auto py-6">
        <p className="text-destructive">{error || 'Application not found'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 px-4 md:px-6 py-4 pb-48">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-slate-900">{application.applicationNumber}</h1>
            {getStatusBadge(application.status)}
          </div>
          <p className="text-sm text-slate-600">
            {application.productVersion?.loanProduct?.name || 'Loan Application'} • {application.client ? `${application.client.firstName} ${application.client.lastName}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/loan-applications')}>Back</Button>
          {canEditDraft && (
            <Button variant="outline" size="sm" onClick={() => navigate(`/loan-applications/${application.id}/edit`)}>Edit</Button>
          )}
          {canSubmit && <Button size="sm" onClick={handleSubmit}>Submit</Button>}
          {canMoveToUnderReview && (
            <Button size="sm" onClick={handleMoveToUnderReview} className="bg-emerald-600 hover:bg-emerald-700">Send for Approval</Button>
          )}
          {application.loan && (
            <Button size="sm" variant="outline" onClick={() => navigate(`/loans/${(application.loan as any).id}`)}>View Loan</Button>
          )}
          {canCreateLoan && (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreateLoan} disabled={creatingLoan}>
              {creatingLoan ? 'Creating...' : 'Create Loan'}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      {/* Progress Steps - Simplified */}
      {(user?.role === UserRole.CREDIT_OFFICER || user?.role === UserRole.ADMIN) && (
        <Card className="border-slate-100">
          <CardContent className="pt-4">
            {(() => {
              const docsVerified = documents.filter(d => d.reviewStatus === 'VERIFIED').length;
              const allDocsVerified = documents.length >= 6 && docsVerified >= 6;
              const hasScore = Boolean(application.creditScore);
              const isVerificationComplete = (allDocsVerified || docsVerified >= documents.length) && hasScore;
              
              const steps = [
                { key: 'submitted', label: 'Submitted' },
                { key: 'verified', label: 'Verified' },
                { key: 'under_review', label: 'Review' },
                { key: 'decision', label: 'Decision' },
              ];
              
              return (
                <div className="flex items-center gap-2">
                  {steps.map((step, index) => {
                    const isCompleted = 
                      (step.key === 'submitted' && ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].includes(application.status)) ||
                      (step.key === 'verified' && (isVerificationComplete || ['UNDER_REVIEW', 'APPROVED', 'REJECTED'].includes(application.status))) ||
                      (step.key === 'under_review' && ['UNDER_REVIEW', 'APPROVED', 'REJECTED'].includes(application.status)) ||
                      (step.key === 'decision' && ['APPROVED', 'REJECTED'].includes(application.status));
                    const isCurrent = 
                      (step.key === 'submitted' && application.status === 'SUBMITTED' && !isVerificationComplete) ||
                      (step.key === 'verified' && application.status === 'SUBMITTED' && isVerificationComplete) ||
                      (step.key === 'under_review' && application.status === 'UNDER_REVIEW');
                  
                    return (
                      <div key={step.key} className="flex items-center gap-2 flex-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          isCompleted ? 'bg-emerald-500 text-white' : 
                          isCurrent ? 'bg-blue-500 text-white' : 
                          'bg-slate-200 text-slate-500'
                        }`}>
                          {isCompleted ? '✓' : index + 1}
                        </div>
                        <span className={`text-xs font-medium ${isCompleted ? 'text-emerald-600' : isCurrent ? 'text-blue-600' : 'text-slate-400'}`}>
                          {step.label}
                        </span>
                        {index < 3 && <div className={`flex-1 h-0.5 ${isCompleted ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      {(application.status === 'SUBMITTED' || application.status === 'UNDER_REVIEW') && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border-slate-100">
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-muted-foreground">Request</p>
              <p className="text-lg font-bold text-emerald-600">KES {Number(application.requestedAmount).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{application.requestedTermMonths} months</p>
            </CardContent>
          </Card>
          <Card className="border-slate-100">
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-muted-foreground">Documents</p>
              <p className={`text-lg font-bold ${documents.length >= 6 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {documents.length}/6
              </p>
              <p className="text-xs text-muted-foreground">{documents.filter(d => d.reviewStatus === 'VERIFIED').length} verified</p>
            </CardContent>
          </Card>
          <Card className="border-slate-100">
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-muted-foreground">Checklist</p>
              <p className={`text-lg font-bold ${checklist.filter(c => c.status === 'COMPLETED').length === checklist.length ? 'text-emerald-600' : 'text-amber-600'}`}>
                {checklist.filter(c => c.status === 'COMPLETED').length}/{checklist.length}
              </p>
              <p className="text-xs text-muted-foreground">{checklist.filter(c => c.status === 'PENDING').length} pending</p>
            </CardContent>
          </Card>
          <Card className="border-slate-100">
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-muted-foreground">Credit Score</p>
              {application.creditScore ? (
                <>
                  <p className={`text-lg font-bold ${Number(application.creditScore.totalScore) >= 16 ? 'text-emerald-600' : Number(application.creditScore.totalScore) >= 12 ? 'text-amber-600' : 'text-red-600'}`}>
                    {application.creditScore.totalScore}/20
                  </p>
                  <p className="text-xs text-muted-foreground">{application.creditScore.grade}</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-slate-400">—</p>
                  <p className="text-xs text-muted-foreground">Not scored</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Request Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Amount</p>
              <p className="font-semibold">KES {Number(application.requestedAmount).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Term</p>
              <p className="font-semibold">{application.requestedTermMonths} months</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Purpose</p>
              <p className="font-semibold">{application.purpose || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Channel</p>
              <p className="font-semibold">{application.channel || 'ONLINE'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">KYC Status</p>
              <Badge variant={(application.client?.kycStatus || application.kycStatusSnapshot) === 'VERIFIED' ? 'default' : 'secondary'}>
                {application.client?.kycStatus || application.kycStatusSnapshot || 'N/A'}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Submitted</p>
              <p className="font-semibold">{application.submittedAt ? formatDate(application.submittedAt) : 'Draft'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="client">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto">
          <TabsTrigger value="client" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 px-4 py-2 text-sm">
            Client
          </TabsTrigger>
          <TabsTrigger value="documents" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 px-4 py-2 text-sm">
            Documents
          </TabsTrigger>
          <TabsTrigger value="scoring" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 px-4 py-2 text-sm">
            Scoring
          </TabsTrigger>
          <TabsTrigger value="schedule" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 px-4 py-2 text-sm">
            Schedule
          </TabsTrigger>
          <TabsTrigger value="events" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 px-4 py-2 text-sm">
            Timeline
          </TabsTrigger>
          <TabsTrigger value="audit" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 px-4 py-2 text-sm">
            Audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="client">
          <div className="space-y-4 mt-4">
            {/* Application Details */}
            <Card>
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Application Number</p>
                    <p className="font-semibold">{application.applicationNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Product</p>
                    <p className="font-semibold">{application.productVersion?.loanProduct?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-semibold">{application.status}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Requested Amount</p>
                    <p className="font-semibold">KES {Number(application.requestedAmount).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Requested Term</p>
                    <p className="font-semibold">{application.requestedTermMonths} months</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Repayment Frequency</p>
                    <p className="font-semibold">{application.requestedRepaymentFrequency || 'MONTHLY'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Purpose</p>
                    <p className="font-semibold">{application.purpose || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created At</p>
                    <p className="font-semibold">{formatDate(application.createdAt)}</p>
                  </div>
                  {application.submittedAt && (
                    <div>
                      <p className="text-muted-foreground">Submitted At</p>
                      <p className="font-semibold">{formatDate(application.submittedAt)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Client Name</p>
                    <p className="font-semibold">
                      {application.client ? `${application.client.firstName} ${application.client.lastName}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Client Code</p>
                    <p className="font-semibold">{application.client?.clientCode || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">KYC Status</p>
                    <p className="font-semibold">{application.client?.kycStatus || application.kycStatusSnapshot || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Risk Rating</p>
                    <p className="font-semibold">{application.client?.riskRating || application.riskRatingSnapshot || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Approved Terms (if approved) */}
            {application.approvedPrincipal && (
              <Card>
                <CardHeader>
                  <CardTitle>Approved Terms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Approved Principal</p>
                      <p className="font-semibold text-green-600">KES {Number(application.approvedPrincipal).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Approved Term</p>
                      <p className="font-semibold">{application.approvedTermMonths} months</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Interest Rate</p>
                      <p className="font-semibold">{application.approvedInterestRate}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Approved At</p>
                      <p className="font-semibold">{application.approvedAt ? formatDate(application.approvedAt) : 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rejection Info (if rejected) */}
            {application.status === 'REJECTED' && application.rejectionReason && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Rejection Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Reason</p>
                      <p className="font-semibold">{application.rejectionReason}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Rejected At</p>
                      <p className="font-semibold">{application.rejectedAt ? formatDate(application.rejectedAt) : 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Approve/Reject forms moved to sticky footer */}
        </TabsContent>

        <TabsContent value="audit">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <p className="text-sm text-muted-foreground">Loading audit logs...</p>
              ) : auditError ? (
                <div className="bg-destructive/10 border border-destructive text-destructive px-3 py-2 rounded text-sm">
                  {auditError}
                </div>
              ) : auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No audit events for this application yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Performed By</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => {
                      let summary = '';
                      const oldVal = log.oldValue as any;
                      const newVal = log.newValue as any;

                      if (log.entity === 'loan_applications') {
                        if (oldVal?.status && newVal?.status && oldVal.status !== newVal.status) {
                          summary = `Application status ${oldVal.status} -> ${newVal.status}`;
                        }
                      }

                      if (!summary && oldVal?.status && newVal?.status && oldVal.status !== newVal.status) {
                        summary = `Status ${oldVal.status} -> ${newVal.status}`;
                      }

                      if (!summary && log.action === 'CREATE') {
                        summary = `Created ${log.entity}`;
                      }

                      if (!summary && log.action === 'DELETE') {
                        summary = `Deleted ${log.entity}`;
                      }

                      return (
                        <TableRow key={log.id}>
                          <TableCell>{formatDate(log.createdAt)}</TableCell>
                          <TableCell>{log.entity}</TableCell>
                          <TableCell>{log.action}</TableCell>
                          <TableCell>
                            {log.user
                              ? `${log.user.firstName} ${log.user.lastName}`
                              : log.performedBy.slice(0, 8)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {summary || `ID: ${log.entityId.slice(0, 8)}...`}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scoring">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Manual Scorecard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {scoreError && (
                  <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-2 rounded text-sm">
                    {scoreError}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="repaymentHistoryScore">Repayment History (1-5)</Label>
                    <Input
                      id="repaymentHistoryScore"
                      type="number"
                      min={1}
                      max={5}
                      disabled={!canEditScore}
                      value={scoreForm.repaymentHistoryScore}
                      onChange={(e) =>
                        setScoreForm((prev) => ({
                          ...prev,
                          repaymentHistoryScore: Number(e.target.value || 0),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="stabilityScore">Employment Stability (1-5)</Label>
                    <Input
                      id="stabilityScore"
                      type="number"
                      min={1}
                      max={5}
                      disabled={!canEditScore}
                      value={scoreForm.stabilityScore}
                      onChange={(e) =>
                        setScoreForm((prev) => ({
                          ...prev,
                          stabilityScore: Number(e.target.value || 0),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="incomeScore">Income Adequacy (1-5)</Label>
                    <Input
                      id="incomeScore"
                      type="number"
                      min={1}
                      max={5}
                      disabled={!canEditScore}
                      value={scoreForm.incomeScore}
                      onChange={(e) =>
                        setScoreForm((prev) => ({
                          ...prev,
                          incomeScore: Number(e.target.value || 0),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="obligationScore">Indebtedness (1-5)</Label>
                    <Input
                      id="obligationScore"
                      type="number"
                      min={1}
                      max={5}
                      disabled={!canEditScore}
                      value={scoreForm.obligationScore}
                      onChange={(e) =>
                        setScoreForm((prev) => ({
                          ...prev,
                          obligationScore: Number(e.target.value || 0),
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Score</p>
                    <p className="font-semibold">
                      {currentTotalScore} / 20 ({currentGrade})
                    </p>
                  </div>
                  {application.creditScore && (
                    <div>
                      <p className="text-muted-foreground">Last Assessed</p>
                      <p className="font-semibold">
                        {formatDate(application.creditScore.assessedAt)}
                        {application.creditScore.approvedAt && (
                          <span className="text-xs text-muted-foreground">
                            {' '}
                            • Checker approved {formatDate(application.creditScore.approvedAt)}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="officerComments">Officer Comments</Label>
                  <textarea
                    id="officerComments"
                    className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm"
                    disabled={!canEditScore}
                    value={scoreForm.officerComments || ''}
                    onChange={(e) =>
                      setScoreForm((prev) => ({ ...prev, officerComments: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="recommendation">Recommendation</Label>
                  <select
                    id="recommendation"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    disabled={!canEditScore}
                    value={scoreForm.recommendation || 'APPROVE'}
                    onChange={(e) =>
                      setScoreForm((prev) => ({
                        ...prev,
                        recommendation: e.target.value as UpsertCreditScoreDto['recommendation'],
                      }))
                    }
                  >
                    <option value="APPROVE">Approve</option>
                    <option value="REJECT">Reject</option>
                    <option value="CONDITIONAL">Conditional</option>
                  </select>
                </div>

                {canEditScore && (
                  <div className="flex justify-end">
                    <Button onClick={handleSaveScore} disabled={scoreSaving}>
                      {scoreSaving ? 'Saving...' : 'Save Score'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Score History</CardTitle>
              </CardHeader>
              <CardContent>
                {scoreEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No score history yet.</p>
                ) : (
                  <ul className="space-y-3 text-sm">
                    {scoreEvents.map((evt) => (
                      <li key={evt.id} className="border-l-2 border-primary pl-3">
                        <div className="flex justify-between">
                          <span className="font-medium">
                            Score {evt.payload?.totalScore ?? ''}{' '}
                            {evt.payload?.grade ? `(${evt.payload.grade})` : ''}
                          </span>
                          <span className="text-muted-foreground">{formatDate(evt.createdAt)}</span>
                        </div>
                        {evt.user && (
                          <p className="text-muted-foreground text-xs mt-1">
                            Scored by {evt.user.firstName} {evt.user.lastName}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Repayment Schedule Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!application.productVersion?.loanProduct ? (
                <p className="text-sm text-muted-foreground">
                  Schedule preview will be available once a loan product version is set.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Product</p>
                      <p className="font-semibold">
                        {application.productVersion.loanProduct.name} (
                        {application.productVersion.loanProduct.code})
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Principal</p>
                      <p className="font-semibold">
                        {application.approvedPrincipal ?? application.requestedAmount}{' '}
                        {application.productVersion.loanProduct.currencyCode}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Term</p>
                      <p className="font-semibold">
                        {application.approvedTermMonths ?? application.requestedTermMonths} months
                      </p>
                    </div>
                  </div>

                  {/* Payment Breakdown Chart */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Payment Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const principal = Number(application.approvedPrincipal ?? application.requestedAmount);
                          const interestRules = (application.productVersion as any)?.rules?.interest;
                          const ratePeriod = interestRules?.rate_period || 'PER_ANNUM';
                          const productInterestRate = interestRules?.rate_per_year ?? 0;
                          const interestRate = Number(application.approvedInterestRate ?? productInterestRate);
                          const term = Number(application.approvedTermMonths ?? application.requestedTermMonths);
                          
                          // Calculate interest based on rate period from product configuration
                          const totalInterest = ratePeriod === 'PER_MONTH'
                            ? (principal * interestRate * term) / 100  // Monthly rate
                            : (principal * interestRate * term) / 1200; // Annual rate
                          
                          // Get processing fee from product rules, default to 0 if not configured
                          const feeRules = application.productVersion?.rules?.fees;
                          const processingFeeRate = feeRules?.processing_fee_type === 'PERCENTAGE' 
                            ? (feeRules.processing_fee_value / 100) 
                            : 0;
                          const processingFeeFixed = feeRules?.processing_fee_type === 'FIXED' 
                            ? feeRules.processing_fee_value 
                            : 0;
                          let processingFee = feeRules?.processing_fee_type === 'PERCENTAGE' 
                            ? principal * processingFeeRate 
                            : processingFeeFixed;
                          if (feeRules?.processing_fee_cap && processingFee > feeRules.processing_fee_cap) {
                            processingFee = feeRules.processing_fee_cap;
                          }
                          
                          const chartData = [
                            { name: 'Principal', value: principal, color: '#3b82f6' },
                            { name: 'Interest', value: totalInterest, color: '#f59e0b' },
                            ...(processingFee > 0 ? [{ name: 'Processing Fee', value: processingFee, color: '#8b5cf6' }] : []),
                          ];
                          
                          return (
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                  >
                                    {chartData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip 
                                    formatter={(value: number) => [`KES ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, '']}
                                  />
                                  <Legend />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>

                    <Card className="border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Payment Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const principal = Number(application.approvedPrincipal ?? application.requestedAmount);
                          const interestRules = (application.productVersion as any)?.rules?.interest;
                          const ratePeriod = interestRules?.rate_period || 'PER_ANNUM';
                          const productInterestRate = interestRules?.rate_per_year ?? 0;
                          const interestRate = Number(application.approvedInterestRate ?? productInterestRate);
                          const term = Number(application.approvedTermMonths ?? application.requestedTermMonths);
                          
                          // Calculate interest based on rate period
                          const totalInterest = ratePeriod === 'PER_MONTH'
                            ? (principal * interestRate * term) / 100  // Monthly rate: rate * months
                            : (principal * interestRate * term) / 1200; // Annual rate: rate * months / 12
                          
                          // Get processing fee from product rules
                          const feeRules = application.productVersion?.rules?.fees;
                          const processingFeeRate = feeRules?.processing_fee_type === 'PERCENTAGE' 
                            ? (feeRules.processing_fee_value / 100) 
                            : 0;
                          const processingFeeFixed = feeRules?.processing_fee_type === 'FIXED' 
                            ? feeRules.processing_fee_value 
                            : 0;
                          let processingFee = feeRules?.processing_fee_type === 'PERCENTAGE' 
                            ? principal * processingFeeRate 
                            : processingFeeFixed;
                          if (feeRules?.processing_fee_cap && processingFee > feeRules.processing_fee_cap) {
                            processingFee = feeRules.processing_fee_cap;
                          }
                          
                          const totalPayment = principal + totalInterest + processingFee;
                          const monthlyPayment = totalPayment / term;
                          const feeLabel = feeRules?.processing_fee_type === 'PERCENTAGE' 
                            ? `Processing Fee (${feeRules.processing_fee_value}%)`
                            : 'Processing Fee';
                          const ratePeriodLabel = ratePeriod === 'PER_MONTH' ? 'p.m.' : 'p.a.';
                          
                          return (
                            <div className="space-y-3">
                              <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Principal Amount</span>
                                <span className="font-semibold">KES {principal.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Total Interest ({interestRate}% {ratePeriodLabel})</span>
                                <span className="font-semibold text-amber-600">KES {totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                              {processingFee > 0 && (
                                <div className="flex justify-between py-2 border-b">
                                  <span className="text-muted-foreground">{feeLabel}</span>
                                  <span className="font-semibold">KES {processingFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                              )}
                              <div className="flex justify-between py-3 bg-slate-50 rounded-lg px-3 -mx-3">
                                <span className="font-semibold">Total Repayment</span>
                                <span className="font-bold text-lg">KES {totalPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between py-2 border-t mt-2">
                                <span className="text-muted-foreground">Monthly Payment (est.)</span>
                                <span className="font-semibold text-blue-600">KES {monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => setShowSchedulePreview(true)}>
                      Open Full Schedule Preview
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist-legacy">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              {checklist.length === 0 ? (
                <p className="text-muted-foreground text-sm">No checklist items defined.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Completed By</TableHead>
                      <TableHead>Completed At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checklist.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.itemLabel}</TableCell>
                        <TableCell>{item.status}</TableCell>
                        <TableCell>{item.completedBy || '-'}</TableCell>
                        <TableCell>
                          {item.completedAt ? formatDate(item.completedAt) : '-'}
                        </TableCell>
                        <TableCell>
                          {canManageChecklist ? (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleChecklistStatusChange(
                                    item,
                                    LoanApplicationChecklistStatus.COMPLETED,
                                  )
                                }
                              >
                                Complete
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleChecklistStatusChange(
                                    item,
                                    LoanApplicationChecklistStatus.NOT_APPLICABLE,
                                  )
                                }
                              >
                                N/A
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleChecklistStatusChange(
                                    item,
                                    LoanApplicationChecklistStatus.PENDING,
                                  )
                                }
                              >
                                Reset
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">View only</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="mt-4">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Documents</CardTitle>
                {canManageDocuments && (
                  <Button size="sm" onClick={() => setShowUploadDialog(true)}>
                    Upload Document
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Required Documents Checklist with Status */}
              <div className="border rounded-lg p-4 bg-muted/50 mb-6">
                <p className="text-sm font-medium mb-3">Required Documents Status:</p>
                <div className="grid gap-3">
                  {[
                    { type: 'BANK_STATEMENT', altTypes: [], label: 'Bank statement for the latest three months (stamped at bank)' },
                    { type: 'KRA_PIN', altTypes: [], label: 'Copy of KRA PIN certificate' },
                    { type: 'NATIONAL_ID', altTypes: [], label: 'Copy of ID' },
                    { type: 'EMPLOYMENT_CONTRACT', altTypes: ['EMPLOYMENT_LETTER', 'CONTRACT'], label: 'Copy of Employment Contract' },
                    { type: 'LOAN_APPLICATION_FORM', altTypes: [], label: 'Duly-filled KENELS BUREAU Loan Application form' },
                    { type: 'PROOF_OF_RESIDENCE', altTypes: [], label: 'Utility Bill (proof of address)' },
                  ].map((req) => {
                    const uploadedDoc = documents.find((d) => d.documentType === req.type || req.altTypes.includes(d.documentType));
                    const isUploaded = Boolean(uploadedDoc);
                    return (
                      <div key={req.type} className={`flex items-center justify-between p-3 rounded-lg border ${isUploaded ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                        <div className="flex items-center gap-3">
                          {isUploaded ? (
                            <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center">
                              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                              </svg>
                            </div>
                          )}
                          <div>
                            <p className={`text-sm font-medium ${isUploaded ? 'text-green-800' : 'text-amber-800'}`}>{req.label}</p>
                            {isUploaded && uploadedDoc && (
                              <p className="text-xs text-green-600">
                                {uploadedDoc.fileName} • Uploaded {formatDate(uploadedDoc.uploadedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                        {isUploaded && uploadedDoc && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-700 border-green-300 hover:bg-green-100"
                            onClick={() => openAuthenticatedFile(`/documents/a_${uploadedDoc.id}/download`)}
                          >
                            View
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1 text-green-600">
                    <div className="h-3 w-3 rounded-full bg-green-500" /> Uploaded
                  </span>
                  <span className="flex items-center gap-1 text-amber-600">
                    <div className="h-3 w-3 rounded-full bg-amber-500" /> Missing
                  </span>
                </div>
              </div>

              {/* All Uploaded Documents Table */}
              {documents.length > 0 && (
                <>
                  <p className="text-sm font-medium mb-3">All Uploaded Documents ({documents.length})</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>File Name</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Review Status</TableHead>
                        <TableHead>Uploaded At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium whitespace-nowrap">{String(doc.documentType).replace(/_/g, ' ')}</TableCell>
                          <TableCell className="max-w-[200px] break-words text-xs">{doc.fileName}</TableCell>
                          <TableCell>
                            {doc.fileSize
                              ? `${(doc.fileSize / 1024).toFixed(2)} KB`
                              : ''}
                          </TableCell>
                          <TableCell>
                            <Badge variant={doc.reviewStatus === 'APPROVED' ? 'default' : doc.reviewStatus === 'REJECTED' ? 'destructive' : 'secondary'}>
                              {doc.reviewStatus || 'PENDING'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => openAuthenticatedFile(`/documents/a_${doc.id}/download`)}
                              >
                                View/Download
                              </Button>
                              {canManageChecklist && doc.reviewStatus !== 'VERIFIED' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-300 hover:bg-green-50"
                                  onClick={() => openReviewDialog(doc)}
                                >
                                  Review
                                </Button>
                              )}
                              {doc.reviewStatus === 'VERIFIED' && (
                                <Badge variant="default" className="bg-green-600">
                                  ✓ Verified
                                </Badge>
                              )}
                              {canDeleteDocuments && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-muted-foreground text-sm">No events recorded yet.</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {events.map((evt) => (
                    <li key={evt.id} className="border-b pb-2 last:border-b-0 last:pb-0">
                      <div className="flex justify-between">
                        <span className="font-medium">{evt.eventType}</span>
                        <span className="text-muted-foreground">{formatDate(evt.createdAt)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {evt.fromStatus && evt.toStatus && (
                          <span>
                            {evt.fromStatus} → {evt.toStatus}
                          </span>
                        )}
                        {evt.user && (
                          <span>
                            {' '}
                            by {evt.user.firstName} {evt.user.lastName}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a supporting document for this loan application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="doc-type">Document Type *</Label>
              <select
                id="doc-type"
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as DocumentType | 'OTHER')}
              >
                <option value="BANK_STATEMENT">Bank Statement</option>
                <option value="KRA_PIN">KRA PIN Certificate</option>
                <option value="NATIONAL_ID">National ID</option>
                <option value="EMPLOYMENT_CONTRACT">Employment Contract</option>
                <option value="LOAN_APPLICATION_FORM">Loan Application Form</option>
                <option value="PROOF_OF_RESIDENCE">Proof of Residence / Utility Bill</option>
                <option value="PASSPORT">Passport</option>
                <option value="PASSPORT_PHOTO">Passport Photo</option>
                <option value="PAYSLIP">Payslip</option>
                <option value="EMPLOYMENT_LETTER">Employment Letter</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <Label htmlFor="doc-file">File *</Label>
              <Input
                id="doc-file"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Max 5MB. Accepted: JPG, PNG, PDF, DOC, DOCX
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadDocument} disabled={!selectedFile}>
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {application.productVersion?.loanProduct && (
        <PreviewScheduleModal
          open={showSchedulePreview}
          onClose={() => setShowSchedulePreview(false)}
          productId={application.productVersion.loanProduct.id}
          versionId={application.productVersion.id}
          productName={application.productVersion.loanProduct.name}
          currencyCode={application.productVersion.loanProduct.currencyCode}
          defaultPrincipal={Number(
            application.approvedPrincipal ?? application.requestedAmount,
          )}
          defaultTermMonths={application.approvedTermMonths ?? application.requestedTermMonths}
        />
      )}

      {/* Document Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Document</DialogTitle>
            <DialogDescription>
              {reviewingDoc && (
                <span className="block mt-2">
                  <strong>{String(reviewingDoc.documentType).replace(/_/g, ' ')}</strong>
                  <br />
                  <span className="text-xs">{reviewingDoc.fileName}</span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Review Decision</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={reviewStatus === 'VERIFIED' ? 'default' : 'outline'}
                  className={reviewStatus === 'VERIFIED' ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={() => setReviewStatus('VERIFIED')}
                >
                  ✓ Approve
                </Button>
                <Button
                  type="button"
                  variant={reviewStatus === 'REJECTED' ? 'destructive' : 'outline'}
                  onClick={() => setReviewStatus('REJECTED')}
                >
                  ✗ Reject
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reviewNotes">Notes (optional)</Label>
              <Input
                id="reviewNotes"
                placeholder="Add any notes about this document..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReviewDocument}
              disabled={reviewLoading}
              className={reviewStatus === 'VERIFIED' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {reviewLoading ? 'Saving...' : reviewStatus === 'VERIFIED' ? 'Approve Document' : 'Reject Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return to Client Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-red-700">Return Application to Client</DialogTitle>
            <DialogDescription>
              The client will be notified to correct the following issues and resubmit their application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Show rejected documents */}
            {documents.filter(d => d.reviewStatus === 'REJECTED').length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Rejected Documents:</Label>
                <div className="space-y-1">
                  {documents.filter(d => d.reviewStatus === 'REJECTED').map(doc => (
                    <div key={doc.id} className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                      <span className="text-red-600">✗</span>
                      <span className="font-medium">{doc.documentType?.replace(/_/g, ' ')}</span>
                      {doc.reviewNotes && <span className="text-slate-500">- {doc.reviewNotes}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Additional Issues (non-document) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Additional Issues (optional):</Label>
              <p className="text-xs text-slate-500">Add any other issues with the application that need correction (e.g., amount, term, personal info).</p>
              <div className="space-y-2">
                {customReturnItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <select
                      className="w-32 p-2 border rounded-md text-sm"
                      value={item.type}
                      onChange={(e) => {
                        const updated = [...customReturnItems];
                        updated[index].type = e.target.value;
                        setCustomReturnItems(updated);
                      }}
                    >
                      <option value="field">Field Issue</option>
                      <option value="amount">Amount Issue</option>
                      <option value="term">Term Issue</option>
                      <option value="purpose">Purpose Issue</option>
                      <option value="personal_info">Personal Info</option>
                      <option value="employment">Employment</option>
                      <option value="other">Other</option>
                    </select>
                    <input
                      type="text"
                      className="w-28 p-2 border rounded-md text-sm"
                      placeholder="Field name"
                      value={item.field}
                      onChange={(e) => {
                        const updated = [...customReturnItems];
                        updated[index].field = e.target.value;
                        setCustomReturnItems(updated);
                      }}
                    />
                    <input
                      type="text"
                      className="flex-1 p-2 border rounded-md text-sm"
                      placeholder="What needs to be fixed..."
                      value={item.message}
                      onChange={(e) => {
                        const updated = [...customReturnItems];
                        updated[index].message = e.target.value;
                        setCustomReturnItems(updated);
                      }}
                    />
                    {customReturnItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 px-2"
                        onClick={() => {
                          setCustomReturnItems(customReturnItems.filter((_, i) => i !== index));
                        }}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-sm"
                  onClick={() => setCustomReturnItems([...customReturnItems, { type: 'field', field: '', message: '' }])}
                >
                  + Add Another Issue
                </Button>
              </div>
            </div>
            
            {/* Return reason */}
            <div className="space-y-2">
              <Label htmlFor="returnReason">Message to Client *</Label>
              <textarea
                id="returnReason"
                className="w-full min-h-[100px] p-3 border rounded-md text-sm"
                placeholder="Explain what needs to be corrected..."
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturnDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReturnToClient}
              disabled={returnLoading || !returnReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {returnLoading ? 'Returning...' : 'Return to Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sticky Action Bar - Shows when verification is complete */}
      {(() => {
        const docsVerified = documents.filter(d => d.reviewStatus === 'VERIFIED').length;
        const docsRejected = documents.filter(d => d.reviewStatus === 'REJECTED').length;
        const allDocsVerified = documents.length > 0 && docsVerified === documents.length && docsRejected === 0;
        const hasScore = Boolean(application.creditScore);
        const isVerificationComplete = allDocsVerified && hasScore;
        
        // Show warning and return button if there are rejected documents
        if (canMoveToUnderReview && docsRejected > 0) {
          return (
            <div className="fixed bottom-0 left-0 right-0 bg-red-600 shadow-lg border-t z-50">
              <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                <p className="text-white text-sm">⚠ {docsRejected} document(s) rejected. Return to client for correction.</p>
                <Button 
                  size="sm" 
                  onClick={() => setShowReturnDialog(true)} 
                  className="bg-white text-red-700 hover:bg-red-50"
                >
                  Return to Client →
                </Button>
              </div>
            </div>
          );
        }
        
        if (canMoveToUnderReview && isVerificationComplete) {
          return (
            <div className="fixed bottom-0 left-0 right-0 bg-emerald-600 shadow-lg border-t z-50">
              <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                <p className="text-white text-sm">✓ Verification complete. Ready to submit for approval.</p>
                <Button size="sm" onClick={handleMoveToUnderReview} className="bg-white text-emerald-700 hover:bg-emerald-50">
                  Submit for Approval →
                </Button>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Approve/Reject Footer for Admin */}
      {canApproveOrReject && showApproveFooter && (
        <div className="fixed bottom-0 left-0 md:left-60 right-0 z-10 shadow-lg border-t">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Approve Section */}
            <div className="p-4 pb-6 bg-emerald-100 border-r border-emerald-200">
              <p className="text-sm font-semibold text-emerald-800 mb-3">Approve Application</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <Input type="number" placeholder="Principal" value={approveData.approvedPrincipal} onChange={(e) => setApproveData(prev => ({ ...prev, approvedPrincipal: Number(e.target.value) }))} className="h-9 text-sm bg-white" />
                <Input type="number" placeholder="Term" value={approveData.approvedTermMonths} onChange={(e) => setApproveData(prev => ({ ...prev, approvedTermMonths: Number(e.target.value) }))} className="h-9 text-sm bg-white" />
                <Input type="number" placeholder="Rate %" value={approveData.approvedInterestRate} onChange={(e) => setApproveData(prev => ({ ...prev, approvedInterestRate: Number(e.target.value) }))} className="h-9 text-sm bg-white" />
              </div>
              <div className="flex gap-2">
                <Input placeholder="Notes" value={approveData.decisionNotes || ''} onChange={(e) => setApproveData(prev => ({ ...prev, decisionNotes: e.target.value }))} className="h-9 text-sm flex-1 bg-white" />
                <Button onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-700 h-9">Approve</Button>
              </div>
            </div>
            {/* Reject Section */}
            <div className="p-4 pb-6 bg-red-100">
              <p className="text-sm font-semibold text-red-800 mb-3">Reject Application</p>
              <div className="flex gap-2 mb-3">
                <Input placeholder="Reason *" value={rejectData.reason} onChange={(e) => setRejectData(prev => ({ ...prev, reason: e.target.value }))} className="h-9 text-sm flex-1 bg-white" />
              </div>
              <div className="flex gap-2">
                <Input placeholder="Notes" value={rejectData.notes || ''} onChange={(e) => setRejectData(prev => ({ ...prev, notes: e.target.value }))} className="h-9 text-sm flex-1 bg-white" />
                <Button variant="destructive" onClick={handleReject} disabled={!rejectData.reason} className="h-9">Reject</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
