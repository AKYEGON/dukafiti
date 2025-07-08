/**
 * Dashboard Monitor Component
 * Real-time debugging and monitoring for dashboard errors
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardMetrics } from '@/lib/supabase-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export function DashboardMonitor() {
  const [logs, setLogs] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  // Test dashboard metrics directly
  const { data: metrics, error, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-metrics-debug'],
    queryFn: async () => {
      console.log('🔍 Dashboard Monitor: Testing getDashboardMetrics...');
      setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: Testing getDashboardMetrics...`]);
      
      try {
        const result = await getDashboardMetrics();
        console.log('✅ Dashboard Monitor: Success!', result);
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: Success! Got metrics:`, JSON.stringify(result, null, 2)]);
        setConnectionStatus('connected');
        return result;
      } catch (error) {
        console.error('❌ Dashboard Monitor: Error!', error);
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: Error! ${error.message}`]);
        setConnectionStatus('error');
        throw error;
      }
    },
    retry: false,
    refetchInterval: 10000, // Check every 10 seconds
  });

  const handleManualTest = () => {
    setLogs([]);
    setConnectionStatus('checking');
    refetch();
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'checking': return <Activity className="w-4 h-4 animate-spin" />;
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'checking': return <Badge variant="secondary">Checking...</Badge>;
      case 'connected': return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Dashboard Monitor
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={handleManualTest} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Test Now
          </Button>
          <Button onClick={() => setLogs([])} variant="ghost" size="sm">
            Clear Logs
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="font-medium text-red-800">Error Details</span>
            </div>
            <code className="text-sm text-red-700 block">{error.message}</code>
          </div>
        )}

        {metrics && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-800">Dashboard Metrics Loaded</span>
            </div>
            <pre className="text-xs text-green-700 overflow-auto max-h-32">
              {JSON.stringify(metrics, null, 2)}
            </pre>
          </div>
        )}

        {logs.length > 0 && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
            <h4 className="font-medium text-gray-800 mb-2">Debug Logs</h4>
            <div className="text-xs text-gray-600 space-y-1 max-h-40 overflow-auto">
              {logs.map((log, index) => (
                <div key={index} className="font-mono">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}