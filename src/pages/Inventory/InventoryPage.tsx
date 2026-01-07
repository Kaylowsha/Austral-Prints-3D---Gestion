import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Package, Plus, Trash2, AlertTriangle, Droplets } from 'lucide-react'
import { toast } from 'sonner'

export default function InventoryPage() {
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        brand: '',
        color: '',
        material_type: 'PLA',
        stock_grams: ''
    })

    useEffect(() => {
        fetchInventory()
    }, [])

    const fetchInventory = async () => {
        setLoading(true)
        const { data } = await supabase.from('inventory').select('*').order('created_at', { ascending: false })
        if (data) setItems(data)
        setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const { error } = await supabase.from('inventory').insert([{
                ...formData,
                type: 'Filamento',
                stock_grams: Number(formData.stock_grams),
                status: Number(formData.stock_grams) < 150 ? 'bajo_stock' : 'disponible'
            }])
            if (error) throw error
            toast.success('Material agregado')
            setOpen(false)
            setFormData({ name: '', brand: '', color: '', material_type: 'PLA', stock_grams: '' })
            fetchInventory()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const deleteItem = async (id: string) => {
        if (!confirm('¿Eliminar este material?')) return
        await supabase.from('inventory').delete().eq('id', id)
        fetchInventory()
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 pb-24">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Inventario de Materiales</h1>
                    <p className="text-slate-500">Control de stock de filamentos y resinas.</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                            <Plus size={20} /> Nuevo Material
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Agregar Material</DialogTitle></DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                            <div className="grid gap-2">
                                <Label>Nombre del Rollo (Ej: PLA Premium)</Label>
                                <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Marca</Label>
                                    <Input value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Color</Label>
                                    <Input required value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Tipo</Label>
                                    <Input value={formData.material_type} onChange={e => setFormData({ ...formData, material_type: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Gramos Actuales</Label>
                                    <Input type="number" required value={formData.stock_grams} onChange={e => setFormData({ ...formData, stock_grams: e.target.value })} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full">Guardar</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(item => (
                    <Card key={item.id} className="overflow-hidden border-slate-200 relative group">
                        <div className={`absolute top-0 left-0 w-1 h-full ${item.stock_grams < 150 ? 'bg-red-500' : 'bg-indigo-500'}`} />
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{item.name}</h3>
                                        <p className="text-xs text-slate-500">{item.brand} • {item.material_type}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 size={16} />
                                </Button>
                            </div>

                            <div className="flex items-end justify-between mt-6">
                                <div>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <div className="w-3 h-3 rounded-full border border-slate-300 shadow-inner" style={{ backgroundColor: item.color?.toLowerCase() }} />
                                        <span className="text-sm font-bold text-slate-700 capitalize">{item.color}</span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-1">
                                        {item.stock_grams < 150 ? (
                                            <span className="flex items-center gap-1 text-[10px] font-black text-red-500 uppercase animate-pulse">
                                                <AlertTriangle size={10} /> Stock Crítico
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase">
                                                <Droplets size={10} /> Nivel Óptimo
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-slate-900 tracking-tighter">{item.stock_grams}g</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Disponibles</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {items.length === 0 && !loading && (
                <div className="text-center py-20 bg-slate-100/50 rounded-3xl border-2 border-dashed border-slate-200">
                    <Package className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-slate-500 font-medium">No tienes materiales registrados.</p>
                </div>
            )}
        </div>
    )
}
