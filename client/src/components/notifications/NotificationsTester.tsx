import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useNotifications from '@/hooks/useNotifications';
import { Bell, Package, CreditCard, AlertTriangle } from 'lucide-react';

export function NotificationsTester() {
  const { createNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const testLowStock = async () => {
    setIsLoading('low_stock');
    try {
      await createNotification({
        type: 'low_stock',
        entity_id: crypto.randomUUID(),
        title: 'Low Stock Alert',
        message: 'Coca Cola 500ml is running low (Stock: 3)',
      });
    } catch (error) {
      console.error('Error creating low stock notification:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const testCreditReminder = async () => {
    setIsLoading('credit');
    try {
      await createNotification({
        type: 'credit',
        entity_id: crypto.randomUUID(),
        title: 'Payment Reminder',
        message: 'John Doe owes KES 1,200 (7 days overdue)',
      });
    } catch (error) {
      console.error('Error creating credit notification:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const simulateCreditCheck = async () => {
    setIsLoading('credit_check');
    try {
      // Simulate creating multiple credit reminders for different customers
      const customers = [
        { name: 'Mary Wanjiku', amount: 850 },
        { name: 'Peter Kiprotich', amount: 1200 },
        { name: 'Alice Nyong\'o', amount: 650 }
      ];

      for (const customer of customers) {
        await createNotification({
          type: 'credit',
          entity_id: crypto.randomUUID(),
          title: 'Payment Reminder',
          message: `${customer.name} owes KES ${customer.amount} (7+ days overdue)`,
        });
        // Small delay between notifications
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Error running credit check:', error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <Card className="bg-white dark:bg-[#1F1F1F] border-2 border-purple-200 dark:border-purple-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
          <Bell className="h-5 w-5" />
          MVP Notifications Testing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              onClick={testLowStock}
              disabled={isLoading === 'low_stock'}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Package className="h-4 w-4" />
              {isLoading === 'low_stock' ? 'Creating...' : '⚠️ Test Low Stock Alert'}
            </Button>

            <Button
              onClick={testCreditReminder}
              disabled={isLoading === 'credit'}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
            >
              <CreditCard className="h-4 w-4" />
              {isLoading === 'credit' ? 'Creating...' : '💳 Test Credit Reminder'}
            </Button>

            <Button
              onClick={simulateCreditCheck}
              disabled={isLoading === 'credit_check'}
              className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white"
            >
              <AlertTriangle className="h-4 w-4" />
              {isLoading === 'credit_check' ? 'Running...' : '🔍 Run Credit Check'}
            </Button>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
            <p className="font-medium mb-1">MVP Test Instructions:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Click test buttons to create notifications</li>
              <li>Check the notification bell in the top bar for red badge</li>
              <li>Click bell to see notifications and auto-mark as read</li>
              <li>Click notifications to navigate to relevant pages</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}