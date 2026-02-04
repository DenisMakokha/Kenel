import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Info, CheckCircle, AlertTriangle, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { portalService } from '../../services/portalService';
import type { PortalNotification } from '../../types/portal';

const typeStyles = {
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-600',
    text: 'text-blue-800',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  success: {
    bg: 'bg-emerald-50 border-emerald-200',
    icon: 'text-emerald-600',
    text: 'text-emerald-800',
    button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200',
    icon: 'text-amber-600',
    text: 'text-amber-800',
    button: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    icon: 'text-red-600',
    text: 'text-red-800',
    button: 'bg-red-600 hover:bg-red-700 text-white',
  },
};

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

interface NotificationBannerProps {
  maxBanners?: number;
  categories?: string[];
}

export function NotificationBanner({ maxBanners = 2, categories }: NotificationBannerProps) {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<PortalNotification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await portalService.getNotifications();
        // Filter unread notifications, optionally by category
        let filtered = data.notifications.filter(n => !n.read && !dismissedIds.has(n.id));
        if (categories && categories.length > 0) {
          filtered = filtered.filter(n => categories.includes(n.category));
        }
        // Take only important ones (warnings and errors first, then others)
        const sorted = filtered.sort((a, b) => {
          const priority = { error: 0, warning: 1, success: 2, info: 3 };
          return priority[a.type] - priority[b.type];
        });
        setBanners(sorted.slice(0, maxBanners));
      } catch (error) {
        console.error('Failed to fetch notifications for banner:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [maxBanners, categories, dismissedIds]);

  const handleDismiss = async (notification: PortalNotification) => {
    setDismissedIds(prev => new Set([...prev, notification.id]));
    setBanners(prev => prev.filter(b => b.id !== notification.id));
    try {
      await portalService.markNotificationAsRead(notification.id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleAction = (notification: PortalNotification) => {
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
    handleDismiss(notification);
  };

  if (banners.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {banners.map((notification) => {
        const styles = typeStyles[notification.type];
        const Icon = typeIcons[notification.type];

        return (
          <div
            key={notification.id}
            className={`relative rounded-lg border p-4 ${styles.bg}`}
          >
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 ${styles.icon}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`font-medium ${styles.text}`}>{notification.title}</h4>
                <p className={`text-sm mt-1 ${styles.text} opacity-90`}>
                  {notification.message}
                </p>
                {notification.actionUrl && notification.actionLabel && (
                  <Button
                    size="sm"
                    className={`mt-3 ${styles.button}`}
                    onClick={() => handleAction(notification)}
                  >
                    {notification.actionLabel}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
              <button
                onClick={() => handleDismiss(notification)}
                className={`flex-shrink-0 p-1 rounded-full hover:bg-black/10 ${styles.icon}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
