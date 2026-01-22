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
  Receipt,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  Percent,
  CheckCircle,
  XCircle,
  FileText,
  Loader2,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { feeTemplateService, FeeTemplate, FeeCategory, FeeCalculationType } from '../services/feeTemplateService';

const FEE_CATEGORY_LABELS: Record<FeeCategory, string> = {
  PROCESSING: 'Processing Fee',
  SERVICE: 'Service Fee',
  INSURANCE: 'Insurance Fee',
  LEGAL: 'Legal Fee',
  PENALTY: 'Penalty Fee',
  OTHER: 'Other Fee',
};

const FEE_CATEGORY_COLORS: Record<FeeCategory, string> = {
  PROCESSING: 'bg-blue-100 text-blue-700',
  SERVICE: 'bg-teal-100 text-teal-700',
  INSURANCE: 'bg-purple-100 text-purple-700',
  LEGAL: 'bg-amber-100 text-amber-700',
  PENALTY: 'bg-red-100 text-red-700',
  OTHER: 'bg-slate-100 text-slate-700',
};

export default function FeeTemplatesPage() {
  const [fees, setFees] = useState<FeeTemplate[]>([]);
  const [, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feeToDelete, setFeeToDelete] = useState<FeeTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'PROCESSING' as FeeCategory,
    calculationType: 'PERCENTAGE' as FeeCalculationType,
    value: '',
    minAmount: '',
    maxAmount: '',
    description: '',
  });

  useEffect(() => {
    loadFees();
  }, []);

  const loadFees = async () => {
    try {
      setLoading(true);
      const response = await feeTemplateService.getAll({ limit: 100 });
      setFees(response.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load fee templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingFee(null);
    setFormData({
      name: '',
      category: 'PROCESSING',
      calculationType: 'PERCENTAGE',
      value: '',
      minAmount: '',
      maxAmount: '',
      description: '',
    });
    setShowDialog(true);
  };

  const handleEdit = (fee: FeeTemplate) => {
    setEditingFee(fee);
    setFormData({
      name: fee.name,
      category: fee.category,
      calculationType: fee.calculationType,
      value: fee.value.toString(),
      minAmount: fee.minAmount?.toString() || '',
      maxAmount: fee.maxAmount?.toString() || '',
      description: fee.description || '',
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const data = {
        name: formData.name,
        category: formData.category,
        calculationType: formData.calculationType,
        value: parseFloat(formData.value),
        minAmount: formData.minAmount ? parseFloat(formData.minAmount) : undefined,
        maxAmount: formData.maxAmount ? parseFloat(formData.maxAmount) : undefined,
        description: formData.description || undefined,
      };

      if (editingFee) {
        await feeTemplateService.update(editingFee.id, data);
        toast.success('Fee template updated successfully');
      } else {
        await feeTemplateService.create(data);
        toast.success('Fee template created successfully');
      }
      setShowDialog(false);
      loadFees();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save fee template');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await feeTemplateService.toggleActive(id);
      toast.success('Status updated');
      loadFees();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteClick = (fee: FeeTemplate) => {
    setFeeToDelete(fee);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!feeToDelete) return;
    try {
      await feeTemplateService.delete(feeToDelete.id);
      toast.success('Fee template deleted successfully');
      loadFees();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete fee template');
    } finally {
      setDeleteDialogOpen(false);
      setFeeToDelete(null);
    }
  };

  const activeFees = fees.filter(f => f.isActive);
  const percentageFees = activeFees.filter(f => f.calculationType === 'PERCENTAGE');
  const fixedFees = activeFees.filter(f => f.calculationType === 'FIXED');

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 md:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fee Templates</h1>
          <p className="text-sm text-slate-600">
            Manage fee configurations for loan products
          </p>
        </div>
        <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Fee Template
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
            <Receipt className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeFees.length}</p>
            <p className="text-xs text-muted-foreground">Currently in use</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Percentage Based</CardTitle>
            <Percent className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{percentageFees.length}</p>
            <p className="text-xs text-muted-foreground">Variable fees</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Fixed Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fixedFees.length}</p>
            <p className="text-xs text-muted-foreground">Flat fees</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <FileText className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fees.length}</p>
            <p className="text-xs text-muted-foreground">All templates</p>
          </CardContent>
        </Card>
      </div>

      {/* Fees Table */}
      <Card className="border-slate-100">
        <CardHeader>
          <CardTitle>Fee Template Configurations</CardTitle>
          <CardDescription>
            Define fees that can be applied to loan products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Limits</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map((fee) => (
                  <TableRow key={fee.id} className={!fee.isActive ? 'opacity-50' : ''}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{fee.name}</p>
                        {fee.description && (
                          <p className="text-xs text-slate-500">{fee.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={FEE_CATEGORY_COLORS[fee.category]}>
                        {FEE_CATEGORY_LABELS[fee.category]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {fee.calculationType === 'PERCENTAGE' ? (
                          <>
                            <Percent className="h-4 w-4 text-blue-500" />
                            <span className="font-semibold">{fee.value}%</span>
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-4 w-4 text-emerald-500" />
                            <span className="font-semibold">{formatCurrency(fee.value)}</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {fee.minAmount || fee.maxAmount ? (
                        <span className="text-sm text-slate-600">
                          {fee.minAmount ? `Min: ${formatCurrency(fee.minAmount)}` : ''}
                          {fee.minAmount && fee.maxAmount ? ' / ' : ''}
                          {fee.maxAmount ? `Max: ${formatCurrency(fee.maxAmount)}` : ''}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">No limits</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        fee.isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-700'
                      )}>
                        {fee.isActive ? (
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
                          onClick={() => handleEdit(fee)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(fee.id)}
                        >
                          {fee.isActive ? (
                            <XCircle className="h-4 w-4 text-amber-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(fee)}
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
              {editingFee ? 'Edit Fee Template' : 'Create Fee Template'}
            </DialogTitle>
            <DialogDescription>
              Configure fee parameters and calculation method
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Fee Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Processing Fee"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Fee Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v as FeeCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROCESSING">Processing Fee</SelectItem>
                    <SelectItem value="SERVICE">Service Fee</SelectItem>
                    <SelectItem value="INSURANCE">Insurance Fee</SelectItem>
                    <SelectItem value="LEGAL">Legal Fee</SelectItem>
                    <SelectItem value="PENALTY">Penalty Fee</SelectItem>
                    <SelectItem value="OTHER">Other Fee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="calculationType">Calculation Type</Label>
                <Select
                  value={formData.calculationType}
                  onValueChange={(v) => setFormData({ ...formData, calculationType: v as FeeCalculationType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount (KES)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">
                {formData.calculationType === 'PERCENTAGE' ? 'Percentage Value (%)' : 'Fixed Amount (KES)'}
              </Label>
              <Input
                id="value"
                type="number"
                step={formData.calculationType === 'PERCENTAGE' ? '0.1' : '1'}
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder={formData.calculationType === 'PERCENTAGE' ? '3.0' : '2500'}
              />
            </div>

            {formData.calculationType === 'PERCENTAGE' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minAmount">Min Amount (KES)</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    value={formData.minAmount}
                    onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                    placeholder="500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAmount">Max Amount (KES)</Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    value={formData.maxAmount}
                    onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                    placeholder="10000"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the fee"
              />
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name || !formData.value || saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingFee ? 'Save Changes' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fee Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{feeToDelete?.name}"? This action cannot be undone.
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
