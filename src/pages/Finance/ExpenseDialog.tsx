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
import { Minus } from 'lucide-react'

interface ExpenseDialogProps {
    onSuccess?: () => void
}

export default function ExpenseDialog({ onSuccess }: ExpenseDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        category: '',
        amount: '',
        description: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data, error } = await supabase.from('expenses').insert([
                {
                    category: formData.category,
                    amount: Number(formData.amount),
                    description: formData.description,
                    date: new Date().toISOString()
                }
            ]).select()

            if (error) throw error

            // Log Audit Action
            if (data && data[0]) {
                await logAuditAction(
                    'CREATE_EXPENSE',
                    'expenses',
                    data[0].id,
                    { amount: formData.amount, category: formData.category }
                )
            }

            toast.success('Gasto registrado')
            setOpen(false)
            setFormData({ category: '', amount: '', description: '' })
            if (onSuccess) onSuccess()

        } catch (error: any) {
            toast.error('Error al registrar gasto', { description: error.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-32 flex flex-col gap-3 bg-white text-slate-900 border hover:bg-slate-50 shadow-sm" variant="outline">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <Minus size={24} />
                    </div>
                    <span className="font-semibold">Registrar<br />GASTO</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Registrar Gasto</DialogTitle>
                    <DialogDescription>
                        ¿En qué se fue el dinero?
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">

                    <div className="grid gap-2">
                        <Label>Categoría</Label>
                        <Select onValueChange={(val) => setFormData({ ...formData, category: val })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="materiales">Materiales (Filamento/Resina)</SelectItem>
                                <SelectItem value="mantenimiento">Repuestos / Mantención</SelectItem>
                                <SelectItem value="servicios">Servicios (Luz/Internet)</SelectItem>
                                <SelectItem value="otros">Otros</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Monto</Label>
                        <Input
                            type="number"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="15000"
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Descripción</Label>
                        <Input
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Ej: 2 Rollos PLA Negro"
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading || !formData.category} variant="destructive">
                            {loading ? 'Guardando...' : 'Confirmar Gasto'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
