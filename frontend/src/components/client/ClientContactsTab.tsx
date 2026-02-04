import { useState } from 'react';
import { Client, CreateNextOfKinDto, CreateRefereeDto } from '../../types/client';
import { clientService } from '../../services/clientService';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import {
  Users,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Star,
  Briefcase,
  CreditCard,
  Heart,
} from 'lucide-react';

interface ClientContactsTabProps {
  client: Client;
  onUpdate: () => void;
}

export default function ClientContactsTab({ client, onUpdate }: ClientContactsTabProps) {
  const { user } = useAuthStore();
  const canManageContacts = user && (user.role === UserRole.ADMIN || user.role === UserRole.CREDIT_OFFICER);
  const canDelete = user?.role === UserRole.ADMIN;

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
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-5 border border-rose-200">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center">
              <Heart className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <p className="text-sm text-rose-600 font-medium">Next of Kin</p>
              <p className="text-2xl font-bold text-rose-700">{client.nextOfKin?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Referees</p>
              <p className="text-2xl font-bold text-blue-700">{client.referees?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Next of Kin */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-5 w-5 text-rose-600" />
                  Next of Kin
                </CardTitle>
                <CardDescription>{client.nextOfKin?.length || 0} emergency contact(s)</CardDescription>
              </div>
              {canManageContacts && (
                <Button size="sm" variant="outline" onClick={() => setShowNOKDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!client.nextOfKin || client.nextOfKin.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <Heart className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No next of kin added</p>
                <p className="text-sm text-slate-500 mt-1">Add emergency contacts for this client</p>
              </div>
            ) : (
              <div className="space-y-3">
                {client.nextOfKin.map((nok) => (
                  <div
                    key={nok.id}
                    className={`rounded-xl border-2 p-4 transition-all ${
                      nok.isPrimary ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold ${
                          nok.isPrimary ? 'bg-rose-200 text-rose-700' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {nok.fullName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{nok.fullName}</p>
                          <p className="text-sm text-slate-500">{nok.relation}</p>
                        </div>
                      </div>
                      {nok.isPrimary && (
                        <Badge className="bg-rose-100 text-rose-700 border-rose-200">
                          <Star className="h-3 w-3 mr-1" />
                          Primary
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="h-4 w-4 text-slate-400" />
                        {nok.phone}
                      </div>
                      {nok.email && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="h-4 w-4 text-slate-400" />
                          {nok.email}
                        </div>
                      )}
                      {nok.address && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          {nok.address}
                        </div>
                      )}
                    </div>
                    {canDelete && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteNOK(nok.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referees */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Referees
                </CardTitle>
                <CardDescription>{client.referees?.length || 0} referee(s) - need 2 minimum</CardDescription>
              </div>
              {canManageContacts && (
                <Button size="sm" variant="outline" onClick={() => setShowRefereeDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!client.referees || client.referees.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No referees added</p>
                <p className="text-sm text-slate-500 mt-1">At least 2 referees are required for KYC</p>
              </div>
            ) : (
              <div className="space-y-3">
                {client.referees.map((referee) => (
                  <div
                    key={referee.id}
                    className="rounded-xl border-2 bg-blue-50 border-blue-200 p-4 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-lg font-bold">
                          {referee.fullName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{referee.fullName}</p>
                          {referee.relation && (
                            <p className="text-sm text-slate-500">{referee.relation}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="h-4 w-4 text-slate-400" />
                        {referee.phone}
                      </div>
                      {referee.idNumber && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <CreditCard className="h-4 w-4 text-slate-400" />
                          ID: {referee.idNumber}
                        </div>
                      )}
                      {referee.employerName && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Briefcase className="h-4 w-4 text-slate-400" />
                          {referee.employerName}
                        </div>
                      )}
                      {referee.address && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          {referee.address}
                        </div>
                      )}
                    </div>
                    {canDelete && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteReferee(referee.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
