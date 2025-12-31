import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const data = [
  { name: "Paid", value: 785000, color: "hsl(142, 76%, 36%)" },
  { name: "Pending", value: 215000, color: "hsl(0, 72%, 51%)" },
  { name: "Partial", value: 125000, color: "hsl(38, 92%, 50%)" },
];

export function PaymentStatus() {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="glass-card p-6 fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-6">Payment Status</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(222, 47%, 10%)",
                border: "1px solid hsl(222, 30%, 18%)",
                borderRadius: "8px",
                color: "hsl(210, 40%, 98%)",
              }}
              formatter={(value: number) => [`₹${value.toLocaleString()}`, ""]}
            />
            <Legend
              wrapperStyle={{ color: "hsl(210, 40%, 98%)" }}
              formatter={(value) => <span style={{ color: "hsl(210, 40%, 98%)" }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground">Total Outstanding</p>
        <p className="text-2xl font-bold text-foreground">₹{total.toLocaleString()}</p>
      </div>
    </div>
  );
}
