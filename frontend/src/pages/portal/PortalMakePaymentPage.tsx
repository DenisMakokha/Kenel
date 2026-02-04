import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { portalService } from '../../services/portalService';
import type { PortalLoanSummary } from '../../types/portal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import {
  CreditCard,
  Smartphone,
  Building2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Shield,
  Clock,
  Info,
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { useToast } from '../../hooks/useToast';
import { cn } from '../../lib/utils';

type PaymentMethod = 'mpesa' | 'bank' | 'card';
type PaymentStep = 'select-loan' | 'enter-amount' | 'select-method' | 'confirm' | 'processing' | 'success';

export default function PortalMakePaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [loans, setLoans] = useState<PortalLoanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Payment flow state
  const [step, setStep] = useState<PaymentStep>('select-loan');
  const [selectedLoan, setSelectedLoan] = useState<PortalLoanSummary | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  
  useEffect(() => {
    loadLoans();
  }, []);

  useEffect(() => {
    // Pre-select loan if loanId is in URL
    const loanId = searchParams.get('loanId');
    if (loanId && loans.length > 0) {
      const loan = loans.find(l => l.id === loanId);
      if (loan) {
        setSelectedLoan(loan);
        setStep('enter-amount');
      }
    }
  }, [searchParams, loans]);

  const loadLoans = async () => {
    try {
      setLoading(true);
      const result = await portalService.getLoans();
      // Filter to only active loans
      const activeLoans = result.filter(l => l.status === 'ACTIVE');
      setLoans(activeLoans);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLoan = (loan: PortalLoanSummary) => {
    setSelectedLoan(loan);
    // Pre-fill with next payment amount from loan schedule, or full outstanding if not available
    const nextPaymentAmount = (loan as any).nextPaymentAmount || (loan as any).monthlyPayment;
    if (nextPaymentAmount && nextPaymentAmount > 0) {
      setAmount(Math.min(loan.outstanding, nextPaymentAmount).toString());
    } else if (loan.outstanding) {
      setAmount(loan.outstanding.toString());
    }
    setStep('enter-amount');
  };

  const handleAmountContinue = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Invalid amount', 'Please enter a valid payment amount');
      return;
    }
    if (selectedLoan && numAmount > selectedLoan.outstanding) {
      toast.warning('Amount exceeds balance', 'Payment amount is more than outstanding balance');
    }
    setStep('select-method');
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setStep('confirm');
  };

  const handleConfirmPayment = async () => {
    if (!selectedLoan || !paymentMethod) return;

    toast.error(
      'Not available',
      'Payments are not available yet. Please use the official repayment channels and contact support if you need help.'
    );
  };

  const handleBack = () => {
    switch (step) {
      case 'enter-amount':
        setStep('select-loan');
        setSelectedLoan(null);
        break;
      case 'select-method':
        setStep('enter-amount');
        break;
      case 'confirm':
        setStep('select-method');
        setPaymentMethod(null);
        break;
      default:
        navigate('/portal/dashboard');
    }
  };

  const handleNewPayment = () => {
    setStep('select-loan');
    setSelectedLoan(null);
    setAmount('');
    setPaymentMethod(null);
    setPhoneNumber('');
  };

  const paymentMethods = [
    {
      id: 'mpesa' as PaymentMethod,
      name: 'M-Pesa',
      description: 'Pay via M-Pesa mobile money',
      icon: Smartphone,
      color: 'bg-green-100 text-green-700',
    },
    {
      id: 'bank' as PaymentMethod,
      name: 'Bank Transfer',
      description: 'Transfer from your bank account',
      icon: Building2,
      color: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'card' as PaymentMethod,
      name: 'Debit/Credit Card',
      description: 'Pay with Visa or Mastercard',
      icon: CreditCard,
      color: 'bg-purple-100 text-purple-700',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center gap-4">
        {step !== 'success' && (
          <button
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Make a Payment</h1>
          <p className="text-sm text-slate-500">
            {step === 'select-loan' && 'Select a loan to make a payment'}
            {step === 'enter-amount' && 'Enter the amount you want to pay'}
            {step === 'select-method' && 'Choose your payment method'}
            {step === 'confirm' && 'Review and confirm your payment'}
            {step === 'processing' && 'Processing your payment...'}
            {step === 'success' && 'Payment successful!'}
          </p>
        </div>
      </div>

      {/* Progress indicator */}
      {step !== 'success' && step !== 'processing' && (
        <div className="flex items-center gap-2">
          {['select-loan', 'enter-amount', 'select-method', 'confirm'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium',
                  step === s
                    ? 'bg-emerald-600 text-white'
                    : ['select-loan', 'enter-amount', 'select-method', 'confirm'].indexOf(step) > i
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-400'
                )}
              >
                {i + 1}
              </div>
              {i < 3 && (
                <div
                  className={cn(
                    'w-8 h-0.5 mx-1',
                    ['select-loan', 'enter-amount', 'select-method', 'confirm'].indexOf(step) > i
                      ? 'bg-emerald-200'
                      : 'bg-slate-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Step 1: Select Loan */}
      {step === 'select-loan' && (
        <div className="space-y-4">
          {loans.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="font-medium text-slate-900 mb-1">No Active Loans</h3>
                <p className="text-sm text-slate-500">
                  You don't have any active loans to make payments on.
                </p>
                <Button className="mt-4" onClick={() => navigate('/portal/loans')}>
                  View All Loans
                </Button>
              </CardContent>
            </Card>
          ) : (
            loans.map((loan) => {
              const progress = loan.principal > 0 
                ? Math.round(((loan.principal - loan.outstanding) / loan.principal) * 100) 
                : 0;
              
              return (
                <Card
                  key={loan.id}
                  className="border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleSelectLoan(loan)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{loan.loanNumber}</h3>
                        <p className="text-sm text-slate-500">{loan.productName}</p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-slate-500">Outstanding</p>
                        <p className="text-lg font-bold text-slate-900">{formatCurrency(loan.outstanding)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Next Payment</p>
                        <p className="text-lg font-bold text-emerald-600">
                          {formatCurrency(Math.min(loan.outstanding, 15000))}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{progress}% repaid</span>
                        <span>{formatCurrency(loan.principal - loan.outstanding)} of {formatCurrency(loan.principal)}</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Step 2: Enter Amount */}
      {step === 'enter-amount' && selectedLoan && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Payment Amount</CardTitle>
            <CardDescription>
              Outstanding balance: {formatCurrency(selectedLoan.outstanding)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Amount (KES)</label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-2xl h-14 font-bold"
              />
            </div>
            
            {/* Quick amount buttons */}
            <div className="flex flex-wrap gap-2">
              {(() => {
                const suggestedAmount = (selectedLoan as any).nextPaymentAmount || (selectedLoan as any).monthlyPayment || selectedLoan.outstanding;
                const displayAmount = Math.min(selectedLoan.outstanding, suggestedAmount);
                return (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(displayAmount.toString())}
                    className={amount === displayAmount.toString() ? 'border-emerald-500 bg-emerald-50' : ''}
                  >
                    Next Payment ({formatCurrency(displayAmount)})
                  </Button>
                );
              })()}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount(selectedLoan.outstanding.toString())}
                className={amount === selectedLoan.outstanding.toString() ? 'border-emerald-500 bg-emerald-50' : ''}
              >
                Full Balance ({formatCurrency(selectedLoan.outstanding)})
              </Button>
            </div>

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={handleAmountContinue}
              disabled={!amount || parseFloat(amount) <= 0}
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Select Payment Method */}
      {step === 'select-method' && (
        <div className="space-y-4">
          <Card className="border-slate-200 bg-slate-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Payment Amount</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(parseFloat(amount))}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">For Loan</p>
                  <p className="font-medium text-slate-900">{selectedLoan?.loanNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <Card
                key={method.id}
                className="border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleMethodSelect(method.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center', method.color)}>
                      <method.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{method.name}</h3>
                      <p className="text-sm text-slate-500">{method.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Confirm Payment */}
      {step === 'confirm' && selectedLoan && paymentMethod && (
        <div className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Confirm Payment</CardTitle>
              <CardDescription>Review your payment details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Loan</span>
                  <span className="font-medium">{selectedLoan.loanNumber}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Amount</span>
                  <span className="font-bold text-lg">{formatCurrency(parseFloat(amount))}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Payment Method</span>
                  <span className="font-medium">
                    {paymentMethods.find(m => m.id === paymentMethod)?.name}
                  </span>
                </div>
              </div>

              {paymentMethod === 'mpesa' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">M-Pesa Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="e.g., 0712345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  <p className="text-xs text-slate-500">
                    You will receive an STK push to complete the payment
                  </p>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                <p className="text-sm text-amber-800">
                  By confirming, you authorize this payment. The transaction cannot be reversed.
                </p>
              </div>

              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={handleConfirmPayment}
                disabled={paymentMethod === 'mpesa' && !phoneNumber}
              >
                <Shield className="h-4 w-4 mr-2" />
                Confirm Payment
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 5: Processing */}
      {step === 'processing' && (
        <Card className="border-slate-200">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-16 w-16 animate-spin text-emerald-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Processing Payment</h3>
            <p className="text-slate-500">Please wait while we process your payment...</p>
            {paymentMethod === 'mpesa' && (
              <p className="text-sm text-emerald-600 mt-4">
                Check your phone for the M-Pesa prompt
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 6: Success */}
      {step === 'success' && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="py-12 text-center">
            <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-emerald-900 mb-2">Payment Successful!</h3>
            <p className="text-emerald-700 mb-2">
              Your payment of {formatCurrency(parseFloat(amount))} has been initiated.
            </p>
            <p className="text-sm text-emerald-600 mb-6">
              Reference: TXN-{Date.now().toString().slice(-8)}
            </p>
            
            <div className="flex items-center justify-center gap-2 text-sm text-slate-600 mb-6">
              <Clock className="h-4 w-4" />
              <span>Payment will reflect in your account within 24 hours</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={handleNewPayment}>
                Make Another Payment
              </Button>
              <Button onClick={() => navigate('/portal/statements')}>
                View Receipts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
