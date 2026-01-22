import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client } from '../../types/client';
import { loanService } from '../../services/loanService';
import type { Loan } from '../../types/loan';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { formatDate } from '../../lib/utils';

interface ClientLoansTabProps {
  client: Client;
}

export default function ClientLoansTab({ client }: ClientLoansTabProps) {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await loanService.getLoans({ clientId: client.id, page: 1, limit: 50 });
        setLoans(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load loan history');
      } finally {
        setLoading(false);
      }
    };

    if (client?.id) {
      load();
    }
  }, [client?.id]);

  const getStatusBadge = (status: string) => {
    if (status === 'ACTIVE') return <Badge variant="success">Active</Badge>;
    if (status === 'PENDING_DISBURSEMENT') return <Badge variant="warning">Pending Disbursement</Badge>;
    if (status === 'CLOSED') return <Badge variant="secondary">Closed</Badge>;
    if (status === 'WRITTEN_OFF') return <Badge variant="destructive">Written Off</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loan History</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading loans...</div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
            {error}
          </div>
        ) : loans.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-2">No loans yet</p>
            <p className="text-sm text-muted-foreground">Approved applications can be converted into loans.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Disbursed</TableHead>
                  <TableHead>Maturity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-mono">{loan.loanNumber}</TableCell>
                    <TableCell>{getStatusBadge(loan.status)}</TableCell>
                    <TableCell className="font-medium">KES {Number(loan.principalAmount).toLocaleString()}</TableCell>
                    <TableCell>{loan.disbursedAt ? formatDate(loan.disbursedAt) : '—'}</TableCell>
                    <TableCell>{loan.maturityDate ? formatDate(loan.maturityDate) : '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/loans/${loan.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
