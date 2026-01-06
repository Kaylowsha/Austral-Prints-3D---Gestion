import { useState } from 'react'
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

interface ProductFormProps {
    onSuccess: () => void
}

export default function ProductForm({ onSuccess }: ProductFormProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState({
        name: '',
        base_price: '',
        weight_grams: '',
        print_time_mins: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase.from('products').insert([
                {
                    name: data.name,
                    base_price: Number(data.base_price) || 0,
                    weight_grams: Number(data.weight_grams) || 0,
                    print_time_mins: Number(data.print_time_mins) || 0
                }
            ])

            if (error) throw error

            toast.success('Producto creado exitosamente')
            setOpen(false)
            setData({ name: '', base_price: '', weight_grams: '', print_time_mins: '' })
            onSuccess()
        } catch (error: any) {
            toast.error('Error al crear producto', { description: error.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <Plus size={20} />
                    Nuevo
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nuevo Producto</DialogTitle>
                    <DialogDescription>
                        Agrega un nuevo modelo a tu catálogo de impresiones.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Nombre
                        </Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData({ ...data, name: e.target.value })}
                            className="col-span-3"
                            placeholder="Ej: Soporte Audífonos"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">
                            Precio Base
                        </Label>
                        <Input
                            id="price"
                            type="number"
                            value={data.base_price}
                            onChange={(e) => setData({ ...data, base_price: e.target.value })}
                            className="col-span-3"
                            placeholder="5000"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="weight" className="text-right">
                            Peso (g)
                        </Label>
                        <Input
                            id="weight"
                            type="number"
                            value={data.weight_grams}
                            onChange={(e) => setData({ ...data, weight_grams: e.target.value })}
                            className="col-span-3"
                            placeholder="Ej: 45"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="time" className="text-right">
                            Tiempo (min)
                        </Label>
                        <Input
                            id="time"
                            type="number"
                            value={data.print_time_mins}
                            onChange={(e) => setData({ ...data, print_time_mins: e.target.value })}
                            className="col-span-3"
                            placeholder="Ej: 120"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Producto'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
