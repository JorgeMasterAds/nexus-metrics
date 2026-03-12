import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useSalesByPlatform, useSalesData, useSalesRealtime } from "@/hooks/useSalesData";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

const PLATFORM_COLORS: Record<string, string> = {
  hotmart: '#f04e23',
  cakto: '#6366f1',
  kiwify: '#22c55e',
  eduzz: '#3b82f6',
  braip: '#f59e0b',
}

const PLATFORM_LABELS: Record<string, string> = {
  hotmart: 'Hotmart',
  cakto: 'Cakto',
  kiwify: 'Kiwify',
  eduzz: 'Eduzz',
  braip: 'Braip',
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "destructive" | "secondary" | "outline" }> = {
  approved: { label: 'Aprovada', variant: 'default' },
  refunded: { label: 'Reembolso', variant: 'destructive' },
  cancelled: { label: 'Cancelada', variant: 'secondary' },
  chargeback: { label: 'Chargeback', variant: 'destructive' },
  pending: { label: 'Pendente', variant: 'outline' },
  overdue: { label: 'Atrasada', variant: 'secondary' },
}

/* ─── Revenue By Platform Chart ─── */
export function RevenueByPlatform() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const startDate = subDays(new Date(), days).toISOString()

  const { data: platformData, isLoading } = useSalesByPlatform(startDate)

  const chartData = useMemo(() => {
    if (!platformData) return []
    return Object.entries(platformData)
      .filter(([_, v]) => v.approvedCount > 0)
      .map(([platform, v]) => ({
        name: PLATFORM_LABELS[platform] || platform,
        platform,
        valor: Number(v.approved.toFixed(2)),
      }))
      .sort((a, b) => b.valor - a.valor)
  }, [platformData])

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Faturamento por Plataforma</CardTitle>
          <div className="flex gap-1">
            {(['7d', '30d', '90d'] as const).map(p => (
              <Button key={p} size="sm" variant={period === p ? 'default' : 'ghost'} className="h-6 px-2 text-xs" onClick={() => setPeriod(p)}>
                {p}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Carregando...</div>
        ) : chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Nenhuma venda no período</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
              <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Faturamento']} />
              <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.platform} fill={PLATFORM_COLORS[entry.platform] || 'hsl(var(--primary))'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

/* ─── Recent Sales Feed ─── */
export function RecentSalesFeed() {
  useSalesRealtime()
  const { data: sales, isLoading } = useSalesData({})

  const recentSales = useMemo(() => (sales || []).slice(0, 20), [sales])

  const maskEmail = (email: string | null) => {
    if (!email) return '—'
    const [user, domain] = email.split('@')
    if (!domain) return '***'
    return `${user.slice(0, 2)}***@${domain}`
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-medium">Últimas Vendas</CardTitle>
          {recentSales.length > 0 && (
            <Badge variant="secondary" className="text-xs">{recentSales.length}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : recentSales.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nenhuma venda registrada</div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {recentSales.map((sale: any) => {
              const st = STATUS_BADGE[sale.status] || STATUS_BADGE.pending
              return (
                <div key={sale.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-border/20 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge style={{ backgroundColor: PLATFORM_COLORS[sale.platform], color: '#fff' }} className="text-[10px] shrink-0">
                      {PLATFORM_LABELS[sale.platform] || sale.platform}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{sale.product_name || '—'}</p>
                      <p className="text-[10px] text-muted-foreground">{maskEmail(sale.buyer_email)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold">
                      R$ {Number(sale.amount ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <Badge variant={st.variant} className="text-[10px]">{st.label}</Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {sale.created_at ? format(new Date(sale.created_at), 'dd/MM HH:mm', { locale: ptBR }) : ''}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ─── Platform Health Cards ─── */
export function PlatformHealthCards() {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const { data: platformData, isLoading } = useSalesByPlatform(startOfMonth)

  if (isLoading) return null

  const platforms = Object.entries(platformData || {}).filter(([_, v]) => v.totalCount > 0)

  if (platforms.length === 0) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {platforms.map(([platform, data]) => {
        const refundRate = data.totalCount > 0 ? (data.refundedCount / data.totalCount) * 100 : 0
        const healthColor = refundRate < 3 ? 'text-green-500' : refundRate < 8 ? 'text-yellow-500' : 'text-red-500'
        const HealthIcon = refundRate < 3 ? CheckCircle : refundRate < 8 ? AlertTriangle : AlertTriangle

        return (
          <Card key={platform}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <Badge style={{ backgroundColor: PLATFORM_COLORS[platform], color: '#fff' }} className="text-[10px]">
                  {PLATFORM_LABELS[platform] || platform}
                </Badge>
                <HealthIcon className={`h-3.5 w-3.5 ${healthColor}`} />
              </div>
              <p className="text-lg font-bold">
                R$ {data.approved.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">{data.approvedCount} vendas</span>
                <span className={`text-[10px] font-medium ${healthColor}`}>
                  {refundRate.toFixed(1)}% refund
                </span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
