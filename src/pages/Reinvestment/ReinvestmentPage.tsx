import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wallet, Camera, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import AcquisitionForm from './components/AcquisitionForm'
import CapitalGrowthChart from './components/CapitalGrowthChart'
import { supabase } from '@/lib/supabase'

export default function ReinvestmentPage() {
    const [stats, setStats] = useState({
        investment: 0,
        reinvestment: 0
    })
    const [history, setHistory] = useState<any[]>([])
    const [itemToEdit, setItemToEdit] = useState<any>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    useEffect(() => {
        fetchStats()
        fetchHistory()
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

    const fetchHistory = async () => {
        const { data } = await supabase
            .from('expenses')
            .select('*')
            .or('tags.cs.{Inversión},tags.cs.{Reinversión}')
            .order('date', { ascending: false })
            .limit(10)

        if (data) setHistory(data)
    }

    const handleSuccess = () => {
        setRefreshTrigger(prev => prev + 1)
    }

    const getEvidenceUrl = (path: string) => {
        const { data } = supabase.storage.from('evidence').getPublicUrl(path)
        return data.publicUrl
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
                <div key={refreshTrigger}>
                    <CapitalGrowthChart />
                </div>
            </div>

            {/* History Table */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b">
                    <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="text-indigo-500" size={20} />
                        Historial de Adquisiciones
                    </CardTitle>
                    <CardDescription>Últimos movimientos registrados de inversión y reinversión.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b">
                                    <th className="px-6 py-4 px-6">Fecha</th>
                                    <th className="px-6 py-4">Concepto</th>
                                    <th className="px-6 py-4">Tipo</th>
                                    <th className="px-6 py-4">Costo</th>
                                    <th className="px-6 py-4">Evidencia</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {history.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-500">
                                            {new Date(item.date).toLocaleDateString('es-CL')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-800">{item.description}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1">
                                                {item.tags?.map((tag: string) => (
                                                    <span
                                                        key={tag}
                                                        className={cn(
                                                            "text-[9px] font-black px-2 py-0.5 rounded uppercase",
                                                            tag === 'Reinversión' ? "bg-emerald-100 text-emerald-700" :
                                                                tag === 'Inversión' ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
                                                        )}
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-black text-slate-900">${item.amount.toLocaleString('es-CL')}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                {item.evidence_url ? (
                                                    <a
                                                        href={getEvidenceUrl(item.evidence_url)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                                                    >
                                                        <Camera size={14} /> Boleta
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-slate-300 italic">Sin boleta</span>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                    onClick={() => {
                                                        setItemToEdit(item)
                                                        setIsEditDialogOpen(true)
                                                    }}
                                                >
                                                    Editar
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {history.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                            No hay registros aún.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Modal de Edición */}
            <AcquisitionForm
                itemToEdit={itemToEdit}
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onSuccess={handleSuccess}
            />
        </div>
    )
}
