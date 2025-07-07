/**
 * Refresh Button Component
 * Provides manual refresh functionality with loading states
 */

import { useState } from 'react';
import { Button } from './button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RefreshButtonProps {
  onRefresh: () => Promise<void> | void;
  isLoading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  label?: string;
  showLabel?: boolean;
}

export function RefreshButton({
  onRefresh,
  isLoading = false,
  disabled = false,
  size = 'sm',
  variant = 'outline',
  className,
  label = 'Refresh',
  showLabel = false,
}: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing || disabled) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const isSpinning = isLoading || isRefreshing;

  return (
    <Button
      onClick={handleRefresh}
      disabled={disabled || isSpinning}
      size={size}
      variant={variant}
      className={cn(
        "min-w-[40px]",
        showLabel && "gap-2",
        className
      )}
      title={label}
    >
      <RefreshCw 
        className={cn(
          "h-4 w-4",
          isSpinning && "animate-spin"
        )} 
      />
      {showLabel && <span className="hidden sm:inline">{label}</span>}
    </Button>
  );
}

export default RefreshButton;