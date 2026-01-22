import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loanApplicationService } from '../services/loanApplicationService';
import { loanService } from '../services/loanService';
import { auditLogService } from '../services/auditLogService';
import { useAuthStore } from '../store/authStore';
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
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');

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
    user.role === UserRole.ADMIN &&
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
    };

    const labels: Record<LoanApplicationStatus, string> = {
      DRAFT: 'Draft',
      SUBMITTED: 'Submitted',
      UNDER_REVIEW: 'Under Review',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const canManageDocuments =
    user && (user.role === UserRole.ADMIN || user.role === UserRole.CREDIT_OFFICER);

  const canDeleteDocuments = user?.role === UserRole.ADMIN;

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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {application.applicationNumber} –{' '}
            {application.productVersion?.loanProduct?.name || 'Loan Application'}
          </h1>
          <p className="text-muted-foreground text-sm">
            Client:{' '}
            {application.client
              ? `${application.client.firstName} ${application.client.lastName} (${application.client.clientCode})`
              : application.clientId}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {getStatusBadge(application.status)}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/loan-applications')}>
              Back to List
            </Button>
            {canEditDraft && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/loan-applications/${application.id}/edit`)}
              >
                Edit Draft
              </Button>
            )}
            {canSubmit && (
              <Button size="sm" onClick={handleSubmit}>
                Submit
              </Button>
            )}
            {canMoveToUnderReview && (
              <Button size="sm" onClick={handleMoveToUnderReview}>
                Move to Under Review
              </Button>
            )}
            {application.loan && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/loans/${(application.loan as any).id}`)}
              >
                View Loan
              </Button>
            )}
            {canCreateLoan && (
              <Button size="sm" onClick={handleCreateLoan} disabled={creatingLoan}>
                {creatingLoan ? 'Creating Loan...' : 'Create Loan'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Requested</p>
              <p className="font-semibold">
                {application.requestedAmount} over {application.requestedTermMonths} months
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Approved</p>
              {application.approvedPrincipal ? (
                <p className="font-semibold">
                  {application.approvedPrincipal} over {application.approvedTermMonths} months @{' '}
                  {application.approvedInterestRate}%
                </p>
              ) : (
                <p className="text-muted-foreground">Not yet approved</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">KYC & Risk at Application</p>
              <p className="font-semibold">
                KYC: {application.kycStatusSnapshot || 'N/A'} / Risk:{' '}
                {application.riskRatingSnapshot || 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scoring">Scoring</TabsTrigger>
          <TabsTrigger value="schedule">Schedule Preview</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="events">Timeline</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {canApproveOrReject && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Approve Application</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="approvedPrincipal">Principal</Label>
                      <Input
                        id="approvedPrincipal"
                        type="number"
                        value={approveData.approvedPrincipal}
                        onChange={(e) =>
                          setApproveData((prev) => ({
                            ...prev,
                            approvedPrincipal: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="approvedTerm">Term (months)</Label>
                      <Input
                        id="approvedTerm"
                        type="number"
                        value={approveData.approvedTermMonths}
                        onChange={(e) =>
                          setApproveData((prev) => ({
                            ...prev,
                            approvedTermMonths: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="approvedRate">Interest Rate %</Label>
                      <Input
                        id="approvedRate"
                        type="number"
                        value={approveData.approvedInterestRate}
                        onChange={(e) =>
                          setApproveData((prev) => ({
                            ...prev,
                            approvedInterestRate: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="decisionNotes">Decision Notes</Label>
                    <textarea
                      id="decisionNotes"
                      className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background"
                      value={approveData.decisionNotes || ''}
                      onChange={(e) =>
                        setApproveData((prev) => ({ ...prev, decisionNotes: e.target.value }))
                      }
                    />
                  </div>
                  <Button onClick={handleApprove}>Approve Application</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Reject Application</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="rejectReason">Reason</Label>
                    <Input
                      id="rejectReason"
                      value={rejectData.reason}
                      onChange={(e) =>
                        setRejectData((prev) => ({ ...prev, reason: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="rejectNotes">Notes</Label>
                    <textarea
                      id="rejectNotes"
                      className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background"
                      value={rejectData.notes || ''}
                      onChange={(e) =>
                        setRejectData((prev) => ({ ...prev, notes: e.target.value }))
                      }
                    />
                  </div>
                  <Button variant="destructive" onClick={handleReject}>
                    Reject Application
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
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
            <CardContent className="space-y-4">
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
                  <div className="flex justify-end">
                    <Button onClick={() => setShowSchedulePreview(true)}>
                      Open Schedule Preview
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist">
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
              {documents.length === 0 ? (
                <p className="text-muted-foreground text-sm">No documents uploaded.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>File Name</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded At</TableHead>
                      {canManageDocuments && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>{String(doc.documentType).replace('_', ' ')}</TableCell>
                        <TableCell>{doc.fileName}</TableCell>
                        <TableCell>
                          {doc.fileSize
                            ? `${(doc.fileSize / 1024).toFixed(2)} KB`
                            : ''}
                        </TableCell>
                        <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                        {canManageDocuments && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`/api/loan-applications/${application.id}/documents`, '_blank')}
                              >
                                Refresh
                              </Button>
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
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                <option value="NATIONAL_ID">National ID</option>
                <option value="PASSPORT">Passport</option>
                <option value="PASSPORT_PHOTO">Passport Photo</option>
                <option value="PROOF_OF_RESIDENCE">Proof of Residence</option>
                <option value="PAYSLIP">Payslip</option>
                <option value="BANK_STATEMENT">Bank Statement</option>
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
    </div>
  );
}
