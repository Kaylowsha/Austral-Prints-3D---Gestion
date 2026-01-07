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
        balance: 0
    })
    const [history, setHistory] = useState<any[]>([])

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user)
        })
        fetchFinancials()
    }, [])

    const fetchFinancials = async () => {
        // 1. Fetch Orders (Incomes)
        const { data: orders } = await supabase
            .from('orders')
            .select('*')
            .gt('price', 0)
            .order('created_at', { ascending: false })
            .limit(10)

        // 2. Fetch Expenses
        const { data: expenses } = await supabase
            .from('expenses')
            .select('*')
            .order('date', { ascending: false })
            .limit(10)

        // Calculate Totals
        // Wait, I limited to 10 above. I need separate queries for Totals and for History.
        // Let's fix that.

        // Total Income Query
        const { data: allOrders } = await supabase.from('orders').select('price, cost').gt('price', 0)
        const realTotalIncome = allOrders?.reduce((acc, curr) => acc + (curr.price || 0), 0) || 0
        const realTotalCost = allOrders?.reduce((acc, curr) => acc + (curr.cost || 0), 0) || 0

        // Total Expenses Query
        const { data: allExpenses } = await supabase.from('expenses').select('amount')
        const realTotalExpenses = allExpenses?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0

        setFinancials({
            income: realTotalIncome,
            expenses: realTotalExpenses,
            balance: realTotalIncome - realTotalExpenses - realTotalCost
        })

        // Merge for History
        const incomeItems = orders?.map(o => ({
            id: o.id,
            type: 'income',
            amount: o.price,
            description: o.description || 'Venta',
            date: o.created_at,
            icon: TrendingUp
        })) || []

        const expenseItems = expenses?.map(e => ({
            id: e.id,
            type: 'expense',
            amount: e.amount,
            description: e.description || 'Gasto',
            date: e.date, // Note: date might be YYYY-MM-DD or ISO
            icon: TrendingDown
        })) || []

        const combined = [...incomeItems, ...expenseItems]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10) // Show last 10 movements

        setHistory(combined)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20"> {/* pb-20 for mobile nav if added later */}

            {/* Header */}
            <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Austral Prints 3D</h1>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500">
                    Salir
                </Button>
            </header>

            <main className="p-4 space-y-6 max-w-lg mx-auto">

                {/* Financial Overview Card */}
                <Card className="bg-slate-900 text-white border-none shadow-xl">
                    <CardContent className="p-6">
                        <p className="text-slate-400 text-sm font-medium mb-1">Balance Total</p>
                        <div className="text-4xl font-bold mb-6">
                            ${financials.balance.toLocaleString('es-CL')}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 p-3 rounded-lg">
                                <div className="flex items-center gap-2 text-green-400 mb-1">
                                    <TrendingUp size={16} />
                                    <span className="text-xs font-bold">INGRESOS</span>
                                </div>
                                <p className="text-lg font-semibold">${financials.income.toLocaleString('es-CL')}</p>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-lg">
                                <div className="flex items-center gap-2 text-red-400 mb-1">
                                    <TrendingDown size={16} />
                                    <span className="text-xs font-bold">GASTOS</span>
                                </div>
                                <p className="text-lg font-semibold">${financials.expenses.toLocaleString('es-CL')}</p>
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
