import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useNotifications from '@/hooks/useNotifications';
import { Bell, Package, CreditCard, AlertTriangle, CheckCircle, Users } from 'lucide-react';

export function NotificationsTest() {
  const { createNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const testNotifications = [
    {
      type: 'low_stock' as const,
      title: 'Low Stock Alert',
      message: 'Product "Coca Cola 500ml" is running low (Stock: 3)',
      icon: Package
    },
    {
      type: 'payment_received' as const,
      title: 'Payment Received',
      message: 'Payment of KES 1,200 received from John Doe',
      icon: CreditCard
    },
    {
      type: 'sync_failed' as const,
      title: 'Sync Failed',
      message: 'Failed to sync data: Network timeout',
      icon: AlertTriangle
    },
    {
      type: 'sale_completed' as const,
      title: 'Sale Completed',
      message: 'Sale of KES 750 to Mary Wanjiku completed',
      icon: CheckCircle
    },
    {
      type: 'customer_payment' as const,
      title: 'Customer Payment',
      message: 'Alice Kamau paid KES 300 via M-Pesa',
      icon: Users
    }
  ];

  const handleTestNotification = async (notification: any) => {
    setIsLoading(notification.type);
    try {
      await createNotification({
        type: notification.type,
        title: notification.title,
        message: notification.message
      });
      console.log('Test notification created:', notification.title);
    } catch (error) {
      console.error('Failed to create test notification:', error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-green-600" />
          Real-Time Notifications Test
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Test the real-time notifications system. Click buttons to create notifications and check the bell icon in the top bar.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {testNotifications.map((notification) => {
          const Icon = notification.icon;
          return (
            <div key={notification.type} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-gray-500" />
                <div>
                  <h4 className="font-medium">{notification.title}</h4>
                  <p className="text-sm text-gray-500">{notification.message}</p>
                </div>
              </div>
              <Button
                onClick={() => handleTestNotification(notification)}
                disabled={isLoading === notification.type}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading === notification.type ? 'Creating...' : 'Test'}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}