import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  Package, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  Users,
  Play,
  RotateCcw,
  Trash2
} from 'lucide-react';

export function NotificationsTester() {
  const { createNotification } = useNotifications();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const createTestNotification = async (
    type: 'low_stock' | 'payment_received' | 'sync_failed' | 'sale_completed' | 'customer_payment',
    title: string,
    message: string,
    payload?: Record<string, any>
  ) => {
    setIsLoading(type);
    try {
      await createNotification({
        type,
        title,
        message,
        payload
      });
      toast({
        title: 'Test notification created',
        description: `${title} notification sent successfully`,
        className: 'bg-green-50 border-green-200 text-green-800'
      });
    } catch (error: any) {
      console.error('Error creating test notification:', error);
      
      let errorMessage = 'Failed to create test notification';
      if (error?.message?.includes('relation "public.notifications" does not exist')) {
        errorMessage = 'Notifications table does not exist. Please create it in Supabase first.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(null);
    }
  };

  const cleanupTestNotifications = async () => {
    setIsCleaningUp(true);
    try {
      // Remove any test notifications that don't have proper context
      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .or('message.like.%Test notification%,message.like.%Real-time Test%,title.like.%Test%')
        .select();
      
      if (error) {
        console.error('Error cleaning up test notifications:', error);
        throw error;
      }
      
      toast({
        title: 'Test notifications cleaned up',
        description: `Removed ${data?.length || 0} test notifications`,
        className: 'bg-green-50 border-green-200 text-green-800'
      });
    } catch (error: any) {
      console.error('Error cleaning up test notifications:', error);
      toast({
        title: 'Cleanup failed',
        description: error.message || 'Failed to clean up test notifications',
        variant: 'destructive'
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  const testNotifications = [
    {
      type: 'low_stock' as const,
      title: 'Low Stock Alert',
      message: 'Product "Coca Cola 500ml" is running low (Stock: 5, Threshold: 10)',
      payload: { productId: 1, productName: 'Coca Cola 500ml', currentQty: 5, threshold: 10 },
      icon: Package,
      color: 'text-orange-500'
    },
    {
      type: 'payment_received' as const,
      title: 'Payment Received',
      message: 'Payment of KES 1,250 received via M-Pesa',
      payload: { saleId: 123, method: 'mobileMoney', amount: 1250, customerName: 'John Doe', orderReference: 'ORD-001' },
      icon: CreditCard,
      color: 'text-green-500'
    },
    {
      type: 'sync_failed' as const,
      title: 'Sync Failed',
      message: 'Failed to sync data after 3 retries: Network timeout',
      payload: { errorDetail: 'Network timeout', retryCount: 3, timestamp: new Date().toISOString() },
      icon: AlertTriangle,
      color: 'text-red-500'
    },
    {
      type: 'sale_completed' as const,
      title: 'Sale Completed',
      message: 'Sale of KES 850 to Mary Wanjiku processed successfully',
      payload: { saleId: 124, customerName: 'Mary Wanjiku', amount: 850, paymentMethod: 'cash', itemsCount: 3, orderReference: 'ORD-002' },
      icon: CheckCircle,
      color: 'text-blue-500'
    },
    {
      type: 'customer_payment' as const,
      title: 'Customer Payment',
      message: 'Alice Kamau made a payment of KES 500 via Cash',
      payload: { customerId: 2, customerName: 'Alice Kamau', amount: 500, paymentMethod: 'Cash', timestamp: new Date().toISOString() },
      icon: Users,
      color: 'text-accent-500'
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
          payload: notification.payload
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
        
        <Alert className="mt-4 border-blue-200 bg-blue-50 dark:bg-blue-900/10">
          <AlertDescription className="text-sm">
            <strong>Setup Required:</strong> If notifications fail, run this SQL in your Supabase SQL editor:
            <code className="block mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
              {`CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type text NOT NULL CHECK (type IN ('low_stock', 'payment_received', 'sync_failed', 'sale_completed', 'customer_payment')),
  title text NOT NULL,
  message text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  user_id integer DEFAULT 1,
  metadata jsonb DEFAULT '{}'::jsonb
);`}
            </code>
          </AlertDescription>
        </Alert>
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
                    notification.payload
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

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
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
          
          <Button
            onClick={cleanupTestNotifications}
            disabled={isCleaningUp}
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            {isCleaningUp ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin mr-2" />
                Cleaning Up...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Clean Up Test Notifications
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}