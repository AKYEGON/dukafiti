import { useEffect, useMemo } from 'react';
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
import useData from '@/hooks/useData';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';

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
      return 'text-orange-600';
    case 'credit_reminder':
    case 'credit':
      return 'text-red-600';
    case 'payment':
      return 'text-green-600';
    case 'alert':
      return 'text-yellow-600';
    default:
      return 'text-blue-600';
  }
};

export function NotificationsDropdown({ isOpen, setIsOpen }: NotificationsDropdownProps) {
  const [, navigate] = useLocation();
  const { items: notifications, refresh, user } = useData('notifications');

  console.log('[NotificationsDropdown] Rendered with:', { 
    notificationsCount: notifications.length,
    isOpen,
    userId: user?.id 
  });

  // Calculate unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.is_read).length;
  }, [notifications]);

  // Auto-mark all as read when dropdown opens
  useEffect(() => {
    if (isOpen && unreadCount > 0 && user?.id) {
      markAllAsRead();
    }
  }, [isOpen, unreadCount, user?.id]);

  // Mark all notifications as read
  const markAllAsRead = async () => {
    console.log('[NotificationsDropdown] markAllAsRead start');
    
    if (!user?.id) {
      console.error('[NotificationsDropdown] No user for mark as read');
      return;
    }

    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      if (unreadNotifications.length === 0) {
        console.log('[NotificationsDropdown] No unread notifications to mark');
        return;
      }

      console.log('[NotificationsDropdown] Marking as read:', unreadNotifications.length, 'notifications');

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('[NotificationsDropdown] Mark as read error:', error);
        throw error;
      }

      console.log('[NotificationsDropdown] All notifications marked as read');
      
      // Refresh to get updated data
      await refresh();
      
    } catch (error) {
      console.error('[NotificationsDropdown] markAllAsRead failed:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: any) => {
    console.log('[NotificationsDropdown] Notification clicked:', notification);
    
    // Navigate based on notification type
    switch (notification.type?.toLowerCase()) {
      case 'low_stock':
      case 'lowstock':
        navigate('/inventory');
        break;
      case 'credit_reminder':
      case 'credit':
        navigate('/customers');
        break;
      case 'payment':
        navigate('/reports');
        break;
      default:
        navigate('/dashboard');
        break;
    }
    
    setIsOpen(false);
  };

  // Sort notifications by creation date (newest first)
  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [notifications]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>
        
        {sortedNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {sortedNotifications.slice(0, 20).map((notification) => {
              const IconComponent = getNotificationIcon(notification.type);
              const colorClass = getNotificationColor(notification.type);
              
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className="p-4 cursor-pointer hover:bg-muted/50 focus:bg-muted/50"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className={`mt-0.5 ${colorClass}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate">
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                        {notification.message}
                      </p>
                      
                      <p className="text-xs text-muted-foreground">
                        {notification.created_at ? 
                          formatDistanceToNow(new Date(notification.created_at), { addSuffix: true }) :
                          'Just now'
                        }
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
            
            {sortedNotifications.length > 20 && (
              <div className="p-4 text-center border-t">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    navigate('/notifications');
                    setIsOpen(false);
                  }}
                >
                  View all notifications
                </Button>
              </div>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}