import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientService } from '../services/clientService';
import { Client, KycStatus } from '../types/client';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { formatDate } from '../lib/utils';
import ClientProfileTab from '../components/client/ClientProfileTab';
import ClientKYCTab from '../components/client/ClientKYCTab';
import ClientContactsTab from '../components/client/ClientContactsTab';
import ClientLoansTab from '../components/client/ClientLoansTab';
import ClientTimelineTab from '../components/client/ClientTimelineTab';
import ClientDocumentsTab from '../components/client/ClientDocumentsTab';
import ClientRepaymentsTab from '../components/client/ClientRepaymentsTab';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadClient();
    }
  }, [id]);

  const loadClient = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await clientService.getClient(id!);
      setClient(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load client');
    } finally {
      setLoading(false);
    }
  };

  const getKycBadge = (status: KycStatus) => {
    const variants = {
      UNVERIFIED: 'outline',
      PENDING_REVIEW: 'warning',
      VERIFIED: 'success',
      REJECTED: 'destructive',
      RETURNED: 'warning',
    } as const;

    return (
      <Badge variant={variants[status]}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">Loading client...</div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded mb-4">
          {error || 'Client not found'}
        </div>
        <Button onClick={() => navigate('/clients')}>Back to Clients</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Button variant="outline" onClick={() => navigate('/clients')} className="mb-4">
            ← Back to Clients
          </Button>
          <h1 className="text-3xl font-bold">
            {client.firstName} {client.lastName}
          </h1>
          <p className="text-muted-foreground">Client Code: {client.clientCode}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/clients/${id}/edit`)}>
            Edit Client
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">KYC Status</p>
              <div className="mt-1">{getKycBadge(client.kycStatus)}</div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Risk Rating</p>
              <p className="font-medium mt-1">
                {client.riskRating ? (
                  <Badge variant={
                    client.riskRating === 'LOW' ? 'success' :
                    client.riskRating === 'MEDIUM' ? 'warning' : 'destructive'
                  }>
                    {client.riskRating}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">Not Set</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Loans</p>
              <p className="font-medium mt-1">{client._count?.loans || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="font-medium mt-1">{formatDate(client.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="kyc">KYC</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="repayments">Repayments</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ClientProfileTab client={client} onUpdate={loadClient} />
        </TabsContent>

        <TabsContent value="kyc">
          <ClientKYCTab client={client} onUpdate={loadClient} />
        </TabsContent>

        <TabsContent value="contacts">
          <ClientContactsTab client={client} onUpdate={loadClient} />
        </TabsContent>

        <TabsContent value="timeline">
          <ClientTimelineTab client={client} />
        </TabsContent>

        <TabsContent value="documents">
          <ClientDocumentsTab client={client} onUpdate={loadClient} />
        </TabsContent>

        <TabsContent value="loans">
          <ClientLoansTab client={client} />
        </TabsContent>

        <TabsContent value="repayments">
          <ClientRepaymentsTab client={client} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
