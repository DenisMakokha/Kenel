import { Client } from '../../types/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { formatDate, formatCurrency } from '../../lib/utils';
import {
  User,
  CreditCard,
  Calendar,
  Users,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Building,
  DollarSign,
  Clock,
  Hash,
  Heart,
} from 'lucide-react';

interface ClientProfileTabProps {
  client: Client;
  onUpdate: () => void;
}

interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  color?: string;
}

function InfoItem({ icon: Icon, label, value, mono, color }: InfoItemProps) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${color || 'bg-slate-200 text-slate-600'}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
        <p className={`text-sm font-medium text-slate-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
    </div>
  );
}

export default function ClientProfileTab({ client }: ClientProfileTabProps) {
  return (
    <div className="space-y-6">
      {/* Client Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
            {client.firstName?.[0]}{client.lastName?.[0]}
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {client.firstName} {client.otherNames} {client.lastName}
            </h2>
            <p className="text-blue-100 font-mono">{client.clientCode}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            {client.idType?.replace('_', ' ')}
          </Badge>
          {client.gender && (
            <Badge variant="secondary" className="bg-white/20 text-white border-0">
              {client.gender}
            </Badge>
          )}
          {client.maritalStatus && (
            <Badge variant="secondary" className="bg-white/20 text-white border-0">
              {client.maritalStatus}
            </Badge>
          )}
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            {client.createdChannel}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Personal Information
            </CardTitle>
            <CardDescription>Identity and personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem icon={CreditCard} label="ID Number" value={client.idNumber} mono color="bg-blue-100 text-blue-600" />
            <InfoItem icon={Calendar} label="Date of Birth" value={formatDate(client.dateOfBirth)} color="bg-purple-100 text-purple-600" />
            <InfoItem icon={Users} label="Gender" value={client.gender} color="bg-pink-100 text-pink-600" />
            <InfoItem icon={Heart} label="Marital Status" value={client.maritalStatus} color="bg-rose-100 text-rose-600" />
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-5 w-5 text-emerald-600" />
              Contact Information
            </CardTitle>
            <CardDescription>Phone numbers and addresses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem icon={Phone} label="Primary Phone" value={client.phonePrimary} color="bg-emerald-100 text-emerald-600" />
            <InfoItem icon={Phone} label="Secondary Phone" value={client.phoneSecondary} color="bg-teal-100 text-teal-600" />
            <InfoItem icon={Mail} label="Email" value={client.email} color="bg-cyan-100 text-cyan-600" />
            <InfoItem icon={MapPin} label="Residential Address" value={client.residentialAddress} color="bg-green-100 text-green-600" />
          </CardContent>
        </Card>

        {/* Employment Information */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-amber-600" />
              Employment Information
            </CardTitle>
            <CardDescription>Work and income details</CardDescription>
          </CardHeader>
          <CardContent>
            {client.employerName ? (
              <div className="space-y-3">
                <InfoItem icon={Building} label="Employer" value={client.employerName} color="bg-amber-100 text-amber-600" />
                <InfoItem icon={Briefcase} label="Occupation" value={client.occupation} color="bg-orange-100 text-orange-600" />
                <InfoItem icon={MapPin} label="Employer Address" value={client.employerAddress} color="bg-yellow-100 text-yellow-700" />
                <InfoItem icon={Phone} label="Employer Phone" value={client.employerPhone} color="bg-lime-100 text-lime-700" />
                {client.monthlyIncome && (
                  <InfoItem icon={DollarSign} label="Monthly Income" value={formatCurrency(parseFloat(client.monthlyIncome))} color="bg-green-100 text-green-600" />
                )}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No employment information</p>
                <p className="text-sm text-slate-500 mt-1">Employment details not provided yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Hash className="h-5 w-5 text-slate-600" />
              Additional Information
            </CardTitle>
            <CardDescription>System and account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem icon={Hash} label="Client Code" value={client.clientCode} mono color="bg-slate-200 text-slate-600" />
            <InfoItem icon={Hash} label="Created Channel" value={client.createdChannel} color="bg-indigo-100 text-indigo-600" />
            {client.kycLevel && (
              <InfoItem icon={User} label="KYC Level" value={client.kycLevel} color="bg-violet-100 text-violet-600" />
            )}
            <InfoItem icon={Clock} label="Last Updated" value={formatDate(client.updatedAt)} color="bg-slate-200 text-slate-600" />
            {client.notes && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-700 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-amber-900 whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
