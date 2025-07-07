/**
 * Notification Triggers for DukaFiti
 * Functions to create contextual notifications based on business events
 */

import useNotifications from '@/hooks/useNotifications';

export function useNotificationTriggers() {
  const { createNotification } = useNotifications();

  const triggerLowStockAlert = async (productName: string, quantity: number) => {
    await createNotification({
      type: 'low_stock',
      title: 'Low Stock Alert',
      message: `${productName} is running low (${quantity} remaining)`
    });
  };

  const triggerCreditReminder = async (customerName: string, balance: number) => {
    await createNotification({
      type: 'credit_reminder',
      title: 'Credit Reminder',
      message: `${customerName} has outstanding credit of KES ${balance.toFixed(2)}`
    });
  };

  const triggerSaleComplete = async (amount: number, customerName?: string) => {
    await createNotification({
      type: 'sale',
      title: 'Sale Completed',
      message: customerName 
        ? `Sale of KES ${amount.toFixed(2)} to ${customerName} completed`
        : `Cash sale of KES ${amount.toFixed(2)} completed`
    });
  };

  const triggerPaymentReceived = async (customerName: string, amount: number) => {
    await createNotification({
      type: 'payment',
      title: 'Payment Received',
      message: `Received KES ${amount.toFixed(2)} from ${customerName}`
    });
  };

  const triggerSyncFailure = async (operationType: string, errorMessage: string) => {
    await createNotification({
      type: 'sync_error',
      title: 'Sync Failed',
      message: `Failed to sync ${operationType}: ${errorMessage}`
    });
  };

  return {
    triggerLowStockAlert,
    triggerCreditReminder,
    triggerSaleComplete,
    triggerPaymentReceived,
    triggerSyncFailure
  };
}