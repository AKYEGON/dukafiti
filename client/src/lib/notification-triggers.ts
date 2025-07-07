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
      type: 'sale_completed',
      title: 'Sale Completed',
      message: `Sale of KES ${total.toFixed(2)} completed via ${paymentMethod}${customerName ? ` to ${customerName}` : ''}`,
      user_id: 1,
      is_read: false
    }]);

  if (error) {
    
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
      type: 'payment_received',
      title: 'Payment Received',
      message: `Payment of KES ${amount.toFixed(2)} received from ${customerName}`,
      user_id: 1,
      is_read: false
    }]);

  if (error) {
    
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
      title: 'Low Stock Alert',
      message: `${productName} is running low (${currentStock} remaining)`,
      user_id: 1,
      is_read: false
    }]);

  if (error) {
    
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
      type: 'payment_received',
      title: 'Credit Reminder',
      message: `${customerName} has outstanding credit of KES ${amount.toFixed(2)} (${daysPastDue} days overdue)`,
      user_id: 1,
      is_read: false
    }]);

  if (error) {
    
  }
};

export const triggerCustomerRegisteredNotification = async (
  customerId: string,
  customerName: string
) => {
  const { error } = await supabase
    .from('notifications')
    .insert([{
      type: 'sale_completed',
      title: 'New Customer',
      message: `${customerName} has been registered as a new customer`,
      user_id: 1,
      is_read: false
    }]);

  if (error) {
    
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
      title: 'Inventory Updated',
      message: `Product "${productName}" has been ${action}`,
      user_id: 1,
      is_read: false
    }]);

  if (error) {
    
  }
};