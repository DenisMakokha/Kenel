import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientService } from '../services/clientService';
import { CreateClientDto, IdType, CreatedChannel } from '../types/client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function ClientFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = id && id !== 'new';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<CreateClientDto>({
    firstName: '',
    lastName: '',
    otherNames: '',
    idType: IdType.NATIONAL_ID,
    idNumber: '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
    phonePrimary: '',
    phoneSecondary: '',
    email: '',
    residentialAddress: '',
    employerName: '',
    employerAddress: '',
    employerPhone: '',
    occupation: '',
    monthlyIncome: '',
    createdChannel: CreatedChannel.BRANCH,
    notes: '',
  });

  useEffect(() => {
    if (isEdit) {
      loadClient();
    }
  }, [id]);

  const loadClient = async () => {
    try {
      setLoading(true);
      const client = await clientService.getClient(id!);
      setFormData({
        firstName: client.firstName,
        lastName: client.lastName,
        otherNames: client.otherNames || '',
        idType: client.idType,
        idNumber: client.idNumber,
        dateOfBirth: client.dateOfBirth.split('T')[0],
        gender: client.gender || '',
        maritalStatus: client.maritalStatus || '',
        phonePrimary: client.phonePrimary,
        phoneSecondary: client.phoneSecondary || '',
        email: client.email || '',
        residentialAddress: client.residentialAddress || '',
        employerName: client.employerName || '',
        employerAddress: client.employerAddress || '',
        employerPhone: client.employerPhone || '',
        occupation: client.occupation || '',
        monthlyIncome: client.monthlyIncome || '',
        createdChannel: client.createdChannel,
        notes: client.notes || '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load client');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      if (isEdit) {
        await clientService.updateClient(id!, formData);
      } else {
        await clientService.createClient(formData);
      }
      
      navigate('/clients');
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} client`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateClientDto, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 space-y-6">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/clients')} className="mb-4">
          ← Back to Clients
        </Button>
        <h1 className="text-3xl font-bold">
          {isEdit ? 'Edit Client' : 'New Client'}
        </h1>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="otherNames">Other Names</Label>
              <Input
                id="otherNames"
                value={formData.otherNames}
                onChange={(e) => handleChange('otherNames', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="idType">ID Type *</Label>
                <select
                  id="idType"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={formData.idType}
                  onChange={(e) => handleChange('idType', e.target.value)}
                  required
                >
                  <option value="NATIONAL_ID">National ID</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="ALIEN_CARD">Alien Card</option>
                </select>
              </div>
              <div>
                <Label htmlFor="idNumber">ID Number *</Label>
                <Input
                  id="idNumber"
                  value={formData.idNumber}
                  onChange={(e) => handleChange('idNumber', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  min="1920-01-01"
                  required
                  className="[&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">Format: YYYY-MM-DD (e.g., 1990-05-15)</p>
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="maritalStatus">Marital Status</Label>
                <select
                  id="maritalStatus"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={formData.maritalStatus}
                  onChange={(e) => handleChange('maritalStatus', e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phonePrimary">Primary Phone *</Label>
                <Input
                  id="phonePrimary"
                  placeholder="+254712345678"
                  value={formData.phonePrimary}
                  onChange={(e) => handleChange('phonePrimary', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phoneSecondary">Secondary Phone</Label>
                <Input
                  id="phoneSecondary"
                  placeholder="+254798765432"
                  value={formData.phoneSecondary}
                  onChange={(e) => handleChange('phoneSecondary', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="residentialAddress">Residential Address</Label>
              <Input
                id="residentialAddress"
                value={formData.residentialAddress}
                onChange={(e) => handleChange('residentialAddress', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Employment Information */}
        <Card>
          <CardHeader>
            <CardTitle>Employment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employerName">Employer Name</Label>
                <Input
                  id="employerName"
                  value={formData.employerName}
                  onChange={(e) => handleChange('employerName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => handleChange('occupation', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="employerAddress">Employer Address</Label>
              <Input
                id="employerAddress"
                value={formData.employerAddress}
                onChange={(e) => handleChange('employerAddress', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employerPhone">Employer Phone</Label>
                <Input
                  id="employerPhone"
                  value={formData.employerPhone}
                  onChange={(e) => handleChange('employerPhone', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="monthlyIncome">Monthly Income (KES)</Label>
                <Input
                  id="monthlyIncome"
                  type="number"
                  step="0.01"
                  value={formData.monthlyIncome}
                  onChange={(e) => handleChange('monthlyIncome', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isEdit && (
              <div>
                <Label htmlFor="createdChannel">Created Channel</Label>
                <select
                  id="createdChannel"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={formData.createdChannel}
                  onChange={(e) => handleChange('createdChannel', e.target.value)}
                >
                  <option value="BRANCH">Branch</option>
                  <option value="AGENT">Agent</option>
                  <option value="ONLINE">Online</option>
                </select>
              </div>
            )}

            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Add any additional notes about the client..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/clients')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Client' : 'Create Client'}
          </Button>
        </div>
      </form>
    </div>
  );
}
