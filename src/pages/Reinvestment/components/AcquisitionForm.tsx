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
import { TrendingUp, Briefcase, Camera, X, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AcquisitionFormProps {
    onSuccess?: () => void
    itemToEdit?: any
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export default function AcquisitionForm({ onSuccess, itemToEdit, open: externalOpen, onOpenChange: setExternalOpen }: AcquisitionFormProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const open = externalOpen !== undefined ? externalOpen : internalOpen
    const setOpen = setExternalOpen || setInternalOpen

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
    const [file, setFile] = useState<File | null>(null)
    const [filePreview, setFilePreview] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            if (acquisitionType === 'inventory' && !itemToEdit) {
                fetchInventory()
            }
            if (itemToEdit) {
                // Pre-populate for edit
                setAcquisitionType(itemToEdit.category === 'materiales' ? 'inventory' : 'asset')
                setCapitalSource(itemToEdit.tags?.includes('Reinversión') ? 'reinvestment' : 'investment')
                setAmount(itemToEdit.amount.toString())
                setDescription(itemToEdit.description)
                setFilePreview(itemToEdit.evidence_url ? getPublicUrl(itemToEdit.evidence_url) : null)
            }
        }
    }, [open, acquisitionType, itemToEdit])

    const getPublicUrl = (path: string) => {
        const { data } = supabase.storage.from('evidence').getPublicUrl(path)
        return data.publicUrl
    }

    const fetchInventory = async () => {
        const { data } = await supabase.from('inventory').select('id, name, brand, color, type').order('name')
        if (data) setInventoryItems(data)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            setFile(selectedFile)
            setFilePreview(URL.createObjectURL(selectedFile))
        }
    }

    const removeFile = () => {
        setFile(null)
        setFilePreview(null)
    }

    const handleSubmit = async () => {
        setLoading(true)
        try {
            // 1. Upload Evidence if exists and is new (file is set)
            let evidence_url = itemToEdit?.evidence_url || null
            if (file) {
                const fileExt = file.name.split('.').pop()
                const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
                const filePath = `receipts/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('evidence')
                    .upload(filePath, file)

                if (uploadError) throw uploadError
                evidence_url = filePath
            }

            // 2. Handle Inventory Update/Creation (ONLY in create mode)
            let finalDescription = description

            if (!itemToEdit && acquisitionType === 'inventory') {
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

            // 3. Register or Update Expense
            const tags = [
                capitalSource === 'reinvestment' ? 'Reinversión' : 'Inversión',
                acquisitionType === 'inventory' ? 'Materiales' : 'Activo Fijo'
            ]

            const expenseData = {
                category: acquisitionType === 'inventory' ? 'materiales' : 'inversion',
                amount: Number(amount),
                description: itemToEdit ? description : (finalDescription || description),
                tags: tags,
                evidence_url: evidence_url
            }

            if (itemToEdit) {
                const { error: expenseError } = await supabase
                    .from('expenses')
                    .update(expenseData)
                    .eq('id', itemToEdit.id)
                if (expenseError) throw expenseError
            } else {
                const { error: expenseError } = await supabase.from('expenses').insert([{
                    ...expenseData,
                    date: new Date().toISOString().split('T')[0]
                }])
                if (expenseError) throw expenseError
            }

            toast.success(itemToEdit ? 'Adquisición actualizada' : 'Adquisición registrada correctamente')
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
        if (!itemToEdit) {
            setAcquisitionType('inventory')
            setCapitalSource('reinvestment')
            setSelectedItemId('new')
            setAmount('')
            setDescription('')
            setQuantityToAdd('')
            setFile(null)
            setFilePreview(null)
            setNewItemDetails({
                name: '',
                type: 'Filamento',
                color: '',
                brand: '',
                stock_grams: 1000,
                price_per_kg: 15000
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val)
            if (!val) resetForm()
        }}>
            {!itemToEdit && (
                <DialogTrigger asChild>
                    <Button className="bg-slate-900 border-slate-800 text-white hover:bg-slate-800 gap-2 font-bold shadow-lg shadow-slate-200">
                        <TrendingUp size={18} /> Registrar Inyección
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black">{itemToEdit ? 'Editar Registro' : 'Nueva Adquisición'}</DialogTitle>
                    <DialogDescription>
                        {itemToEdit ? 'Corrije los datos del registro financiero.' : 'Registra una compra e indica el origen de los fondos.'}
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
                            disabled={!!itemToEdit}
                            value={acquisitionType}
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
                        {itemToEdit && (
                            <p className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded">
                                Nota: Para cambios de stock, usa la sección de Inventario.
                            </p>
                        )}
                    </div>

                    {/* Dynamic Fields based on Type */}
                    {acquisitionType === 'inventory' ? (
                        <div className="space-y-4 bg-slate-50 p-4 rounded-xl">
                            {!itemToEdit && (
                                <>
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
                                            <Input placeholder="Nombre (ej: PLA Genérico)" value={newItemDetails.name} onChange={e => setNewItemDetails({ ...newItemDetails, name: e.target.value })} />
                                            <Input placeholder="Marca" value={newItemDetails.brand} onChange={e => setNewItemDetails({ ...newItemDetails, brand: e.target.value })} />
                                            <Input placeholder="Color (Opcional)" value={newItemDetails.color} onChange={e => setNewItemDetails({ ...newItemDetails, color: e.target.value })} />
                                            <Input type="number" placeholder="Gramos Iniciales" value={newItemDetails.stock_grams} onChange={e => setNewItemDetails({ ...newItemDetails, stock_grams: Number(e.target.value) })} />
                                            <Input type="number" placeholder="Precio por Kg ($)" value={newItemDetails.price_per_kg} onChange={e => setNewItemDetails({ ...newItemDetails, price_per_kg: Number(e.target.value) })} />
                                        </div>
                                    ) : (
                                        <div>
                                            <Label>Cantidad a agregar (gramos)</Label>
                                            <Input type="number" placeholder="ej: 1000" value={quantityToAdd} onChange={e => setQuantityToAdd(e.target.value)} />
                                        </div>
                                    )}
                                </>
                            )}
                            {itemToEdit && (
                                <div className="space-y-2">
                                    <Label>Descripción del Material</Label>
                                    <Input placeholder="Ej: PLA Blanco" value={description} onChange={e => setDescription(e.target.value)} />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label>Descripción del Activo</Label>
                            <Input placeholder="Ej: Impresora Bambu Lab A1" value={description} onChange={e => setDescription(e.target.value)} />
                        </div>
                    )}

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <Label className="uppercase text-xs font-bold text-slate-400">Evidencia (Boleta / Recibo)</Label>
                        {!filePreview ? (
                            <div
                                className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer relative"
                                onClick={() => document.getElementById('evidence-upload')?.click()}
                            >
                                <Camera className="text-slate-400" size={32} />
                                <p className="text-sm font-bold text-slate-500">Subir foto de boleta</p>
                                <p className="text-[10px] text-slate-400 uppercase font-black">PNG, JPG, PDF</p>
                                <input
                                    id="evidence-upload"
                                    type="file"
                                    className="hidden"
                                    accept="image/*,application/pdf"
                                    onChange={handleFileChange}
                                />
                            </div>
                        ) : (
                            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2 group">
                                <div className="flex items-center gap-3">
                                    {file?.type.includes('image') ? (
                                        <img src={filePreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                            <FileText size={24} />
                                        </div>
                                    )}
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-bold text-slate-700 truncate">{file?.name}</p>
                                        <p className="text-xs text-slate-500 font-medium">{(file?.size || 0 / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <Button size="icon" variant="ghost" className="text-slate-400 hover:text-rose-500" onClick={removeFile}>
                                        <X size={18} />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

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
                        {loading ? 'Guardando...' : (itemToEdit ? 'Guardar Cambios' : `Confirmar ${capitalSource === 'reinvestment' ? 'Reinversión' : 'Inversión'}`)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
