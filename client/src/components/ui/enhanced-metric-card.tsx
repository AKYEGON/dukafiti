import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, Loader2 } from "lucide-react";

interface EnhancedMetricCardProps {
  title: string;
  value: string;
  percentageChange: string;
  icon: LucideIcon;
  isLoading?: boolean;
  isRefreshing?: boolean;
  error?: boolean;
}

function getPercentageColor(percentageChange: string): string {
  if (percentageChange === "0.0%" || percentageChange === "—") return "text-gray-500";
  if (percentageChange === "New") return "text-green-600 dark:text-green-400";
  if (percentageChange.startsWith("+")) return "text-green-600 dark:text-green-400";
  if (percentageChange.startsWith("-")) return "text-red-600 dark:text-red-400";
  return "text-gray-500";
}

export function EnhancedMetricCard({
  title,
  value,
  percentageChange,
  icon: Icon,
  isLoading = false,
  isRefreshing = false,
  error = false
}: EnhancedMetricCardProps) {
  return (
    <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className="relative">
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Icon className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
        
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        ) : error ? (
          <div className="space-y-1">
            <div className="text-2xl font-bold text-gray-400">—</div>
            <p className="text-xs text-gray-400" title="Data unavailable">
              Data unavailable
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-2xl font-bold text-foreground">{value}</div>
            <p className={cn(
              "text-xs font-medium transition-colors",
              getPercentageColor(percentageChange)
            )}>
              {percentageChange}
              {percentageChange !== "—" && percentageChange !== "0.0%" && percentageChange !== "New" && (
                <span className="text-muted-foreground ml-1">vs yesterday</span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}