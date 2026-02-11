import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  X,
  Info,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  CreditCard,
  Wallet,
  FileText,
  Settings,
} from 'lucide-react';
import { Button } from '../ui/button';
import { portalService } from '../../services/portalService';
import type { PortalNotification } from '../../types/portal';
import { formatDistanceToNow } from 'date-fns';

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

const typeStyles = {
  info: 'text-blue-600 bg-blue-100',
  success: 'text-emerald-600 bg-emerald-100',
  warning: 'text-amber-600 bg-amber-100',
  error: 'text-red-600 bg-red-100',
};

const categoryIcons = {
  loan_application: FileText,
  payment: Wallet,
  loan: CreditCard,
  system: Settings,
};

export function NotificationDropdown() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await portalService.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await portalService.markNotificationAsRead(notificationId);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await portalService.markAllNotificationsAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await portalService.deleteNotification(notificationId);
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification: PortalNotification) => {
    if (!notification.read) {
      portalService.markNotificationAsRead(notification.id);
      setNotifications(notifications.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setIsOpen(false);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs font-medium text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[480px] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[380px]">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Bell className="h-12 w-12 text-slate-300 mb-3" />
                <p className="text-slate-500 text-sm">No notifications yet</p>
                <p className="text-slate-400 text-xs">We'll notify you when something happens</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => {
                  const TypeIcon = typeIcons[notification.type];
                  const CategoryIcon = categoryIcons[notification.category];
                  
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${typeStyles[notification.type]}`}>
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium ${!notification.read ? 'text-slate-900' : 'text-slate-700'}`}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!notification.read && (
                                <button
                                  onClick={(e) => handleMarkAsRead(notification.id, e)}
                                  className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                                  title="Mark as read"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                onClick={(e) => handleDelete(notification.id, e)}
                                className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <CategoryIcon className="h-3 w-3" />
                              {notification.category.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-400">
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>
                          {notification.actionUrl && notification.actionLabel && (
                            <button className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700">
                              {notification.actionLabel} →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-2 bg-slate-50 dark:bg-slate-900">
              <button
                onClick={() => {
                  navigate('/portal/notifications');
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-1"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
