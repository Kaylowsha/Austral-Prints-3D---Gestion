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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { TrendingUp, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AcquisitionFormProps {
    onSuccess?: () => void
}

export default function AcquisitionForm({ onSuccess }: AcquisitionFormProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [inventoryItems, setInventoryItems] = useState<any[]>([])

    // Form State
    const [acquisitionType, setAcquisitionType] = useState<'inventory' | 'asset'>('inventory')
    const [capitalSource, setCapitalSource] = useState<'reinvestment' | 'investment'>('reinvestment')

    // Inventory Details
    const [selectedItemId, setSelectedItemId] = useState<string>('new') // 'new' or UUID
    const [newItemDetails, setNewItemDetails] = useState({
        name: '',
        type: 'Filamento',
        color: '',
        brand: '',
        stock_grams: 1000,
        price_per_kg: 15000
    })

    // Shared Details
    const [amount, setAmount] = useState('') // Costo total
    const [description, setDescription] = useState('')
    const [quantityToAdd, setQuantityToAdd] = useState('') // Grams or Units

    useEffect(() => {
        if (open && acquisitionType === 'inventory') {
            fetchInventory()
        }
    }, [open, acquisitionType])

    const fetchInventory = async () => {
        const { data } = await supabase.from('inventory').select('id, name, brand, color, type').order('name')
        if (data) setInventoryItems(data)
    }

    const handleSubmit = async () => {
        setLoading(true)
        try {
            // 1. Handle Inventory Update/Creation
            let finalDescription = description

            if (acquisitionType === 'inventory') {
                if (selectedItemId === 'new') {
                    // Create new item
                    const { error: createError } = await supabase.from('inventory').insert([{
                        name: newItemDetails.name,
                        type: newItemDetails.type,
                        brand: newItemDetails.brand,
                        color: newItemDetails.color,
                        stock_grams: Number(newItemDetails.stock_grams),
                        price_per_kg: Number(newItemDetails.price_per_kg),
                        status: 'disponible'
                    }]).select().single()

                    if (createError) throw createError
                    finalDescription = `Compra de Material Nuevo: ${newItemDetails.name}`
                } else {
                    // Update existing item
                    // First get current stock
                    const { data: currentItem, error: fetchError } = await supabase.from('inventory').select('stock_grams, name').eq('id', selectedItemId).single()
                    if (fetchError) throw fetchError

                    const newStock = (currentItem.stock_grams || 0) + Number(quantityToAdd)

                    const { error: updateError } = await supabase.from('inventory').update({
                        stock_grams: newStock
                    }).eq('id', selectedItemId)

                    if (updateError) throw updateError
                    finalDescription = `Recarga de Stock: ${currentItem.name} (+${quantityToAdd}g)`
                }
            }

            // 2. Register Expense
            const tags = [
                capitalSource === 'reinvestment' ? 'Reinversión' : 'Inversión',
                acquisitionType === 'inventory' ? 'Materiales' : 'Activo Fijo'
            ]

            const { error: expenseError } = await supabase.from('expenses').insert([{
                category: acquisitionType === 'inventory' ? 'materiales' : 'inversion',
                amount: Number(amount),
                description: finalDescription || description,
                date: new Date().toISOString().split('T')[0],
                tags: tags
            }])

            if (expenseError) throw expenseError

            toast.success('Adquisición registrada correctamente')
            setOpen(false)
            resetForm()
            if (onSuccess) onSuccess()

        } catch (error: any) {
            console.error(error)
            toast.error('Error al registrar', { description: error.message })
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setAcquisitionType('inventory')
        setCapitalSource('reinvestment')
        setSelectedItemId('new')
        setAmount('')
        setDescription('')
        setQuantityToAdd('')
        setNewItemDetails({
            name: '',
            type: 'Filamento',
            color: '',
            brand: '',
            stock_grams: 1000,
            price_per_kg: 15000
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-slate-900 border-slate-800 text-white hover:bg-slate-800 gap-2 font-bold shadow-lg shadow-slate-200">
                    <TrendingUp size={18} /> Registrar Inyección
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black">Nueva Adquisición</DialogTitle>
                    <DialogDescription>
                        Registra una compra e indica el origen de los fondos.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    {/* Source Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div
                            className={cn(
                                "cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-slate-50",
                                capitalSource === 'reinvestment' ? "border-emerald-500 bg-emerald-50/50" : "border-slate-200"
                            )}
                            onClick={() => setCapitalSource('reinvestment')}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", capitalSource === 'reinvestment' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                                    <TrendingUp size={16} />
                                </div>
                                <span className={cn("font-bold", capitalSource === 'reinvestment' ? "text-emerald-700" : "text-slate-600")}>Reinversión</span>
                            </div>
                            <p className="text-xs text-slate-500">Usar ganancias acumuladas del negocio.</p>
                        </div>

                        <div
                            className={cn(
                                "cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-slate-50",
                                capitalSource === 'investment' ? "border-indigo-500 bg-indigo-50/50" : "border-slate-200"
                            )}
                            onClick={() => setCapitalSource('investment')}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", capitalSource === 'investment' ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400")}>
                                    <Briefcase size={16} />
                                </div>
                                <span className={cn("font-bold", capitalSource === 'investment' ? "text-indigo-700" : "text-slate-600")}>Inversión Externa</span>
                            </div>
                            <p className="text-xs text-slate-500">Aporte de dinero externo (Tu bolsillo).</p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <Label className="uppercase text-xs font-bold text-slate-400">¿Qué estás adquiriendo?</Label>
                        <RadioGroup
                            defaultValue="inventory"
                            className="flex gap-4"
                            onValueChange={(v) => setAcquisitionType(v as any)}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="inventory" id="r1" />
                                <Label htmlFor="r1" className="cursor-pointer">Material de Inventario (Rollos, Resina)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="asset" id="r2" />
                                <Label htmlFor="r2" className="cursor-pointer">Activo Fijo / Otro (Máquinas, Mejoras)</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Dynamic Fields based on Type */}
                    {acquisitionType === 'inventory' ? (
                        <div className="space-y-4 bg-slate-50 p-4 rounded-xl">
                            <Label>Seleccionar Material</Label>
                            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Elegir material..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="new">+ Crear Nuevo Material</SelectItem>
                                    {inventoryItems.map(item => (
                                        <SelectItem key={item.id} value={item.id}>
                                            {item.name} {item.brand ? `(${item.brand})` : ''} - {item.color}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {selectedItemId === 'new' ? (
                                <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2">
                                    <Input placeholder="Nombre (ej: PLA Matte)" value={newItemDetails.name} onChange={e => setNewItemDetails({ ...newItemDetails, name: e.target.value })} />
                                    <Input placeholder="Marca" value={newItemDetails.brand} onChange={e => setNewItemDetails({ ...newItemDetails, brand: e.target.value })} />
                                    <Input placeholder="Color" value={newItemDetails.color} onChange={e => setNewItemDetails({ ...newItemDetails, color: e.target.value })} />
                                    <Input type="number" placeholder="Gramos Iniciales" value={newItemDetails.stock_grams} onChange={e => setNewItemDetails({ ...newItemDetails, stock_grams: Number(e.target.value) })} />
                                    <Input type="number" placeholder="Precio por Kg ($)" value={newItemDetails.price_per_kg} onChange={e => setNewItemDetails({ ...newItemDetails, price_per_kg: Number(e.target.value) })} />
                                </div>
                            ) : (
                                <div>
                                    <Label>Cantidad a agregar (gramos)</Label>
                                    <Input type="number" placeholder="ej: 1000" value={quantityToAdd} onChange={e => setQuantityToAdd(e.target.value)} />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label>Descripción del Activo</Label>
                            <Input placeholder="Ej: Impresora Bambu Lab A1" value={description} onChange={e => setDescription(e.target.value)} />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Costo Total ($)</Label>
                        <Input type="number" className="text-lg font-bold" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !amount}
                        className={cn(
                            "font-bold text-white",
                            capitalSource === 'reinvestment' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"
                        )}
                    >
                        {loading ? 'Registrando...' : `Confirmar ${capitalSource === 'reinvestment' ? 'Reinversión' : 'Inversión'}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
