import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/ui/stat-card";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Building2,
  FileText,
  DollarSign,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import dashboardService from "@/services/dashboard.service";
import { format } from "date-fns";

const quickNavItems = [
  { title: "Inward Entry", description: "Record waste collection", icon: ArrowDownToLine, href: "/inward" },
  { title: "Outward Entry", description: "Record waste dispatch", icon: ArrowUpFromLine, href: "/outward" },
  { title: "Companies", description: "Manage generators", icon: Building2, href: "/companies" },
  { title: "Invoices", description: "View all invoices", icon: FileText, href: "/invoices" },
];

const COLORS = {
  paid: "#10b981", // success/green
  pending: "#f59e0b", // warning/amber
  partial: "#3b82f6", // primary/blue
  overdue: "#ef4444", // destructive/red
};

export default function Dashboard() {
  const currentYear = new Date().getFullYear();

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats(),
  });

  const { data: wasteFlowData, isLoading: wasteFlowLoading } = useQuery({
    queryKey: ['dashboard-waste-flow', currentYear],
    queryFn: () => dashboardService.getWasteFlow(currentYear),
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['dashboard-revenue', currentYear],
    queryFn: () => dashboardService.getRevenueChart(currentYear),
  });

  const { data: paymentStatus, isLoading: paymentStatusLoading } = useQuery({
    queryKey: ['dashboard-payment-status'],
    queryFn: () => dashboardService.getPaymentStatus(),
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['dashboard-recent-activity'],
    queryFn: () => dashboardService.getRecentActivity(5),
  });

  // Format revenue for display
  const formatRevenue = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(2)}K`;
    return `₹${amount.toLocaleString()}`;
  };

  // Format quantity for display
  const formatQuantity = (quantity: number) => {
    return `${quantity.toFixed(1)} MT`;
  };

  // Prepare payment status data for pie chart
  const paymentStatusChartData = paymentStatus
    ? [
      {
        name: "Paid",
        value: paymentStatus.paid.amount,
        color: COLORS.paid,
      },
      {
        name: "Pending",
        value: paymentStatus.pending.amount,
        color: COLORS.pending,
      },
      {
        name: "Partial",
        value: paymentStatus.partial.pending,
        color: COLORS.partial,
      },
      ...(paymentStatus.overdue.amount > 0
        ? [
          {
            name: "Overdue",
            value: paymentStatus.overdue.amount,
            color: COLORS.overdue,
          },
        ]
        : []),
    ].filter((item) => item.value > 0)
    : [];

  const isLoading = statsLoading || wasteFlowLoading || revenueLoading || paymentStatusLoading || activityLoading;

  if (isLoading) {
    return (
      <MainLayout title="Dashboard" subtitle="Chemical Waste Management Overview">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Dashboard" subtitle="Chemical Waste Management Overview">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Inward (This Month)"
          value={stats ? formatQuantity(stats.inward.quantity) : "0 MT"}
          subtitle={`Across ${stats?.inward.entries || 0} entries`}
          icon={ArrowDownToLine}
        />
        <StatCard
          title="Total Outward (This Month)"
          value={stats ? formatQuantity(stats.outward.quantity) : "0 MT"}
          subtitle={`Across ${stats?.outward.entries || 0} dispatches`}
          icon={ArrowUpFromLine}
        />
        <StatCard
          title="Total Invoices"
          value={stats?.invoices.thisMonth.toString() || "0"}
          subtitle="Generated this month"
          icon={FileText}
        />
        <StatCard
          title="Total Revenue (YTD)"
          value={stats ? formatRevenue(stats.revenue.ytd) : "₹0"}
          subtitle={`Paid: ${stats ? formatRevenue(stats.revenue.paid) : "₹0"} | Pending: ${stats ? formatRevenue(stats.revenue.pending) : "₹0"}`}
          icon={DollarSign}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Inward/Outward Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Inward vs Outward (Monthly)</h3>
          <div className="h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={wasteFlowData || []}>
                <defs>
                  <linearGradient id="colorInward" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOutward" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(262, 70%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(262, 70%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)} MT`, ""]}
                />
                <Area
                  type="monotone"
                  dataKey="inward"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorInward)"
                  strokeWidth={2}
                  name="Inward"
                />
                <Area
                  type="monotone"
                  dataKey="outward"
                  stroke="hsl(262, 70%, 50%)"
                  fillOpacity={1}
                  fill="url(#colorOutward)"
                  strokeWidth={2}
                  name="Outward"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">Inward</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(262, 70%, 50%)" }} />
              <span className="text-sm text-muted-foreground">Outward</span>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Payment Status</h3>
          {paymentStatusChartData.length > 0 ? (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentStatusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {paymentStatusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                      formatter={(value: number) => formatRevenue(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {paymentStatusChartData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium text-foreground">{formatRevenue(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              No payment data available
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Quick Navigation */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickNavItems.map((item) => (
              <Link
                key={item.title}
                to={item.href}
                className="glass-card p-4 hover:border-primary/50 transition-all duration-300 group"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary mb-3 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="w-5 h-5" />
                </div>
                <h4 className="font-medium text-foreground text-sm">{item.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
            <Link to="/inward" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentActivity && (
              <>
                {recentActivity.inward.slice(0, 3).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{entry.description}</p>
                      <p className="text-xs text-muted-foreground">{entry.details}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{format(new Date(entry.date), 'MMM dd')}</p>
                    </div>
                  </div>
                ))}
                {recentActivity.invoices.slice(0, 2).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{entry.description}</p>
                      <p className="text-xs text-muted-foreground">{entry.details}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{format(new Date(entry.date), 'MMM dd')}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
            {(!recentActivity || (recentActivity.inward.length === 0 && recentActivity.invoices.length === 0)) && (
              <div className="text-center py-8 text-muted-foreground text-sm">No recent activity</div>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Revenue</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(v) => {
                  if (v >= 1000000) return `₹${(v / 1000000).toFixed(1)}M`;
                  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
                  return `₹${v}`;
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
                formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </MainLayout>
  );
}
