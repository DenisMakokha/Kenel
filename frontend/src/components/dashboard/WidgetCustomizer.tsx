import { useState } from 'react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import {
  Settings2,
  GripVertical,
  Eye,
  EyeOff,
  RotateCcw,
  LayoutGrid,
  BarChart3,
  List,
  Hash,
} from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

const WIDGET_TYPE_ICONS = {
  stat: Hash,
  chart: BarChart3,
  list: List,
};

const SIZE_LABELS = {
  small: '1/4',
  medium: '1/2',
  large: '3/4',
  full: 'Full',
};

interface WidgetCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WidgetCustomizer({ open, onOpenChange }: WidgetCustomizerProps) {
  const { user } = useAuthStore();
  const { getWidgets, toggleWidget, reorderWidgets, resetToDefault } = useDashboardStore();
  const role = user?.role || 'ADMIN';
  const widgets = getWidgets(role);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    reorderWidgets(role, draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const visibleCount = widgets.filter((w) => w.visible).length;
  const hiddenCount = widgets.filter((w) => !w.visible).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Customize Dashboard
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-500">
                  <Badge variant="outline" className="mr-1">{visibleCount}</Badge>
                  visible
                </span>
                <span className="text-slate-500">
                  <Badge variant="outline" className="mr-1">{hiddenCount}</Badge>
                  hidden
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => resetToDefault(role)}
                className="text-slate-500"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to default
              </Button>
            </div>

            <div className="space-y-2">
              {widgets.map((widget, index) => {
                const TypeIcon = WIDGET_TYPE_ICONS[widget.type as keyof typeof WIDGET_TYPE_ICONS] || Hash;
                return (
                  <div
                    key={widget.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-all cursor-move',
                      widget.visible
                        ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60',
                      draggedIndex === index && 'ring-2 ring-emerald-500 shadow-lg'
                    )}
                  >
                    <GripVertical className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    
                    <div className={cn(
                      'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      widget.visible ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-slate-100 dark:bg-slate-800'
                    )}>
                      <TypeIcon className={cn(
                        'h-4 w-4',
                        widget.visible ? 'text-emerald-600' : 'text-slate-400'
                      )} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'font-medium truncate',
                        widget.visible ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'
                      )}>
                        {widget.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        {widget.type} • {SIZE_LABELS[widget.size]} width
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 flex-shrink-0"
                      onClick={() => toggleWidget(role, widget.id)}
                    >
                      {widget.visible ? (
                        <Eye className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <p className="text-xs text-slate-500 flex-1">
            Drag widgets to reorder. Click the eye icon to show/hide.
          </p>
          <Button onClick={() => onOpenChange(false)} className="bg-emerald-600 hover:bg-emerald-700">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CustomizeDashboardButtonProps {
  className?: string;
}

export function CustomizeDashboardButton({ className }: CustomizeDashboardButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className={className}
      >
        <Settings2 className="h-4 w-4 mr-2" />
        Customize
      </Button>
      <WidgetCustomizer open={open} onOpenChange={setOpen} />
    </>
  );
}
