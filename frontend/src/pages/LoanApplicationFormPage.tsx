import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clientService } from '../services/clientService';
import { loanProductService } from '../services/loanProductService';
import { loanApplicationService } from '../services/loanApplicationService';
import type { Client, CreatedChannel } from '../types/client';
import type { LoanProduct, LoanProductVersion, RepaymentFrequency } from '../types/loan-product';
import type { CreateLoanApplicationDto, UpdateLoanApplicationDto, LoanApplication } from '../types/loan-application';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function LoanApplicationFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEdit = Boolean(id);

  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedProductVersionId, setSelectedProductVersionId] = useState('');
  const [requestedAmount, setRequestedAmount] = useState('');
  const [requestedTermMonths, setRequestedTermMonths] = useState('');
  const [requestedRepaymentFrequency, setRequestedRepaymentFrequency] = useState<RepaymentFrequency | ''>('');
  const [purpose, setPurpose] = useState('');
  const [channel, setChannel] = useState<CreatedChannel | ''>('');
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoadingInitial(true);
        const [clientsRes, productsRes] = await Promise.all([
          clientService.getClients({ page: 1, limit: 50 }),
          loanProductService.getProducts({ page: 1, limit: 50, isActive: 'true' }),
        ]);
        setClients(clientsRes.data);
        setProducts(productsRes.data);

        if (isEdit && id) {
          const app = await loanApplicationService.getApplication(id);
          setSelectedClientId(app.clientId);
          setSelectedProductVersionId(app.productVersionId);
          setRequestedAmount(app.requestedAmount.toString());
          setRequestedTermMonths(String(app.requestedTermMonths));
          setRequestedRepaymentFrequency(app.requestedRepaymentFrequency || '');
          setPurpose(app.purpose || '');
          setChannel(app.channel || '');
        } else {
          // set sensible defaults
          if (clientsRes.data.length > 0) {
            setSelectedClientId(clientsRes.data[0].id);
          }
          const firstProduct = productsRes.data[0];
          if (firstProduct && firstProduct.versions && firstProduct.versions.length > 0) {
            const version = firstProduct.versions[0] as LoanProductVersion;
            setSelectedProductVersionId(version.id);
            const rules = version.rules;
            setRequestedAmount(String(rules.terms.default_principal));
            setRequestedTermMonths(String(rules.terms.default_term_months));
            setRequestedRepaymentFrequency(rules.terms.repayment_frequency);
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load initial data');
      } finally {
        setLoadingInitial(false);
      }
    };

    loadInitial();
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !selectedProductVersionId) {
      setError('Client and product are required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const basePayload: CreateLoanApplicationDto & UpdateLoanApplicationDto = {
        clientId: selectedClientId,
        productVersionId: selectedProductVersionId,
        requestedAmount: Number(requestedAmount),
        requestedTermMonths: Number(requestedTermMonths),
        requestedRepaymentFrequency: requestedRepaymentFrequency || undefined,
        purpose: purpose || undefined,
        channel: channel || undefined,
      };

      let application: LoanApplication;

      if (isEdit && id) {
        const { clientId, productVersionId, ...updatePayload } = basePayload;
        application = await loanApplicationService.updateApplication(id, updatePayload);
      } else {
        application = await loanApplicationService.createApplication(basePayload);
      }

      navigate(`/loan-applications/${application.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save application');
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (productVersionId: string) => {
    setSelectedProductVersionId(productVersionId);
    const product = products.find((p) => p.versions?.some((v) => v.id === productVersionId));
    const version = product?.versions?.find((v) => v.id === productVersionId) as LoanProductVersion | undefined;
    if (version) {
      const rules = version.rules;
      setRequestedAmount(String(rules.terms.default_principal));
      setRequestedTermMonths(String(rules.terms.default_term_months));
      setRequestedRepaymentFrequency(rules.terms.repayment_frequency);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? 'Edit Loan Application' : 'New Loan Application'}
          </h1>
          <p className="text-muted-foreground">
            Capture basic details for a new loan application
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Application Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingInitial ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client">Client</Label>
                  <select
                    id="client"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                  >
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.clientCode} - {client.firstName} {client.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="product">Product & Version</Label>
                  <select
                    id="product"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={selectedProductVersionId}
                    onChange={(e) => handleProductChange(e.target.value)}
                  >
                    <option value="">Select product</option>
                    {products.flatMap((product) =>
                      (product.versions || []).map((version) => (
                        <option key={version.id} value={version.id}>
                          {product.code} - {product.name} (v{version.versionNumber})
                        </option>
                      )),
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="amount">Requested Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={requestedAmount}
                    onChange={(e) => setRequestedAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="term">Term (months)</Label>
                  <Input
                    id="term"
                    type="number"
                    value={requestedTermMonths}
                    onChange={(e) => setRequestedTermMonths(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="frequency">Repayment Frequency</Label>
                  <select
                    id="frequency"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={requestedRepaymentFrequency}
                    onChange={(e) =>
                      setRequestedRepaymentFrequency(e.target.value as RepaymentFrequency | '')
                    }
                  >
                    <option value="">Default from product</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purpose">Purpose</Label>
                  <textarea
                    id="purpose"
                    className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="channel">Channel</Label>
                  <select
                    id="channel"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as CreatedChannel | '')}
                  >
                    <option value="">Select channel</option>
                    <option value="BRANCH">Branch</option>
                    <option value="AGENT">Agent</option>
                    <option value="ONLINE">Online</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/loan-applications')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Application'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
