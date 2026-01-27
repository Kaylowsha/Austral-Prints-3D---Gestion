import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
    ChevronLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { ProductionCostsTab } from './ProductionCostsTab'

export default function ProductionAnalysisPage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'month' | 'all'>('30d')
    const [stats, setStats] = useState({
        production_cost: 0,
        material_cost: 0,
        energy_cost: 0,
        total_grams: 0,
        total_hours: 0
    })
    const [dailyData, setDailyData] = useState<any[]>([])

    useEffect(() => {
        fetchProductionStats()
    }, [timeframe])

    const fetchProductionStats = async () => {
        setLoading(true)

        // Calculate start date based on timeframe
        let startDate: string | null = null
        const now = new Date()
        if (timeframe === '7d') {
            const d = new Date()
            d.setDate(d.getDate() - 7)
            startDate = d.toISOString().split('T')[0]
        } else if (timeframe === '30d') {
            const d = new Date()
            d.setDate(d.getDate() - 30)
            startDate = d.toISOString().split('T')[0]
        } else if (timeframe === 'month') {
            startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
        }

        let ordersQuery = supabase.from('orders').select('*')
        if (startDate) {
            ordersQuery = ordersQuery.or(`date.gte.${startDate},created_at.gte.${startDate}`)
        }

        const { data: orders } = await ordersQuery
        const realized_orders = orders?.filter(o => ['entregado'].includes(o.status)) || []

        // Total Production Cost
        const production_cost = realized_orders.reduce((acc, curr) => acc + (curr.cost || 0), 0) || 0

        // Material vs Energy Breakdown
        const material_cost = realized_orders.reduce((acc, curr) => {
            if (curr.quoted_grams && curr.quoted_material_price) {
                const costPerGram = (curr.quoted_material_price || 15000) / 1000
                return acc + (curr.quoted_grams * costPerGram * (curr.quantity || 1))
            }
            return acc + ((curr.cost || 0) * 0.9)
        }, 0)

        const energy_cost = Math.max(0, production_cost - material_cost)

        const total_grams = realized_orders.reduce((acc, curr) => acc + (curr.quoted_grams || 0) * (curr.quantity || 1), 0)
        const total_hours = realized_orders.reduce((acc, curr) => {
            const h = curr.quoted_hours || 0
            const m = curr.quoted_mins || 0
            return acc + (h + m / 60) * (curr.quantity || 1)
        }, 0)

        setStats({
            production_cost,
            material_cost,
            energy_cost,
            total_grams,
            total_hours
        })

        // Daily Data for Charts
        const daysToFetch = timeframe === '7d' ? 7 : 30
        const timeline = Array.from({ length: daysToFetch }, (_, i) => {
            const d = new Date()
            d.setDate(d.getDate() - (daysToFetch - 1 - i))
            return d.toISOString().split('T')[0]
        })

        const historyData = timeline.map(date => {
            const dayOrders = orders?.filter(o => (o.date || o.created_at).startsWith(date) && o.status === 'entregado') || []
            const dayProdCost = dayOrders.reduce((acc, curr) => acc + (curr.cost || 0), 0)

            const dayMaterialCost = dayOrders.reduce((acc, curr) => {
                if (curr.quoted_grams && curr.quoted_material_price) {
                    return acc + ((curr.quoted_grams * (curr.quoted_material_price / 1000)) * (curr.quantity || 1))
                }
                return acc + ((curr.cost || 0) * 0.9)
            }, 0)

            return {
                date,
                displayDate: new Date(date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }),
                costo_directo: dayProdCost,
                material_cost: dayMaterialCost,
                energy_cost: Math.max(0, dayProdCost - dayMaterialCost)
            }
        })

        setDailyData(historyData)
        setLoading(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto pb-24 bg-slate-50/50 min-h-screen">
            {/* Header */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest mb-4 transition-colors"
                    >
                        <ChevronLeft size={14} /> Volver
                    </button>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-pink-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">COST ANALYSIS</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Análisis de Producción</h1>
                    <p className="text-slate-500 font-medium text-sm">Desglose detallado de costos directos: material vs energía.</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Timeframe Selector */}
                    <div className="flex bg-slate-200/50 p-1 rounded-xl gap-1">
                        {[
                            { id: '7d', label: '7D' },
                            { id: '30d', label: '30D' },
                            { id: 'month', label: 'MES' },
                            { id: 'all', label: 'TODO' }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTimeframe(t.id as any)}
                                className={cn(
                                    "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                                    timeframe === t.id
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Direct Cost Analysis Content */}
            <ProductionCostsTab stats={stats} dailyData={dailyData} />
        </div>
    )
}
