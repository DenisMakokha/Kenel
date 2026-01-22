import { Client } from '../../types/client';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { formatDate, formatCurrency } from '../../lib/utils';

interface ClientProfileTabProps {
  client: Client;
  onUpdate: () => void;
}

export default function ClientProfileTab({ client }: ClientProfileTabProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Full Name</p>
            <p className="font-medium">
              {client.firstName} {client.otherNames} {client.lastName}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">ID Type</p>
            <p className="font-medium">{client.idType.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">ID Number</p>
            <p className="font-medium font-mono">{client.idNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date of Birth</p>
            <p className="font-medium">{formatDate(client.dateOfBirth)}</p>
          </div>
          {client.gender && (
            <div>
              <p className="text-sm text-muted-foreground">Gender</p>
              <p className="font-medium">{client.gender}</p>
            </div>
          )}
          {client.maritalStatus && (
            <div>
              <p className="text-sm text-muted-foreground">Marital Status</p>
              <p className="font-medium">{client.maritalStatus}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Primary Phone</p>
            <p className="font-medium">{client.phonePrimary}</p>
          </div>
          {client.phoneSecondary && (
            <div>
              <p className="text-sm text-muted-foreground">Secondary Phone</p>
              <p className="font-medium">{client.phoneSecondary}</p>
            </div>
          )}
          {client.email && (
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{client.email}</p>
            </div>
          )}
          {client.residentialAddress && (
            <div>
              <p className="text-sm text-muted-foreground">Residential Address</p>
              <p className="font-medium">{client.residentialAddress}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Employment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {client.employerName ? (
            <>
              <div>
                <p className="text-sm text-muted-foreground">Employer</p>
                <p className="font-medium">{client.employerName}</p>
              </div>
              {client.occupation && (
                <div>
                  <p className="text-sm text-muted-foreground">Occupation</p>
                  <p className="font-medium">{client.occupation}</p>
                </div>
              )}
              {client.employerAddress && (
                <div>
                  <p className="text-sm text-muted-foreground">Employer Address</p>
                  <p className="font-medium">{client.employerAddress}</p>
                </div>
              )}
              {client.employerPhone && (
                <div>
                  <p className="text-sm text-muted-foreground">Employer Phone</p>
                  <p className="font-medium">{client.employerPhone}</p>
                </div>
              )}
              {client.monthlyIncome && (
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Income</p>
                  <p className="font-medium">{formatCurrency(parseFloat(client.monthlyIncome))}</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">No employment information provided</p>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Created Channel</p>
            <p className="font-medium">{client.createdChannel}</p>
          </div>
          {client.kycLevel && (
            <div>
              <p className="text-sm text-muted-foreground">KYC Level</p>
              <p className="font-medium capitalize">{client.kycLevel}</p>
            </div>
          )}
          {client.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="font-medium whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Last Updated</p>
            <p className="font-medium">{formatDate(client.updatedAt)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
