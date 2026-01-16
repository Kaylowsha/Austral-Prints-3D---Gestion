import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import OrderDialog from './OrderDialog'
import EditOrderDialog from './EditOrderDialog'
import ConfirmDialog from '@/components/ConfirmDialog'
import { XCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Define columns
const COLUMNS = [
    { id: 'pendiente', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'en_proceso', label: 'Imprimiendo', color: 'bg-blue-100 text-blue-800' },
    { id: 'terminado', label: 'Listo', color: 'bg-green-100 text-green-800' },
    { id: 'entregado', label: 'Entregado', color: 'bg-gray-100 text-gray-800' }
]

export default function KanbanBoard() {
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({})

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async (silent = false) => {
        if (!silent) setLoading(true)
        const { data, error } = await supabase
            .from('orders')
            .select(`
        *,
        products (name)
      `)
            .neq('status', 'cancelado') // Don't show cancelled for now
            .order('created_at', { ascending: false })

        if (!error && data) {
            setOrders(data)
        }
        if (!silent) setLoading(false)
    }

    const deductInventory = async (order: any) => {
        if (!order.product_id) return

        try {
            // 1. Get product weight
            const { data: product } = await supabase
                .from('products')
                .select('weight_grams')
                .eq('id', order.product_id)
                .maybeSingle()

            if (!product || product.weight_grams <= 0) return

            // 2. Determine which roll to deduct from
            let targetInventoryId = order.inventory_id
            if (!targetInventoryId) {
                const { data: firstFilament } = await supabase
                    .from('inventory')
                    .select('id')
                    .eq('type', 'Filamento')
                    .limit(1)
                    .maybeSingle()
                targetInventoryId = firstFilament?.id
            }

            if (!targetInventoryId) return

            // 3. Get current stock
            const { data: filament } = await supabase
                .from('inventory')
                .select('id, stock_grams')
                .eq('id', targetInventoryId)
                .maybeSingle()

            if (!filament) return

            // 4. Deduct weight (multiplied by quantity)
            const totalWeightDraft = product.weight_grams * (order.quantity || 1)
            const newStock = Math.max(0, (filament.stock_grams || 0) - totalWeightDraft)

            await supabase
                .from('inventory')
                .update({ stock_grams: newStock })
                .eq('id', targetInventoryId)

            toast.success(`Stock descontado: -${totalWeightDraft}g`)
        } catch (error: any) {
            console.error('Inventory deduction error:', error)
            toast.error('Error al descontar stock, pero el pedido se marcó como listo.')
        }
    }

    const updateStatus = async (orderId: string, newStatus: string) => {
        if (isUpdating[orderId]) return

        // 1. Snapshot the current orders for possible rollback
        const previousOrders = [...orders]
        const targetOrder = previousOrders.find(o => o.id === orderId)

        // 2. Optimistic update
        setIsUpdating(prev => ({ ...prev, [orderId]: true }))
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))

        try {
            console.log(`Updating order ${orderId} to ${newStatus}...`)

            // 3. Persist to DB (Simplified select to avoid 406/PGRST116 errors)
            const { error, data } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId)
                .select()

            if (error) throw error

            // 4. Critical check: Did we actually update a row?
            if (!data || data.length === 0) {
                console.error('Update matched 0 rows. Check RLS policies or if the ID exists.')
                throw new Error('No se pudo guardar el cambio en la base de datos (0 filas afectadas).')
            }

            // 5. Update the local state with the actual returned record
            const updatedRow = data[0];
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updatedRow } : o))

            // 6. Success Toast
            const colLabel = COLUMNS.find(c => c.id === newStatus)?.label || newStatus
            toast.success(`Pedido movido a ${colLabel}`)

            // 7. Inventory Deduction (Async, non-blocking for the UI move)
            if (newStatus === 'terminado' && targetOrder) {
                deductInventory({ ...targetOrder, status: newStatus })
            }

        } catch (error: any) {
            console.error('Update status error:', error)
            toast.error('Error de persistencia', {
                description: error.message || 'La base de datos rechazó el cambio.',
                duration: 5000
            })
            // 8. Rollback optimistic update ONLY on real failure
            setOrders(previousOrders)
        } finally {
            setIsUpdating(prev => ({ ...prev, [orderId]: false }))
        }
    }

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>

    return (
        <div className="h-full flex flex-col p-4 md:p-6 bg-slate-50 min-h-screen">
            <header className="mb-6 flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Tablero de Pedidos</h1>
                    <p className="text-slate-500 text-sm">Gestiona el flujo de trabajo</p>
                </div>
                <OrderDialog onSuccess={fetchOrders} />
            </header>

            {/* Desktop Kanban Grid */}
            <div className="hidden md:flex flex-1 overflow-x-auto text-slate-900">
                <div className="flex gap-4 min-w-[1000px] h-full pb-4">
                    {COLUMNS.map(col => (
                        <div key={col.id} className="flex-1 min-w-[250px] bg-slate-100/50 rounded-xl p-3 border border-slate-200 flex flex-col max-h-[70vh]">
                            <div className={`mb-3 px-3 py-2 rounded-lg font-semibold text-sm ${col.color} flex justify-between items-center`}>
                                {col.label}
                                <span className="bg-white/50 px-2 rounded-full text-xs">
                                    {orders.filter(o => o.status === col.id).length}
                                </span>
                            </div>

                            <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                                <OrdersList
                                    orders={orders.filter(o => o.status === col.id)}
                                    isUpdating={isUpdating}
                                    updateStatus={updateStatus}
                                    handleDeduct={deductInventory} // Passed as prop if needed, though ConfirmDialog is inline
                                    colId={col.id}
                                    fetchOrders={fetchOrders}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mobile Tabs View */}
            <div className="md:hidden flex-1 h-full min-h-0 flex flex-col">
                <Tabs defaultValue="pendiente" className="flex-1 flex flex-col min-h-0">
                    <TabsList className="grid w-full grid-cols-4 mb-2">
                        {COLUMNS.map(col => (
                            <TabsTrigger key={col.id} value={col.id} className="text-[10px] px-0.5 py-2">
                                {col.label.replace('Imprimiendo', 'Print').replace('Entregado', 'Fin')}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {COLUMNS.map(col => (
                        <TabsContent key={col.id} value={col.id} className="flex-1 overflow-y-auto min-h-0 pb-20">
                            <div className={`mb-3 px-3 py-2 rounded-lg font-semibold text-sm ${col.color} flex justify-between items-center sticky top-0 z-10 shadow-sm mx-1`}>
                                {col.label}
                                <span className="bg-white/50 px-2 rounded-full text-xs">
                                    {orders.filter(o => o.status === col.id).length}
                                </span>
                            </div>
                            <div className="space-y-3 px-1">
                                <OrdersList
                                    orders={orders.filter(o => o.status === col.id)}
                                    isUpdating={isUpdating}
                                    updateStatus={updateStatus}
                                    handleDeduct={deductInventory}
                                    colId={col.id}
                                    fetchOrders={fetchOrders}
                                />
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </div>
    )
}

// Extracted Component to avoid duplication
function OrdersList({ orders, isUpdating, updateStatus, colId, fetchOrders }: any) {
    if (orders.length === 0) {
        return (
            <div className="text-center py-10 text-slate-300 text-xs italic">
                Vacío
            </div>
        )
    }

    return (
        <>
            {orders.map((order: any) => (
                <Card key={order.id} className={`hover:shadow-md transition-all shadow-sm bg-white border-0 ${isUpdating[order.id] ? 'opacity-50 cursor-wait' : 'cursor-default'}`}>
                    <CardContent className="p-3 space-y-2">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <span className="font-black text-[10px] text-slate-800 uppercase leading-tight mb-1">
                                    {order.custom_client_name || order.clients?.full_name || 'Sin Cliente'}
                                </span>
                                <p className="font-semibold text-xs text-slate-500 line-clamp-2">
                                    {order.description || order.products?.name || 'Sin descripción'}
                                </p>
                            </div>
                            {(order.quantity > 1) && (
                                <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-indigo-100">
                                    x{order.quantity}
                                </span>
                            )}
                        </div>
                        <div className="flex justify-between items-end text-xs text-slate-400">
                            <div className="flex flex-col">
                                <span>{new Date(order.created_at).toLocaleDateString()}</span>
                                {order.deadline && (
                                    <span className="text-red-500 font-medium">Entrega: {new Date(order.deadline).toLocaleDateString()}</span>
                                )}
                            </div>
                            <span className="font-mono text-slate-600 font-bold">${((order.price || 0) * (order.quantity || 1)).toLocaleString() || 0}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 flex justify-between items-center gap-1">
                            <ConfirmDialog
                                title="¿Anular pedido?"
                                description="El pedido se marcará como cancelado y no aparecerá en el tablero."
                                onConfirm={() => updateStatus(order.id, 'cancelado')}
                                trigger={
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        disabled={isUpdating[order.id]}
                                        className="h-6 text-[10px] px-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50"
                                    >
                                        <XCircle size={12} className="mr-1" /> Anular
                                    </Button>
                                }
                            />

                            <EditOrderDialog order={order} onSuccess={fetchOrders} />

                            {colId !== 'entregado' && (
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={isUpdating[order.id]}
                                    className="h-6 text-[10px] px-2"
                                    onClick={() => {
                                        const COLUMNS = [
                                            { id: 'pendiente' },
                                            { id: 'en_proceso' },
                                            { id: 'terminado' },
                                            { id: 'entregado' }
                                        ]
                                        const nextIndex = COLUMNS.findIndex(c => c.id === colId) + 1
                                        if (nextIndex < COLUMNS.length) {
                                            updateStatus(order.id, COLUMNS[nextIndex].id)
                                        }
                                    }}
                                >
                                    {isUpdating[order.id] ? <Loader2 size={10} className="animate-spin mr-1" /> : 'Avanzar'}
                                    <ArrowRight size={10} className="ml-1" />
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </>
    )
}
