import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Package, Plus, Trash2, Droplets, Search, X, Pencil, DollarSign, Boxes } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import ConfirmDialog from '@/components/ConfirmDialog'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import TagSettingsTab from './TagSettingsTab'

export default function InventoryPage() {
    const [items, setItems] = useState<any[]>([])
    const [consumptionStats, setConsumptionStats] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        type: 'Filamento',
        brand: '',
        color: '',
        material_type: 'PLA',
        stock_grams: '',
        price_per_kg: '15000'
    })
    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState('Todos')
    const [itemToDelete, setItemToDelete] = useState<string | null>(null)
    const [itemToEdit, setItemToEdit] = useState<any | null>(null)

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        setLoading(true)
        await fetchInventory()
        await fetchStats()
        setLoading(false)
    }

    const fetchInventory = async () => {
        const { data } = await supabase.from('inventory').select('*').order('created_at', { ascending: false })
        if (data) setItems(data)
    }

    const fetchStats = async () => {
        const { data } = await supabase.from('material_consumption_stats').select('*')
        if (data) setConsumptionStats(data)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const payload = {
                ...formData,
                stock_grams: Number(formData.stock_grams),
                price_per_kg: Number(formData.price_per_kg),
                status: Number(formData.stock_grams) < 150 ? 'bajo_stock' : 'disponible'
            }

            let error;
            if (itemToEdit) {
                const { error: err } = await supabase.from('inventory').update(payload).eq('id', itemToEdit.id)
                error = err
            } else {
                const { error: err } = await supabase.from('inventory').insert([payload])
                error = err
            }

            if (error) throw error
            toast.success(itemToEdit ? 'Material actualizado' : 'Material agregado')
            setOpen(false)
            resetForm()
            fetchInitialData()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const resetForm = () => {
        setFormData({ name: '', type: 'Filamento', brand: '', color: '', material_type: 'PLA', stock_grams: '', price_per_kg: '15000' })
        setItemToEdit(null)
    }

    const handleEdit = (item: any) => {
        setItemToEdit(item)
        setFormData({
            name: item.name,
            type: item.type || 'Filamento',
            brand: item.brand || '',
            color: item.color || '',
            material_type: item.material_type || '',
            stock_grams: item.stock_grams.toString(),
            price_per_kg: (item.price_per_kg || 15000).toString()
        })
        setOpen(true)
    }

    const deleteItem = async () => {
        if (!itemToDelete) return
        const { error } = await supabase.from('inventory').delete().eq('id', itemToDelete)

        if (error) {
            toast.error('Error al eliminar: ' + error.message)
            console.error(error)
            return
        }

        setItemToDelete(null)
        fetchInitialData()
        toast.success('Material eliminado')
    }

    const filteredItems = items.filter(item => {
        const matchesSearch =
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.color || '').toLowerCase().includes(searchQuery.toLowerCase())

        const matchesType = filterType === 'Todos' || item.type === filterType

        return matchesSearch && matchesType
    })

    const materialTypes = ['Todos', ...new Set(items.map(i => i.type || 'Filamento'))]

    const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-10 pb-24 bg-slate-50/30 min-h-screen">
            <Tabs defaultValue="inventory" className="space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Inventario y Maestros</h1>
                        <p className="text-slate-500 font-medium">Gestiona materiales, etiquetas y configuraciones.</p>
                    </div>

                    <TabsList className="bg-slate-200/50 p-1 rounded-xl">
                        <TabsTrigger value="inventory" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 rounded-lg font-bold text-xs uppercase px-6">Materiales</TabsTrigger>
                        <TabsTrigger value="tags" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 rounded-lg font-bold text-xs uppercase px-6">Etiquetas</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="inventory" className="space-y-10 outline-none">
                    <div className="flex justify-end">
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 font-bold px-6">
                                    <Plus size={20} /> Nuevo Material
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>{itemToEdit ? 'Editar Material' : 'Agregar Material'}</DialogTitle></DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                                    <div className="grid gap-2">
                                        <Label>Nombre descriptivo</Label>
                                        <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-indigo-600 font-bold">Categoría de Material</Label>
                                        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Filamento">Filamento</SelectItem>
                                                <SelectItem value="Resina">Resina</SelectItem>
                                                <SelectItem value="Repuesto">Repuesto</SelectItem>
                                                <SelectItem value="Otro">Otro</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Marca</Label>
                                            <Input value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
                                        </div>
                                        {(formData.type === 'Filamento' || formData.type === 'Resina') && (
                                            <div className="grid gap-2">
                                                <Label>Color</Label>
                                                <Input required value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {(formData.type === 'Filamento' || formData.type === 'Resina') && (
                                            <div className="grid gap-2">
                                                <Label>{formData.type === 'Filamento' ? 'Tipo (PLA, ABS, PETG...)' : 'Tipo/Modelo'}</Label>
                                                <Input value={formData.material_type} onChange={e => setFormData({ ...formData, material_type: e.target.value })} />
                                            </div>
                                        )}
                                        <div className="grid gap-2">
                                            <Label>{formData.type === 'Filamento' || formData.type === 'Resina' ? 'Gramos Disponibles' : 'Cantidad en Stock'}</Label>
                                            <Input type="number" required value={formData.stock_grams} onChange={e => setFormData({ ...formData, stock_grams: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid gap-2 border-t pt-4">
                                        <Label className="text-indigo-600 font-bold">Precio por Kilo ($)</Label>
                                        <Input type="number" required value={formData.price_per_kg} onChange={e => setFormData({ ...formData, price_per_kg: e.target.value })} />
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" className="w-full bg-indigo-600">{itemToEdit ? 'Actualizar Cambios' : 'Guardar Material'}</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:max-w-md group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                            <Input
                                placeholder="Buscar por nombre, marca o color..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-10 border-slate-200 focus:border-indigo-300 focus:ring-indigo-100 rounded-xl"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                            {materialTypes.map(type => (
                                <Button
                                    key={type}
                                    variant={filterType === type ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterType(type)}
                                    className={cn(
                                        "rounded-full px-4 font-bold text-xs uppercase tracking-wider",
                                        filterType === type ? "bg-slate-900" : "text-slate-500 border-slate-200"
                                    )}
                                >
                                    {type}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {!loading && consumptionStats.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2 border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b bg-white flex justify-between items-center">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-800">Uso de Filamento por Color</h2>
                                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total gramos consumidos por rollo</p>
                                    </div>
                                </div>
                                <CardContent className="p-6 h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={consumptionStats.filter(s => s.total_grams_used > 0)}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="color" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                            <Tooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="total_grams_used" name="Gramos Usados" radius={[6, 6, 0, 0]} barSize={35}>
                                                {consumptionStats.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color ? entry.color.toLowerCase() : COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <div className="space-y-4">
                                <Card className="border-indigo-100 bg-indigo-50 shadow-none">
                                    <CardContent className="p-6">
                                        <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-widest mb-4">Color Estrella</h3>
                                        {consumptionStats.sort((a, b) => b.total_orders - a.total_orders)[0] ? (
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full border-4 border-white shadow-md" style={{ backgroundColor: consumptionStats.sort((a, b) => b.total_orders - a.total_orders)[0].color?.toLowerCase() }} />
                                                <div>
                                                    <p className="text-2xl font-black text-slate-900">{consumptionStats.sort((a, b) => b.total_orders - a.total_orders)[0].color}</p>
                                                    <p className="text-xs text-indigo-600 font-bold uppercase">{consumptionStats.sort((a, b) => b.total_orders - a.total_orders)[0].total_orders} Pedidos</p>
                                                </div>
                                            </div>
                                        ) : <p className="text-slate-400 text-sm">Sin datos aún</p>}
                                    </CardContent>
                                </Card>

                                <Card className="border-emerald-100 bg-emerald-50 shadow-none">
                                    <CardContent className="p-6">
                                        <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-widest mb-4">Ingresos Generados</h3>
                                        <p className="text-3xl font-black text-slate-900">
                                            ${consumptionStats.reduce((acc, curr) => acc + (curr.total_revenue || 0), 0).toLocaleString('es-CL')}
                                        </p>
                                        <p className="text-xs text-emerald-600 font-bold uppercase">Con materiales actuales</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-800">Tus Materiales en Stock ({filteredItems.length})</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredItems.map(item => (
                                <Card key={item.id} className="overflow-hidden border-slate-200 relative group bg-white shadow-sm hover:shadow-md transition-all">
                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${item.stock_grams < 150 ? 'bg-rose-500 animate-pulse' : 'bg-indigo-500'}`} />
                                    <CardContent className="p-5">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                                    {item.type === 'Filamento' || item.type === 'Resina' ? (
                                                        <Droplets size={20} />
                                                    ) : (
                                                        <Boxes size={20} />
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800 text-base">{item.name}</h3>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {item.brand && `${item.brand} • `}{item.material_type || item.type}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="text-slate-300 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all">
                                                    <Pencil size={16} />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setItemToDelete(item.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex items-end justify-between mt-8">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none px-2 py-0 text-[9px] font-black uppercase">
                                                        {item.type || 'Filamento'}
                                                    </Badge>
                                                    {item.color && (
                                                        <>
                                                            <div className="w-4 h-4 rounded-full border border-slate-200 shadow-inner" style={{ backgroundColor: item.color?.toLowerCase() }} />
                                                            <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{item.color}</span>
                                                        </>
                                                    )}
                                                </div>
                                                {item.stock_grams < 150 ? (
                                                    <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none px-2 py-0 text-[9px] font-black uppercase">Crítico</Badge>
                                                ) : (
                                                    <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-green-500" style={{ width: `${Math.min(100, (item.stock_grams / 1000) * 100)}%` }} />
                                                    </div>
                                                )}
                                                <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1">
                                                    <DollarSign size={10} className="text-emerald-500" />
                                                    ${(item.price_per_kg || 15000).toLocaleString('es-CL')} / kg
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-3xl font-black text-slate-900 leading-none tracking-tighter">{item.stock_grams}g</p>
                                                <p className="text-[9px] text-slate-400 font-black uppercase mt-1">Disponible</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {filteredItems.length === 0 && !loading && (
                        <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-inner">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Package className="text-slate-200" size={40} />
                            </div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest">Sin materiales encontrados</p>
                            <p className="text-xs text-slate-300 mt-1">Intenta con otros términos de búsqueda o filtros.</p>
                        </div>
                    )}

                </TabsContent>

                <TabsContent value="tags" className="outline-none">
                    <TagSettingsTab />
                </TabsContent>
            </Tabs>

            <ConfirmDialog
                open={!!itemToDelete}
                onOpenChange={(open) => !open && setItemToDelete(null)}
                onConfirm={deleteItem}
                title="¿Eliminar Material?"
                description="Esta acción no se puede deshacer. Se eliminará el registro del rollo y su stock asociado."
                confirmText="Eliminar"
                variant="destructive"
            />
        </div>
    )
}
