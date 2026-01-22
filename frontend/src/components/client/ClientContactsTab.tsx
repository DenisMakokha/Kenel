import { useState } from 'react';
import { Client, CreateNextOfKinDto, CreateRefereeDto } from '../../types/client';
import { clientService } from '../../services/clientService';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';

interface ClientContactsTabProps {
  client: Client;
  onUpdate: () => void;
}

export default function ClientContactsTab({ client, onUpdate }: ClientContactsTabProps) {
  const [showNOKDialog, setShowNOKDialog] = useState(false);
  const [showRefereeDialog, setShowRefereeDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nokForm, setNokForm] = useState<CreateNextOfKinDto>({
    fullName: '',
    relation: '',
    phone: '',
    email: '',
    address: '',
    isPrimary: false,
  });
  const [refereeForm, setRefereeForm] = useState<CreateRefereeDto>({
    fullName: '',
    relation: '',
    phone: '',
    idNumber: '',
    employerName: '',
    address: '',
  });

  const handleAddNOK = async () => {
    if (!nokForm.fullName || !nokForm.relation || !nokForm.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await clientService.addNextOfKin(client.id, nokForm);
      setShowNOKDialog(false);
      setNokForm({
        fullName: '',
        relation: '',
        phone: '',
        email: '',
        address: '',
        isPrimary: false,
      });
      onUpdate();
      toast.success('Next of kin added');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add next of kin');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNOK = async (nokId: string) => {
    if (!confirm('Are you sure you want to remove this next of kin?')) return;

    try {
      await clientService.deleteNextOfKin(client.id, nokId);
      onUpdate();
      toast.success('Next of kin removed');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete next of kin');
    }
  };

  const handleAddReferee = async () => {
    if (!refereeForm.fullName || !refereeForm.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await clientService.addReferee(client.id, refereeForm);
      setShowRefereeDialog(false);
      setRefereeForm({
        fullName: '',
        relation: '',
        phone: '',
        idNumber: '',
        employerName: '',
        address: '',
      });
      onUpdate();
      toast.success('Referee added');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add referee');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReferee = async (refereeId: string) => {
    if (!confirm('Are you sure you want to remove this referee?')) return;

    try {
      await clientService.deleteReferee(client.id, refereeId);
      onUpdate();
      toast.success('Referee removed');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete referee');
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Next of Kin */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Next of Kin</CardTitle>
            <Button size="sm" onClick={() => setShowNOKDialog(true)}>
              Add NOK
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!client.nextOfKin || client.nextOfKin.length === 0 ? (
            <p className="text-muted-foreground">No next of kin added yet</p>
          ) : (
            <div className="space-y-4">
              {client.nextOfKin.map((nok) => (
                <div key={nok.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{nok.fullName}</p>
                      <p className="text-sm text-muted-foreground">{nok.relation}</p>
                    </div>
                    {nok.isPrimary && (
                      <Badge variant="default" className="text-xs">Primary</Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><strong>Phone:</strong> {nok.phone}</p>
                    {nok.email && <p><strong>Email:</strong> {nok.email}</p>}
                    {nok.address && <p><strong>Address:</strong> {nok.address}</p>}
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteNOK(nok.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referees */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Referees</CardTitle>
            <Button size="sm" onClick={() => setShowRefereeDialog(true)}>
              Add Referee
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!client.referees || client.referees.length === 0 ? (
            <p className="text-muted-foreground">No referees added yet</p>
          ) : (
            <div className="space-y-4">
              {client.referees.map((referee) => (
                <div key={referee.id} className="border rounded-lg p-4 space-y-2">
                  <div>
                    <p className="font-medium">{referee.fullName}</p>
                    {referee.relation && (
                      <p className="text-sm text-muted-foreground">{referee.relation}</p>
                    )}
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><strong>Phone:</strong> {referee.phone}</p>
                    {referee.idNumber && <p><strong>ID:</strong> {referee.idNumber}</p>}
                    {referee.employerName && <p><strong>Employer:</strong> {referee.employerName}</p>}
                    {referee.address && <p><strong>Address:</strong> {referee.address}</p>}
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteReferee(referee.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add NOK Dialog */}
      <Dialog open={showNOKDialog} onOpenChange={setShowNOKDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Next of Kin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nok-name">Full Name *</Label>
              <Input
                id="nok-name"
                value={nokForm.fullName}
                onChange={(e) => setNokForm({ ...nokForm, fullName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="nok-relation">Relation *</Label>
              <Input
                id="nok-relation"
                placeholder="e.g., Spouse, Parent, Sibling"
                value={nokForm.relation}
                onChange={(e) => setNokForm({ ...nokForm, relation: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="nok-phone">Phone *</Label>
              <Input
                id="nok-phone"
                placeholder="+254712345678"
                value={nokForm.phone}
                onChange={(e) => setNokForm({ ...nokForm, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="nok-email">Email</Label>
              <Input
                id="nok-email"
                type="email"
                value={nokForm.email}
                onChange={(e) => setNokForm({ ...nokForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="nok-address">Address</Label>
              <Input
                id="nok-address"
                value={nokForm.address}
                onChange={(e) => setNokForm({ ...nokForm, address: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="nok-primary"
                checked={nokForm.isPrimary}
                onChange={(e) => setNokForm({ ...nokForm, isPrimary: e.target.checked })}
              />
              <Label htmlFor="nok-primary">Set as primary contact</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNOKDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNOK} disabled={loading}>
              Add Next of Kin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Referee Dialog */}
      <Dialog open={showRefereeDialog} onOpenChange={setShowRefereeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Referee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ref-name">Full Name *</Label>
              <Input
                id="ref-name"
                value={refereeForm.fullName}
                onChange={(e) => setRefereeForm({ ...refereeForm, fullName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="ref-phone">Phone *</Label>
              <Input
                id="ref-phone"
                placeholder="+254712345678"
                value={refereeForm.phone}
                onChange={(e) => setRefereeForm({ ...refereeForm, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="ref-relation">Relation</Label>
              <Input
                id="ref-relation"
                placeholder="e.g., Colleague, Friend"
                value={refereeForm.relation}
                onChange={(e) => setRefereeForm({ ...refereeForm, relation: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="ref-id">ID Number</Label>
              <Input
                id="ref-id"
                value={refereeForm.idNumber}
                onChange={(e) => setRefereeForm({ ...refereeForm, idNumber: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="ref-employer">Employer</Label>
              <Input
                id="ref-employer"
                value={refereeForm.employerName}
                onChange={(e) => setRefereeForm({ ...refereeForm, employerName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="ref-address">Address</Label>
              <Input
                id="ref-address"
                value={refereeForm.address}
                onChange={(e) => setRefereeForm({ ...refereeForm, address: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefereeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddReferee} disabled={loading}>
              Add Referee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
