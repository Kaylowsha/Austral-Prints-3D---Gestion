import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Wallet } from 'lucide-react'
import AcquisitionForm from './components/AcquisitionForm'
import CapitalGrowthChart from './components/CapitalGrowthChart'
import { supabase } from '@/lib/supabase'

export default function ReinvestmentPage() {
    const [stats, setStats] = useState({
        investment: 0,
        reinvestment: 0
    })
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    useEffect(() => {
        fetchStats()
    }, [refreshTrigger])

    const fetchStats = async () => {
        const { data: expenses } = await supabase
            .from('expenses')
            .select('amount, tags')
            .or('tags.cs.{Inversión},tags.cs.{Reinversión}')

        if (expenses) {
            let inv = 0
            let reinv = 0
            expenses.forEach(exp => {
                if (exp.tags && exp.tags.includes('Inversión')) inv += exp.amount
                if (exp.tags && exp.tags.includes('Reinversión')) reinv += exp.amount
            })
            setStats({ investment: inv, reinvestment: reinv })
        }
    }

    const handleSuccess = () => {
        setRefreshTrigger(prev => prev + 1)
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-24 bg-slate-50/50 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Growth Engine</span>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Reinversión</h1>
                    </div>
                    <p className="text-slate-500 font-medium max-w-2xl">
                        Gestiona el crecimiento de tu capital. Registra adquisiciones y analiza cuánto del negocio se está construyendo con sus propias ganancias.
                    </p>
                </div>
                <AcquisitionForm onSuccess={handleSuccess} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-900 border-none text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Wallet size={120} />
                    </div>
                    <CardHeader className="relative z-10">
                        <CardDescription className="text-indigo-200 font-medium uppercase tracking-widest text-xs">Capital Propio vs Externo</CardDescription>
                        <CardTitle className="text-3xl font-black">Resumen de Capital</CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10 grid grid-cols-2 gap-8">
                        <div>
                            <p className="text-indigo-300 text-xs font-bold uppercase mb-1">Inversión Externa</p>
                            <p className="text-4xl font-black tracking-tight">${stats.investment.toLocaleString('es-CL')}</p>
                            <p className="text-[10px] text-slate-400 mt-1">Tu aporte personal</p>
                        </div>
                        <div>
                            <p className="text-emerald-300 text-xs font-bold uppercase mb-1">Reinversión (Propia)</p>
                            <p className="text-4xl font-black tracking-tight text-emerald-400">${stats.reinvestment.toLocaleString('es-CL')}</p>
                            <p className="text-[10px] text-emerald-600/70 mt-1">Generado por el negocio</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Growth Chart */}
                <div key={refreshTrigger}> {/* Force re-render on update */}
                    <CapitalGrowthChart />
                </div>
            </div>
        </div>
    )
}
