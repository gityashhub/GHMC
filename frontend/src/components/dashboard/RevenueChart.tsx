import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", revenue: 45000, inward: 120, outward: 95 },
  { month: "Feb", revenue: 52000, inward: 145, outward: 110 },
  { month: "Mar", revenue: 48000, inward: 130, outward: 105 },
  { month: "Apr", revenue: 61000, inward: 165, outward: 140 },
  { month: "May", revenue: 55000, inward: 150, outward: 125 },
  { month: "Jun", revenue: 67000, inward: 180, outward: 155 },
  { month: "Jul", revenue: 72000, inward: 195, outward: 170 },
  { month: "Aug", revenue: 68000, inward: 185, outward: 160 },
  { month: "Sep", revenue: 75000, inward: 200, outward: 175 },
  { month: "Oct", revenue: 82000, inward: 220, outward: 195 },
  { month: "Nov", revenue: 78000, inward: 210, outward: 185 },
  { month: "Dec", revenue: 91000, inward: 245, outward: 215 },
];

export function RevenueChart() {
  return (
    <div className="glass-card p-6 fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-6">Revenue Overview</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(168, 76%, 42%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(168, 76%, 42%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
            <XAxis
              dataKey="month"
              stroke="hsl(215, 20%, 55%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(215, 20%, 55%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(222, 47%, 10%)",
                border: "1px solid hsl(222, 30%, 18%)",
                borderRadius: "8px",
                color: "hsl(210, 40%, 98%)",
              }}
              formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(168, 76%, 42%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
