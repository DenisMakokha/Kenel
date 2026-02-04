import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  CheckCircle,
  AlertTriangle,
  Upload,
  FileText,
  Trash2,
  Briefcase,
  Building,
  DollarSign,
  Users,
  UserPlus,
  Shield,
  ArrowRight,
  History,
  Clock,
  XCircle,
  MapPin,
  Home,
} from 'lucide-react';
import { usePortalAuthStore } from '../../store/portalAuthStore';
import { portalService } from '../../services/portalService';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ActionRequiredBanner } from '../../components/portal/ActionRequiredBanner';

export default function PortalKYCPage() {
  const { client, setClient } = usePortalAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isReturned = searchParams.get('returned') === 'true' || (client as any)?.kycStatus === 'RETURNED';

  // Document upload state
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocType, setSelectedDocType] = useState('');

  // Address form state
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    residentialAddress: '',
  });

  // Employment form state
  const [showEmploymentDialog, setShowEmploymentDialog] = useState(false);
  const [savingEmployment, setSavingEmployment] = useState(false);
  const [employmentForm, setEmploymentForm] = useState({
    employerName: '',
    occupation: '',
    monthlyIncome: '',
  });

  // Next of Kin form state
  const [showNokDialog, setShowNokDialog] = useState(false);
  const [savingContacts, setSavingContacts] = useState(false);
  const [nokForm, setNokForm] = useState({
    fullName: '',
    relation: '',
    phone: '',
    email: '',
    address: '',
    isPrimary: true,
  });

  // Referee form state
  const [showRefereeDialog, setShowRefereeDialog] = useState(false);
  const [refereeForm, setRefereeForm] = useState({
    fullName: '',
    phone: '',
    relation: '',
    idNumber: '',
    employerName: '',
    address: '',
  });

  // KYC submission state
  const [submittingKyc, setSubmittingKyc] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      if (!client) return;
      try {
        const me = await portalService.getMe();
        setClient(me);
      } catch {
        // ignore
      }
    };
    hydrate();
  }, [client?.id, setClient]);

  // Calculate KYC completion
  const getKycProgress = () => {
    const c = client as any;
    const docs = c?.documents || [];
    const hasDoc = (type: string) => docs.some((d: any) => d.documentType === type);

    const checklistItems = [
      { label: 'Personal Information Complete', checked: !!(c?.firstName && c?.lastName && (c?.idNumber || c?.nationalId) && c?.dateOfBirth), category: 'profile' },
      { label: 'Residential Address Provided', checked: !!c?.residentialAddress, category: 'profile' },
      { label: 'Employment Information Added', checked: !!(c?.employerName || c?.employer), category: 'employment' },
      { label: 'Next of Kin Added', checked: (c?.nextOfKin || []).length > 0, category: 'contacts' },
      { label: 'Referees Added (at least 2)', checked: (c?.referees || []).length >= 2, category: 'contacts' },
      { label: 'National ID Uploaded', checked: hasDoc('NATIONAL_ID') || hasDoc('PASSPORT'), category: 'documents' },
      { label: 'KRA PIN Certificate Uploaded', checked: hasDoc('KRA_PIN'), category: 'documents' },
      { label: 'Bank Statement Uploaded', checked: hasDoc('BANK_STATEMENT'), category: 'documents' },
      { label: 'Employment Contract Uploaded', checked: hasDoc('EMPLOYMENT_CONTRACT') || hasDoc('EMPLOYMENT_LETTER') || hasDoc('CONTRACT'), category: 'documents' },
      { label: 'Proof of Residence Uploaded', checked: hasDoc('PROOF_OF_RESIDENCE'), category: 'documents' },
    ];

    const completed = checklistItems.filter(i => i.checked).length;
    const total = checklistItems.length;
    const percentage = Math.round((completed / total) * 100);

    return { checklistItems, completed, total, percentage };
  };

  const { checklistItems, completed, total, percentage } = getKycProgress();

  // Determine header colors based on progress
  const getHeaderColors = () => {
    if (percentage >= 80) {
      return {
        bg: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
        textMuted: 'text-emerald-100',
        border: 'border-emerald-300',
        progressBg: 'bg-emerald-400/50',
        ctaBg: 'bg-emerald-400/30',
        ctaButton: 'bg-white text-emerald-600 hover:bg-emerald-50',
      };
    } else if (percentage >= 50) {
      return {
        bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
        textMuted: 'text-blue-100',
        border: 'border-blue-300',
        progressBg: 'bg-blue-400/50',
        ctaBg: 'bg-blue-400/30',
        ctaButton: 'bg-white text-blue-600 hover:bg-blue-50',
      };
    } else {
      return {
        bg: 'bg-gradient-to-r from-amber-500 to-amber-600',
        textMuted: 'text-amber-100',
        border: 'border-amber-300',
        progressBg: 'bg-amber-400/50',
        ctaBg: 'bg-amber-400/30',
        ctaButton: 'bg-white text-amber-600 hover:bg-amber-50',
      };
    }
  };

  const headerColors = getHeaderColors();

  // Get returned items from client data
  const returnedItems = (client as any)?.kycReturnedItems || [];
  const returnReason = (client as any)?.kycReturnReason || '';

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Action Required Banner for Returned KYC */}
      {isReturned && returnReason && (
        <ActionRequiredBanner
          type="kyc"
          reason={returnReason}
          returnedItems={returnedItems}
          actionUrl="/portal/kyc"
        />
      )}

      {/* Header with Progress */}
      <div className={`${headerColors.bg} rounded-xl p-6 text-white`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Complete Your KYC</h1>
            <p className={`${headerColors.textMuted} mt-1`}>
              Complete your profile to apply for loans
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-3xl font-bold">{percentage}%</p>
              <p className={`text-sm ${headerColors.textMuted}`}>{completed}/{total} completed</p>
            </div>
            <div className={`h-16 w-16 rounded-full border-4 ${headerColors.border} flex items-center justify-center`}>
              {percentage === 100 ? (
                <CheckCircle className="h-8 w-8" />
              ) : (
                <Shield className="h-8 w-8" />
              )}
            </div>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="mt-4">
          <div className={`h-2 ${headerColors.progressBg} rounded-full overflow-hidden`}>
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        {/* KYC Status Actions */}
        {(() => {
          const kycStatus = (client as any)?.kycStatus;
          
          if (kycStatus === 'VERIFIED') {
            return (
              <div className="mt-4 flex items-center justify-between bg-emerald-400/30 rounded-lg p-3">
                <p className="text-sm font-medium">✓ Your KYC is verified! You can apply for loans.</p>
                <Button
                  size="sm"
                  className="bg-white text-emerald-600 hover:bg-emerald-50"
                  onClick={() => navigate('/portal/loans')}
                >
                  Apply for Loan
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            );
          }
          
          if (kycStatus === 'PENDING_REVIEW') {
            return (
              <div className="mt-4 flex items-center gap-3 bg-blue-400/30 rounded-lg p-3">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">KYC Under Review</p>
                  <p className="text-xs opacity-80">We're reviewing your documents. You'll be notified once verified.</p>
                </div>
              </div>
            );
          }
          
          if (kycStatus === 'REJECTED') {
            const rejectionEvent = (client as any)?.kycEvents?.find((e: any) => e.toStatus === 'REJECTED');
            const rejectionReason = rejectionEvent?.reason || 'Please review your documents and information.';
            return (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between bg-red-400/30 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">KYC Rejected</p>
                      <p className="text-xs opacity-80">Please update your documents and resubmit for verification.</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-white text-red-600 hover:bg-red-50"
                    disabled={submittingKyc || percentage < 100}
                    onClick={async () => {
                      setSubmittingKyc(true);
                      try {
                        await portalService.submitKycForReview();
                        const me = await portalService.getMe();
                        setClient(me);
                        toast.success('KYC resubmitted for review!');
                      } catch (err: any) {
                        toast.error(err.response?.data?.message || 'Failed to submit KYC');
                      } finally {
                        setSubmittingKyc(false);
                      }
                    }}
                  >
                    {submittingKyc ? 'Submitting...' : 'Resubmit KYC'}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-red-800 mb-1">Rejection Reason:</p>
                  <p className="text-sm text-red-700">{rejectionReason}</p>
                </div>
              </div>
            );
          }
          
          if (percentage === 100) {
            return (
              <div className={`mt-4 flex items-center justify-between ${headerColors.ctaBg} rounded-lg p-3`}>
                <p className="text-sm font-medium">All items complete! Submit your KYC for verification.</p>
                <Button
                  size="sm"
                  className={headerColors.ctaButton}
                  disabled={submittingKyc}
                  onClick={async () => {
                    setSubmittingKyc(true);
                    try {
                      await portalService.submitKycForReview();
                      const me = await portalService.getMe();
                      setClient(me);
                      toast.success('KYC submitted for review!');
                    } catch (err: any) {
                      toast.error(err.response?.data?.message || 'Failed to submit KYC');
                    } finally {
                      setSubmittingKyc(false);
                    }
                  }}
                >
                  {submittingKyc ? 'Submitting...' : 'Submit for Review'}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            );
          }
          
          return null;
        })()}
      </div>

      {/* Checklist Overview */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg">KYC Checklist</CardTitle>
          <CardDescription>Track your progress across all requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {checklistItems.map((item, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg ${item.checked ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'}`}
              >
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${item.checked ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'}`}>
                  {item.checked ? '✓' : index + 1}
                </div>
                <span className={`text-sm ${item.checked ? 'text-emerald-700' : 'text-slate-600'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KYC History */}
      {(() => {
        const kycEvents = (client as any)?.kycEvents || [];
        if (kycEvents.length === 0) return null;
        
        const getStatusIcon = (status: string) => {
          switch (status) {
            case 'VERIFIED': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
            case 'REJECTED': return <XCircle className="h-4 w-4 text-red-500" />;
            case 'PENDING_REVIEW': return <Clock className="h-4 w-4 text-amber-500" />;
            default: return <Clock className="h-4 w-4 text-slate-400" />;
          }
        };
        
        const getStatusColor = (status: string) => {
          switch (status) {
            case 'VERIFIED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
            case 'PENDING_REVIEW': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
          }
        };
        
        return (
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-slate-600" />
                KYC History
              </CardTitle>
              <CardDescription>Track your KYC verification journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {kycEvents.map((event: any, index: number) => (
                  <div key={event.id || index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${getStatusColor(event.toStatus)}`}>
                        {getStatusIcon(event.toStatus)}
                      </div>
                      {index < kycEvents.length - 1 && <div className="w-0.5 h-full bg-slate-200 my-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusColor(event.toStatus)}>
                          {event.toStatus?.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {new Date(event.createdAt).toLocaleDateString('en-US', { 
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      {event.reason && (
                        <p className="text-sm text-slate-600 mt-1">
                          <span className="font-medium">Reason:</span> {event.reason}
                        </p>
                      )}
                      {event.notes && (
                        <p className="text-sm text-slate-500 mt-1">{event.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Address Information */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-600" />
              Residential Address
            </CardTitle>
            <CardDescription>Your current residential address</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => {
            const c = client as any;
            setAddressForm({
              residentialAddress: c?.residentialAddress || '',
            });
            setShowAddressDialog(true);
          }}>
            {(client as any)?.residentialAddress ? 'Edit' : 'Add'}
          </Button>
        </CardHeader>
        <CardContent>
          {(() => {
            const c = client as any;
            if (!c?.residentialAddress) {
              return (
                <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                  <Home className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">No address provided</p>
                  <p className="text-sm text-slate-500 mt-1">Add your residential address</p>
                  <Button
                    size="sm"
                    className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => setShowAddressDialog(true)}
                  >
                    <MapPin className="h-4 w-4 mr-1" />
                    Add Address
                  </Button>
                </div>
              );
            }
            return (
              <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg">
                <MapPin className="h-5 w-5 text-emerald-600 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Residential Address</p>
                  <p className="text-sm font-medium text-slate-900">{c.residentialAddress}</p>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Employment Information */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-emerald-600" />
                Employment Information
              </CardTitle>
              <CardDescription>Your employment details for loan assessment</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={() => {
              const c = client as any;
              setEmploymentForm({
                employerName: c?.employerName || '',
                occupation: c?.occupation || '',
                monthlyIncome: c?.monthlyIncome || '',
              });
              setShowEmploymentDialog(true);
            }}>
              {(client as any)?.employerName ? 'Edit' : 'Add'}
            </Button>
          </CardHeader>
          <CardContent>
            {(() => {
              const c = client as any;
              if (!c?.employerName) {
                return (
                  <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                    <Building className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">No employment information</p>
                    <p className="text-sm text-slate-500 mt-1">Add your employment details</p>
                    <Button
                      size="sm"
                      className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setShowEmploymentDialog(true)}
                    >
                      <Briefcase className="h-4 w-4 mr-1" />
                      Add Employment Info
                    </Button>
                  </div>
                );
              }
              return (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                    <Building className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-xs text-slate-500">Employer</p>
                      <p className="text-sm font-medium text-slate-900">{c.employerName}</p>
                    </div>
                  </div>
                  {c.occupation && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Briefcase className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-xs text-slate-500">Occupation</p>
                        <p className="text-sm font-medium text-slate-900">{c.occupation}</p>
                      </div>
                    </div>
                  )}
                  {c.monthlyIncome && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <DollarSign className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-xs text-slate-500">Monthly Income</p>
                        <p className="text-sm font-medium text-slate-900">KES {Number(c.monthlyIncome).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Next of Kin & Referees */}
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              Contacts
            </CardTitle>
            <CardDescription>Next of kin and referees for verification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Next of Kin Section */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${(client?.nextOfKin || []).length > 0 ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                    <Users className={`h-4 w-4 ${(client?.nextOfKin || []).length > 0 ? 'text-emerald-600' : 'text-amber-600'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Next of Kin</p>
                    <p className="text-xs text-slate-500">Emergency contact</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${(client?.nextOfKin || []).length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {(client?.nextOfKin || []).length > 0 ? '✓ Added' : 'Required'}
                  </Badge>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8" onClick={() => setShowNokDialog(true)}>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
              <div className="p-4">
                {(client?.nextOfKin || []).length === 0 ? (
                  <div className="text-center py-6">
                    <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                      <AlertTriangle className="h-6 w-6 text-amber-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-900">No next of kin added</p>
                    <p className="text-xs text-slate-500 mt-1">Add at least one emergency contact</p>
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowNokDialog(true)}>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add Next of Kin
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(client?.nextOfKin || []).map((nok) => (
                      <div key={nok.id} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-emerald-600">{nok.fullName?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-900 truncate">{nok.fullName}</p>
                            {nok.isPrimary && <Badge className="bg-blue-100 text-blue-700 text-xs">Primary</Badge>}
                          </div>
                          <p className="text-xs text-slate-500">{nok.relation} • {nok.phone}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0 flex-shrink-0"
                          disabled={savingContacts}
                          onClick={async () => {
                            if (!confirm('Remove this next of kin?')) return;
                            setSavingContacts(true);
                            try {
                              await portalService.removeNextOfKin(nok.id);
                              const me = await portalService.getMe();
                              setClient(me);
                              toast.success('Next of kin removed');
                            } catch {
                              toast.error('Failed to remove');
                            } finally {
                              setSavingContacts(false);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Referees Section */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${(client?.referees || []).length >= 2 ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                    <Users className={`h-4 w-4 ${(client?.referees || []).length >= 2 ? 'text-emerald-600' : 'text-amber-600'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Referees</p>
                    <p className="text-xs text-slate-500">Professional references</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${(client?.referees || []).length >= 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {(client?.referees || []).length}/2 {(client?.referees || []).length >= 2 ? '✓' : 'Required'}
                  </Badge>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8" onClick={() => setShowRefereeDialog(true)}>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
              <div className="p-4">
                {(client?.referees || []).length === 0 ? (
                  <div className="text-center py-6">
                    <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                      <AlertTriangle className="h-6 w-6 text-amber-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-900">No referees added</p>
                    <p className="text-xs text-slate-500 mt-1">Add at least 2 professional references</p>
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowRefereeDialog(true)}>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add Referee
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(client?.referees || []).length < 2 && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 mb-3">
                        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <p className="text-xs text-amber-700">Add {2 - (client?.referees || []).length} more referee{2 - (client?.referees || []).length > 1 ? 's' : ''} to complete this requirement</p>
                      </div>
                    )}
                    {(client?.referees || []).map((referee) => (
                      <div key={referee.id} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-blue-600">{referee.fullName?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{referee.fullName}</p>
                          <p className="text-xs text-slate-500">{referee.relation || 'Professional Reference'} • {referee.phone}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0 flex-shrink-0"
                          disabled={savingContacts}
                          onClick={async () => {
                            if (!confirm('Remove this referee?')) return;
                            setSavingContacts(true);
                            try {
                              await portalService.removeReferee(referee.id);
                              const me = await portalService.getMe();
                              setClient(me);
                              toast.success('Referee removed');
                            } catch {
                              toast.error('Failed to remove');
                            } finally {
                              setSavingContacts(false);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents Upload */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            Required Documents
          </CardTitle>
          <CardDescription>Upload all required documents for KYC verification</CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const c = client as any;
            const docs = c?.documents || [];

            const docTypes = [
              { type: 'NATIONAL_ID', label: 'National ID', description: 'Front and back of your ID', required: true },
              { type: 'KRA_PIN', label: 'KRA PIN Certificate', description: 'Your KRA PIN certificate', required: true },
              { type: 'BANK_STATEMENT', label: 'Bank Statement', description: 'Last 3 months statement', required: true },
              { type: 'EMPLOYMENT_CONTRACT', label: 'Employment Contract/Letter', description: 'Proof of employment', required: true },
              { type: 'PROOF_OF_RESIDENCE', label: 'Proof of Residence', description: 'Utility bill or lease agreement', required: true },
              { type: 'PASSPORT', label: 'Passport (Optional)', description: 'If available', required: false },
            ];

            const handleFileUpload = async (docType: string, file: File) => {
              setUploadingDoc(true);
              try {
                await portalService.uploadDocument(file, docType);
                const me = await portalService.getMe();
                setClient(me);
                toast.success('Document uploaded successfully');
              } catch (err: any) {
                toast.error(err.response?.data?.message || 'Failed to upload document');
              } finally {
                setUploadingDoc(false);
              }
            };

            return (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {docTypes.map((docType) => {
                  const uploadedDoc = docs.find((d: any) =>
                    d.documentType === docType.type ||
                    (docType.type === 'EMPLOYMENT_CONTRACT' && ['EMPLOYMENT_LETTER', 'CONTRACT'].includes(d.documentType))
                  );

                  return (
                    <div
                      key={docType.type}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        uploadedDoc
                          ? 'border-emerald-300 bg-emerald-50'
                          : docType.required
                            ? 'border-amber-300 bg-amber-50'
                            : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        {uploadedDoc ? (
                          <CheckCircle className="h-6 w-6 text-emerald-600" />
                        ) : (
                          <FileText className={`h-6 w-6 ${docType.required ? 'text-amber-600' : 'text-slate-400'}`} />
                        )}
                        {uploadedDoc && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2 -mt-1 -mr-1"
                            onClick={async () => {
                              if (!confirm('Delete this document?')) return;
                              try {
                                await portalService.deleteDocument(uploadedDoc.id);
                                const me = await portalService.getMe();
                                setClient(me);
                                toast.success('Document deleted');
                              } catch {
                                toast.error('Failed to delete document');
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className={`font-medium ${uploadedDoc ? 'text-emerald-700' : 'text-slate-700'}`}>
                        {docType.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{docType.description}</p>
                      
                      {uploadedDoc ? (
                        <p className="text-xs text-emerald-600 mt-3 font-medium">✓ Uploaded</p>
                      ) : (
                        <div className="mt-3">
                          <input
                            type="file"
                            id={`file-${docType.type}`}
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(docType.type, file);
                                e.target.value = '';
                              }
                            }}
                          />
                          <label
                            htmlFor={`file-${docType.type}`}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                              docType.required
                                ? 'bg-amber-600 text-white hover:bg-amber-700'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            } ${uploadingDoc ? 'opacity-50 pointer-events-none' : ''}`}
                          >
                            <Upload className="h-3 w-3" />
                            Upload
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Document Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Select a document type and upload your file.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Document Type</label>
              <select
                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm"
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
              >
                <option value="">Select document type...</option>
                <option value="NATIONAL_ID">National ID</option>
                <option value="KRA_PIN">KRA PIN Certificate</option>
                <option value="BANK_STATEMENT">Bank Statement</option>
                <option value="EMPLOYMENT_CONTRACT">Employment Contract</option>
                <option value="EMPLOYMENT_LETTER">Employment Letter</option>
                <option value="PROOF_OF_RESIDENCE">Proof of Residence / Utility Bill</option>
                <option value="PASSPORT">Passport</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">File</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
              <p className="text-xs text-slate-500">PDF, JPG, or PNG (max 5MB)</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setShowUploadDialog(false);
              setSelectedFile(null);
              setSelectedDocType('');
            }}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={uploadingDoc || !selectedFile || !selectedDocType}
              onClick={async () => {
                if (!selectedFile || !selectedDocType) {
                  toast.error('Please select a document type and file');
                  return;
                }
                setUploadingDoc(true);
                try {
                  await portalService.uploadDocument(selectedFile, selectedDocType);
                  const me = await portalService.getMe();
                  setClient(me);
                  setShowUploadDialog(false);
                  setSelectedFile(null);
                  setSelectedDocType('');
                  toast.success('Document uploaded successfully');
                } catch (err: any) {
                  toast.error(err.response?.data?.message || 'Failed to upload document');
                } finally {
                  setUploadingDoc(false);
                }
              }}
            >
              {uploadingDoc ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Address Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Residential Address</DialogTitle>
            <DialogDescription>Enter your current residential address.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Full Address *</label>
              <textarea
                className="w-full min-h-[100px] px-3 py-2 rounded-md border border-slate-200 bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                value={addressForm.residentialAddress}
                onChange={(e) => setAddressForm({ ...addressForm, residentialAddress: e.target.value })}
                placeholder="Enter your full residential address including building, street, area, city..."
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddressDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={savingAddress || !addressForm.residentialAddress.trim()}
              onClick={async () => {
                if (!addressForm.residentialAddress.trim()) {
                  toast.error('Please enter your address');
                  return;
                }
                setSavingAddress(true);
                try {
                  await portalService.updateProfile({
                    residentialAddress: addressForm.residentialAddress.trim(),
                  });
                  const me = await portalService.getMe();
                  setClient(me);
                  setShowAddressDialog(false);
                  toast.success('Address updated successfully');
                } catch (err: any) {
                  toast.error(err.response?.data?.message || 'Failed to update address');
                } finally {
                  setSavingAddress(false);
                }
              }}
            >
              {savingAddress ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Employment Dialog */}
      <Dialog open={showEmploymentDialog} onOpenChange={setShowEmploymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Employment Information</DialogTitle>
            <DialogDescription>Add your employment details for loan assessment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Employer Name *</label>
              <Input
                value={employmentForm.employerName}
                onChange={(e) => setEmploymentForm({ ...employmentForm, employerName: e.target.value })}
                placeholder="Company name"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Occupation / Job Title</label>
              <Input
                value={employmentForm.occupation}
                onChange={(e) => setEmploymentForm({ ...employmentForm, occupation: e.target.value })}
                placeholder="e.g. Software Engineer"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Monthly Income (KES)</label>
              <Input
                type="number"
                value={employmentForm.monthlyIncome}
                onChange={(e) => setEmploymentForm({ ...employmentForm, monthlyIncome: e.target.value })}
                placeholder="e.g. 50000"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEmploymentDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={savingEmployment || !employmentForm.employerName}
              onClick={async () => {
                if (!employmentForm.employerName) {
                  toast.error('Please enter employer name');
                  return;
                }
                setSavingEmployment(true);
                try {
                  await portalService.updateEmployment({
                    employerName: employmentForm.employerName,
                    occupation: employmentForm.occupation || undefined,
                    monthlyIncome: employmentForm.monthlyIncome || undefined,
                  });
                  const me = await portalService.getMe();
                  setClient(me);
                  setShowEmploymentDialog(false);
                  toast.success('Employment information updated');
                } catch (err: any) {
                  toast.error(err.response?.data?.message || 'Failed to update employment info');
                } finally {
                  setSavingEmployment(false);
                }
              }}
            >
              {savingEmployment ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Next of Kin Dialog */}
      <Dialog open={showNokDialog} onOpenChange={setShowNokDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Next of Kin</DialogTitle>
            <DialogDescription>Provide details for your next of kin contact.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Full Name *</label>
              <Input value={nokForm.fullName} onChange={(e) => setNokForm({ ...nokForm, fullName: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Relation *</label>
              <Input value={nokForm.relation} onChange={(e) => setNokForm({ ...nokForm, relation: e.target.value })} placeholder="e.g. Spouse, Parent, Sibling" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Phone *</label>
              <Input value={nokForm.phone} onChange={(e) => setNokForm({ ...nokForm, phone: e.target.value })} placeholder="e.g. 0712345678" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Email (optional)</label>
              <Input value={nokForm.email} onChange={(e) => setNokForm({ ...nokForm, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Address (optional)</label>
              <Input value={nokForm.address} onChange={(e) => setNokForm({ ...nokForm, address: e.target.value })} />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNokDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={savingContacts}
              onClick={async () => {
                if (!nokForm.fullName || !nokForm.relation || !nokForm.phone) {
                  toast.error('Please fill in full name, relation and phone');
                  return;
                }
                setSavingContacts(true);
                try {
                  await portalService.addNextOfKin({
                    fullName: nokForm.fullName,
                    relation: nokForm.relation,
                    phone: nokForm.phone,
                    email: nokForm.email || undefined,
                    address: nokForm.address || undefined,
                    isPrimary: nokForm.isPrimary,
                  });
                  const me = await portalService.getMe();
                  setClient(me);
                  setNokForm({ fullName: '', relation: '', phone: '', email: '', address: '', isPrimary: true });
                  setShowNokDialog(false);
                  toast.success('Next of kin added');
                } catch (err: any) {
                  toast.error(err.response?.data?.message || 'Failed to add next of kin');
                } finally {
                  setSavingContacts(false);
                }
              }}
            >
              {savingContacts ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Referee Dialog */}
      <Dialog open={showRefereeDialog} onOpenChange={setShowRefereeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Referee</DialogTitle>
            <DialogDescription>Provide details for a referee contact.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Full Name *</label>
              <Input value={refereeForm.fullName} onChange={(e) => setRefereeForm({ ...refereeForm, fullName: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Phone *</label>
              <Input value={refereeForm.phone} onChange={(e) => setRefereeForm({ ...refereeForm, phone: e.target.value })} placeholder="e.g. 0712345678" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Relation (optional)</label>
              <Input value={refereeForm.relation} onChange={(e) => setRefereeForm({ ...refereeForm, relation: e.target.value })} placeholder="e.g. Colleague, Friend" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">ID Number (optional)</label>
              <Input value={refereeForm.idNumber} onChange={(e) => setRefereeForm({ ...refereeForm, idNumber: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Employer (optional)</label>
              <Input value={refereeForm.employerName} onChange={(e) => setRefereeForm({ ...refereeForm, employerName: e.target.value })} />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRefereeDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={savingContacts}
              onClick={async () => {
                if (!refereeForm.fullName || !refereeForm.phone) {
                  toast.error('Please fill in full name and phone');
                  return;
                }
                setSavingContacts(true);
                try {
                  await portalService.addReferee({
                    fullName: refereeForm.fullName,
                    phone: refereeForm.phone,
                    relation: refereeForm.relation || undefined,
                    idNumber: refereeForm.idNumber || undefined,
                    employerName: refereeForm.employerName || undefined,
                    address: refereeForm.address || undefined,
                  });
                  const me = await portalService.getMe();
                  setClient(me);
                  setRefereeForm({ fullName: '', phone: '', relation: '', idNumber: '', employerName: '', address: '' });
                  setShowRefereeDialog(false);
                  toast.success('Referee added');
                } catch (err: any) {
                  toast.error(err.response?.data?.message || 'Failed to add referee');
                } finally {
                  setSavingContacts(false);
                }
              }}
            >
              {savingContacts ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
