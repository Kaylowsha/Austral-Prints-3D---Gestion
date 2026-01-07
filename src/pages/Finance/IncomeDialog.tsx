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

interface IncomeDialogProps {
    onSuccess?: () => void
}

export default function IncomeDialog({ onSuccess }: IncomeDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [products, setProducts] = useState<any[]>([])

    const [formData, setFormData] = useState({
        product_id: '',
        description: '',
        price: '',
        quantity: '1' // Assuming 1 by default
    })

    // Fetch products when dialog opens
    useEffect(() => {
        if (open) {
            fetchProducts()
        }
    }, [open])

    const fetchProducts = async () => {
        const { data } = await supabase.from('products').select('*').order('name')
        if (data) setProducts(data)
    }

    const handleProductChange = (productId: string) => {
        const product = products.find(p => p.id === productId)
        if (product) {
            setFormData({
                ...formData,
                product_id: productId,
                description: product.name, // Auto-fill description
                price: product.base_price.toString() // Auto-fill price
            })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Calculate Cost
            const selectedProduct = products.find(p => p.id === formData.product_id)
            const weight = selectedProduct?.weight_grams || 0
            const estimatedCost = weight * 20

            // 1. Create the Order (Income)
            const { data, error } = await supabase.from('orders').insert([
                {
                    product_id: formData.product_id,
                    description: formData.description,
                    price: Number(formData.price),
                    cost: estimatedCost,
                    status: 'terminado', // Immediate income
                    created_at: new Date().toISOString()
                }
            ]).select()

            if (error) throw error

            // Log Audit Action
            if (data && data[0]) {
                await logAuditAction(
                    'CREATE_INCOME',
                    'orders',
                    data[0].id,
                    { price: formData.price, product: formData.description }
                )
            }

            toast.success('Ingreso registrado ®️')
            setOpen(false)
            setFormData({ product_id: '', description: '', price: '', quantity: '1' })
            if (onSuccess) onSuccess()

        } catch (error: any) {
            toast.error('Error al registrar ingreso', { description: error.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-32 flex flex-col gap-3 bg-white text-slate-900 border hover:bg-slate-50 shadow-sm" variant="outline">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <Plus size={24} />
                    </div>
                    <span className="font-semibold">Registrar<br />INGRESO</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Registrar Venta / Ingreso</DialogTitle>
                    <DialogDescription>
                        Selecciona el producto que vendiste.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">

                    <div className="grid gap-2">
                        <Label>Producto</Label>
                        <Select onValueChange={handleProductChange}>
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
                        <Label>Descripción (Opcional)</Label>
                        <Input
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Detalle extra..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Precio Venta</Label>
                            <Input
                                type="number"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                        {/* Quantity can be added later if schema supports it directly on orders line items, 
                 for now we assume 1 order = 1 item or lumped price */}
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading || !formData.product_id} className="bg-green-600 hover:bg-green-700">
                            {loading ? 'Guardando...' : 'Confirmar Ingreso'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
