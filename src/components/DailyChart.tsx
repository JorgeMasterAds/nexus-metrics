import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface DailyChartProps {
  clicks: Array<{ created_at: string }>;
  conversions: Array<{ created_at: string; amount?: number }>;
  dateFrom: Date;
  dateTo: Date;
  title?: string;
}

export default function DailyChart({ clicks, conversions, dateFrom, dateTo, title = "Desempenho Diário" }: DailyChartProps) {
  const chartData = useMemo(() => {
    const dayMap = new Map<string, { date: string; cliques: number; vendas: number; receita: number }>();

    // Generate all days in range
    const d = new Date(dateFrom);
    d.setHours(0, 0, 0, 0);
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);

    while (d <= end) {
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      dayMap.set(key, { date: label, cliques: 0, vendas: 0, receita: 0 });
      d.setDate(d.getDate() + 1);
    }

    clicks.forEach((c) => {
      const key = new Date(c.created_at).toISOString().slice(0, 10);
      const entry = dayMap.get(key);
      if (entry) entry.cliques++;
    });

    conversions.forEach((c) => {
      const key = new Date(c.created_at).toISOString().slice(0, 10);
      const entry = dayMap.get(key);
      if (entry) {
        entry.vendas++;
        entry.receita += Number(c.amount || 0);
      }
    });

    return Array.from(dayMap.values());
  }, [clicks, conversions, dateFrom, dateTo]);

  if (chartData.length === 0) return null;

  return (
    <div className="rounded-xl bg-card border border-border/50 card-shadow p-5 mt-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
              interval={chartData.length > 14 ? Math.floor(chartData.length / 7) : 0}
            />
            <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number, name: string) => {
                if (name === "receita") return [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Receita"];
                return [value, name === "cliques" ? "Cliques" : "Vendas"];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px" }}
              formatter={(value) => value === "cliques" ? "Cliques" : value === "vendas" ? "Vendas" : "Receita"}
            />
            <Bar dataKey="cliques" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} opacity={0.7} />
            <Bar dataKey="vendas" fill="hsl(var(--success, 142 71% 45%))" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
