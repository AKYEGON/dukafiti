import { supabase } from './supabase';

// Real business event notification triggers

export const triggerSaleCompletedNotification = async (
  orderId: string,
  total: number,
  paymentMethod: string,
  customerName?: string
) => {
  const { error } = await supabase
    .from('notifications')
    .insert([{
      type: 'credit',
      entity_id: orderId,
      title: 'Sale Completed',
      message: `Sale of KES ${total.toFixed(2)} completed via ${paymentMethod}${customerName ? ` to ${customerName}` : ''}`,
      is_read: false
    }]);

  if (error) {
    console.error('Error creating sale notification:', error);
  }
};

export const triggerPaymentReceivedNotification = async (
  customerId: string,
  amount: number,
  customerName: string
) => {
  const { error } = await supabase
    .from('notifications')
    .insert([{
      type: 'credit',
      entity_id: customerId,
      title: 'Payment Received',
      message: `Payment of KES ${amount.toFixed(2)} received from ${customerName}`,
      is_read: false
    }]);

  if (error) {
    console.error('Error creating payment notification:', error);
  }
};

export const triggerLowStockNotification = async (
  productId: string,
  productName: string,
  currentStock: number
) => {
  const { error } = await supabase
    .from('notifications')
    .insert([{
      type: 'low_stock',
      entity_id: productId,
      title: 'Low Stock Alert',
      message: `${productName} is running low (${currentStock} remaining)`,
      is_read: false
    }]);

  if (error) {
    console.error('Error creating low stock notification:', error);
  }
};

export const triggerCreditReminderNotification = async (
  customerId: string,
  customerName: string,
  amount: number,
  daysPastDue: number
) => {
  const { error } = await supabase
    .from('notifications')
    .insert([{
      type: 'credit',
      entity_id: customerId,
      title: 'Credit Reminder',
      message: `${customerName} has outstanding credit of KES ${amount.toFixed(2)} (${daysPastDue} days overdue)`,
      is_read: false
    }]);

  if (error) {
    console.error('Error creating credit reminder notification:', error);
  }
};

export const triggerCustomerRegisteredNotification = async (
  customerId: string,
  customerName: string
) => {
  const { error } = await supabase
    .from('notifications')
    .insert([{
      type: 'credit',
      entity_id: customerId,
      title: 'New Customer',
      message: `${customerName} has been registered as a new customer`,
      is_read: false
    }]);

  if (error) {
    console.error('Error creating customer notification:', error);
  }
};

export const triggerInventoryUpdatedNotification = async (
  productId: string,
  productName: string,
  action: 'added' | 'updated' | 'deleted'
) => {
  const { error } = await supabase
    .from('notifications')
    .insert([{
      type: 'low_stock',
      entity_id: productId,
      title: 'Inventory Updated',
      message: `Product "${productName}" has been ${action}`,
      is_read: false
    }]);

  if (error) {
    console.error('Error creating inventory notification:', error);
  }
};