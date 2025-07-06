import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { formatDistanceToNow } from 'date-fns';
import { Bell, AlertTriangle, CheckCircle, Info, Trash2, Package, CreditCard, Users, ExternalLink } from 'lucide-react';
import { MobilePageWrapper } from '@/components/layout/mobile-page-wrapper';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import type { Notification } from '@shared/schema';

export function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [, setLocation] = useLocation();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();

  // Automatically mark all notifications as read when the page is opened
  useEffect(() => {
    if (notifications.length > 0 && unreadCount > 0) {
      markAllAsRead();
    }
  }, [notifications.length, unreadCount, markAllAsRead]);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.is_read;
    if (filter === 'read') return notification.is_read;
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'sale_completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'payment_received':
        return <CreditCard className="w-5 h-5 text-green-500" />;
      case 'low_stock':
        return <Package className="w-5 h-5 text-orange-500" />;
      case 'sync_failed':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'customer_payment':
        return <CreditCard className="w-5 h-5 text-blue-500" />;
      case 'customer_added':
        return <Users className="w-5 h-5 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getEnhancedNotificationMessage = (notification: Notification) => {
    // If no payload, fallback to original message
    if (!notification.payload) {
      return notification.message;
    }

    const payload = notification.payload;

    switch (notification.type) {
      case 'low_stock':
        if (payload.productName && payload.currentQty !== undefined && payload.threshold) {
          return `${payload.productName} is running low (Stock: ${payload.currentQty} vs threshold ${payload.threshold})`;
        }
        break;
      case 'sale_completed':
        if (payload.amount && payload.customerName) {
          return `Sale of KES ${payload.amount} to ${payload.customerName} completed successfully`;
        }
        break;
      case 'payment_received':
        if (payload.amount && payload.method) {
          return `Payment of KES ${payload.amount} received via ${payload.method}`;
        }
        break;
      case 'customer_payment':
        if (payload.customerName && payload.amount && payload.paymentMethod) {
          return `${payload.customerName} made a payment of KES ${payload.amount} via ${payload.paymentMethod}`;
        }
        break;
      case 'sync_failed':
        if (payload.errorDetail) {
          const retryText = payload.retryCount ? ` after ${payload.retryCount} retries` : '';
          return `Sync failed${retryText}: ${payload.errorDetail}`;
        }
        break;
    }

    // Fallback to original message if payload parsing fails
    return notification.message;
  };

  const handleNotificationClick = (notification: Notification) => {
    // Navigate based on notification type and payload context
    switch (notification.type) {
      case 'low_stock':
        const productId = notification.payload?.productId;
        setLocation(productId ? `/inventory?highlight=${productId}` : '/inventory');
        break;
      case 'payment_received':
        const saleId = notification.payload?.saleId;
        setLocation(saleId ? `/sales?invoice=${saleId}` : '/sales');
        break;
      case 'customer_payment':
        const customerId = notification.payload?.customerId;
        setLocation(customerId ? `/customers?highlight=${customerId}` : '/customers');
        break;
      case 'sale_completed':
        const completedSaleId = notification.payload?.saleId;
        setLocation(completedSaleId ? `/sales?invoice=${completedSaleId}` : '/sales');
        break;
      case 'sync_failed':
        setLocation('/settings#sync-errors');
        break;
      default:
        break;
    }
  };

  const handleMarkAsRead = (id: number, isRead: boolean) => {
    if (!isRead) {
      markAsRead(id, true);
    }
  };

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      markAllAsRead();
    }
  };

  return (
    <MobilePageWrapper title="Notifications">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-sm text-accent dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 disabled:opacity-50 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-1">
            {(['all', 'unread', 'read'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === tab
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                aria-label={`Show ${tab} notifications`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'unread' && unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-6">
          {isLoading ? (
            /* Loading Skeleton */
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse bg-gray-200 dark:bg-gray-700 h-16 mb-3 rounded-lg"
                />
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {filter === 'all' ? 'No notifications' : `No ${filter} notifications`}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {filter === 'all' 
                  ? 'You have no notifications at this time.'
                  : `You have no ${filter} notifications.`
                }
              </p>
            </div>
          ) : (
            /* Notifications List */
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors ${
                    !notification.is_read 
                      ? 'border-l-4 border-l-accent-500' 
                      : 'border-l-4 border-l-transparent'
                  }`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Notification: ${notification.title}, ${formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}`}
                  onClick={() => handleMarkAsRead(notification.id, notification.is_read)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleMarkAsRead(notification.id, notification.is_read);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className={`text-base font-medium ${
                            !notification.is_read 
                              ? 'text-gray-900 dark:text-gray-100' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {notification.title}
                          </h3>
                          {notification.message && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {getEnhancedNotificationMessage(notification)}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notification);
                            }}
                            className="text-xs px-2 py-1 h-7"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-accent-500 rounded-full" aria-label="Unread" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobilePageWrapper>
  );
}

export default NotificationsPage;