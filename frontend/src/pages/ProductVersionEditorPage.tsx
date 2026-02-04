import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loanProductService } from '../services/loanProductService';
import {
  LoanProduct,
  LoanProductVersion,
  LoanProductRules,
  CreateProductVersionDto,
  RepaymentFrequency,
  InterestCalculationMethod,
  InterestRatePeriod,
  FeeType,
  PenaltyType,
  PenaltyFrequency,
} from '../types/loan-product';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import PreviewScheduleModal from '../components/loan-products/PreviewScheduleModal';

export default function ProductVersionEditorPage() {
  const { productId, versionId } = useParams<{ productId: string; versionId: string }>();
  const navigate = useNavigate();
  const isEdit = versionId !== 'new';

  const [product, setProduct] = useState<LoanProduct | null>(null);
  const [version, setVersion] = useState<LoanProductVersion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Empty default rules - user must configure all values
  const [rules, setRules] = useState<LoanProductRules>({
    terms: {
      min_principal: 0,
      max_principal: 0,
      default_principal: 0,
      min_term_months: 1,
      max_term_months: 1,
      default_term_months: 1,
      repayment_frequency: 'MONTHLY' as RepaymentFrequency,
      allow_topup: false,
    },
    interest: {
      calculation_method: 'DECLINING_BALANCE' as InterestCalculationMethod,
      rate_per_year: 0,
      min_rate_per_year: 0,
      max_rate_per_year: 0,
      rate_period: 'PER_ANNUM' as InterestRatePeriod,
      interest_free_periods: 0,
      recalculate_on_prepayment: true,
    },
    fees: {
      processing_fee_type: 'PERCENTAGE' as FeeType,
      processing_fee_value: 0,
      processing_fee_cap: 0,
      disbursement_fee: null,
    },
    penalties: {
      late_payment: {
        type: 'PERCENTAGE_OF_OVERDUE' as PenaltyType,
        value: 0,
        frequency: 'MONTHLY' as PenaltyFrequency,
        grace_days: 0,
      },
    },
    grace_moratorium: {
      grace_on_principal_periods: 0,
      grace_on_interest_periods: 0,
      moratorium_interest_free_periods: 0,
    },
    arrears: {
      grace_on_arrears_ageing_days: 0,
      overdue_days_for_npa: 90,
    },
    allocation: {
      order: ['penalties', 'fees', 'interest', 'principal'],
    },
    constraints: {
      allow_multiple_loans_per_client: true,
      max_active_loans_per_client: 1,
    },
  });

  useEffect(() => {
    loadData();
  }, [productId, versionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const prod = await loanProductService.getProduct(productId!);
      setProduct(prod);

      if (isEdit) {
        const ver = await loanProductService.getVersion(productId!, versionId!);
        setVersion(ver);
        setRules(ver.rules);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (publish = false) => {
    setError('');
    try {
      setLoading(true);

      if (isEdit) {
        await loanProductService.updateVersion(productId!, versionId!, { rules });
        if (publish) {
          await loanProductService.publishVersion(productId!, versionId!);
        }
      } else {
        const dto: CreateProductVersionDto = { rules };
        const created = await loanProductService.createVersion(productId!, dto);
        if (publish) {
          await loanProductService.publishVersion(productId!, created.id);
        }
      }

      navigate(`/loan-products/${productId}`);
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData?.errors) {
        setError(
          `Validation failed:\n${errorData.errors.map((e: any) => `• ${e.path}: ${e.message}`).join('\n')}`,
        );
      } else {
        setError(errorData?.message || 'Failed to save version');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !product) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {isEdit ? 'Edit Version' : 'New Version'} - {product?.name}
        </h1>
        <p className="text-muted-foreground">
          {isEdit ? `Version ${version?.versionNumber}` : 'Create a new product version'}
        </p>
        {version?.status && (
          <Badge className="mt-2" variant={version.status === 'DRAFT' ? 'outline' : 'success'}>
            {version.status}
          </Badge>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded whitespace-pre-line">
          {error}
        </div>
      )}

      {/* Terms Section */}
      <Card>
        <CardHeader>
          <CardTitle>Terms & Limits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Min Principal *</Label>
              <Input
                type="number"
                value={rules.terms.min_principal}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    terms: { ...rules.terms, min_principal: Number(e.target.value) },
                  })
                }
              />
            </div>
            <div>
              <Label>Default Principal *</Label>
              <Input
                type="number"
                value={rules.terms.default_principal}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    terms: { ...rules.terms, default_principal: Number(e.target.value) },
                  })
                }
              />
            </div>
            <div>
              <Label>Max Principal *</Label>
              <Input
                type="number"
                value={rules.terms.max_principal}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    terms: { ...rules.terms, max_principal: Number(e.target.value) },
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Min Term (months) *</Label>
              <Input
                type="number"
                value={rules.terms.min_term_months}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    terms: { ...rules.terms, min_term_months: Number(e.target.value) },
                  })
                }
              />
            </div>
            <div>
              <Label>Default Term (months) *</Label>
              <Input
                type="number"
                value={rules.terms.default_term_months}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    terms: { ...rules.terms, default_term_months: Number(e.target.value) },
                  })
                }
              />
            </div>
            <div>
              <Label>Max Term (months) *</Label>
              <Input
                type="number"
                value={rules.terms.max_term_months}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    terms: { ...rules.terms, max_term_months: Number(e.target.value) },
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Repayment Frequency *</Label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={rules.terms.repayment_frequency}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    terms: { ...rules.terms, repayment_frequency: e.target.value as RepaymentFrequency },
                  })
                }
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-8">
              <input
                type="checkbox"
                id="allow_topup"
                checked={rules.terms.allow_topup}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    terms: { ...rules.terms, allow_topup: e.target.checked },
                  })
                }
              />
              <Label htmlFor="allow_topup">Allow Top-up</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interest Section */}
      <Card>
        <CardHeader>
          <CardTitle>Interest Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Calculation Method *</Label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={rules.interest.calculation_method}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    interest: {
                      ...rules.interest,
                      calculation_method: e.target.value as InterestCalculationMethod,
                    },
                  })
                }
              >
                <option value="FLAT">Flat</option>
                <option value="DECLINING_BALANCE">Declining Balance</option>
              </select>
            </div>
            <div>
              <Label>Rate Period *</Label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={rules.interest.rate_period || 'PER_ANNUM'}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    interest: {
                      ...rules.interest,
                      rate_period: e.target.value as InterestRatePeriod,
                    },
                  })
                }
              >
                <option value="PER_ANNUM">Per Annum (p.a.)</option>
                <option value="PER_MONTH">Per Month (p.m.)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Min Rate (% {rules.interest.rate_period === 'PER_MONTH' ? 'p.m.' : 'p.a.'}) *</Label>
              <Input
                type="number"
                step="0.1"
                value={rules.interest.min_rate_per_year}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    interest: { ...rules.interest, min_rate_per_year: Number(e.target.value) },
                  })
                }
              />
            </div>
            <div>
              <Label>Default Rate (% {rules.interest.rate_period === 'PER_MONTH' ? 'p.m.' : 'p.a.'}) *</Label>
              <Input
                type="number"
                step="0.1"
                value={rules.interest.rate_per_year}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    interest: { ...rules.interest, rate_per_year: Number(e.target.value) },
                  })
                }
              />
            </div>
            <div>
              <Label>Max Rate (% {rules.interest.rate_period === 'PER_MONTH' ? 'p.m.' : 'p.a.'}) *</Label>
              <Input
                type="number"
                step="0.1"
                value={rules.interest.max_rate_per_year}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    interest: { ...rules.interest, max_rate_per_year: Number(e.target.value) },
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fees Section */}
      <Card>
        <CardHeader>
          <CardTitle>Fees</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Processing Fee Type *</Label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={rules.fees.processing_fee_type}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    fees: { ...rules.fees, processing_fee_type: e.target.value as FeeType },
                  })
                }
              >
                <option value="FIXED">Fixed</option>
                <option value="PERCENTAGE">Percentage</option>
              </select>
            </div>
            <div>
              <Label>Processing Fee Value *</Label>
              <Input
                type="number"
                step="0.1"
                value={rules.fees.processing_fee_value}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    fees: { ...rules.fees, processing_fee_value: Number(e.target.value) },
                  })
                }
              />
            </div>
            <div>
              <Label>Processing Fee Cap</Label>
              <Input
                type="number"
                value={rules.fees.processing_fee_cap || ''}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    fees: {
                      ...rules.fees,
                      processing_fee_cap: e.target.value ? Number(e.target.value) : null,
                    },
                  })
                }
                placeholder="No cap"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Arrears Section */}
      <Card>
        <CardHeader>
          <CardTitle>Arrears & NPA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Grace on Arrears Ageing (days)</Label>
              <Input
                type="number"
                value={rules.arrears.grace_on_arrears_ageing_days}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    arrears: { ...rules.arrears, grace_on_arrears_ageing_days: Number(e.target.value) },
                  })
                }
              />
            </div>
            <div>
              <Label>Overdue Days for NPA *</Label>
              <Input
                type="number"
                value={rules.arrears.overdue_days_for_npa}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    arrears: { ...rules.arrears, overdue_days_for_npa: Number(e.target.value) },
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => navigate(`/loan-products/${productId}`)}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
            disabled={loading}
          >
            Preview Schedule
          </Button>
          <Button variant="outline" onClick={() => handleSave(false)} disabled={loading}>
            {loading ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button onClick={() => handleSave(true)} disabled={loading}>
            {loading ? 'Publishing...' : 'Save & Publish'}
          </Button>
        </div>
      </div>

      {/* Preview Modal */}
      {product && (isEdit ? version : true) && (
        <PreviewScheduleModal
          open={showPreview}
          onClose={() => setShowPreview(false)}
          productId={productId!}
          versionId={isEdit ? versionId! : 'temp'}
          productName={product.name}
          currencyCode={product.currencyCode}
        />
      )}
    </div>
  );
}
