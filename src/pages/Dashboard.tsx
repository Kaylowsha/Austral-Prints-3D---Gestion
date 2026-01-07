import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { History, TrendingUp, TrendingDown } from 'lucide-react'
import IncomeDialog from './Finance/IncomeDialog'
import ExpenseDialog from './Finance/ExpenseDialog'

export default function Dashboard() {
    const [user, setUser] = useState<any>(null)
    const [financials, setFinancials] = useState({
        income: 0,
        expenses: 0,
        production_cost: 0,
        balance: 0
    })
    const [stock, setStock] = useState<any>(null)
    const [history, setHistory] = useState<any[]>([])

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user)
        })
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        await fetchFinancials()
        await fetchInventory()
    }

    const fetchInventory = async () => {
        const { data } = await supabase
            .from('inventory')
            .select('*')
            .eq('type', 'Filamento')
            .limit(1)
            .maybeSingle()
        if (data) setStock(data)
    }

    const fetchFinancials = async () => {
        // 1. Fetch Orders (Recent for history)
        const { data: orders } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10)

        // 2. Fetch Expenses (Recent for history)
        const { data: expenses } = await supabase
            .from('expenses')
            .select('*')
            .order('date', { ascending: false })
            .limit(10)

        // 3. Totals for cards
        const { data: allOrders } = await supabase.from('orders').select('price, cost').gt('price', 0)
        const realTotalIncome = allOrders?.reduce((acc, curr) => acc + (curr.price || 0), 0) || 0
        const realTotalCost = allOrders?.reduce((acc, curr) => acc + (curr.cost || 0), 0) || 0

        const { data: allExpenses } = await supabase.from('expenses').select('amount')
        const realTotalExpenses = allExpenses?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0

        setFinancials({
            income: realTotalIncome,
            expenses: realTotalExpenses,
            production_cost: realTotalCost,
            balance: realTotalIncome - realTotalExpenses - realTotalCost
        })

        // Merge for History
        const incomeItems = orders?.map(o => ({
            id: o.id,
            type: 'income',
            amount: o.price,
            description: o.description || 'Venta',
            date: o.date || o.created_at,
            icon: TrendingUp
        })) || []

        const expenseItems = expenses?.map(e => ({
            id: e.id,
            type: 'expense',
            amount: e.amount,
            description: e.description || 'Gasto',
            date: e.date,
            icon: TrendingDown
        })) || []

        const combined = [...incomeItems, ...expenseItems]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10)

        setHistory(combined)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Austral Prints 3D</h1>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{user?.email}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors">
                    Salir
                </Button>
            </header>

            <main className="p-4 space-y-6 max-w-lg mx-auto">

                {/* Main Balance Card */}
                <Card className="bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-500/20 transition-all" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Balance Neto Real</p>
                            {stock && (
                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${stock.stock_grams < 150 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-green-500/20 text-green-400'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${stock.stock_grams < 150 ? 'bg-red-400' : 'bg-green-400'}`} />
                                    {stock.stock_grams}g Stock
                                </div>
                            )}
                        </div>
                        <div className="text-5xl font-black mb-8 tracking-tighter">
                            ${financials.balance.toLocaleString('es-CL')}
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white/5 p-2 rounded-xl backdrop-blur-sm border border-white/5">
                                <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Ingresos</p>
                                <p className="text-sm font-bold text-green-400">${financials.income.toLocaleString('es-CL')}</p>
                            </div>
                            <div className="bg-white/5 p-2 rounded-xl backdrop-blur-sm border border-white/5">
                                <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Gastos</p>
                                <p className="text-sm font-bold text-slate-300">${financials.expenses.toLocaleString('es-CL')}</p>
                            </div>
                            <div className="bg-white/5 p-2 rounded-xl backdrop-blur-sm border border-white/5">
                                <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Costos</p>
                                <p className="text-sm font-bold text-rose-400">${financials.production_cost.toLocaleString('es-CL')}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Primary Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <IncomeDialog onSuccess={fetchFinancials} />
                    <ExpenseDialog onSuccess={fetchFinancials} />
                </div>

                {/* Secondary Actions / History */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <History size={20} />
                            Historial Reciente
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {history.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                No hay movimientos recientes
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {history.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                <item.icon size={16} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{item.description}</p>
                                                <p className="text-xs text-slate-500">
                                                    {new Date(item.date).toLocaleDateString('es-CL')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`font-bold text-sm ${item.type === 'income' ? 'text-green-600' : 'text-slate-900'}`}>
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
