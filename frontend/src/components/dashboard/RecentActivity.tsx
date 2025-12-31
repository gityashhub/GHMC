import { ArrowDownToLine, ArrowUpFromLine, FileText, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";

const activities: Array<{
  type: "inward" | "outward" | "invoice" | "payment";
  title: string;
  quantity: string;
  time: string;
  icon: typeof ArrowDownToLine;
}> = [];

export function RecentActivity() {
  return (
    <div className="glass-card p-6 fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-6">Recent Activity</h3>
      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary/30 transition-colors"
            >
              <div
                className={cn(
                  "p-2 rounded-lg",
                  activity.type === "inward" && "bg-primary/20 text-primary",
                  activity.type === "outward" && "bg-warning/20 text-warning",
                  activity.type === "invoice" && "bg-chart-4/20 text-chart-4",
                  activity.type === "payment" && "bg-success/20 text-success"
                )}
              >
                <activity.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{activity.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
              </div>
              <span className="text-sm font-medium text-foreground">{activity.quantity}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
        )}
      </div>
    </div>
  );
}
