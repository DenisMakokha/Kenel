import { useState, useEffect } from 'react';
import { Client } from '../../types/client';
import { clientService } from '../../services/clientService';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { formatDate } from '../../lib/utils';
import { toast } from 'sonner';

interface ClientTimelineTabProps {
  client: Client;
}

export default function ClientTimelineTab({ client }: ClientTimelineTabProps) {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeline();
  }, [client.id]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const data = await clientService.getTimeline(client.id);
      setTimeline(data);
    } catch (error) {
      toast.error('Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'kyc_event':
        return '🔒';
      case 'document':
        return '📄';
      default:
        return '📌';
    }
  };

  const getKycStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      UNVERIFIED: 'outline',
      PENDING_REVIEW: 'warning',
      VERIFIED: 'success',
      REJECTED: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Loading timeline...</p>
        ) : timeline.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No activity yet</p>
        ) : (
          <div className="space-y-4">
            {timeline.map((item, index) => (
              <div key={index} className="flex gap-4 border-l-2 border-primary pl-4 pb-4">
                <div className="text-2xl">{getEventIcon(item.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {item.type === 'kyc_event' ? 'KYC Status Change' : 'Document Uploaded'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(item.date)}
                    </span>
                  </div>

                  {item.type === 'kyc_event' && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Status changed from</span>
                        {getKycStatusBadge(item.data.fromStatus)}
                        <span className="text-sm">to</span>
                        {getKycStatusBadge(item.data.toStatus)}
                      </div>
                      {item.data.reason && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Reason:</strong> {item.data.reason}
                        </p>
                      )}
                      {item.data.notes && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Notes:</strong> {item.data.notes}
                        </p>
                      )}
                    </div>
                  )}

                  {item.type === 'document' && (
                    <div className="space-y-1">
                      <p className="text-sm">
                        <strong>{item.data.fileName}</strong>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Type: {item.data.documentType.replace('_', ' ')} •{' '}
                        Size: {(item.data.sizeBytes / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
