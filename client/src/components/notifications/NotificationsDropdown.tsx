import { useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, AlertTriangle, CreditCard, Package, Info, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import useNotifications from '@/hooks/useNotifications';
import { useLocation } from 'wouter';

interface NotificationsDropdownProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const getNotificationIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'low_stock':
    case 'lowstock':
      return Package;
    case 'credit_reminder':
    case 'credit':
      return CreditCard;
    case 'payment':
      return Check;
    case 'alert':
      return AlertTriangle;
    default:
      return Info;
  }
};

const getNotificationColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'low_stock':
    case 'lowstock':
      return 'text-orange-500';
    case 'credit_reminder':
    case 'credit':
      return 'text-blue-500';
    case 'payment':
      return 'text-green-500';
    case 'alert':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

const getNotificationRoute = (type: string) => {
  switch (type.toLowerCase()) {
    case 'low_stock':
    case 'lowstock':
      return '/inventory';
    case 'credit_reminder':
    case 'credit':
      return '/customers';
    default:
      return null;
  }
};

export function NotificationsDropdown({ isOpen, setIsOpen }: NotificationsDropdownProps) {
  const { list: notifications, unreadCount, markAllRead } = useNotifications();
  const [, setLocation] = useLocation();

  // Auto-mark as read when dropdown opens
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      markAllRead();
    }
  }, [isOpen, unreadCount, markAllRead]);

  const handleNotificationClick = (type: string) => {
    const route = getNotificationRoute(type);
    if (route) {
      setLocation(route);
      setIsOpen(false);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-96 overflow-y-auto"
        sideOffset={8}
      >
        <div className="px-3 py-2 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        {notifications.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.slice(0, 10).map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const colorClass = getNotificationColor(notification.type);
              const hasRoute = getNotificationRoute(notification.type);
              
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={`px-3 py-3 cursor-pointer ${hasRoute ? 'hover:bg-muted/50' : ''}`}
                  onClick={() => hasRoute && handleNotificationClick(notification.type)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${colorClass}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
        
        {notifications.length > 10 && (
          <div className="px-3 py-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                setLocation('/notifications');
                setIsOpen(false);
              }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}