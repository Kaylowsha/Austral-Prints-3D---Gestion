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

interface OrderDialogProps {
    onSuccess?: () => void
}

export default function OrderDialog({ onSuccess }: OrderDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [products, setProducts] = useState<any[]>([])
    const [inventory, setInventory] = useState<any[]>([])

    const [formData, setFormData] = useState({
        product_id: '',
        inventory_id: '',
        description: '',
        price: '',
        deadline: ''
    })

    useEffect(() => {
        if (open) {
            fetchProducts()
            fetchInventory()
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

    const handleProductChange = (productId: string) => {
        const product = products.find(p => p.id === productId)
        if (product) {
            setFormData({
                ...formData,
                product_id: productId,
                description: product.name,
                price: product.base_price.toString()
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
            const estimatedCost = weight * 20 // $20 CLP per gram

            const { data, error } = await supabase.from('orders').insert([
                {
                    product_id: formData.product_id,
                    inventory_id: formData.inventory_id || null, // Link to specific filament
                    description: formData.description,
                    price: Number(formData.price),
                    cost: estimatedCost,
                    deadline: formData.deadline || null,
                    status: 'pendiente',
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
            setFormData({ product_id: '', inventory_id: '', description: '', price: '', deadline: '' })
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
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">

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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Precio Pactado</Label>
                            <Input
                                type="number"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Fecha Entrega</Label>
                            <Input
                                type="date"
                                value={formData.deadline}
                                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                            />
                        </div>
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
