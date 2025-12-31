import { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
}

export function StatCard({ title, value, subtitle, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="glass-card p-5 hover:border-primary/30 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend.positive ? 'text-green-500' : 'text-red-500'}`}>
            {trend.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.value}%
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-1">{title}</p>
      <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}
