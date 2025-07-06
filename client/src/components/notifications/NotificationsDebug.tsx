import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function NotificationsDebug() {
  const [connectionStatus, setConnectionStatus] = useState('Testing...');
  const [realtimeStatus, setRealtimeStatus] = useState('Not started');
  const [subscriptionStatus, setSubscriptionStatus] = useState('Not started');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    testConnection();
    testRealtime();
  }, []);

  const testConnection = async () => {
    try {
      addTestResult('Testing basic Supabase connection...');
      
      // Test basic connection
      const { data, error } = await supabase.from('notifications').select('count').limit(1);
      
      if (error) {
        setConnectionStatus(`Error: ${error.message}`);
        addTestResult(`Connection failed: ${error.message}`);
      } else {
        setConnectionStatus('Connected');
        addTestResult('Basic connection successful');
      }
    } catch (err) {
      setConnectionStatus(`Failed: ${err}`);
      addTestResult(`Connection test failed: ${err}`);
    }
  };

  const testRealtime = () => {
    addTestResult('Setting up realtime subscription...');
    setRealtimeStatus('Setting up...');

    const subscription = supabase
      .channel('debug-notifications-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: 'user_id=eq.1'
      }, (payload) => {
        addTestResult(`Real-time INSERT received: ${payload.new.title}`);
        setNotifications(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: 'user_id=eq.1'
      }, (payload) => {
        addTestResult(`Real-time UPDATE received: ${payload.new.title}`);
      })
      .subscribe((status) => {
        addTestResult(`Subscription status: ${status}`);
        setSubscriptionStatus(status);
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('Active');
          addTestResult('Real-time subscription is active!');
        } else if (status === 'CLOSED') {
          setRealtimeStatus('Closed');
          addTestResult('Real-time subscription closed');
        } else if (status === 'CHANNEL_ERROR') {
          setRealtimeStatus('Error');
          addTestResult('Real-time subscription error');
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  };

  const createTestNotification = async () => {
    try {
      addTestResult('Creating test notification...');
      
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          type: 'sync_failed',
          title: 'Debug Test Notification',
          message: `Test notification created at ${new Date().toLocaleTimeString()}`,
          user_id: 1,
          is_read: false,
          metadata: { debug: true }
        }])
        .select()
        .single();

      if (error) {
        addTestResult(`Failed to create notification: ${error.message}`);
      } else {
        addTestResult(`Test notification created: ${data.id}`);
      }
    } catch (err) {
      addTestResult(`Error creating notification: ${err}`);
    }
  };

  const fetchNotifications = async () => {
    try {
      addTestResult('Fetching notifications...');
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', 1)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        addTestResult(`Failed to fetch notifications: ${error.message}`);
      } else {
        addTestResult(`Fetched ${data?.length || 0} notifications`);
        setNotifications(data || []);
      }
    } catch (err) {
      addTestResult(`Error fetching notifications: ${err}`);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Notifications System Debug</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded">
            <h4 className="font-medium">Connection</h4>
            <p className={`text-sm ${connectionStatus === 'Connected' ? 'text-green-600' : 'text-red-600'}`}>
              {connectionStatus}
            </p>
          </div>
          <div className="p-4 border rounded">
            <h4 className="font-medium">Real-time</h4>
            <p className={`text-sm ${realtimeStatus === 'Active' ? 'text-green-600' : 'text-red-600'}`}>
              {realtimeStatus}
            </p>
          </div>
          <div className="p-4 border rounded">
            <h4 className="font-medium">Subscription</h4>
            <p className={`text-sm ${subscriptionStatus === 'SUBSCRIBED' ? 'text-green-600' : 'text-red-600'}`}>
              {subscriptionStatus}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button onClick={createTestNotification} className="bg-blue-600 hover:bg-blue-700">
            Create Test Notification
          </Button>
          <Button onClick={fetchNotifications} variant="outline">
            Fetch Notifications
          </Button>
          <Button onClick={testConnection} variant="outline">
            Retest Connection
          </Button>
        </div>

        {/* Notifications List */}
        <div className="space-y-2">
          <h4 className="font-medium">Recent Notifications ({notifications.length})</h4>
          <div className="max-h-48 overflow-y-auto border rounded p-2">
            {notifications.length === 0 ? (
              <p className="text-gray-500">No notifications</p>
            ) : (
              notifications.map((notification, index) => (
                <div key={notification.id || index} className="p-2 border-b last:border-b-0">
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-sm text-gray-600">{notification.message}</div>
                  <div className="text-xs text-gray-400">
                    {notification.created_at} - Read: {notification.is_read ? 'Yes' : 'No'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Test Results Log */}
        <div className="space-y-2">
          <h4 className="font-medium">Debug Log</h4>
          <div className="max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-3 rounded font-mono text-xs">
            {testResults.map((result, index) => (
              <div key={index}>{result}</div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}