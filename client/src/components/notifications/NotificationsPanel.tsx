import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { formatDistanceToNow } from 'date-fns';
import { 
  Bell, 
  Package, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  Users,
  Check,
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotifications, type Notification } from '@/hooks/useNotifications';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const [, setLocation] = useLocation();
  const { notifications, unreadCount, isLoading, markAsRead } = useNotifications();

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        // Mark first unread notification as read
        const firstUnread = notifications.find(n => !n.is_read);
        if (firstUnread) {
          markAsRead(firstUnread.id, true);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyboard);
      return () => document.removeEventListener('keydown', handleKeyboard);
    }
  }, [isOpen, onClose, markAsRead, notifications]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'low_stock':
        const productId = notification.metadata?.product_id;
        setLocation(productId ? `/inventory?highlight=${productId}` : '/inventory');
        break;
      case 'payment_received':
      case 'customer_payment':
        setLocation('/customers');
        break;
      case 'sale_completed':
        setLocation('/reports');
        break;
      case 'sync_failed':
        setLocation('/settings#sync');
        break;
      default:
        break;
    }

    onClose();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
        return <Package className="w-5 h-5 text-orange-500" />;
      case 'payment_received':
      case 'customer_payment':
        return <CreditCard className="w-5 h-5 text-green-500" />;
      case 'sync_failed':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'sale_completed':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      // Handle legacy notification types
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'info':
        return <Bell className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationBorderColor = (type: string) => {
    switch (type) {
      case 'low_stock':
        return 'border-l-orange-500';
      case 'payment_received':
      case 'customer_payment':
        return 'border-l-green-500';
      case 'sync_failed':
        return 'border-l-red-500';
      case 'sale_completed':
        return 'border-l-blue-500';
      // Handle legacy notification types
      case 'success':
        return 'border-l-green-500';
      case 'info':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-500';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full md:w-96 bg-white dark:bg-[#1F1F1F] shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
        <Card className="h-full rounded-none border-0 shadow-none">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-green-600" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 h-full overflow-y-auto">
            {isLoading ? (
              // Loading skeleton
              <div className="p-4 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              // Empty state
              <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
                <Bell className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No notifications
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  You're all caught up! New notifications will appear here.
                </p>
              </div>
            ) : (
              // Notifications list
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`relative border-l-4 transition-colors ${
                      !notification.is_read 
                        ? `${getNotificationBorderColor(notification.type)} bg-green-50/30 dark:bg-green-900/10` 
                        : 'border-l-transparent'
                    }`}
                  >
                    <div 
                      onClick={() => handleNotificationClick(notification)}
                      className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-sm font-medium truncate ${
                              !notification.is_read 
                                ? 'text-gray-900 dark:text-gray-100 font-semibold' 
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!notification.is_read && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification.id, true);
                                    }}
                                    className="p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 hover:text-green-700 transition-colors"
                                    title="Mark as read"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                                </>
                              )}
                            </div>
                          </div>
                          
                          {notification.message && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                            {!notification.is_read && (
                              <span className="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                New
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Keyboard shortcuts help */}
            {notifications.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-200 dark:bg-gray-700 rounded">Ctrl+A</kbd> Mark all read • 
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-200 dark:bg-gray-700 rounded ml-1">Ctrl+R</kbd> Mark first unread • 
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-200 dark:bg-gray-700 rounded ml-1">Esc</kbd> Close
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}