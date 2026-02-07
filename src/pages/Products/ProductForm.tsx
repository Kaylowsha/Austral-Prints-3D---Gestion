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
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import AdditionalCostsInput, { type AdditionalCost } from '@/components/AdditionalCostsInput'
import { InventoryItemSelector, type InventoryItemSelection } from '@/components/InventoryItemSelector'

interface ProductFormProps {
    onSuccess: () => void
    product?: any
    trigger?: React.ReactNode
}

export default function ProductForm({ onSuccess, product, trigger }: ProductFormProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState({
        name: '',
        base_price: '',
        weight_grams: '',
        print_time_mins: '',
        additional_costs: [] as AdditionalCost[],
        inventory_items: [] as InventoryItemSelection[]
    })

    useEffect(() => {
        if (product && open) {
            setData({
                name: product.name || '',
                base_price: product.base_price?.toString() || '',
                weight_grams: product.weight_grams?.toString() || '',
                print_time_mins: product.print_time_mins?.toString() || '',
                additional_costs: product.additional_costs || [],
                inventory_items: product.inventory_items || []
            })
        }
    }, [product, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const payload = {
            name: data.name,
            base_price: Number(data.base_price) || 0,
            weight_grams: Number(data.weight_grams) || 0,
            print_time_mins: Number(data.print_time_mins) || 0,
            additional_costs: data.additional_costs,
            inventory_items: data.inventory_items
        }

        try {
            let error
            if (product?.id) {
                const { error: updateError } = await supabase
                    .from('products')
                    .update(payload)
                    .eq('id', product.id)
                error = updateError
            } else {
                const { error: insertError } = await supabase
                    .from('products')
                    .insert([payload])
                error = insertError
            }

            if (error) throw error

            toast.success(product ? 'Producto actualizado' : 'Producto creado')
            setOpen(false)
            if (!product) {
                setData({ name: '', base_price: '', weight_grams: '', print_time_mins: '', additional_costs: [], inventory_items: [] })
            }
            onSuccess()
        } catch (error: any) {
            toast.error('Error al guardar producto', { description: error.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                        <Plus size={20} />
                        Nuevo
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{product ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
                    <DialogDescription>
                        {product ? 'Actualiza los detalles de este producto.' : 'Agrega un nuevo modelo a tu catálogo de impresiones.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">
                            Nombre
                        </Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData({ ...data, name: e.target.value })}
                            placeholder="Ej: Soporte Audífonos"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="price">
                                Precio Base
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                value={data.base_price}
                                onChange={(e) => setData({ ...data, base_price: e.target.value })}
                                placeholder="5000"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="weight">
                                Peso (g)
                            </Label>
                            <Input
                                id="weight"
                                type="number"
                                value={data.weight_grams}
                                onChange={(e) => setData({ ...data, weight_grams: e.target.value })}
                                placeholder="Ej: 45"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="time">
                                Tiempo (min)
                            </Label>
                            <Input
                                id="time"
                                type="number"
                                value={data.print_time_mins}
                                onChange={(e) => setData({ ...data, print_time_mins: e.target.value })}
                                placeholder="Ej: 120"
                            />
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <Label className="mb-2 block font-bold text-slate-700">Insumos de Inventario (Unidades)</Label>
                        <InventoryItemSelector
                            value={data.inventory_items}
                            onChange={(items) => setData({ ...data, inventory_items: items })}
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                            Estos ítems se descontarán del stock al completar un pedido.
                        </p>
                    </div>

                    <div className="border-t pt-4">
                        <Label className="mb-2 block font-bold text-slate-700">Costos Adicionales (Otros)</Label>
                        <AdditionalCostsInput
                            costs={data.additional_costs}
                            onChange={(costs) => setData({ ...data, additional_costs: costs })}
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                            Costos extras como pintura, lijado manual, etc.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : product ? 'Actualizar' : 'Guardar Producto'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
