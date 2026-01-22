import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Percent,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { interestRateService, InterestRate } from '../services/interestRateService';

const RATE_TYPE_LABELS: Record<string, string> = {
  FLAT: 'Flat Rate',
  REDUCING: 'Reducing Balance',
  DECLINING: 'Declining Balance',
};

export default function InterestRatesPage() {
  const [rates, setRates] = useState<InterestRate[]>([]);
  const [, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRate, setEditingRate] = useState<InterestRate | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rateToDelete, setRateToDelete] = useState<InterestRate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'REDUCING' as InterestRate['type'],
    rate: '',
    ratePeriod: 'PER_ANNUM' as 'PER_ANNUM' | 'PER_MONTH',
    minTerm: '',
    maxTerm: '',
    minAmount: '',
    maxAmount: '',
    effectiveFrom: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    try {
      setLoading(true);
      const response = await interestRateService.getAll({ limit: 100 });
      setRates(response.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load interest rates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRate(null);
    setFormData({
      name: '',
      type: 'REDUCING',
      rate: '',
      ratePeriod: 'PER_ANNUM',
      minTerm: '',
      maxTerm: '',
      minAmount: '',
      maxAmount: '',
      effectiveFrom: new Date().toISOString().slice(0, 10),
    });
    setShowDialog(true);
  };

  const handleEdit = (rate: InterestRate) => {
    setEditingRate(rate);
    setFormData({
      name: rate.name,
      type: rate.type,
      rate: rate.rate.toString(),
      ratePeriod: rate.ratePeriod,
      minTerm: rate.minTerm.toString(),
      maxTerm: rate.maxTerm.toString(),
      minAmount: rate.minAmount.toString(),
      maxAmount: rate.maxAmount.toString(),
      effectiveFrom: rate.effectiveFrom.slice(0, 10),
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const data = {
        name: formData.name,
        type: formData.type,
        rate: parseFloat(formData.rate),
        ratePeriod: formData.ratePeriod,
        minTerm: parseInt(formData.minTerm),
        maxTerm: parseInt(formData.maxTerm),
        minAmount: parseFloat(formData.minAmount),
        maxAmount: parseFloat(formData.maxAmount),
        effectiveFrom: formData.effectiveFrom,
      };

      if (editingRate) {
        await interestRateService.update(editingRate.id, data);
        toast.success('Interest rate updated successfully');
      } else {
        await interestRateService.create(data);
        toast.success('Interest rate created successfully');
      }
      setShowDialog(false);
      loadRates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save interest rate');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await interestRateService.toggleActive(id);
      toast.success('Status updated');
      loadRates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteClick = (rate: InterestRate) => {
    setRateToDelete(rate);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!rateToDelete) return;
    try {
      await interestRateService.delete(rateToDelete.id);
      toast.success('Interest rate deleted successfully');
      loadRates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete interest rate');
    } finally {
      setDeleteDialogOpen(false);
      setRateToDelete(null);
    }
  };

  const activeRates = rates.filter(r => r.isActive);
  const avgRate = activeRates.length > 0
    ? (activeRates.reduce((sum, r) => sum + r.rate, 0) / activeRates.length).toFixed(1)
    : '0';

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 md:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Interest Rates</h1>
          <p className="text-sm text-slate-600">
            Manage interest rate configurations for loan products
          </p>
        </div>
        <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Rate
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Active Rates</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeRates.length}</p>
            <p className="text-xs text-muted-foreground">Currently in use</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Average Rate</CardTitle>
            <Percent className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{avgRate}%</p>
            <p className="text-xs text-muted-foreground">Across active rates</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Lowest Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {activeRates.length > 0 ? Math.min(...activeRates.map(r => r.rate)) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Best available</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Highest Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {activeRates.length > 0 ? Math.max(...activeRates.map(r => r.rate)) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Maximum rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Rates Table */}
      <Card className="border-slate-100">
        <CardHeader>
          <CardTitle>Interest Rate Configurations</CardTitle>
          <CardDescription>
            Define interest rates with terms and amount limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Term Range</TableHead>
                  <TableHead>Amount Range</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((rate) => (
                  <TableRow key={rate.id} className={!rate.isActive ? 'opacity-50' : ''}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{rate.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          From {rate.effectiveFrom}
                          {rate.effectiveTo && ` to ${rate.effectiveTo}`}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {RATE_TYPE_LABELS[rate.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-lg font-semibold text-emerald-600">
                        {rate.rate}% {rate.ratePeriod === 'PER_MONTH' ? 'p.m.' : 'p.a.'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {rate.minTerm} - {rate.maxTerm} months
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        KES {rate.minAmount.toLocaleString()} - {rate.maxAmount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        rate.isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-700'
                      )}>
                        {rate.isActive ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> Inactive</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(rate)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(rate.id)}
                        >
                          {rate.isActive ? (
                            <XCircle className="h-4 w-4 text-amber-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(rate)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingRate ? 'Edit Interest Rate' : 'Create Interest Rate'}
            </DialogTitle>
            <DialogDescription>
              Configure interest rate parameters and limits
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Rate Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Standard Personal Loan"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Interest Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v as InterestRate['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLAT">Flat Rate</SelectItem>
                    <SelectItem value="REDUCING">Reducing Balance</SelectItem>
                    <SelectItem value="DECLINING">Declining Balance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate">Interest Rate (%)</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.1"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  placeholder="14.5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rate Period</Label>
              <Select
                value={formData.ratePeriod}
                onValueChange={(v) => setFormData({ ...formData, ratePeriod: v as 'PER_ANNUM' | 'PER_MONTH' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PER_ANNUM">Per Annum (p.a.)</SelectItem>
                  <SelectItem value="PER_MONTH">Per Month (p.m.)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minTerm">Min Term (months)</Label>
                <Input
                  id="minTerm"
                  type="number"
                  value={formData.minTerm}
                  onChange={(e) => setFormData({ ...formData, minTerm: e.target.value })}
                  placeholder="3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTerm">Max Term (months)</Label>
                <Input
                  id="maxTerm"
                  type="number"
                  value={formData.maxTerm}
                  onChange={(e) => setFormData({ ...formData, maxTerm: e.target.value })}
                  placeholder="36"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minAmount">Min Amount (KES)</Label>
                <Input
                  id="minAmount"
                  type="number"
                  value={formData.minAmount}
                  onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                  placeholder="10000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAmount">Max Amount (KES)</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  value={formData.maxAmount}
                  onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                  placeholder="500000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="effectiveFrom">Effective From</Label>
              <Input
                id="effectiveFrom"
                type="date"
                value={formData.effectiveFrom}
                onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name || !formData.rate || saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingRate ? 'Save Changes' : 'Create Rate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Interest Rate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{rateToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
