import { useState, useEffect } from 'react';
import { Client } from '../../types/client';
import { clientService } from '../../services/clientService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { formatDate } from '../../lib/utils';
import { toast } from 'sonner';
import {
  History,
  Shield,
  ShieldCheck,
  ShieldX,
  Clock,
  FileText,
  Upload,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

interface ClientTimelineTabProps {
  client: Client;
}

const KYC_STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  UNVERIFIED: { icon: Shield, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
  PENDING_REVIEW: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200' },
  VERIFIED: { icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' },
  REJECTED: { icon: ShieldX, color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' },
  RETURNED: { icon: RotateCcw, color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200' },
};

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

  const getEventConfig = (type: string, data: any) => {
    if (type === 'kyc_event') {
      const statusConfig = KYC_STATUS_CONFIG[data?.toStatus] || KYC_STATUS_CONFIG.UNVERIFIED;
      return {
        icon: statusConfig.icon,
        color: statusConfig.color,
        bg: statusConfig.bg,
        border: statusConfig.border,
        title: 'KYC Status Change',
      };
    }
    return {
      icon: Upload,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      border: 'border-blue-200',
      title: 'Document Uploaded',
    };
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-5 w-5 text-slate-600" />
          Activity Timeline
        </CardTitle>
        <CardDescription>Recent activity and status changes</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-12">
            <Clock className="h-8 w-8 text-slate-300 mx-auto mb-3 animate-spin" />
            <p className="text-slate-500">Loading timeline...</p>
          </div>
        ) : timeline.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
            <History className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No activity yet</p>
            <p className="text-sm text-slate-500 mt-1">Client activities will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {timeline.map((item, index) => {
              const config = getEventConfig(item.type, item.data);
              const EventIcon = config.icon;

              return (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 ${config.bg} ${config.border}`}>
                      <EventIcon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    {index < timeline.length - 1 && (
                      <div className="w-0.5 flex-1 bg-slate-200 my-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-slate-900">{config.title}</span>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {formatDate(item.date)}
                      </span>
                    </div>

                    {item.type === 'kyc_event' && (
                      <div className={`rounded-lg p-3 ${config.bg} border ${config.border}`}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`${KYC_STATUS_CONFIG[item.data.fromStatus]?.bg || 'bg-slate-100'} ${KYC_STATUS_CONFIG[item.data.fromStatus]?.color || 'text-slate-600'} border ${KYC_STATUS_CONFIG[item.data.fromStatus]?.border || 'border-slate-200'}`}>
                            {item.data.fromStatus?.replace('_', ' ')}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-slate-400" />
                          <Badge variant="outline" className={`${config.bg} ${config.color} border ${config.border}`}>
                            {item.data.toStatus?.replace('_', ' ')}
                          </Badge>
                        </div>
                        {item.data.reason && (
                          <p className="text-sm text-slate-700 mt-2">
                            <span className="font-medium">Reason:</span> {item.data.reason}
                          </p>
                        )}
                        {item.data.notes && (
                          <p className="text-sm text-slate-600 mt-1">{item.data.notes}</p>
                        )}
                      </div>
                    )}

                    {item.type === 'document' && (
                      <div className="rounded-lg p-3 bg-blue-50 border border-blue-200">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{item.data.fileName}</p>
                            <p className="text-xs text-slate-500">
                              {item.data.documentType?.replace('_', ' ')} • {(item.data.sizeBytes / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
