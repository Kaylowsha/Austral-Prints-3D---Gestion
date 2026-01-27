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
} from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface ClientDialogProps {
    open: boolean
    setOpen: (open: boolean) => void
    client?: any
    onSuccess?: () => void
}

export default function ClientDialog({ open, setOpen, client, onSuccess }: ClientDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: ''
    })

    useEffect(() => {
        if (client) {
            setFormData({
                full_name: client.full_name || '',
                phone: client.phone || '',
                email: client.email || ''
            })
        } else {
            setFormData({ full_name: '', phone: '', email: '' })
        }
    }, [client, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (client?.id) {
                const { error } = await supabase
                    .from('clients')
                    .update(formData)
                    .eq('id', client.id)
                if (error) throw error
                toast.success('Cliente actualizado')
            } else {
                const { error } = await supabase
                    .from('clients')
                    .insert([formData])
                if (error) throw error
                toast.success('Cliente registrado')
            }

            setOpen(false)
            if (onSuccess) onSuccess()
        } catch (error: any) {
            toast.error('Error al guardar cliente', { description: error.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{client ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
                    <DialogDescription>
                        Ingresa los datos de contacto del cliente.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Nombre Completo</Label>
                        <Input
                            required
                            value={formData.full_name}
                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            placeholder="Ej: Juan Pérez"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Teléfono</Label>
                        <Input
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="Ej: +56 9 1234 5678"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Email</Label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Ej: juan.perez@email.com"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                            {loading ? 'Guardando...' : client ? 'Actualizar' : 'Registrar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
