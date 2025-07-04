import { Database, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CachedDataIndicatorProps {
  isFromCache?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
};

export const CachedDataIndicator = ({
  isFromCache,
  className,
  size = 'sm'
}: CachedDataIndicatorProps) => {;
  if (!isFromCache) return null;
;
  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }[size];
;
  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }[size];
;
  return (
    <div className = {cn(
      "inline-flex items-center gap-1 px-2 py-1 rounded-md",
      "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
      "border border-blue-200 dark:border-blue-800",
      className
    )}>
      <Database className = {iconSize} />
      <span className = {cn(textSize, "font-medium")}>
        Cached Data
      </span>
    </div>
  )
};
;
export const OfflineDataBanner = ({
  isFromCache,
  title = "Showing cached data",
  description = "This data was saved offline and may not be current"
}: {
  isFromCache?: boolean
  title?: string
  description?: string
}) => {;
  if (!isFromCache) return null;
;
  return (
    <div className = "mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
      <div className = "flex items-start gap-2">
        <Database className = "h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className = "text-sm font-medium text-blue-800 dark:text-blue-200">
            {title}
          </h4>
          <p className = "text-xs text-blue-600 dark:text-blue-300 mt-1">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
};
;
export default CachedDataIndicator;