import { useEffect } from 'react';
import { Bell, Check, CheckCheck, X, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './dropdown-menu';
import { useNotificationStore, startNotificationPolling, stopNotificationPolling } from '../../store/notificationStore';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const typeColors = {
  info: 'text-blue-500',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  error: 'text-red-500',
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotificationStore();

  useEffect(() => {
    startNotificationPolling();
    return () => stopNotificationPolling();
  }, []);

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                markAllAsRead();
              }}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              No notifications
            </div>
          ) : (
            notifications.slice(0, 10).map((notification) => {
              const Icon = (typeIcons as any)[notification.type] || Info;
              const colorClass = (typeColors as any)[notification.type] || typeColors.info;
              return (
                <div
                  key={notification.id}
                  className={cn(
                    'relative px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b last:border-0',
                    !notification.read && 'bg-blue-50/50 dark:bg-blue-900/10'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className={cn('mt-0.5', colorClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', !notification.read && 'text-slate-900 dark:text-slate-100')}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {!notification.read && (
                        <button
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          title="Mark as read"
                        >
                          <Check className="h-3 w-3 text-slate-400" />
                        </button>
                      )}
                      <button
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotification(notification.id);
                        }}
                        title="Dismiss"
                      >
                        <X className="h-3 w-3 text-slate-400" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-center text-sm text-emerald-600 hover:text-emerald-700 justify-center"
              onClick={() => navigate('/notifications')}
            >
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
