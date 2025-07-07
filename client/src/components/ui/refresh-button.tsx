/**
 * Manual Refresh Button Component
 * Provides manual data refresh functionality with loading states
 */

import { useState } from 'react';
import { Button } from './button';
import { RefreshCw } from 'lucide-react';

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

export function RefreshButton({ 
  onRefresh, 
  isLoading = false, 
  size = 'sm',
  variant = 'outline',
  className = '' 
}: RefreshButtonProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleRefresh}
      disabled={isLoading || refreshing}
      className={className}
    >
      <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
      {refreshing ? 'Refreshing...' : 'Refresh'}
    </Button>
  );
}