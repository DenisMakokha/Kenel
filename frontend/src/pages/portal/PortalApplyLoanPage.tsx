import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  FileText,
  Calculator,
  Clock,
  AlertCircle,
  Loader2,
  Info,
  Upload,
  X,
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { useToast } from '../../hooks/useToast';
import { cn } from '../../lib/utils';
import { usePortalAuthStore } from '../../store/portalAuthStore';
import { portalService } from '../../services/portalService';

type ApplicationStep = 'select-product' | 'loan-details' | 'documents' | 'review' | 'submitted';

interface LoanProduct {
  id: string;
  code: string;
  name: string;
  description: string | null;
  currencyCode: string;
  versionId: string;
  minAmount: number;
  maxAmount: number;
  minTermMonths: number;
  maxTermMonths: number;
  interestRate: number;
  interestRatePeriod: 'PER_MONTH' | 'PER_ANNUM';
  processingFeeType: 'FIXED' | 'PERCENTAGE';
  processingFeeValue: number;
}

export default function PortalApplyLoanPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { client } = usePortalAuthStore();

  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  
  const [step, setStep] = useState<ApplicationStep>('select-product');
  const [selectedProduct, setSelectedProduct] = useState<LoanProduct | null>(null);
  const [loading] = useState(false);
  
  // Loan details
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('');
  const [purpose, setPurpose] = useState('');
  
  // Documents - individual fields for each required document
  const [requiredDocuments, setRequiredDocuments] = useState<{
    bank_statement: File | null;
    kra_pin: File | null;
    id_copy: File | null;
    employment_contract: File | null;
    loan_application_form: File | null;
    utility_bill: File | null;
  }>({
    bank_statement: null,
    kra_pin: null,
    id_copy: null,
    employment_contract: null,
    loan_application_form: null,
    utility_bill: null,
  });

  const requiredDocumentLabels: Record<string, string> = {
    bank_statement: 'Bank statement for the latest three months (stamped at bank)',
    kra_pin: 'Copy of KRA PIN certificate',
    id_copy: 'Copy of ID',
    employment_contract: 'Copy of Employment Contract',
    loan_application_form: 'Duly-filled KENELS BUREAU Loan Application form',
    utility_bill: 'Utility Bill (proof of address)',
  };
  
  // Calculated values
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [processingFeeAmount, setProcessingFeeAmount] = useState(0);

  useEffect(() => {
    const checkActiveLoans = async () => {
      try {
        const dash = await portalService.getDashboard();
        if ((dash?.summary?.totalActiveLoans || 0) > 0) {
          toast.warning(
            'Active loan detected',
            'You cannot apply for another loan while you have an active loan. Please track your loan under My Loans.'
          );
          navigate('/portal/loans');
        }
      } catch {
        // Ignore - applying will still be blocked server-side once applications are wired.
      }
    };

    checkActiveLoans();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setProductsLoading(true);
        const data = await portalService.getLoanProducts();
        setProducts(Array.isArray(data) ? (data as LoanProduct[]) : []);
      } catch (err: any) {
        toast.error('Failed to load products', err?.response?.data?.message || 'Please try again');
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct && amount && term) {
      calculateLoan();
    }
  }, [amount, term, selectedProduct]);

  const calculateLoan = () => {
    if (!selectedProduct) return;
    
    const principal = parseFloat(amount) || 0;
    const months = parseInt(term) || 0;
    const rate = selectedProduct.interestRatePeriod === 'PER_MONTH'
      ? selectedProduct.interestRate / 100
      : selectedProduct.interestRate / 100 / 12;
    
    if (principal > 0 && months > 0) {
      // Calculate monthly payment using amortization formula
      const monthly = (principal * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
      const total = monthly * months;
      const fee = selectedProduct.processingFeeType === 'PERCENTAGE'
        ? principal * (selectedProduct.processingFeeValue / 100)
        : selectedProduct.processingFeeValue;
      
      setMonthlyPayment(Math.round(monthly));
      setTotalPayment(Math.round(total));
      setProcessingFeeAmount(Math.round(fee));
    }
  };

  const handleSelectProduct = (product: LoanProduct) => {
    setSelectedProduct(product);
    setAmount(product.minAmount.toString());
    setTerm(product.minTermMonths.toString());
    setStep('loan-details');
  };

  const handleDetailsSubmit = () => {
    if (!selectedProduct) return;
    
    const numAmount = parseFloat(amount);
    const numTerm = parseInt(term);
    
    if (numAmount < selectedProduct.minAmount || numAmount > selectedProduct.maxAmount) {
      toast.error('Invalid amount', `Amount must be between ${formatCurrency(selectedProduct.minAmount)} and ${formatCurrency(selectedProduct.maxAmount)}`);
      return;
    }
    
    if (numTerm < selectedProduct.minTermMonths || numTerm > selectedProduct.maxTermMonths) {
      toast.error('Invalid term', `Term must be between ${selectedProduct.minTermMonths} and ${selectedProduct.maxTermMonths} months`);
      return;
    }
    
    if (!purpose.trim()) {
      toast.error('Purpose required', 'Please enter the purpose of the loan');
      return;
    }
    
    setStep('documents');
  };

  const handleDocumentUpload = (docKey: keyof typeof requiredDocuments, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRequiredDocuments(prev => ({ ...prev, [docKey]: file }));
    }
    e.target.value = '';
  };

  const handleRemoveDocument = (docKey: keyof typeof requiredDocuments) => {
    setRequiredDocuments(prev => ({ ...prev, [docKey]: null }));
  };

  const allDocumentsUploaded = Object.values(requiredDocuments).every(doc => doc !== null);
  const uploadedCount = Object.values(requiredDocuments).filter(doc => doc !== null).length;
  const totalRequired = Object.keys(requiredDocuments).length;

  const handleDocumentsSubmit = () => {
    if (!allDocumentsUploaded) {
      toast.warning('All documents required', 'Please upload all required documents before proceeding');
      return;
    }
    setStep('review');
  };

  const handleSubmitApplication = async () => {
    if (!client) {
      toast.error('Not logged in', 'Please login to submit an application.');
      return;
    }
    if (!selectedProduct) {
      toast.error('Missing product', 'Please select a loan product.');
      return;
    }
    if (!allDocumentsUploaded) {
      toast.warning('All documents required', 'Please upload all required documents before proceeding');
      return;
    }

    try {
      const requestedAmount = parseFloat(amount);
      const requestedTermMonths = parseInt(term);

      const application = await portalService.createLoanApplication({
        productVersionId: selectedProduct.versionId,
        requestedAmount,
        requestedTermMonths,
        purpose: purpose.trim(),
      });

      const appId = application?.id;
      if (!appId) {
        toast.error('Failed to create application', 'Could not create loan application.');
        return;
      }

      // Upload all required documents - map to valid Prisma DocumentType values
      const documentTypeMap: Record<string, string> = {
        bank_statement: 'BANK_STATEMENT',
        kra_pin: 'KRA_PIN',
        id_copy: 'NATIONAL_ID',
        employment_contract: 'EMPLOYMENT_CONTRACT',
        loan_application_form: 'LOAN_APPLICATION_FORM',
        utility_bill: 'PROOF_OF_RESIDENCE',
      };

      for (const [key, file] of Object.entries(requiredDocuments)) {
        if (file) {
          await portalService.uploadLoanApplicationDocument(appId, {
            file: file,
            type: documentTypeMap[key] || 'OTHER',
            category: 'KYC',
          });
        }
      }

      await portalService.submitLoanApplication(appId, { notes: '' });
      toast.success('Submitted', 'Your loan application has been submitted successfully.');
      setStep('submitted');
    } catch (err: any) {
      toast.error('Submission failed', err?.response?.data?.message || 'Please try again');
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'loan-details':
        setStep('select-product');
        setSelectedProduct(null);
        break;
      case 'documents':
        setStep('loan-details');
        break;
      case 'review':
        setStep('documents');
        break;
      default:
        navigate('/portal/dashboard');
    }
  };

  const steps = [
    { id: 'select-product', label: 'Product' },
    { id: 'loan-details', label: 'Details' },
    { id: 'documents', label: 'Documents' },
    { id: 'review', label: 'Review' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center gap-4">
        {step !== 'submitted' && (
          <button
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Apply for a Loan</h1>
          <p className="text-sm text-slate-500">
            {step === 'select-product' && 'Choose a loan product that suits your needs'}
            {step === 'loan-details' && 'Enter your loan requirements'}
            {step === 'documents' && 'Upload supporting documents'}
            {step === 'review' && 'Review your application'}
            {step === 'submitted' && 'Application submitted successfully'}
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      {step !== 'submitted' && (
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium',
                    i < currentStepIndex
                      ? 'bg-emerald-600 text-white'
                      : i === currentStepIndex
                      ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-600'
                      : 'bg-slate-100 text-slate-400'
                  )}
                >
                  {i < currentStepIndex ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={cn(
                  'text-xs mt-1',
                  i <= currentStepIndex ? 'text-slate-900 font-medium' : 'text-slate-400'
                )}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'w-full h-0.5 mx-2 flex-1',
                    i < currentStepIndex ? 'bg-emerald-600' : 'bg-slate-200'
                  )}
                  style={{ minWidth: '40px' }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step 1: Select Product */}
      {step === 'select-product' && (
        <div className="grid gap-4 md:grid-cols-3">
          {productsLoading ? (
            <Card className="border-slate-200">
              <CardContent className="py-8 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
              </CardContent>
            </Card>
          ) : products.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="py-8 text-center text-sm text-slate-600">
                No loan products available right now.
              </CardContent>
            </Card>
          ) : (
            products.map((product) => (
              <Card
                key={product.id}
                className="border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleSelectProduct(product)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <CardDescription>{product.description || ''}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Amount Range</span>
                      <span className="font-medium">
                        {formatCurrency(product.minAmount)} - {formatCurrency(product.maxAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Term</span>
                      <span className="font-medium">{product.minTermMonths} - {product.maxTermMonths} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Interest Rate</span>
                      <Badge className="bg-emerald-100 text-emerald-700">
                        {product.interestRate}% {product.interestRatePeriod === 'PER_MONTH' ? 'p.m.' : 'p.a.'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Step 2: Loan Details */}
      {step === 'loan-details' && selectedProduct && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Loan Details</CardTitle>
              <CardDescription>
                {selectedProduct.name} - {selectedProduct.interestRate}% {selectedProduct.interestRatePeriod === 'PER_MONTH' ? 'p.m.' : 'p.a.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Loan Amount (KES)
                </label>
                <Input
                  type="number"
                  className="bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={selectedProduct.minAmount}
                  max={selectedProduct.maxAmount}
                />
                <p className="text-xs text-slate-500">
                  Min: {formatCurrency(selectedProduct.minAmount)} | Max: {formatCurrency(selectedProduct.maxAmount)}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Repayment Period (Months)
                </label>
                <Input
                  type="number"
                  className="bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  min={selectedProduct.minTermMonths}
                  max={selectedProduct.maxTermMonths}
                />
                <p className="text-xs text-slate-500">
                  Min: {selectedProduct.minTermMonths} months | Max: {selectedProduct.maxTermMonths} months
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Purpose of Loan
                </label>
                <textarea
                  className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Describe how you plan to use this loan..."
                />
              </div>

              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={handleDetailsSubmit}
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Loan Calculator */}
          <Card className="border-slate-200 bg-gradient-to-br from-emerald-50 to-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-lg">Loan Calculator</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <p className="text-sm text-slate-500 mb-1">Monthly Payment</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {formatCurrency(monthlyPayment)}
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Principal Amount</span>
                  <span className="font-medium">{formatCurrency(parseFloat(amount) || 0)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Interest Rate</span>
                  <span className="font-medium">{selectedProduct.interestRate}% {selectedProduct.interestRatePeriod === 'PER_MONTH' ? 'p.m.' : 'p.a.'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Loan Term</span>
                  <span className="font-medium">{term} months</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">
                    Processing Fee ({selectedProduct.processingFeeType === 'PERCENTAGE' ? `${selectedProduct.processingFeeValue}%` : formatCurrency(selectedProduct.processingFeeValue)})
                  </span>
                  <span className="font-medium">{formatCurrency(processingFeeAmount)}</span>
                </div>
                <div className="flex justify-between py-2 pt-2">
                  <span className="font-semibold text-slate-900">Total Repayment</span>
                  <span className="font-bold text-slate-900">{formatCurrency(totalPayment)}</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                <p className="text-xs text-amber-800">
                  This is an estimate. Actual terms may vary based on credit assessment.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Documents */}
      {step === 'documents' && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Required Documents</CardTitle>
            <CardDescription>
              Upload all required documents to proceed with your application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress indicator */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Upload Progress</span>
                <span className="text-sm font-semibold text-emerald-600">
                  {uploadedCount} of {totalRequired} documents
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(uploadedCount / totalRequired) * 100}%` }}
                />
              </div>
            </div>

            {/* Individual document upload fields */}
            <div className="space-y-3">
              {(Object.keys(requiredDocuments) as Array<keyof typeof requiredDocuments>).map((docKey) => (
                <div
                  key={docKey}
                  className={cn(
                    "border rounded-lg p-4 transition-all",
                    requiredDocuments[docKey] 
                      ? "border-emerald-300 bg-emerald-50" 
                      : "border-slate-200 bg-white"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                        requiredDocuments[docKey] 
                          ? "bg-emerald-100" 
                          : "bg-slate-100"
                      )}>
                        {requiredDocuments[docKey] ? (
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <FileText className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium",
                          requiredDocuments[docKey] ? "text-emerald-800" : "text-slate-700"
                        )}>
                          {requiredDocumentLabels[docKey]}
                        </p>
                        {requiredDocuments[docKey] ? (
                          <p className="text-xs text-emerald-600 mt-1 truncate">
                            {requiredDocuments[docKey]?.name}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500 mt-1">
                            PDF, JPG, PNG up to 10MB
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {requiredDocuments[docKey] ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDocument(docKey)}
                          className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        <>
                          <input
                            type="file"
                            id={`file-${docKey}`}
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleDocumentUpload(docKey, e)}
                          />
                          <label htmlFor={`file-${docKey}`}>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="cursor-pointer"
                              asChild
                            >
                              <span>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload
                              </span>
                            </Button>
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!allDocumentsUploaded && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  Please upload all {totalRequired} required documents before proceeding. 
                  Missing documents may delay your application.
                </p>
              </div>
            )}

            <Button
              className={cn(
                "w-full",
                allDocumentsUploaded 
                  ? "bg-emerald-600 hover:bg-emerald-700" 
                  : "bg-slate-300 cursor-not-allowed"
              )}
              onClick={handleDocumentsSubmit}
              disabled={!allDocumentsUploaded}
            >
              Continue to Review
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {step === 'review' && selectedProduct && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Review Application</CardTitle>
            <CardDescription>
              Please review your application details before submitting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Applicant Info */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Applicant Information</h3>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Name</span>
                  <span className="font-medium">{client?.firstName} {client?.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Client Code</span>
                  <span className="font-medium">{client?.clientCode}</span>
                </div>
              </div>
            </div>

            {/* Loan Details */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Loan Details</h3>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Product</span>
                  <span className="font-medium">{selectedProduct.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount</span>
                  <span className="font-medium">{formatCurrency(parseFloat(amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Term</span>
                  <span className="font-medium">{term} months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Monthly Payment</span>
                  <span className="font-medium">{formatCurrency(monthlyPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Purpose</span>
                  <span className="font-medium">{purpose}</span>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                Documents ({uploadedCount})
              </h3>
              <div className="bg-slate-50 rounded-lg p-4">
                <ul className="space-y-2 text-sm">
                  {(Object.keys(requiredDocuments) as Array<keyof typeof requiredDocuments>).map((docKey) => (
                    <li key={docKey} className="flex items-center gap-2 text-slate-700">
                      {requiredDocuments[docKey] ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={requiredDocuments[docKey] ? '' : 'text-red-500'}>
                        {requiredDocumentLabels[docKey]}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Terms */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                By submitting this application, I confirm that all information provided is accurate
                and I agree to the terms and conditions of KENELS BUREAU.
              </p>
            </div>

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSubmitApplication}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Submitted */}
      {step === 'submitted' && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="py-12 text-center">
            <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-emerald-900 mb-2">
              Application Submitted!
            </h3>
            <p className="text-emerald-700 mb-2">
              Your loan application has been submitted successfully.
            </p>
            <p className="text-sm text-emerald-600 mb-6">
              Application Reference: APP-{Date.now().toString().slice(-8)}
            </p>

            <div className="bg-white rounded-lg p-4 mb-6 max-w-md mx-auto">
              <h4 className="font-medium text-slate-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-slate-600 space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-emerald-600 mt-0.5" />
                  <span>Our team will review your application within 24-48 hours</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                  <span>You may be contacted for additional information</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                  <span>Once approved, funds will be disbursed to your account</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/portal/loans')}>
                View My Loans
              </Button>
              <Button onClick={() => navigate('/portal/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
