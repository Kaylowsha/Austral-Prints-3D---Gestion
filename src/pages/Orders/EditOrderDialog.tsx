import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Pencil, Calculator } from 'lucide-react'
import { calculateQuotation, type QuotationParams } from '@/lib/quotation'

interface EditOrderDialogProps {
    order: any
    onSuccess?: () => void
}

export default function EditOrderDialog({ order, onSuccess }: EditOrderDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [inventory, setInventory] = useState<any[]>([])

    const [formData, setFormData] = useState({
        description: order.description || '',
        price: order.price?.toString() || '0',
        suggested_price: order.suggested_price?.toString() || '0',
        cost: order.cost?.toString() || '0',
        quantity: order.quantity?.toString() || '1',
        deadline: order.deadline || '',
        inventory_id: order.inventory_id || '',
        // Technical fields
        grams: order.quoted_grams || 0,
        hours: order.quoted_hours || 0,
        mins: order.quoted_mins || 0,
        power: order.quoted_power_watts || 100,
        opMult: order.quoted_op_multiplier || 1.5,
        salesMult: order.quoted_sales_multiplier || 3.0,
        matPrice: order.quoted_material_price || 15000
    })

    useEffect(() => {
        if (open) {
            fetchInventory()
        }
    }, [open])

    const fetchInventory = async () => {
        const { data } = await supabase
            .from('inventory')
            .select('*')
            .eq('type', 'Filamento')
            .order('name')
        if (data) setInventory(data)
    }

    const handleRecalculate = () => {
        const params: QuotationParams = {
            grams: Number(formData.grams),
            hours: Number(formData.hours),
            minutes: Number(formData.mins),
            materialPricePerKg: Number(formData.matPrice),
            electricityCostPerKwh: 50, // Should ideally be dynamic or stored in order
            printerPowerWatts: Number(formData.power),
            opMultiplier: Number(formData.opMult),
            salesMultiplier: Number(formData.salesMult)
        }
        const results = calculateQuotation(params)
        setFormData({
            ...formData,
            suggested_price: results.finalPrice.toFixed(0),
            // No cambiamos el precio 'price' (cobrado) automáticamente para no sobreescribir decisiones del usuario,
            // pero le damos el dato para que él lo ajuste si quiere.
            cost: results.totalOperationalCost.toFixed(0)
        })
        toast.info(`Nuevo sugerido técnico: $${results.finalPrice.toLocaleString()}`)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase
                .from('orders')
                .update({
                    description: formData.description,
                    price: Number(formData.price),
                    suggested_price: Number(formData.suggested_price),
                    cost: Number(formData.cost),
                    quantity: Number(formData.quantity),
                    deadline: formData.deadline || null,
                    inventory_id: formData.inventory_id || null,
                    quoted_grams: Number(formData.grams),
                    quoted_hours: Number(formData.hours),
                    quoted_mins: Number(formData.mins),
                    quoted_power_watts: Number(formData.power),
                    quoted_op_multiplier: Number(formData.opMult),
                    quoted_sales_multiplier: Number(formData.salesMult),
                    quoted_material_price: Number(formData.matPrice)
                })
                .eq('id', order.id)

            if (error) throw error

            toast.success('Pedido actualizado')
            setOpen(false)
            if (onSuccess) onSuccess()
        } catch (error: any) {
            toast.error('Error al actualizar', { description: error.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-slate-400 hover:text-indigo-600">
                    <Pencil size={12} className="mr-1" /> Editar
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Pedido</DialogTitle>
                    <DialogDescription>Ajusta los parámetros técnicos y comerciales.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-6 py-4">

                    <div className="grid gap-2">
                        <Label>Descripción / Cliente</Label>
                        <Input
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Material (Opcional)</Label>
                        <Select onValueChange={(val) => setFormData({ ...formData, inventory_id: val })} value={formData.inventory_id}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona el material..." />
                            </SelectTrigger>
                            <SelectContent>
                                {inventory.map(item => (
                                    <SelectItem key={item.id} value={item.id}>
                                        {item.brand} - {item.color} ({item.stock_grams}g)
                                    </SelectItem>
                                ))}
                                {inventory.length === 0 && (
                                    <SelectItem value="none" disabled>No hay materiales disponibles</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-y py-4 bg-slate-50 p-4 rounded-xl">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Base Técnica</h4>
                            <div className="grid gap-2">
                                <Label className="text-[11px]">Peso (gramos)</Label>
                                <Input type="number" value={formData.grams} onChange={e => setFormData({ ...formData, grams: Number(e.target.value) })} />
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Label className="text-[11px]">Horas</Label>
                                    <Input type="number" value={formData.hours} onChange={e => setFormData({ ...formData, hours: Number(e.target.value) })} />
                                </div>
                                <div className="flex-1">
                                    <Label className="text-[11px]">Mins</Label>
                                    <Input type="number" value={formData.mins} onChange={e => setFormData({ ...formData, mins: Number(e.target.value) })} />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pricing</h4>
                            <div className="grid gap-2">
                                <Label className="text-[11px]">Multiplicador Op (1.5)</Label>
                                <Input type="number" step="0.1" value={formData.opMult} onChange={e => setFormData({ ...formData, opMult: Number(e.target.value) })} />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-[11px]">Multiplicador Venta (3.0)</Label>
                                <Input type="number" step="0.1" value={formData.salesMult} onChange={e => setFormData({ ...formData, salesMult: Number(e.target.value) })} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center gap-4">
                        <div className="flex-1">
                            <Label>Precio Final Cobrado ($)</Label>
                            <Input
                                type="number"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                className="text-xl font-black text-indigo-600"
                            />
                        </div>
                        <div className="flex-1">
                            <Label>Precio Sugerido (App) ($)</Label>
                            <Input
                                type="number"
                                value={formData.suggested_price}
                                onChange={e => setFormData({ ...formData, suggested_price: e.target.value })}
                                className="text-xl font-bold text-slate-400 bg-slate-50"
                            />
                        </div>
                        <Button type="button" variant="outline" onClick={handleRecalculate} className="mt-6 gap-2 border-dashed">
                            <Calculator size={16} /> Recalcular
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Cantidad</Label>
                            <Input type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Fecha Entrega</Label>
                            <Input type="date" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full bg-indigo-600">
                            {loading ? 'Actualizando...' : 'Guardar Cambios'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
