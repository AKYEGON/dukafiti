// DukaFiti Offline Status Indicator
import React from 'react';
import { useOffline } from '@/contexts/OfflineContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export function OfflineIndicator() {
  const { 
    isOnline, 
    isOfflineMode, 
    syncStatus, 
    pendingSyncCount, 
    lastSyncTime,
    forceSyncNow 
  } = useOffline();

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="h-3 w-3 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (isOfflineMode) return 'bg-yellow-500';
    if (pendingSyncCount > 0) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isOfflineMode) return 'Offline Mode';
    if (pendingSyncCount > 0) return `${pendingSyncCount} pending`;
    return 'Online';
  };

  const getTooltipText = () => {
    if (!isOnline) {
      return 'Device is offline. Changes will sync when connection is restored.';
    }
    if (isOfflineMode) {
      return 'Working in offline mode. Click to enable online sync.';
    }
    if (pendingSyncCount > 0) {
      return `${pendingSyncCount} items waiting to sync. Click to sync now.`;
    }
    if (lastSyncTime) {
      return `Last synced: ${lastSyncTime.toLocaleTimeString()}`;
    }
    return 'All data is synced';
  };

  const handleIndicatorClick = () => {
    if (isOnline && pendingSyncCount > 0) {
      forceSyncNow();
    }
  };

  return (
    <TooltipProvider>
      <div className="flex items-center space-x-2">
        {/* Connection Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center space-x-1">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isOnline ? 'Connected' : 'No connection'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Sync Status Badge */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="secondary" 
              className={`text-white text-xs px-2 py-1 cursor-pointer transition-all hover:scale-105 ${getStatusColor()}`}
              onClick={handleIndicatorClick}
            >
              <div className="flex items-center space-x-1">
                {getSyncStatusIcon()}
                <span>{getStatusText()}</span>
              </div>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipText()}</p>
          </TooltipContent>
        </Tooltip>

        {/* Manual Sync Button - only show when online and has pending items */}
        {isOnline && pendingSyncCount > 0 && syncStatus !== 'syncing' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={forceSyncNow}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Force sync now</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

export default OfflineIndicator;