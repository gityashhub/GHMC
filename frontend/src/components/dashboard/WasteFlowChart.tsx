import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { month: "Jan", inward: 120, outward: 95 },
  { month: "Feb", inward: 145, outward: 110 },
  { month: "Mar", inward: 130, outward: 105 },
  { month: "Apr", inward: 165, outward: 140 },
  { month: "May", inward: 150, outward: 125 },
  { month: "Jun", inward: 180, outward: 155 },
  { month: "Jul", inward: 195, outward: 170 },
  { month: "Aug", inward: 185, outward: 160 },
  { month: "Sep", inward: 200, outward: 175 },
  { month: "Oct", inward: 220, outward: 195 },
  { month: "Nov", inward: 210, outward: 185 },
  { month: "Dec", inward: 245, outward: 215 },
];

export function WasteFlowChart() {
  return (
    <div className="glass-card p-6 fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-6">Inward vs Outward (MT)</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={8}>
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
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(222, 47%, 10%)",
                border: "1px solid hsl(222, 30%, 18%)",
                borderRadius: "8px",
                color: "hsl(210, 40%, 98%)",
              }}
            />
            <Legend
              wrapperStyle={{ color: "hsl(210, 40%, 98%)" }}
            />
            <Bar
              dataKey="inward"
              name="Inward"
              fill="hsl(168, 76%, 42%)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="outward"
              name="Outward"
              fill="hsl(38, 92%, 50%)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
