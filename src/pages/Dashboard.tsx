import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { History, TrendingUp, TrendingDown, Clock, AlertTriangle, Package, ShoppingCart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import IncomeDialog from './Finance/IncomeDialog'
import ExpenseDialog from './Finance/ExpenseDialog'
import { calculateOrderTotal, calculateFinanceStats } from '@/lib/orderUtils'
import { cn } from '@/lib/utils'

export default function Dashboard() {
    const navigate = useNavigate()
    const [user, setUser] = useState<any>(null)
    const [financials, setFinancials] = useState({
        income: 0,
        expenses: 0,
        production_cost: 0,
        balance: 0,
        floating: 0
    })
    const [urgentOrders, setUrgentOrders] = useState<any[]>([])
    const [lowStockItems, setLowStockItems] = useState<any[]>([])
    const [pendingCount, setPendingCount] = useState(0)
    const [history, setHistory] = useState<any[]>([])

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user)
        })
        fetchAll()
    }, [])

    const fetchAll = async () => {
        await Promise.all([
            fetchFinancials(),
            fetchUrgentOrders(),
            fetchLowStock()
        ])
    }

    const fetchUrgentOrders = async () => {
        const today = new Date().toISOString().split('T')[0]
        const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        // Orders with deadline in the next 3 days or overdue
        const { data: orders } = await supabase
            .from('orders')
            .select('*')
            .in('status', ['pendiente', 'en_proceso', 'terminado'])
            .not('deadline', 'is', null)
            .lte('deadline', inThreeDays)
            .order('deadline', { ascending: true })
            .limit(5)

        if (orders) {
            setUrgentOrders(orders.map(o => ({
                ...o,
                isOverdue: o.deadline < today
            })))
        }

        // Total pending count
        const { count } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .in('status', ['pendiente', 'en_proceso', 'terminado'])

        setPendingCount(count || 0)
    }

    const fetchLowStock = async () => {
        const { data } = await supabase
            .from('inventory')
            .select('*')
            .eq('type', 'Filamento')
            .lt('stock_grams', 200)
            .order('stock_grams', { ascending: true })

        if (data) setLowStockItems(data)
    }

    const fetchFinancials = async () => {
        const { data: allOrders } = await supabase.from('orders').select('*')
        const { data: allExpensesData } = await supabase.from('expenses').select('*')

        const stats = calculateFinanceStats(allOrders || [], allExpensesData || [])

        setFinancials({
            income: stats.income,
            expenses: stats.expenses,
            production_cost: stats.production_cost,
            balance: stats.balance,
            floating: stats.floating
        })

        // Build history
        const recentOrders = [...(allOrders || [])]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 10)

        const recentExpenses = [...(allExpensesData || [])]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10)

        const incomeItems = recentOrders.map(o => ({
            id: o.id,
            type: 'income',
            amount: calculateOrderTotal(o),
            description: o.description || 'Venta',
            status: o.status,
            date: o.date || o.created_at,
            icon: TrendingUp
        }))

        const expenseItems = recentExpenses.map(e => ({
            id: e.id,
            type: 'expense',
            amount: e.amount,
            description: e.description || 'Gasto',
            date: e.date,
            icon: TrendingDown
        }))

        const combined = [...incomeItems, ...expenseItems]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 8)

        setHistory(combined)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Austral Prints 3D</h1>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{user?.email}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors">
                    Salir
                </Button>
            </header>

            <main className="p-4 space-y-4 max-w-lg mx-auto">

                {/* Balance Card */}
                <Card className="bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
                    <CardContent className="p-5">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Balance Neto</p>
                        <div className="flex items-end justify-between mb-4">
                            <div className="text-4xl font-black tracking-tighter">
                                ${financials.balance.toLocaleString('es-CL')}
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-indigo-400 uppercase">Flotante</p>
                                <p className="text-lg font-black text-white">+${financials.floating.toLocaleString('es-CL')}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white/5 p-2 rounded-xl">
                                <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Ingresos</p>
                                <p className="text-xs font-bold text-green-400">${financials.income.toLocaleString('es-CL')}</p>
                            </div>
                            <div className="bg-white/5 p-2 rounded-xl">
                                <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Gastos</p>
                                <p className="text-xs font-bold text-slate-300">${financials.expenses.toLocaleString('es-CL')}</p>
                            </div>
                            <div className="bg-white/5 p-2 rounded-xl">
                                <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Costos</p>
                                <p className="text-xs font-bold text-rose-400">${financials.production_cost.toLocaleString('es-CL')}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <IncomeDialog onSuccess={fetchAll} />
                    <ExpenseDialog onSuccess={fetchAll} />
                </div>

                {/* Alerts Section */}
                {(urgentOrders.length > 0 || lowStockItems.length > 0) && (
                    <div className="space-y-3">
                        {/* Urgent Orders */}
                        {urgentOrders.length > 0 && (
                            <Card className="border-amber-200 bg-amber-50/50">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Clock size={16} className="text-amber-600" />
                                        <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Entregas Próximas</p>
                                    </div>
                                    <div className="space-y-2">
                                        {urgentOrders.map(order => (
                                            <button
                                                key={order.id}
                                                onClick={() => navigate('/orders')}
                                                className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-amber-100/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        order.isOverdue ? "bg-red-500 animate-pulse" : "bg-amber-500"
                                                    )} />
                                                    <span className="text-sm font-medium text-slate-800 truncate max-w-[160px]">
                                                        {order.description || 'Pedido'}
                                                    </span>
                                                </div>
                                                <span className={cn(
                                                    "text-xs font-bold",
                                                    order.isOverdue ? "text-red-600" : "text-amber-600"
                                                )}>
                                                    {order.isOverdue ? 'Vencido' : new Date(order.deadline).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Low Stock Alert */}
                        {lowStockItems.length > 0 && (
                            <Card className="border-red-200 bg-red-50/50">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <AlertTriangle size={16} className="text-red-600" />
                                        <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Stock Bajo</p>
                                    </div>
                                    <div className="space-y-2">
                                        {lowStockItems.map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => navigate('/inventory')}
                                                className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-red-100/50 transition-colors"
                                            >
                                                <span className="text-sm font-medium text-slate-800">
                                                    {item.brand} {item.color}
                                                </span>
                                                <span className={cn(
                                                    "text-xs font-bold px-2 py-0.5 rounded-full",
                                                    item.stock_grams === 0 ? "bg-red-200 text-red-700" : "bg-amber-200 text-amber-700"
                                                )}>
                                                    {item.stock_grams}g
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Quick Stats Bar */}
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/orders')}
                        className="flex-1 flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors"
                    >
                        <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <ShoppingCart size={16} className="text-indigo-600" />
                        </div>
                        <div className="text-left">
                            <p className="text-lg font-black text-slate-900">{pendingCount}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Pendientes</p>
                        </div>
                    </button>
                    <button
                        onClick={() => navigate('/inventory')}
                        className="flex-1 flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors"
                    >
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Package size={16} className="text-emerald-600" />
                        </div>
                        <div className="text-left">
                            <p className="text-lg font-black text-slate-900">{lowStockItems.length}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Stock Bajo</p>
                        </div>
                    </button>
                </div>

                {/* History */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <History size={16} />
                            Historial Reciente
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {history.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                No hay movimientos recientes
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {history.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-7 h-7 rounded-full flex items-center justify-center",
                                                item.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                            )}>
                                                <item.icon size={14} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-slate-800 truncate max-w-[180px]">{item.description}</p>
                                                <p className="text-[10px] text-slate-400">
                                                    {new Date(item.date).toLocaleDateString('es-CL')}
                                                    {item.status && <span className={cn(
                                                        "ml-2 uppercase font-bold",
                                                        item.status === 'entregado' ? 'text-green-500' :
                                                        item.status === 'cancelado' ? 'text-red-400' : 'text-indigo-400'
                                                    )}>({item.status})</span>}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "font-bold text-sm",
                                            item.status === 'cancelado' ? 'text-slate-300 line-through' :
                                            item.type === 'income' ? 'text-green-600' : 'text-slate-900'
                                        )}>
                                            {item.type === 'income' ? '+' : '-'}${item.amount.toLocaleString('es-CL')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

            </main>
        </div>
    )
}
