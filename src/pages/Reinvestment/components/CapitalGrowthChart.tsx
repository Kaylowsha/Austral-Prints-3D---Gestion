import { useState, useEffect } from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts'
import { supabase } from '@/lib/supabase'

export default function CapitalGrowthChart() {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        // Fetch expenses tagged as 'Inversión' or 'Reinversión'
        const { data: expenses } = await supabase
            .from('expenses')
            .select('amount, date, tags')
            .or('tags.cs.{Inversión},tags.cs.{Reinversión}')
            .order('date', { ascending: true })

        if (!expenses) {
            setLoading(false)
            return
        }

        // Process data by month
        const monthlyData: Record<string, { month: string, investment: number, reinvestment: number }> = {}

        expenses.forEach(exp => {
            const date = new Date(exp.date)
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            const monthLabel = date.toLocaleDateString('es-CL', { month: 'short', year: '2-digit' })

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { month: monthLabel, investment: 0, reinvestment: 0 }
            }

            if (exp.tags && exp.tags.includes('Inversión')) {
                monthlyData[monthKey].investment += exp.amount
            } else if (exp.tags && exp.tags.includes('Reinversión')) {
                monthlyData[monthKey].reinvestment += exp.amount
            }
        })

        // Sort by key and convert to array
        const sortedData = Object.keys(monthlyData).sort().map(key => monthlyData[key])

        // If data is empty, provide some placeholders or empty array
        setData(sortedData.length > 0 ? sortedData : [])
        setLoading(false)
    }

    if (loading) return <div className="h-[300px] flex items-center justify-center text-slate-400">Cargando gráfico...</div>
    if (data.length === 0) return <div className="h-[300px] flex items-center justify-center text-slate-400">Sin datos de inversión registrados aún.</div>

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[400px] min-h-[400px]">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Crecimiento de Capital Histórico</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            tickFormatter={(val) => `$${val / 1000}k`}
                        />
                        <Tooltip
                            formatter={(value: any) => [`$${value.toLocaleString('es-CL')}`, '']}
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                        <Bar dataKey="investment" name="Inversión Externa" stackId="a" fill="#6366f1" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="reinvestment" name="Reinversión (Propia)" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
