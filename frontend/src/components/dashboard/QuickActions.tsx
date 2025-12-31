import { Link } from "react-router-dom";
import { Plus, ArrowDownToLine, ArrowUpFromLine, Building2, FileText } from "lucide-react";

const actions = [
  {
    icon: ArrowDownToLine,
    label: "New Inward Entry",
    path: "/inward?action=new",
    color: "bg-primary/20 text-primary",
  },
  {
    icon: ArrowUpFromLine,
    label: "New Outward Entry",
    path: "/outward?action=new",
    color: "bg-warning/20 text-warning",
  },
  {
    icon: Building2,
    label: "Add Company",
    path: "/companies?action=new",
    color: "bg-chart-4/20 text-chart-4",
  },
  {
    icon: FileText,
    label: "Generate Invoice",
    path: "/invoices?action=new",
    color: "bg-success/20 text-success",
  },
];

export function QuickActions() {
  return (
    <div className="glass-card p-6 fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-6">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className="flex items-center gap-3 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
          >
            <div className={`p-2 rounded-lg ${action.color}`}>
              <action.icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
