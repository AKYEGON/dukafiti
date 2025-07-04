import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, Loader2 } from "lucide-react";

interface SimpleMetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  isLoading?: boolean;
  isRefreshing?: boolean;
  error?: boolean;
}

export function SimpleMetricCard({
  title,
  value,
  icon: Icon,
  isLoading = false,
  isRefreshing = false,
  error = false
}: SimpleMetricCardProps) {
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
          </div>
        ) : error ? (
          <div className="space-y-1">
            <div className="text-2xl font-bold text-gray-400">—</div>
            <p className="text-xs text-gray-400" title="Data unavailable">
              Data unavailable
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center py-2">
            <div className="text-2xl font-bold text-foreground text-center">{value}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}