import { storage } from '../server/storage';

async function seedNotifications() {
  try {
    // Create sample notifications for user ID 1 (admin user)
    const userId = 1;

    const sampleNotifications = [
      {
        userId,
        title: 'Low Stock Alert',
        message: 'Milk 1L is running low. Only 3 units remaining.',
        type: 'warning' as const,
        isRead: false;
      },
      {
        userId,
        title: 'New Sale',
        message: 'A new sale of KES 250.00 has been completed.',
        type: 'success' as const,
        isRead: false;
      },
      {
        userId,
        title: 'Welcome!',
        message: 'Welcome to DukaSmart! Your business management platform is ready.',
        type: 'info' as const,
        isRead: true;
      }
    ];

    for (const notification of sampleNotifications) {
      await storage.createNotification(notification);
      }

    } catch (error) {
    console.error('Error seeding notifications:', error);
  }
}

seedNotifications();