import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loanProductService } from '../services/loanProductService';
import { ProductType, CreateLoanProductDto, UpdateLoanProductDto } from '../types/loan-product';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Package,
  ArrowLeft,
  Save,
  Percent,
  Receipt,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Info,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { interestRateService, type InterestRate } from '../services/interestRateService';
import { feeTemplateService, type FeeTemplate } from '../services/feeTemplateService';

const PRODUCT_TYPE_INFO: Record<ProductType, { label: string; description: string; icon: any }> = {
  SALARY_ADVANCE: {
    label: 'Salary Advance',
    description: 'Short-term loans against expected salary',
    icon: DollarSign,
  },
  TERM_LOAN: {
    label: 'Term Loan',
    description: 'Fixed-term loans with regular repayments',
    icon: Calendar,
  },
  BUSINESS_LOAN: {
    label: 'Business Loan',
    description: 'Loans for business purposes and working capital',
    icon: TrendingUp,
  },
  CUSTOM: {
    label: 'Custom',
    description: 'Flexible loan product with custom terms',
    icon: Package,
  },
};

export default function LoanProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const configDisabled = true;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [interestRates, setInterestRates] = useState<InterestRate[]>([]);
  const [feeTemplates, setFeeTemplates] = useState<FeeTemplate[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    productType: 'SALARY_ADVANCE' as ProductType,
    currencyCode: 'KES',
    isActive: true,
    // Configuration fields - empty by default, user must set values
    minAmount: '',
    maxAmount: '',
    minTerm: '1',
    maxTerm: '',
    interestRateId: '',
    interestRatePeriod: 'PER_ANNUM' as 'PER_ANNUM' | 'PER_MONTH',
    selectedFees: [] as string[],
  });

  useEffect(() => {
    if (isEdit && id) {
      loadProduct();
    }
  }, [id]);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoadingConfig(true);
        const [ratesResp, feesResp] = await Promise.all([
          interestRateService.getAll({ limit: 200, isActive: 'true' }),
          feeTemplateService.getAll({ limit: 200, isActive: 'true' }),
        ]);
        setInterestRates(ratesResp.data);
        setFeeTemplates(feesResp.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load interest rates / fee templates');
      } finally {
        setLoadingConfig(false);
      }
    };

    loadConfig();
  }, []);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const product = await loanProductService.getProduct(id!);
      setFormData({
        code: product.code,
        name: product.name,
        description: product.description || '',
        productType: product.productType,
        currencyCode: product.currencyCode,
        isActive: product.isActive,
        // Load from product configuration or leave empty
        minAmount: '',
        maxAmount: '',
        minTerm: '1',
        maxTerm: '',
        interestRateId: '',
        interestRatePeriod: 'PER_ANNUM',
        selectedFees: [],
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      if (isEdit) {
        const updateDto: UpdateLoanProductDto = {
          name: formData.name,
          description: formData.description,
          productType: formData.productType,
          currencyCode: formData.currencyCode,
          isActive: formData.isActive,
        };
        await loanProductService.updateProduct(id!, updateDto);
      } else {
        const createDto: CreateLoanProductDto = {
          code: formData.code,
          name: formData.name,
          description: formData.description,
          productType: formData.productType,
          currencyCode: formData.currencyCode,
        };
        const created = await loanProductService.createProduct(createDto);
        navigate(`/loan-products/${created.id}`);
        return;
      }
      navigate(`/loan-products/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const toggleFee = (feeId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedFees: prev.selectedFees.includes(feeId)
        ? prev.selectedFees.filter((id) => id !== feeId)
        : [...prev.selectedFees, feeId],
    }));
  };

  const selectedRate = interestRates.find((r) => r.id === formData.interestRateId);

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 md:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/loan-products')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isEdit ? 'Edit Loan Product' : 'New Loan Product'}
            </h1>
            <p className="text-sm text-slate-600">
              {isEdit ? 'Update product configuration' : 'Create a new loan product with terms and fees'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/loan-products')}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.code || !formData.name}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="border-slate-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Information
              </CardTitle>
              <CardDescription>
                Basic details about the loan product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">Product Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="SAL_ADV"
                    disabled={isEdit}
                    maxLength={50}
                  />
                  {isEdit && (
                    <p className="text-xs text-muted-foreground">Code cannot be changed</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currencyCode">Currency</Label>
                  <Select
                    value={formData.currencyCode}
                    onValueChange={(v) => setFormData({ ...formData, currencyCode: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Salary Advance"
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the loan product..."
                />
              </div>

              <div className="space-y-2">
                <Label>Product Type *</Label>
                <div className="grid gap-3 md:grid-cols-2">
                  {(Object.keys(PRODUCT_TYPE_INFO) as ProductType[]).map((type) => {
                    const info = PRODUCT_TYPE_INFO[type];
                    const Icon = info.icon;
                    const isSelected = formData.productType === type;
                    return (
                      <div
                        key={type}
                        onClick={() => setFormData({ ...formData, productType: type })}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 hover:border-slate-300'
                        )}
                      >
                        <div className={cn(
                          'h-8 w-8 rounded-lg flex items-center justify-center',
                          isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className={cn(
                            'font-medium text-sm',
                            isSelected ? 'text-emerald-700' : 'text-slate-900'
                          )}>
                            {info.label}
                          </p>
                          <p className="text-xs text-slate-500">{info.description}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loan Limits */}
          <Card className="border-slate-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Loan Limits
              </CardTitle>
              <CardDescription>
                Define amount and term limits for this product
              </CardDescription>
            </CardHeader>
            <CardContent>
              {configDisabled && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 mb-4">
                  Loan product limits are not available yet.
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="minAmount">Minimum Amount (KES)</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    value={formData.minAmount}
                    onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                    placeholder="10000"
                    disabled={configDisabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAmount">Maximum Amount (KES)</Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    value={formData.maxAmount}
                    onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                    placeholder="500000"
                    disabled={configDisabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minTerm">Minimum Term (months)</Label>
                  <Input
                    id="minTerm"
                    type="number"
                    value={formData.minTerm}
                    onChange={(e) => setFormData({ ...formData, minTerm: e.target.value })}
                    placeholder="1"
                    disabled={configDisabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxTerm">Maximum Term (months)</Label>
                  <Input
                    id="maxTerm"
                    type="number"
                    value={formData.maxTerm}
                    onChange={(e) => setFormData({ ...formData, maxTerm: e.target.value })}
                    placeholder="12"
                    disabled={configDisabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fee Templates */}
          <Card className="border-slate-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Applicable Fees
              </CardTitle>
              <CardDescription>
                Select fee templates to apply to this product
              </CardDescription>
            </CardHeader>
            <CardContent>
              {configDisabled && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 mb-4">
                  Fee selection is not available yet.
                </div>
              )}
              <div className="grid gap-3 md:grid-cols-2">
                {loadingConfig ? (
                  <div className="text-sm text-muted-foreground">Loading fees...</div>
                ) : feeTemplates.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No active fee templates found</div>
                ) : (
                  feeTemplates.map((fee) => {
                    const isSelected = formData.selectedFees.includes(fee.id);
                    return (
                      <div
                        key={fee.id}
                        onClick={() => {
                          if (!configDisabled) toggleFee(fee.id);
                        }}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all',
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 hover:border-slate-300'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'h-4 w-4 rounded border-2 flex items-center justify-center',
                              isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                            )}
                          >
                            {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{fee.name}</p>
                            {fee.description && (
                              <p className="text-xs text-slate-500">{fee.description}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="font-mono">
                          {fee.calculationType === 'PERCENTAGE'
                            ? `${fee.value}%`
                            : `KES ${Number(fee.value).toLocaleString()}`}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <Info className="h-3 w-3" />
                {formData.selectedFees.length} fee(s) selected
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary & Interest Rate */}
        <div className="space-y-6">
          {/* Interest Rate Selection */}
          <Card className="border-slate-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Interest Rate
              </CardTitle>
              <CardDescription>
                Select the interest rate configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {configDisabled && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Interest rate configuration is not available yet.
                </div>
              )}
              <div className="space-y-2">
                <Label>Rate Period</Label>
                <Select
                  value={formData.interestRatePeriod}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      interestRatePeriod: v as 'PER_ANNUM' | 'PER_MONTH',
                    })
                  }
                  disabled={configDisabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PER_ANNUM">Per Annum (p.a.)</SelectItem>
                    <SelectItem value="PER_MONTH">Per Month (p.m.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loadingConfig ? (
                <div className="text-sm text-muted-foreground">Loading interest rates...</div>
              ) : interestRates.length === 0 ? (
                <div className="text-sm text-muted-foreground">No active interest rates found</div>
              ) : (
                interestRates.map((rate) => {
                  const isSelected = formData.interestRateId === rate.id;
                  return (
                    <div
                      key={rate.id}
                      onClick={() => {
                        if (!configDisabled) setFormData({ ...formData, interestRateId: rate.id });
                      }}
                      className={cn(
                        'p-3 rounded-lg border-2 cursor-pointer transition-all',
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{rate.name}</p>
                          <p className="text-xs text-slate-500">{rate.type} Balance</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-emerald-600">{rate.rate}%</p>
                          <p className="text-xs text-slate-500">
                            {formData.interestRatePeriod === 'PER_MONTH' ? 'per month' : 'per annum'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Product Summary */}
          <Card className="border-slate-100 bg-slate-50">
            <CardHeader>
              <CardTitle className="text-base">Product Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Product Code</span>
                <span className="font-mono font-medium">{formData.code || '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Product Name</span>
                <span className="font-medium">{formData.name || '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Type</span>
                <Badge variant="outline">
                  {PRODUCT_TYPE_INFO[formData.productType].label}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Amount Range</span>
                <span className="font-medium">
                  {formData.currencyCode} {parseInt(formData.minAmount || '0').toLocaleString()} - {parseInt(formData.maxAmount || '0').toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Term Range</span>
                <span className="font-medium">
                  {formData.minTerm} - {formData.maxTerm} months
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Interest Rate</span>
                <span className="font-medium text-emerald-600">
                  {selectedRate
                    ? `${selectedRate.rate}% ${formData.interestRatePeriod === 'PER_MONTH' ? 'p.m.' : 'p.a.'}`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Fees Applied</span>
                <span className="font-medium">{formData.selectedFees.length} fee(s)</span>
              </div>
              
              {isEdit && (
                <>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Status</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                          className={cn(
                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                            formData.isActive ? 'bg-emerald-600' : 'bg-slate-200'
                          )}
                        >
                          <span
                            className={cn(
                              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                              formData.isActive ? 'translate-x-6' : 'translate-x-1'
                            )}
                          />
                        </button>
                        <span className="text-sm font-medium">
                          {formData.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
