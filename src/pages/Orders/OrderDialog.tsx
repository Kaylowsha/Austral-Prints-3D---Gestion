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
import { logAuditAction } from '@/lib/audit'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import TagSelector from '@/components/TagSelector'
import AdditionalCostsInput, { type AdditionalCost } from '@/components/AdditionalCostsInput'
import { InventoryItemSelector, type InventoryItemSelection } from '@/components/InventoryItemSelector'

interface OrderDialogProps {
    onSuccess?: () => void
}

export default function OrderDialog({ onSuccess }: OrderDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [products, setProducts] = useState<any[]>([])
    const [inventory, setInventory] = useState<any[]>([])
    const [clients, setClients] = useState<any[]>([])

    const [formData, setFormData] = useState({
        product_id: '',
        inventory_id: '',
        description: '',
        price: '',
        deadline: '',
        quantity: '1',
        tags: [] as string[],
        client_id: '',
        custom_client_name: '',
        useCustomClient: false,
        additional_costs: [] as AdditionalCost[],
        inventory_items: [] as InventoryItemSelection[]
    })

    useEffect(() => {
        if (open) {
            fetchProducts()
            fetchInventory()
            fetchClients()
        }
    }, [open])

    const fetchProducts = async () => {
        const { data } = await supabase.from('products').select('*').order('name')
        if (data) setProducts(data)
    }

    const fetchInventory = async () => {
        const { data } = await supabase
            .from('inventory')
            .select('*')
            .eq('type', 'Filamento')
            .gt('stock_grams', 0)
            .order('name')
        if (data) setInventory(data)
    }

    const fetchClients = async () => {
        const { data } = await supabase.from('clients').select('*').order('full_name')
        if (data) setClients(data)
    }

    const handleProductChange = (productId: string) => {
        const product = products.find(p => p.id === productId)
        if (product) {
            setFormData({
                ...formData,
                product_id: productId,
                description: product.name,
                price: product.base_price.toString(),
                additional_costs: product.additional_costs || [],
                inventory_items: product.inventory_items || []
            })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Calculate Cost based on product weight
            const selectedProduct = products.find(p => p.id === formData.product_id)
            const weight = selectedProduct?.weight_grams || 0
            const hours = selectedProduct?.estimated_hours || 0
            const mins = selectedProduct?.estimated_mins || 0
            const materialPrice = 15000 // Default material price if not specified


            const estimatedCost = (weight * (materialPrice / 1000))
            // itemsCost is NOT added here because it is stored in inventory_items 
            // and added dynamically in FinancePage via getAdditionalCostsTotal

            const { data, error } = await supabase.from('orders').insert([
                {
                    product_id: formData.product_id,
                    client_id: formData.useCustomClient ? null : formData.client_id || null,
                    custom_client_name: formData.useCustomClient ? formData.custom_client_name : null,
                    inventory_id: formData.inventory_id || null, // Link to specific filament
                    description: formData.description,
                    price: Number(formData.price),
                    cost: estimatedCost * Number(formData.quantity || 1),
                    quantity: Number(formData.quantity || 1),
                    deadline: formData.deadline || null,
                    status: 'pendiente',
                    date: new Date().toISOString().split('T')[0],
                    tags: formData.tags,
                    quoted_grams: weight,
                    quoted_hours: hours,
                    quoted_mins: mins,
                    quoted_material_price: materialPrice,
                    additional_costs: formData.additional_costs,
                    inventory_items: formData.inventory_items,
                    created_at: new Date().toISOString()
                }
            ]).select()

            if (error) throw error

            if (data && data[0]) {
                await logAuditAction(
                    'CREATE_ORDER',
                    'orders',
                    data[0].id,
                    { price: formData.price, product: formData.description }
                )
            }

            toast.success('Pedido registrado')
            setOpen(false)
            setFormData({
                product_id: '',
                inventory_id: '',
                description: '',
                price: '',
                deadline: '',
                quantity: '1',
                tags: [],
                client_id: '',
                custom_client_name: '',
                useCustomClient: false,
                additional_costs: [],
                inventory_items: []
            })
            if (onSuccess) onSuccess()

        } catch (error: any) {
            toast.error('Error al registrar pedido', { description: error.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <Plus size={20} />
                    Nuevo Pedido
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nuevo Pedido</DialogTitle>
                    <DialogDescription>
                        Registra un nuevo encargo vinculándolo a un material.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4 max-h-[80vh] overflow-y-auto pr-2">

                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label>Cliente</Label>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, useCustomClient: !formData.useCustomClient })}
                                className="text-[10px] font-bold text-indigo-600 uppercase hover:underline"
                            >
                                {formData.useCustomClient ? 'Elegir registrado' : 'Ingresar manual'}
                            </button>
                        </div>
                        {formData.useCustomClient ? (
                            <Input
                                placeholder="Nombre completo del cliente..."
                                value={formData.custom_client_name}
                                onChange={e => setFormData({ ...formData, custom_client_name: e.target.value })}
                            />
                        ) : (
                            <Select onValueChange={(val) => setFormData({ ...formData, client_id: val })} value={formData.client_id}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar cliente registrado..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                                    ))}
                                    {clients.length === 0 && (
                                        <SelectItem value="none" disabled>No hay clientes registrados</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label>Producto</Label>
                        <Select onValueChange={handleProductChange} value={formData.product_id}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un producto..." />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name} (${p.base_price})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Material (Color/Rollo)</Label>
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
                                    <SelectItem value="none" disabled>No hay materiales con stock</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Descripción / Notas</Label>
                        <Input
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Ej: Llavero personalizado"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label>Cant.</Label>
                            <Input
                                type="number"
                                min="1"
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2 col-span-2">
                            <Label>Precio Pactado (Unitario)</Label>
                            <Input
                                type="number"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Insumos (Cadenas, Argollas, etc)</Label>
                        <InventoryItemSelector
                            value={formData.inventory_items}
                            onChange={(items) => setFormData({ ...formData, inventory_items: items })}
                        />
                    </div>

                    <div className="grid gap-2">
                        <AdditionalCostsInput
                            costs={formData.additional_costs}
                            onChange={(costs) => setFormData({ ...formData, additional_costs: costs })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Fecha Entrega</Label>
                            <Input
                                type="date"
                                value={formData.deadline}
                                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                            />
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-dashed border-slate-200 flex flex-col justify-center items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Estimado</span>
                            <span className="text-lg font-black text-indigo-600">
                                ${((Number(formData.price || 0) * Number(formData.quantity || 1)) + formData.additional_costs.reduce((sum, c) => sum + c.amount, 0)).toLocaleString('es-CL')}
                            </span>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Etiquetas</Label>
                        <TagSelector
                            selectedTags={formData.tags}
                            onChange={(tags) => setFormData({ ...formData, tags })}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading || !formData.product_id} className="w-full">
                            {loading ? 'Guardando...' : 'Crear Pedido'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
