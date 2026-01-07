import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { User, Activity, Clock } from 'lucide-react'

export default function AuditPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchLogs()
    }, [])

    const fetchLogs = async () => {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*, profiles(email)')
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) {
            console.error('Error fetching logs:', error)
        } else {
            setLogs(data || [])
        }
        setLoading(false)
    }

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-4xl mx-auto pb-24 bg-slate-50/50 min-h-screen">
            <header className="border-b pb-6">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Historial de Auditoría</h1>
                <p className="text-slate-500 font-medium">Control de acciones y trazabilidad de socios.</p>
            </header>

            <div className="space-y-4">
                {loading ? (
                    <p className="text-center py-10 text-slate-400 font-medium">Cargando bitácora...</p>
                ) : logs.length === 0 ? (
                    <Card className="p-12 text-center text-slate-400 italic">
                        No hay acciones registradas aún.
                    </Card>
                ) : (
                    logs.map((log) => (
                        <Card key={log.id} className="shadow-sm border-slate-200 overflow-hidden">
                            <CardContent className="p-4 flex items-start gap-4">
                                <div className={`p-2 rounded-lg ${log.action.includes('CREATE') ? 'bg-green-50 text-green-600' :
                                    log.action.includes('DELETE') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                    }`}>
                                    <Activity size={20} />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold text-slate-900">
                                            {formatAction(log.action)}
                                        </p>
                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                            <Clock size={10} />
                                            {new Date(log.created_at).toLocaleString('es-CL')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <User size={14} className="text-slate-400" />
                                        <span className="font-semibold">{log.profiles?.email?.split('@')[0] || 'Socio'}</span>
                                        <span>en tabla</span>
                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-600 uppercase">
                                            {log.table_name}
                                        </span>
                                    </div>
                                    {log.details && (
                                        <div className="mt-2 text-xs bg-slate-50 p-2 rounded border border-slate-100 text-slate-600">
                                            {JSON.stringify(log.details)}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}

function formatAction(action: string) {
    const map: Record<string, string> = {
        'CREATE_INCOME': 'Registro de Ingreso',
        'CREATE_EXPENSE': 'Registro de Gasto',
        'CREATE_ORDER': 'Creación de Pedido',
        'DELETE_INCOME': 'Eliminación de Ingreso',
        'DELETE_EXPENSE': 'Eliminación de Gasto',
        'DELETE_ORDER': 'Eliminación de Pedido'
    }
    return map[action] || action
}
