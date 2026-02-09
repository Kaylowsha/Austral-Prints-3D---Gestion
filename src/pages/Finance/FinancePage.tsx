import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import {
    ArrowUpRight, ArrowDownRight, ShoppingBag, DollarSign, TrendingUp, Zap,
    LineChart as LineChartIcon, PieChart as PieChartIcon, BarChart3, Filter,
    User, Tag, Package, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import IncomeDialog from './IncomeDialog'
import ExpenseDialog from './ExpenseDialog'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area
} from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type Transaction, type Client, type FinanceStats } from '@/types/orders'
import { AssetsTab } from './AssetsTab'
import TagManagerDialog from './TagManagerDialog'
import { calculateOrderTotal, getAdditionalCostsTotal } from '@/lib/orderUtils'
import { ProductionCostsTab } from './ProductionCostsTab'


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

export default function FinancePage() {
    const [, setLoading] = useState(true)
    const [stats, setStats] = useState<FinanceStats>({
        income: 0,
        expenses: 0,
        profit: 0,
        margin: 0,
        balance: 0,
        injections: 0,
        withdrawals: 0,
        inversions: 0,
        floating: 0,
        suggested_income: 0,
        production_cost: 0,
        material_cost: 0,
        energy_cost: 0,
        total_grams: 0,
        total_hours: 0
    })
    const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'month' | 'all'>('30d')
    const [categoryData, setCategoryData] = useState<any[]>([])
    const [dailyData, setDailyData] = useState<any[]>([])
    const [cumulativeData, setCumulativeData] = useState<any[]>([])
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [inventoryValue, setInventoryValue] = useState(0)
    const [clients, setClients] = useState<Client[]>([])
    const [products, setProducts] = useState<any[]>([])
    const [inventory, setInventory] = useState<any[]>([])

    // Filters State
    const [selectedClient, setSelectedClient] = useState<string>('all')
    const [selectedTag, setSelectedTag] = useState<string>('all')
    const [availableTags, setAvailableTags] = useState<string[]>([])

    useEffect(() => {
        fetchClients()
        fetchProducts()
        fetchInventory()
    }, [])

    useEffect(() => {
        fetchDetailedStats()
    }, [timeframe, selectedClient, selectedTag])



    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase.from('products').select('*').order('name')
            if (error) throw error
            if (data) setProducts(data)
        } catch (error: any) {
            console.error('Error fetching products:', error)
            toast.error('Error al cargar productos', { description: error.message })
        }
    }

    const fetchInventory = async () => {
        const { data } = await supabase.from('inventory').select('*')
        if (data) {
            setInventory(data)
            // Calculate Value
            const currentInventoryValue = data.reduce((acc, item) => {
                const kg = (item.stock_grams || 0) / 1000
                const price = item.price_per_kg || 0
                return acc + (kg * price)
            }, 0)
            setInventoryValue(currentInventoryValue)
        }
    }

    const fetchClients = async () => {
        const { data } = await supabase.from('clients').select('*').order('full_name')
        if (data) setClients(data)
    }

    const fetchDetailedStats = async () => {
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

        // 1. Fetch Data
        let ordersQuery = supabase.from('orders').select('*, products(name), profiles(email)')
        let expensesQuery = supabase.from('expenses').select('*, profiles(email)')

        if (startDate) {
            ordersQuery = ordersQuery.or(`date.gte.${startDate},created_at.gte.${startDate}`)
            expensesQuery = expensesQuery.gte('date', startDate)
        }

        if (selectedClient !== 'all') {
            ordersQuery = ordersQuery.eq('client_id', selectedClient)
            // Expenses don't usually have client_id, but if they did we'd filter here
        }

        if (selectedTag !== 'all') {
            ordersQuery = ordersQuery.contains('tags', [selectedTag])
            expensesQuery = expensesQuery.contains('tags', [selectedTag])
        }

        const { data: orders } = await ordersQuery
        const { data: expenses } = await expensesQuery

        // Extract and deduplicate tags for the filter dropdown
        const allTags = new Set<string>()
        orders?.forEach(o => o.tags?.forEach((t: string) => allTags.add(t)))
        expenses?.forEach(e => e.tags?.forEach((t: string) => allTags.add(t)))
        setAvailableTags(Array.from(allTags).sort())

        // Fetch Inventory for Valuation (Current Snapshot) & Analysis
        // Moved to standalone fetchInventory() called on mount

        // Fetch Products for Cost Analysis
        // Moved to standalone fetchProducts() called on mount

        // Separate Operational from Capital
        // Separación estricta: Solo 'entregado' es Ingreso Real.
        const realized_orders = orders?.filter(o => ['entregado'].includes(o.status)) || []

        // CORRECCIÓN LÓGICA (Matching Principle): 
        // Para calcular la utilidad REAL, los costos directos solo deben restarse de lo que FINALMENTE SE VENDIÓ.
        // Si incluimos costos de 'en_proceso', estamos castigando la utilidad actual con costos futuros.
        const production_cost_orders = realized_orders; // Solo de lo entregado

        // Para métricas de carga de trabajo o "flotante", sí usamos todo lo pendiente
        const pending_orders = orders?.filter(o => ['pendiente', 'en_proceso', 'terminado'].includes(o.status)) || []

        // Realized Income: Products + Manual Sales (Anything that is NOT Capital Injection)
        const op_income = realized_orders
            .filter(o => o.product_id || o.description !== 'Inyección de Capital')
            .reduce((acc, curr) => acc + calculateOrderTotal(curr), 0) || 0

        const suggested_income = realized_orders
            .filter(o => o.product_id || o.description !== 'Inyección de Capital')
            .reduce((acc, curr) => acc + ((curr.suggested_price || curr.price || 0) * (curr.quantity || 1)) + getAdditionalCostsTotal(curr), 0) || 0

        // Floating: ALL pending orders are potential revenue (regardless of having a product_id or not)
        const floating = pending_orders
            .reduce((acc, curr) => acc + calculateOrderTotal(curr), 0) || 0

        const op_expenses = expenses?.filter(e => !['retiro', 'inversion'].includes(e.category)).reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0

        // Costo Real de Producción (Material + Energia de lo producido/en curso + Complementos)
        const realTotalCost = production_cost_orders.reduce((acc, curr) => acc + (curr.cost || 0) + getAdditionalCostsTotal(curr), 0) || 0

        // Desglose de Costos Directos
        const material_cost = production_cost_orders.reduce((acc, curr) => {
            // Si no tiene campos técnicos (pedidos antiguos o simples), asumimos que el 90% es material
            const plasticCost = curr.quoted_grams && curr.quoted_material_price
                ? (curr.quoted_grams * ((curr.quoted_material_price || 15000) / 1000) * (curr.quantity || 1))
                : ((curr.cost || 0) * 0.9);

            return acc + plasticCost + getAdditionalCostsTotal(curr);
        }, 0)

        const energy_cost = realTotalCost - material_cost

        const total_grams = production_cost_orders.reduce((acc, curr) => acc + (curr.quoted_grams || 0) * (curr.quantity || 1), 0)
        const total_hours = production_cost_orders.reduce((acc, curr) => {
            const h = curr.quoted_hours || 0
            const m = curr.quoted_mins || 0
            return acc + (h + m / 60) * (curr.quantity || 1)
        }, 0)

        // Injections: Only explicit Capital Injections
        const injections = realized_orders
            .filter(o => !o.product_id && o.description === 'Inyección de Capital')
            .reduce((acc, curr) => acc + calculateOrderTotal(curr), 0) || 0

        const inversions = expenses?.filter(e => e.category === 'inversion').reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0
        const withdrawals = expenses?.filter(e => e.category === 'retiro').reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0

        const profit = op_income - op_expenses - realTotalCost
        const margin = op_income > 0 ? (profit / op_income) * 100 : 0
        const balance = profit + injections - inversions - withdrawals

        setStats({
            income: op_income,
            expenses: op_expenses,
            profit,
            margin,
            balance,
            injections,
            withdrawals,
            inversions,
            floating,
            suggested_income,
            production_cost: realTotalCost,
            material_cost,
            energy_cost,
            total_grams,
            total_hours
        })

        // 2. Format Category Data (Operational only)
        const categories: Record<string, number> = {}
        expenses?.filter(e => !['retiro', 'inversion'].includes(e.category)).forEach(e => {
            const cat = e.category || 'Otros'
            categories[cat] = (categories[cat] || 0) + (e.amount || 0)
        })

        const categoryArray = Object.keys(categories).map(name => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value: categories[name]
        }))
        setCategoryData(categoryArray)

        // 3. Daily Data & Cumulative
        // 3. Daily Data & Cumulative
        // Determine Start Date for Timeline
        // Determine Start Date for Timeline
        let timelineStart = new Date()

        if (timeframe === '7d') {
            timelineStart.setDate(timelineStart.getDate() - 7)
        } else if (timeframe === '30d') {
            timelineStart.setDate(timelineStart.getDate() - 30)
        } else if (timeframe === 'month') {
            // First day of current month
            timelineStart = new Date(now.getFullYear(), now.getMonth(), 1)
        } else if (timeframe === 'all') {
            // Find min date from fetched orders/expenses
            const dates = [...(orders || []), ...(expenses || [])]
                .map(x => x.date || x.created_at)
                .filter(Boolean)

            if (dates.length > 0) {
                dates.sort() // ascending string sort works for ISO dates
                timelineStart = new Date(dates[0])
            } else {
                timelineStart.setDate(timelineStart.getDate() - 30) // fallback
            }
        }

        const timeline: string[] = []
        const d = new Date(timelineStart)
        const end = new Date()

        // Loop from start to today
        while (d <= end) {
            timeline.push(d.toISOString().split('T')[0])
            d.setDate(d.getDate() + 1)
        }

        // 2.5 Calculate Initial Values (before startDate)
        let initialBalance = 0
        let initialIngresos = 0
        let initialSugerido = 0
        let initialCosto = 0
        let initialCostoTotal = 0

        if (startDate) {
            // Fetch everything BEFORE startDate to set initial state
            // Note: This matches the filters (Client/Tag) to be consistent
            let prevOrdersQuery = supabase.from('orders').select('*').lt('date', startDate)
            let prevExpensesQuery = supabase.from('expenses').select('*').lt('date', startDate)

            if (selectedClient !== 'all') prevOrdersQuery = prevOrdersQuery.eq('client_id', selectedClient)
            if (selectedTag !== 'all') {
                prevOrdersQuery = prevOrdersQuery.contains('tags', [selectedTag])
                prevExpensesQuery = prevExpensesQuery.contains('tags', [selectedTag])
            }

            const { data: prevOrders } = await prevOrdersQuery
            const { data: prevExpenses } = await prevExpensesQuery

            // Re-calculating initialBalance strictly following daily logic:
            prevOrders?.forEach(o => {
                if (['entregado'].includes(o.status)) {
                    // Operational Income
                    if (o.product_id || o.description !== 'Inyección de Capital') {
                        initialBalance += calculateOrderTotal(o)
                    }
                    // Capital Injection
                    if (!o.product_id && o.description === 'Inyección de Capital') {
                        initialBalance += calculateOrderTotal(o)
                    }
                }
            })
            prevExpenses?.forEach(e => {
                initialBalance -= (e.amount || 0)
            })

            // Add operational income/cost to balance
            // Income
            prevOrders?.forEach(o => {
                if (['entregado'].includes(o.status) && (o.product_id || o.description !== 'Inyección de Capital')) {
                    initialBalance += calculateOrderTotal(o)
                }
            })
            // Costs? NO. Balance is Income - Expenses. 
            // In this strict cash flow view: Balance = (Sales + Injections) - (Expenses + Withdrawals + Inversions)
            // It does NOT subtract "Internal Production Cost" because that's not a cash outflow (technically material purchase is the outflow)
            // BUT, the chart shows "Balance en Caja".
            // If we follow the "Cash Flow" definition: initialBalance is correct as (Income - Expense).
            // However, the chart shows `balance` which in the code (line 331) subtracts `dayProdCost_Total`?!
            // Wait, line 305: dayNet = Income - OpExpense - ProdCost + Injections - Withdrawals.
            // Using "ProdCost" (Consumption) as a proxy for Cash Outflow is an approximation if we don't track raw material purchases.
            // If the user tracks "Expenses" (Category: Material), then subtracting ProdCost double counts!
            // Let's assume the user DOES NOT track material purchases as expenses, but relies on "Cost" to estimate outflow.

            // Re-calculating initialBalance strictly following daily logic:
            prevOrders?.forEach(o => {
                if (['entregado'].includes(o.status)) {
                    // Operational Income
                    if (o.product_id || o.description !== 'Inyección de Capital') {
                        initialBalance += calculateOrderTotal(o)
                    }
                    // Production Cost (Proxy for outflow)
                    if (o.status !== 'cancelado') {
                        initialBalance -= ((o.cost || 0) + getAdditionalCostsTotal(o))
                    }
                    // Capital Injection
                    if (!o.product_id && o.description === 'Inyección de Capital') {
                        initialBalance += calculateOrderTotal(o)
                    }
                }
            })
            prevExpenses?.forEach(e => {
                initialBalance -= (e.amount || 0)
            })
        }

        let runningBalance = initialBalance
        let accIngresos = initialIngresos
        let accSugerido = initialSugerido
        let accCosto = initialCosto // Directos (Puros)
        let accCostoTotal = initialCostoTotal // Directos + Adicionales

        const historyData = timeline.map(date => {
            // 1. Ingreso Real (Cobrado)
            const dayOpIncome = orders?.filter(o => (o.date || o.created_at).startsWith(date) && o.status === 'entregado' && (o.product_id || o.description !== 'Inyección de Capital'))
                .reduce((acc, curr) => acc + calculateOrderTotal(curr), 0) || 0

            // 2. Gastos Operativos (Compras, Servicios, etc.)
            const dayOpExpense = expenses?.filter(e => !['retiro', 'inversion'].includes(e.category) && e.date === date)
                .reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0

            // 3. Costos de Producción (Directos: Filamento + Energía)
            // Lógica Ajustada: Solo de lo entregado
            const dayProdCost_Pure = orders?.filter(o => (o.date || o.created_at).startsWith(date) && o.status === 'entregado' && o.status !== 'cancelado')
                .reduce((acc, curr) => acc + (curr.cost || 0), 0) || 0

            const dayAdditionalCost = orders?.filter(o => (o.date || o.created_at).startsWith(date) && o.status === 'entregado' && o.status !== 'cancelado')
                .reduce((acc, curr) => acc + getAdditionalCostsTotal(curr), 0) || 0

            // 4. Costo Total (Directo + Adicionales)
            const dayProdCost_Total = dayProdCost_Pure + dayAdditionalCost

            // Desglose Material vs Energía (Solo sobre el Costo Puro)
            const dayMaterialCost = orders?.filter(o => (o.date || o.created_at).startsWith(date) && o.status === 'entregado' && o.status !== 'cancelado')
                .reduce((acc, curr) => {
                    if (curr.quoted_grams && curr.quoted_material_price) {
                        return acc + ((curr.quoted_grams * (curr.quoted_material_price / 1000)) * (curr.quantity || 1))
                    }
                    return acc + ((curr.cost || 0) * 0.9)
                }, 0) || 0
            const dayEnergyCost = dayProdCost_Pure - dayMaterialCost

            // 5. Sugerido (Técnico + Adicionales)
            // Regla del usuario: (Costo Directo * 1.5) + Adicionales? 
            // O simplemente Sugerido Guardado + Adicionales.
            // Usaremos (Sugerido Guardado + Adicionales) para respetar lo que dice la App en el momento de crear el pedido.
            const dayOpSuggested = orders?.filter(o => (o.date || o.created_at).startsWith(date) && o.status === 'entregado' && (o.product_id || o.description !== 'Inyección de Capital'))
                .reduce((acc, curr) => acc + ((curr.suggested_price || curr.price || 0) * (curr.quantity || 1)) + getAdditionalCostsTotal(curr), 0) || 0


            // Movimientos de Capital
            const dayInjections = (realized_orders.filter(o => !o.product_id && o.description === 'Inyección de Capital' && (o.date || o.created_at).startsWith(date)).reduce((acc, curr) => acc + calculateOrderTotal(curr), 0) || 0) +
                (expenses?.filter(e => e.category === 'inversion' && e.date === date).reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0)

            const dayWithdrawals = expenses?.filter(e => e.category === 'retiro' && e.date === date)
                .reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0


            const dayNet = dayOpIncome - dayOpExpense - dayProdCost_Total + dayInjections - dayWithdrawals

            // Accumulate values
            runningBalance += dayNet
            accIngresos += dayOpIncome
            accSugerido += dayOpSuggested
            accCosto += dayProdCost_Pure
            accCostoTotal += dayProdCost_Total

            return {
                date,
                displayDate: new Date(date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }),
                ingresos: dayOpIncome,
                ingresos_acc: accIngresos,
                sugerido: dayOpSuggested,
                sugerido_acc: accSugerido,

                costo_directo: dayProdCost_Pure,
                costo_acc: accCosto, // Line 1: Solo Directos

                costo_total: dayProdCost_Total,
                costo_total_acc: accCostoTotal, // Line 2: Directos + Adicionales

                material_cost: dayMaterialCost,
                energy_cost: dayEnergyCost,
                gastos: dayOpExpense,
                balance: runningBalance,
                net: dayNet
            }
        })
        setDailyData(historyData)
        setCumulativeData(historyData)

        // 4. Transactions List
        const incomeItems = orders?.map(o => ({
            id: o.id,
            type: 'income' as const,
            category: (o.product_id || o.description !== 'Inyección de Capital') ? 'Venta' : 'Capital',
            amount: calculateOrderTotal(o),
            description: o.description || (o.products as any)?.name || 'Venta',
            date: o.date || o.created_at,
            author: (o.profiles as any)?.email?.split('@')[0] || 'Socio'
        })) || []

        const expenseItems = expenses?.map(e => ({
            id: e.id,
            type: 'expense' as const,
            category: e.category,
            amount: e.amount,
            description: e.description,
            date: e.date,
            author: (e.profiles as any)?.email?.split('@')[0] || 'Socio'
        })) || []

        const combined = [...incomeItems, ...expenseItems]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        setTransactions(combined)
        setLoading(false)
    }

    const deleteTransaction = async (id: string, type: Transaction['type']) => {
        if (!confirm('¿Seguro que quieres eliminar este registro?')) return

        try {
            const table = (type === 'income' || type === 'sale') ? 'orders' : 'expenses'
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
        <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto pb-24 bg-slate-50/50 min-h-screen">

            {/* Header Elaborado */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b pb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">PRO ANALYTICS</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Centro Financiero</h1>
                    <p className="text-slate-500 font-medium text-sm">Control de rentabilidad, flujo de caja e inversiones.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    {/* Timeframe Selector */}
                    <div className="flex bg-slate-200/50 p-1 rounded-xl gap-1 mr-2">
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

                    <IncomeDialog onSuccess={fetchDetailedStats} />
                    <ExpenseDialog onSuccess={fetchDetailedStats} />
                </div>
            </header>

            {/* Filtros Avanzados */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-slate-400 mr-2 border-r pr-4">
                    <Filter size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">Filtros</span>
                </div>

                <div className="flex flex-col gap-1.5 min-w-[200px]">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Cliente</Label>
                    <Select value={selectedClient} onValueChange={setSelectedClient}>
                        <SelectTrigger className="h-9 bg-slate-50 border-none text-xs font-bold">
                            <div className="flex items-center gap-2">
                                <User size={14} className="text-indigo-500" />
                                <SelectValue placeholder="Todos los clientes" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los clientes</SelectItem>
                            {clients.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-1.5 min-w-[200px] relative">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Etiqueta (Criterio)</Label>
                    <div className="flex items-center gap-2">
                        <Select value={selectedTag} onValueChange={setSelectedTag}>
                            <SelectTrigger className="h-9 bg-slate-50 border-none text-xs font-bold flex-1">
                                <div className="flex items-center gap-2">
                                    <Tag size={14} className="text-indigo-500" />
                                    <SelectValue placeholder="Todas las etiquetas" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las etiquetas</SelectItem>
                                {availableTags.map(tag => (
                                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <TagManagerDialog onSuccess={fetchDetailedStats} />
                    </div>
                </div>

                {
                    (selectedClient !== 'all' || selectedTag !== 'all') && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedClient('all'); setSelectedTag('all'); }}
                            className="mt-5 h-9 text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold text-xs gap-2"
                        >
                            <X size={14} /> Limpiar
                        </Button>
                    )
                }
            </div >

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-white border text-slate-500">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Resumen</TabsTrigger>
                    <TabsTrigger value="valuation" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Valuación</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8">

                    {/* Métricas de Alto Nivel */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            title="Ingresos Reales"
                            value={`$${stats.income.toLocaleString('es-CL')}`}
                            icon={<ArrowUpRight className="text-green-500" />}
                            subValue="Ventas entregadas/pagadas"
                        />
                        <MetricCard
                            title="Gastos Operativos"
                            value={`$${stats.expenses.toLocaleString('es-CL')}`}
                            icon={<ArrowDownRight className="text-rose-500" />}
                            subValue="Compras y gastos registrados"
                        />
                        <MetricCard
                            title="Costos Directos"
                            value={`$${stats.production_cost.toLocaleString('es-CL')}`}
                            icon={<Package className="text-pink-500" />}
                            subValue="Costo de material y energía"
                        />
                        <MetricCard
                            title="Ingresos Flotantes"
                            value={`$${stats.floating.toLocaleString('es-CL')}`}
                            icon={<Zap className="text-amber-500" />}
                            subValue="Ventas en curso/pendientes"
                        />
                        <MetricCard
                            title="Utilidad Neta"
                            value={`$${stats.profit.toLocaleString('es-CL')}`}
                            icon={<DollarSign className="text-white" />}
                            subValue="Rentabilidad real actual"
                            highlight={true}
                        />
                        <MetricCard
                            title="Balance en Caja"
                            value={`$${stats.balance.toLocaleString('es-CL')}`}
                            icon={<TrendingUp className="text-indigo-600" />}
                            subValue="Dinero líquido disponible"
                        />
                        <MetricCard
                            title="Diferencia Comercial"
                            value={`${stats.income >= stats.suggested_income ? '+' : ''}${(stats.income - stats.suggested_income).toLocaleString('es-CL')}`}
                            icon={<PieChartIcon className={stats.income >= stats.suggested_income ? 'text-emerald-500' : 'text-rose-500'} />}
                            subValue={stats.income >= stats.suggested_income ? 'Cobrando sobre el sugerido' : 'Cobrando bajo el sugerido'}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Gráfico de Balance Acumulado */}
                        <Card className="lg:col-span-2 shadow-sm border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <div>
                                    <CardTitle className="text-base font-bold">Crecimiento de Caja</CardTitle>
                                    <CardDescription>Flujo acumulado en el tiempo</CardDescription>
                                </div>
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <LineChartIcon size={20} />
                                </div>
                            </CardHeader>
                            <CardContent className="h-[250px] pr-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={cumulativeData}>
                                        <defs>
                                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="displayDate"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                                            interval={timeframe === '7d' ? 0 : 4}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Area type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Desglose de Gastos Operativos */}
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <div>
                                    <CardTitle className="text-base font-bold">Gastos por Categoría</CardTitle>
                                    <CardDescription>Distribución operativa</CardDescription>
                                </div>
                                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                                    <PieChartIcon size={20} />
                                </div>
                            </CardHeader>
                            <CardContent className="h-[250px] flex flex-col items-center">
                                <ResponsiveContainer width="100%" height="70%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
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
                                <div className="w-full space-y-2 mt-4">
                                    {categoryData.map((c: any, i: number) => (
                                        <div key={c.name} className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                {c.name}
                                            </div>
                                            <span className="text-slate-900">${c.value.toLocaleString('es-CL')}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Comparativa Sugerido vs Real */}
                        <Card className="shadow-sm border-slate-200 lg:col-span-1">
                            <CardHeader>
                                <CardTitle className="text-base font-bold">Rendimiento Comercial</CardTitle>
                                <CardDescription>Análisis de Brechas</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div style={{ width: '100%', height: 300, minHeight: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={dailyData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="displayDate"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                                tickFormatter={(val) => `$${val.toLocaleString('es-CL', { notation: "compact" })}`}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value: any) => [`$${Number(value).toLocaleString('es-CL')}`, '']}
                                                labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '12px' }}
                                            />
                                            <Legend verticalAlign="top" height={36} iconType="circle" />

                                            <Line
                                                type="monotone"
                                                dataKey="sugerido_acc"
                                                name="Sugerido (+Adic)"
                                                stroke="#6366f1" // Indigo
                                                strokeWidth={2}
                                                dot={false}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="ingresos_acc"
                                                name="Cobrado"
                                                stroke="#10b981" // Emerald
                                                strokeWidth={3}
                                                dot={{ r: 3, strokeWidth: 0, fill: '#10b981' }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="costo_acc"
                                                name="Costos Directos"
                                                stroke="#ec4899" // Pink
                                                strokeWidth={2}
                                                strokeDasharray="4 4"
                                                dot={false}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="costo_total_acc"
                                                name="Costos Totales (+Adic)"
                                                stroke="#f59e0b" // Amber
                                                strokeWidth={2}
                                                strokeDasharray="4 4"
                                                dot={false}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Gráfico Diario */}
                        <Card className="shadow-sm border-slate-200 lg:col-span-1">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <div>
                                    <CardTitle className="text-base font-bold">Tendencia</CardTitle>
                                    <CardDescription>Sugerido vs Real</CardDescription>
                                </div>
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <BarChart3 size={20} />
                                </div>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={dailyData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="displayDate"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                                            interval={timeframe === '7d' ? 0 : 4}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Legend verticalAlign="top" height={36} />
                                        <Line
                                            type="monotone"
                                            dataKey="sugerido"
                                            stroke="#94a3b8"
                                            strokeWidth={2}
                                            dot={false}
                                            name="Sugerido"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="ingresos"
                                            stroke="#6366f1"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#6366f1' }}
                                            activeDot={{ r: 6 }}
                                            name="Cobrado"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Ingresos vs Gastos Diarios */}
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <div>
                                    <CardTitle className="text-base font-bold">Actividad Diaria</CardTitle>
                                    <CardDescription>Ingresos vs Egresos</CardDescription>
                                </div>
                                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                                    <BarChart3 size={20} />
                                </div>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dailyData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="displayDate"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                                            interval={timeframe === '7d' ? 0 : 4}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="ingresos" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={timeframe === '7d' ? 12 : 8} />
                                        <Bar dataKey="gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={timeframe === '7d' ? 12 : 8} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Resumen de Capital */}
                        <Card className="shadow-sm border-indigo-100 bg-indigo-50/20">
                            <CardHeader>
                                <CardTitle className="text-base font-bold">Movimientos de Capital</CardTitle>
                                <CardDescription>Inyecciones y Retiros fuera de la operación</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-indigo-100 shadow-sm">
                                        <div className="p-2 bg-green-100 text-green-600 rounded-xl">
                                            <ArrowUpRight size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Inyectado</p>
                                            <p className="text-sm font-black text-slate-900">${stats.injections.toLocaleString('es-CL')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-indigo-100 shadow-sm">
                                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                                            <ArrowDownRight size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Invertido</p>
                                            <p className="text-sm font-black text-slate-900">${stats.inversions.toLocaleString('es-CL')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-indigo-100 shadow-sm">
                                        <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                                            <ArrowDownRight size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Retirado</p>
                                            <p className="text-sm font-black text-slate-900">${stats.withdrawals.toLocaleString('es-CL')}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <div className="flex justify-between text-xs font-bold text-slate-500 uppercase px-1">
                                        <span>Operación</span>
                                        <span className={stats.profit >= 0 ? 'text-green-600' : 'text-rose-600'}>
                                            {stats.profit >= 0 ? '+' : ''}${stats.profit.toLocaleString('es-CL')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold text-slate-500 uppercase px-1">
                                        <span>Capital Neto</span>
                                        <span className={stats.injections - stats.inversions - stats.withdrawals >= 0 ? 'text-indigo-600' : 'text-rose-600'}>
                                            {stats.injections - stats.inversions - stats.withdrawals >= 0 ? '+' : ''}${(stats.injections - stats.inversions - stats.withdrawals).toLocaleString('es-CL')}
                                        </span>
                                    </div>
                                    <div className="border-t pt-2 mt-2 flex justify-between text-sm font-black text-indigo-700 uppercase px-1">
                                        <span>Balance Final</span>
                                        <span>${stats.balance.toLocaleString('es-CL')}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Lista de Transacciones de Alta Fidelidad */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Movimientos Detallados</h2>
                            <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">Últimos registros</span>
                        </div>
                        <Card className="border-slate-200 overflow-hidden shadow-sm rounded-3xl">
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50/50 border-b">
                                            <tr>
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Concepto</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Fecha</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Monto</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {transactions.map((t) => (
                                                <tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className={cn(
                                                                "w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm",
                                                                t.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'
                                                            )}>
                                                                {t.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{t.description}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                                    {t.author}
                                                                </p>
                                                                {t.tags && t.tags.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {t.tags.map((tag: string) => (
                                                                            <span key={tag} className="text-[9px] font-bold bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                                <Tag size={8} /> {tag}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className={cn(
                                                            "text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest",
                                                            t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'
                                                        )}>
                                                            {t.category || t.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-center text-xs font-bold text-slate-500">
                                                        {new Date(t.date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <span className={cn(
                                                            "text-sm font-black",
                                                            t.type === 'income' ? 'text-green-600' : 'text-slate-900'
                                                        )}>
                                                            {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString('es-CL')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <button
                                                            onClick={() => deleteTransaction(t.id, t.type)}
                                                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-2 rounded-xl hover:bg-rose-50"
                                                            title="Eliminar registro"
                                                        >
                                                            <Zap size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {transactions.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-20 text-center">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                                                <ShoppingBag size={32} />
                                                            </div>
                                                            <p className="text-sm font-bold text-slate-400 italic">No se encontraron movimientos en este periodo.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="production-costs">
                    <ProductionCostsTab stats={stats} dailyData={dailyData} products={products} inventory={inventory} />
                </TabsContent>
                <TabsContent value="valuation">
                    <AssetsTab cashBalance={stats.balance} inventoryValue={inventoryValue} />
                </TabsContent>
            </Tabs>
        </div >
    )
}
