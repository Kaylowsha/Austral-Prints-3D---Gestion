import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
    ShoppingBag,
    DollarSign,
    Calendar,
    Package,
    Loader2,
    Clock
} from 'lucide-react'

interface ClientDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    client: any
}

export default function ClientDetailsDialog({ open, onOpenChange, client }: ClientDetailsDialogProps) {
    const [loading, setLoading] = useState(false)
    const [orders, setOrders] = useState<any[]>([])
    const [stats, setStats] = useState({
        totalCharged: 0,
        directCost: 0,
        pendingPayment: 0,
        orderCount: 0
    })

    useEffect(() => {
        if (open && client?.id) {
            fetchClientHistory()
        }
    }, [open, client])

    const fetchClientHistory = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('orders')
                .select('*, products(name)')
                .eq('client_id', client.id)
                .order('created_at', { ascending: false })

            if (error) throw error

            const history = data || []
            setOrders(history)

            // Calculate Stats
            const deliveredOrders = history.filter(o => o.status === 'entregado')
            const pendingOrders = history.filter(o => ['pendiente', 'en_proceso', 'terminado'].includes(o.status))

            const charged = deliveredOrders.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0)
            const pending = pendingOrders.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0)
            const cost = history.filter(o => o.status !== 'cancelado').reduce((acc, curr) => acc + (curr.cost || 0), 0)

            setStats({
                totalCharged: charged,
                directCost: cost,
                pendingPayment: pending,
                orderCount: history.length
            })
        } catch (error) {
            console.error('Error fetching client history:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pendiente': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            case 'en_proceso': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'terminado': return 'bg-green-100 text-green-700 border-green-200'
            case 'entregado': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
            case 'cancelado': return 'bg-rose-100 text-rose-700 border-rose-200'
            default: return 'bg-slate-100 text-slate-700 border-slate-200'
        }
    }

    if (!client) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-200">
                            {client.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">{client.full_name}</DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium">
                                {client.email || 'Sin correo'} • {client.phone || 'Sin teléfono'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <MetricBox
                            label="Lo Cobrado"
                            value={`$${stats.totalCharged.toLocaleString('es-CL')}`}
                            icon={<DollarSign size={14} />}
                            color="text-emerald-600"
                        />
                        <MetricBox
                            label="Costo Directo"
                            value={`$${stats.directCost.toLocaleString('es-CL')}`}
                            icon={<Package size={14} />}
                            color="text-rose-600"
                        />
                        <MetricBox
                            label="Pendiente de Pago"
                            value={`$${stats.pendingPayment.toLocaleString('es-CL')}`}
                            icon={<Clock size={14} />}
                            color={stats.pendingPayment > 0 ? "text-amber-600" : "text-slate-400"}
                        />
                        <MetricBox
                            label="Pedidos"
                            value={stats.orderCount.toString()}
                            icon={<ShoppingBag size={14} />}
                        />
                    </div>

                    {/* Order History */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                            <Calendar size={14} /> Historial de Pedidos
                        </h3>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="animate-spin text-indigo-600" />
                            </div>
                        ) : orders.length > 0 ? (
                            <div className="space-y-2">
                                {orders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl transition-all hover:bg-white hover:shadow-sm group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="hidden sm:flex w-10 h-10 rounded-xl bg-white border border-slate-100 items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                                                <Package size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{order.description || order.products?.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    {new Date(order.created_at).toLocaleDateString('es-CL')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="font-black text-slate-900 text-sm">
                                                    ${(order.price * order.quantity).toLocaleString('es-CL')}
                                                </p>
                                                {order.quantity > 1 && (
                                                    <p className="text-[10px] text-slate-400 font-bold">x{order.quantity} un.</p>
                                                )}
                                            </div>
                                            <Badge variant="outline" className={`capitalize font-bold text-[10px] px-2 py-0 border-transparent shadow-none ${getStatusColor(order.status)}`}>
                                                {order.status.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                <p className="text-slate-400 font-medium italic">Este cliente aún no registra pedidos.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fin de Historial</p>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function MetricBox({ label, value, icon, color = "text-slate-600" }: any) {
    return (
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="flex items-center gap-1.5 mb-1 opacity-60">
                {icon}
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider leading-none">{label}</span>
            </div>
            <p className={`text-lg font-black tracking-tight ${color}`}>{value}</p>
        </div>
    )
}
