import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  Users,
  Play,
  RotateCcw
} from 'lucide-react';

export function NotificationsTester() {
  const { createNotification } = useNotifications();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const createTestNotification = async (
    type: 'low_stock' | 'payment_received' | 'sync_failed' | 'sale_completed' | 'customer_payment',
    title: string,
    message: string,
    metadata: Record<string, any> = {}
  ) => {
    setIsLoading(type);
    try {
      await createNotification({
        type,
        title,
        message,
        is_read: false,
        metadata
      });
      toast({
        title: 'Test notification created',
        description: `${title} notification sent successfully`,
        className: 'bg-green-50 border-green-200 text-green-800'
      });
    } catch (error) {
      console.error('Error creating test notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to create test notification',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(null);
    }
  };

  const testNotifications = [
    {
      type: 'low_stock' as const,
      title: 'Low Stock Alert',
      message: 'Product "Coca Cola 500ml" is running low (Stock: 5, Threshold: 10)',
      metadata: { product_name: 'Coca Cola 500ml', current_stock: 5, threshold: 10 },
      icon: Package,
      color: 'text-orange-500'
    },
    {
      type: 'payment_received' as const,
      title: 'Payment Received',
      message: 'Payment of KES 1,250 received from John Doe',
      metadata: { amount: 1250, customer_name: 'John Doe', payment_method: 'M-Pesa' },
      icon: CreditCard,
      color: 'text-green-500'
    },
    {
      type: 'sync_failed' as const,
      title: 'Sync Failed',
      message: 'Failed to sync data after 3 retries: Network timeout',
      metadata: { error_message: 'Network timeout', retry_count: 3 },
      icon: AlertTriangle,
      color: 'text-red-500'
    },
    {
      type: 'sale_completed' as const,
      title: 'Sale Completed',
      message: 'Sale of KES 850 to Mary Wanjiku processed successfully',
      metadata: { total: 850, customer_name: 'Mary Wanjiku', items_count: 3 },
      icon: CheckCircle,
      color: 'text-blue-500'
    },
    {
      type: 'customer_payment' as const,
      title: 'Customer Payment',
      message: 'Alice Kamau made a payment of KES 500 via Cash',
      metadata: { customer_name: 'Alice Kamau', amount: 500, payment_method: 'Cash' },
      icon: Users,
      color: 'text-purple-500'
    }
  ];

  const createAllTestNotifications = async () => {
    setIsLoading('all');
    try {
      for (const notification of testNotifications) {
        await createNotification({
          type: notification.type,
          title: notification.title,
          message: notification.message,
          is_read: false,
          metadata: notification.metadata
        });
        // Small delay between notifications
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      toast({
        title: 'All test notifications created',
        description: `${testNotifications.length} notifications sent successfully`,
        className: 'bg-green-50 border-green-200 text-green-800'
      });
    } catch (error) {
      console.error('Error creating test notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to create some test notifications',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="w-5 h-5 text-green-600" />
          Notifications Testing Center
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Create test notifications to verify the notifications system is working correctly.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {testNotifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <div
                key={notification.type}
                className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Icon className={`w-5 h-5 ${notification.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {notification.title}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {notification.message}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => createTestNotification(
                    notification.type,
                    notification.title,
                    notification.message,
                    notification.metadata
                  )}
                  disabled={isLoading === notification.type}
                  className="flex-shrink-0"
                >
                  {isLoading === notification.type ? (
                    <RotateCcw className="w-4 h-4 animate-spin" />
                  ) : (
                    'Test'
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={createAllTestNotifications}
            disabled={isLoading === 'all'}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading === 'all' ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin mr-2" />
                Creating All Notifications...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Create All Test Notifications
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}