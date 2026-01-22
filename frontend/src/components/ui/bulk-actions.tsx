import { useState } from 'react';
import { Button } from './button';
import { Badge } from './badge';
import { Checkbox } from './checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from './dialog';
import {
  CheckCircle,
  XCircle,
  Trash2,
  Download,
  X,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface BulkAction {
  id: string;
  label: string;
  icon: React.ElementType;
  variant?: 'default' | 'destructive' | 'outline';
  confirmMessage?: string;
  requiresConfirmation?: boolean;
}

interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  actions: BulkAction[];
  onAction: (actionId: string) => Promise<void>;
  isAllSelected: boolean;
}

export function BulkActionsBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  actions,
  onAction,
  isAllSelected,
}: BulkActionsBarProps) {
  const [confirmDialog, setConfirmDialog] = useState<BulkAction | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleAction = async (action: BulkAction) => {
    if (action.requiresConfirmation) {
      setConfirmDialog(action);
      return;
    }
    await executeAction(action.id);
  };

  const executeAction = async (actionId: string) => {
    setProcessing(true);
    try {
      await onAction(actionId);
    } finally {
      setProcessing(false);
      setConfirmDialog(null);
    }
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center gap-3 bg-slate-900 dark:bg-slate-800 text-white px-4 py-3 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500 text-white">
              {selectedCount}
            </Badge>
            <span className="text-sm">
              {selectedCount === 1 ? 'item' : 'items'} selected
            </span>
          </div>

          <div className="h-6 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            {!isAllSelected && (
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-700"
                onClick={onSelectAll}
              >
                Select all {totalCount}
              </Button>
            )}

            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant={action.variant === 'destructive' ? 'destructive' : 'ghost'}
                  size="sm"
                  className={cn(
                    action.variant !== 'destructive' && 'text-slate-300 hover:text-white hover:bg-slate-700'
                  )}
                  onClick={() => handleAction(action)}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4 mr-2" />
                  )}
                  {action.label}
                </Button>
              );
            })}
          </div>

          <div className="h-6 w-px bg-slate-700" />

          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white hover:bg-slate-700"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Action
            </DialogTitle>
            <DialogDescription>
              {confirmDialog?.confirmMessage || `Are you sure you want to ${confirmDialog?.label.toLowerCase()} ${selectedCount} item${selectedCount === 1 ? '' : 's'}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmDialog?.variant === 'destructive' ? 'destructive' : 'default'}
              onClick={() => confirmDialog && executeAction(confirmDialog.id)}
              disabled={processing}
              className={confirmDialog?.variant !== 'destructive' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                confirmDialog?.label
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface SelectableRowProps {
  selected: boolean;
  onSelect: (selected: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function SelectableRow({ selected, onSelect, children, className }: SelectableRowProps) {
  return (
    <tr
      className={cn(
        'transition-colors',
        selected && 'bg-emerald-50 dark:bg-emerald-900/20',
        className
      )}
    >
      <td className="w-[40px] px-4">
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
          className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
        />
      </td>
      {children}
    </tr>
  );
}

interface SelectAllHeaderProps {
  checked: boolean | 'indeterminate';
  onCheckedChange: (checked: boolean) => void;
}

export function SelectAllHeader({ checked, onCheckedChange }: SelectAllHeaderProps) {
  return (
    <th className="w-[40px] px-4">
      <Checkbox
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
      />
    </th>
  );
}

// Preset bulk actions for common use cases
export const LOAN_APPLICATION_BULK_ACTIONS: BulkAction[] = [
  {
    id: 'approve',
    label: 'Approve',
    icon: CheckCircle,
    requiresConfirmation: true,
    confirmMessage: 'Are you sure you want to approve the selected loan applications?',
  },
  {
    id: 'reject',
    label: 'Reject',
    icon: XCircle,
    variant: 'destructive',
    requiresConfirmation: true,
    confirmMessage: 'Are you sure you want to reject the selected loan applications?',
  },
  {
    id: 'export',
    label: 'Export',
    icon: Download,
  },
];

export const REPAYMENT_BULK_ACTIONS: BulkAction[] = [
  {
    id: 'post',
    label: 'Post All',
    icon: CheckCircle,
    requiresConfirmation: true,
    confirmMessage: 'Are you sure you want to post all selected repayments?',
  },
  {
    id: 'export',
    label: 'Export',
    icon: Download,
  },
];

export const CLIENT_BULK_ACTIONS: BulkAction[] = [
  {
    id: 'approve_kyc',
    label: 'Approve KYC',
    icon: CheckCircle,
    requiresConfirmation: true,
  },
  {
    id: 'export',
    label: 'Export',
    icon: Download,
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: Trash2,
    variant: 'destructive',
    requiresConfirmation: true,
    confirmMessage: 'Are you sure you want to delete the selected clients? This action cannot be undone.',
  },
];
