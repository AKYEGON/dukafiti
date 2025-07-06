import { useState } from 'react';
import { useLocation } from 'wouter';
import useNotifications from '../../hooks/useNotifications';

export default function NotificationsDropdown() {
  const { list, markAllRead, unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  const handleToggle = () => {
    if (!open) {
      markAllRead();
    }
    setOpen(!open);
  };

  const handleNotificationClick = (notification: any) => {
    if (notification.type === 'credit') {
      // Navigate to customers page and highlight the customer
      setLocation(`/customers`);
    } else if (notification.type === 'low_stock') {
      // Navigate to inventory page and highlight the product
      setLocation(`/inventory`);
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <button 
        onClick={handleToggle} 
        aria-label="Notifications"
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
      >
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {list.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No notifications
                </div>
              ) : (
                list.map(notification => (
                  <div
                    key={notification.id}
                    className="p-3 border-b last:border-none hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {notification.type === 'credit' ? (
                          <span className="text-xl">💳</span>
                        ) : (
                          <span className="text-xl">⚠️</span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          {notification.title}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          {new Date(notification.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}