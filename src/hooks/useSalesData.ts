import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useEffect } from 'react'

type Platform = 'hotmart' | 'cakto' | 'kiwify' | 'eduzz' | 'braip'
type SaleStatus = 'approved' | 'refunded' | 'cancelled' | 'chargeback' | 'pending' | 'overdue'

interface SalesFilters {
  platform?: Platform
  status?: SaleStatus
  startDate?: string
  endDate?: string
}

export function useSalesData(filters: SalesFilters = {}) {
  return useQuery({
    queryKey: ['sales', filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)

      if (filters.platform) query = query.eq('platform', filters.platform)
      if (filters.status) query = query.eq('status', filters.status)
      if (filters.startDate) query = query.gte('created_at', filters.startDate)
      if (filters.endDate) query = query.lte('created_at', filters.endDate)

      const { data, error } = await query
      if (error) throw error
      return data as any[]
    },
    staleTime: 30_000,
  })
}

export function useSalesByPlatform(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['sales-by-platform', startDate, endDate],
    queryFn: async () => {
      let query = (supabase as any)
        .from('sales')
        .select('platform, status, amount')

      if (startDate) query = query.gte('created_at', startDate)
      if (endDate) query = query.lte('created_at', endDate)

      const { data, error } = await query
      if (error) throw error

      const platforms = ['hotmart', 'cakto', 'kiwify', 'eduzz', 'braip'] as const
      const result: Record<string, { approved: number; approvedCount: number; refunded: number; refundedCount: number; total: number; totalCount: number }> = {}

      platforms.forEach(p => {
        result[p] = { approved: 0, approvedCount: 0, refunded: 0, refundedCount: 0, total: 0, totalCount: 0 }
      })

      ;(data || []).forEach((sale: any) => {
        const p = sale.platform
        if (!result[p]) return
        result[p].total += Number(sale.amount ?? 0)
        result[p].totalCount += 1
        if (sale.status === 'approved') {
          result[p].approved += Number(sale.amount ?? 0)
          result[p].approvedCount += 1
        }
        if (sale.status === 'refunded') {
          result[p].refunded += Number(sale.amount ?? 0)
          result[p].refundedCount += 1
        }
      })

      return result
    },
  })
}

export function useSalesRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('sales-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'sales',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['sales'] })
        queryClient.invalidateQueries({ queryKey: ['sales-by-platform'] })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [queryClient])
}
