import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useNotificationStore } from '../store/notificationStore';

export default function NotificationsPage() {
  const { notifications, unreadCount, fetchNotifications, markAllAsRead, markAsRead } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">Your recent system notifications</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllAsRead()}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Inbox
            {unreadCount > 0 && <Badge variant="secondary">{unreadCount} unread</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {notifications.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            <div className="divide-y rounded-md border">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={
                    "p-4 flex items-start justify-between gap-3 " +
                    (!n.read ? 'bg-blue-50/50' : '')
                  }
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{n.title}</p>
                      {!n.read && <Badge variant="outline">New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                    {n.link && (
                      <div className="mt-2">
                        <Link
                          to={n.link}
                          className="text-sm text-emerald-600 hover:underline"
                          onClick={() => markAsRead(n.id)}
                        >
                          Open
                        </Link>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => markAsRead(n.id)}>
                    Mark read
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
