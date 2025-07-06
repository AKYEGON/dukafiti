// DukaFiti Offline Settings Component
import React, { useState, useEffect } from 'react';
import { useOffline } from '@/contexts/OfflineContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  RefreshCw, 
  Download, 
  Upload, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Wifi,
  WifiOff,
  Database,
  HardDrive
} from 'lucide-react';
import { offlineManager } from '@/lib/offline-manager';
import { toast } from '@/hooks/use-toast';

export function OfflineSettings() {
  const { 
    isOnline, 
    isOfflineMode, 
    syncStatus, 
    pendingSyncCount, 
    lastSyncTime,
    toggleOfflineMode,
    forceSyncNow,
    getSyncQueueStatus
  } = useOffline();

  const [offlineStats, setOfflineStats] = useState<any>(null);
  const [syncQueueDetails, setSyncQueueDetails] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    loadOfflineStats();
    loadSyncQueueDetails();
  }, []);

  const loadOfflineStats = async () => {
    setIsLoadingStats(true);
    try {
      const stats = await offlineManager.getOfflineStats();
      setOfflineStats(stats);
    } catch (error) {
      console.error('Failed to load offline stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadSyncQueueDetails = async () => {
    try {
      const details = await getSyncQueueStatus();
      setSyncQueueDetails(details);
    } catch (error) {
      console.error('Failed to load sync queue details:', error);
    }
  };

  const handleManualSync = async () => {
    try {
      const result = await forceSyncNow();
      await loadSyncQueueDetails();
      await loadOfflineStats();
      
      if (result.success) {
        toast({
          title: "Sync Complete",
          description: `${result.syncedItems} items synced successfully`,
          duration: 5000
        });
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Please try again later",
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'bg-blue-500';
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSyncStatusText = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'Syncing...';
      case 'success':
        return 'Synced';
      case 'error':
        return 'Failed';
      default:
        return 'Idle';
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            Connection Status
          </CardTitle>
          <CardDescription>
            Current connection status and sync information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Internet Connection</span>
            <Badge variant={isOnline ? "default" : "destructive"}>
              {isOnline ? "Online" : "Offline"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Offline Mode</span>
            <div className="flex items-center gap-2">
              <Switch
                checked={isOfflineMode}
                onCheckedChange={toggleOfflineMode}
                disabled={!isOnline}
              />
              <Badge variant={isOfflineMode ? "secondary" : "outline"}>
                {isOfflineMode ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Sync Status</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getSyncStatusColor()}`} />
              <span className="text-sm">{getSyncStatusText()}</span>
            </div>
          </div>

          {lastSyncTime && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Sync</span>
              <span className="text-sm text-muted-foreground">
                {lastSyncTime.toLocaleString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sync Management
          </CardTitle>
          <CardDescription>
            Manage offline data synchronization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingSyncCount > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {pendingSyncCount} items pending sync
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={handleManualSync}
                  disabled={!isOnline || syncStatus === 'syncing'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {syncStatus === 'syncing' ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-1" />
                      Sync Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {syncQueueDetails && (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{syncQueueDetails.pending}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{syncQueueDetails.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{syncQueueDetails.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          )}

          <Button
            onClick={handleManualSync}
            disabled={!isOnline || syncStatus === 'syncing'}
            className="w-full"
            variant="outline"
          >
            {syncStatus === 'syncing' ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Force Sync All Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Offline Storage Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Offline Storage
          </CardTitle>
          <CardDescription>
            Local data storage statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingStats ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : offlineStats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Products</span>
                    <Badge variant="outline">{offlineStats.productsCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Customers</span>
                    <Badge variant="outline">{offlineStats.customersCount}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Orders</span>
                    <Badge variant="outline">{offlineStats.ordersCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Low Stock</span>
                    <Badge variant={offlineStats.lowStockCount > 0 ? "destructive" : "outline"}>
                      {offlineStats.lowStockCount}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Sales (Offline)</span>
                <span className="text-sm font-bold">
                  KSh {offlineStats.totalSales.toLocaleString()}
                </span>
              </div>

              <Button
                onClick={loadOfflineStats}
                variant="ghost"
                size="sm"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Stats
              </Button>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Failed to load storage stats
            </div>
          )}
        </CardContent>
      </Card>

      {/* Offline Features Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Offline Features
          </CardTitle>
          <CardDescription>
            What works offline in DukaFiti
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">Record sales and manage inventory</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">Add and edit customers</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">View reports and analytics</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">Automatic sync when online</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">Background data synchronization</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default OfflineSettings;