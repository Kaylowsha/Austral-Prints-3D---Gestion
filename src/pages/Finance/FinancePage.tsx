import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    ShoppingBag,
    Zap
} from 'lucide-react'
import IncomeDialog from './IncomeDialog'
import ExpenseDialog from './ExpenseDialog'
import { toast } from 'sonner'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie
} from 'recharts'

export default function FinancePage() {
    const [, setLoading] = useState(true)
    const [stats, setStats] = useState({
        income: 0,
        expenses: 0,
        profit: 0,
        margin: 0
    })
    const [categoryData, setCategoryData] = useState<any[]>([])
    const [dailyData, setDailyData] = useState<any[]>([])
    const [transactions, setTransactions] = useState<any[]>([])

    useEffect(() => {
        fetchDetailedStats()
    }, [])

    const fetchDetailedStats = async () => {
        setLoading(true)

        // 1. Fetch All Data with user profiles
        const { data: orders } = await supabase
            .from('orders')
            .select('*, products(name), profiles(email)')
            .gt('price', 0)

        const { data: expenses } = await supabase
            .from('expenses')
            .select('*, profiles(email)')

        const income = orders?.reduce((acc, curr) => acc + (curr.price || 0), 0) || 0
        const expense = expenses?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0
        const profit = income - expense
        const margin = income > 0 ? (profit / income) * 100 : 0

        setStats({ income, expenses: expense, profit, margin })

        // 2. Format Category Data for Pie Chart
        const categories: Record<string, number> = {}
        expenses?.forEach(e => {
            const cat = e.category || 'Otros'
            categories[cat] = (categories[cat] || 0) + (e.amount || 0)
        })

        const categoryArray = Object.keys(categories).map(name => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value: categories[name]
        }))
        setCategoryData(categoryArray)

        // 3. Format Daily Data for Bar Chart (Last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date()
            d.setDate(d.getDate() - (6 - i))
            return d.toISOString().split('T')[0]
        })

        const daily = last7Days.map(date => {
            const dayIncome = orders?.filter(o => o.created_at.startsWith(date))
                .reduce((acc, curr) => acc + (curr.price || 0), 0) || 0
            const dayExpense = expenses?.filter(e => e.date === date)
                .reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0

            return {
                name: new Date(date).toLocaleDateString('es-CL', { weekday: 'short' }),
                ingresos: dayIncome,
                gastos: dayExpense
            }
        })
        setDailyData(daily)

        // 4. Merge Transactions for the list
        const incomeItems = orders?.map(o => ({
            id: o.id,
            type: 'income',
            amount: o.price,
            description: o.description || (o.products as any)?.name || 'Venta',
            date: o.created_at,
            icon: TrendingUp,
            user_id: o.user_id,
            author: (o.profiles as any)?.email?.split('@')[0] || 'Socio'
        })) || []

        const expenseItems = expenses?.map(e => ({
            id: e.id,
            type: 'expense',
            amount: e.amount,
            description: e.description,
            date: e.date,
            icon: TrendingDown,
            user_id: e.user_id,
            author: (e.profiles as any)?.email?.split('@')[0] || 'Socio'
        })) || []

        const combined = [...incomeItems, ...expenseItems]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 20)

        setTransactions(combined)
        setLoading(false)
    }

    const deleteTransaction = async (id: string, type: 'income' | 'expense') => {
        if (!confirm('¿Seguro que quieres eliminar este registro?')) return

        try {
            const table = type === 'income' ? 'orders' : 'expenses'
            const { error } = await supabase.from(table).delete().eq('id', id)

            if (error) throw error

            toast.success('Registro eliminado')
            fetchDetailedStats()
        } catch (error: any) {
            toast.error('No tienes permiso o hubo un error', { description: error.message })
        }
    }

    const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6']

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto pb-24 bg-slate-50/50 min-h-screen">

            {/* Header Elaborado */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Centro Financiero</h1>
                    <p className="text-slate-500 font-medium">Análisis profundo de rentabilidad y flujos.</p>
                </div>
                <div className="flex items-center gap-3">
                    <IncomeDialog onSuccess={fetchDetailedStats} />
                    <div className="w-px h-8 bg-slate-200 hidden md:block" />
                    <ExpenseDialog onSuccess={fetchDetailedStats} />
                </div>
            </header>

            {/* Métricas de Alto Nivel */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Ingresos Totales"
                    value={`$${stats.income.toLocaleString('es-CL')}`}
                    trend=""
                    icon={<ArrowUpRight className="text-green-500" />}
                    subValue="Ventas brutas del periodo"
                />
                <MetricCard
                    title="Gastos Totales"
                    value={`$${stats.expenses.toLocaleString('es-CL')}`}
                    trend=""
                    icon={<ArrowDownRight className="text-red-500" />}
                    subValue="Costo de operación"
                />
                <MetricCard
                    title="Ganancia Neta"
                    value={`$${stats.profit.toLocaleString('es-CL')}`}
                    icon={<DollarSign className="text-indigo-500" />}
                    subValue="Dinero real en bolsillo"
                    highlight={true}
                />
                <MetricCard
                    title="Margen de Ganancia"
                    value={`${stats.margin.toFixed(1)}%`}
                    icon={<TrendingUp className="text-indigo-500" />}
                    subValue="Rentabilidad promedio"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Gráfico de Flujo Semanal (Más elaborado) */}
                <Card className="lg:col-span-2 shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Flujo de Caja (Últimos 7 días)</CardTitle>
                        <CardDescription>Comparativa diaria de entradas y salidas</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#f8fafc' }}
                                />
                                <Bar dataKey="ingresos" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Desglose de Gastos (Pie Chart) */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Gastos por Categoría</CardTitle>
                        <CardDescription>Distribución del capital saliente</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex flex-col items-center">
                        <ResponsiveContainer width="100%" height="80%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="w-full grid grid-cols-2 gap-2 mt-2">
                            {categoryData.map((c, i) => (
                                <div key={c.name} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    {c.name}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Lista de Transacciones de Alta Fidelidad */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Movimientos Recientes</h2>
                <Card className="border-slate-200 overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Descripción</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Socio</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Fecha</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Monto</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {transactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                                                        {t.type === 'income' ? <ShoppingBag size={18} /> : <Zap size={18} />}
                                                    </div>
                                                    <span className="font-semibold text-slate-700">{t.description}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full capitalize">
                                                    {t.author}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm text-slate-500">
                                                {new Date(t.date).toLocaleDateString('es-CL')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`font-bold ${t.type === 'income' ? 'text-indigo-600' : 'text-slate-900'}`}>
                                                    {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString('es-CL')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => deleteTransaction(t.id, t.type)}
                                                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                    title="Eliminar (Solo el autor)"
                                                >
                                                    <Zap size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {transactions.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No hay registros financieros suficientes.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function MetricCard({ title, value, trend, icon, subValue, highlight = false }: any) {
    return (
        <Card className={`border-none shadow-sm ${highlight ? 'bg-indigo-600 text-white' : 'bg-white'}`}>
            <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-xl ${highlight ? 'bg-white/20' : 'bg-slate-50'}`}>
                        {icon}
                    </div>
                    {trend && (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${highlight ? 'bg-white/20' : 'bg-green-50 text-green-600'}`}>
                            {trend}
                        </span>
                    )}
                </div>
                <div>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${highlight ? 'text-indigo-100' : 'text-slate-400'}`}>
                        {title}
                    </p>
                    <h4 className="text-2xl font-black mb-1">{value}</h4>
                    <p className={`text-[10px] ${highlight ? 'text-indigo-200' : 'text-slate-500'}`}>{subValue}</p>
                </div>
            </CardContent>
        </Card>
    )
}
