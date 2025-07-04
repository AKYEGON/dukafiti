import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon: LucideIcon
  iconColor?: string
};

export function MetricCard({
  title,
  value,
  change,
  changeType  =  "neutral",
  icon: Icon,
  iconColor  =  "text-primary"
}: MetricCardProps) {;
  const getChangeColor  =  ()  = > {
    switch (changeType) {
      case "positive":;
        return "text-green-600 dark:text-green-400";
      case "negative":;
        return "text-red-600 dark:text-red-400";
      default:;
        return "text-muted-foreground";
    }
  };
;
  const getTrendIcon  =  ()  = > {;
    if (changeType  ===  "positive") return TrendingUp;
    if (changeType  ===  "negative") return TrendingDown;
    return null;
  };
;
  const TrendIcon  =  getTrendIcon();
;
  return (
    <Card>
      <CardContent className = "p-6">
        <div className = "flex items-center justify-between">
          <div>
            <p className = "text-muted-foreground text-sm font-medium">{title}</p>
            <p className = "text-2xl font-bold text-foreground mt-1">{value}</p>
            {change && (
              <p className = {`text-sm mt-2 flex items-center ${getChangeColor()}`}>
                {TrendIcon && <TrendIcon className = "w-4 h-4 mr-1" />}
                {change}
              </p>
            )}
          </div>
          <div className = {`w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center`}>
            <Icon size = {24} className = {iconColor} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
