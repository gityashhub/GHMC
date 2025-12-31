import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
}

export function KPICard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-primary",
}: KPICardProps) {
  return (
    <div className="kpi-card fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
          {change && (
            <p
              className={cn(
                "text-sm mt-2 font-medium",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-lg bg-secondary/50", iconColor)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
