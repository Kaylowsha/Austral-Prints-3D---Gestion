import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Users,
    Search,
    Plus,
    Edit2,
    Trash2,
    RefreshCw,
    UserPlus,
    CheckCircle2,
    AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import ClientDialog from './ClientDialog'
import ConfirmDialog from '@/components/ConfirmDialog'

export default function ClientsPage() {
    const [loading, setLoading] = useState(true)
    const [clients, setClients] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')

    // Dialog States
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedClient, setSelectedClient] = useState<any>(null)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [clientToDelete, setClientToDelete] = useState<any>(null)

    // Rescue Tool states
    const [rescueLoading, setRescueLoading] = useState(false)
    const [orphanedNames, setOrphanedNames] = useState<string[]>([])
    const [showRescue, setShowRescue] = useState(false)

    useEffect(() => {
        fetchClients()
        findOrphanedNames()
    }, [])

    const fetchClients = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('full_name')

            if (error) throw error
            setClients(data || [])
        } catch (error: any) {
            toast.error('Error al cargar clientes', { description: error.message })
        } finally {
            setLoading(false)
        }
    }

    const findOrphanedNames = async () => {
        try {
            const { data: orders } = await supabase
                .from('orders')
                .select('custom_client_name')
                .is('client_id', null)
                .not('custom_client_name', 'is', null)

            if (orders) {
                const names = Array.from(new Set(orders.map(o => o.custom_client_name.trim())))

                // Filter out names that already exist as registered clients
                const { data: existingClients } = await supabase
                    .from('clients')
                    .select('full_name')

                const existingNames = new Set(existingClients?.map(c => c.full_name.trim().toLowerCase()))
                const trulyOrphaned = names.filter(name => !existingNames.has(name.toLowerCase()))

                setOrphanedNames(trulyOrphaned)
            }
        } catch (error) {
            console.error('Error finding orphaned names:', error)
        }
    }

    const handleDeleteClient = async () => {
        if (!clientToDelete) return
        try {
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', clientToDelete.id)

            if (error) throw error
            toast.success('Cliente eliminado')
            fetchClients()
        } catch (error: any) {
            toast.error('Error al eliminar cliente', { description: error.message })
        } finally {
            setIsConfirmOpen(false)
            setClientToDelete(null)
        }
    }

    const rescueClient = async (name: string) => {
        try {
            setRescueLoading(true)
            // 1. Create client
            const { data: newClient, error: clientError } = await supabase
                .from('clients')
                .insert([{ full_name: name }])
                .select()
                .single()

            if (clientError) throw clientError

            // 2. Update orders that had this custom name
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    client_id: newClient.id,
                    custom_client_name: null
                })
                .eq('custom_client_name', name)

            if (updateError) throw updateError

            toast.success(`Cliente "${name}" rescatado y pedidos vinculados`)
            findOrphanedNames()
            fetchClients()
        } catch (error: any) {
            toast.error('Error al rescatar cliente', { description: error.message })
        } finally {
            setRescueLoading(false)
        }
    }

    const filteredClients = clients.filter(c =>
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.phone && c.phone.includes(searchTerm))
    )

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-[1200px] mx-auto pb-24">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Users className="text-indigo-600" size={32} />
                        Gestión de Clientes
                    </h1>
                    <p className="text-slate-500 font-medium">Administra tu base de datos de compradores y rescatar antiguos registros.</p>
                </div>
                <div className="flex items-center gap-2">
                    {orphanedNames.length > 0 && (
                        <Button
                            variant="outline"
                            className="gap-2 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                            onClick={() => setShowRescue(!showRescue)}
                        >
                            <RefreshCw size={18} className={rescueLoading ? 'animate-spin' : ''} />
                            Rescatar ({orphanedNames.length})
                        </Button>
                    )}
                    <Button
                        onClick={() => { setSelectedClient(null); setIsDialogOpen(true); }}
                        className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Plus size={20} />
                        Nuevo Cliente
                    </Button>
                </div>
            </header>

            {showRescue && orphanedNames.length > 0 && (
                <Card className="border-amber-200 bg-amber-50/50 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                    <CardHeader className="pb-3 text-amber-900">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={20} />
                            <CardTitle className="text-lg font-bold">Herramienta de Rescate</CardTitle>
                        </div>
                        <CardDescription className="text-amber-700 font-medium">
                            Se detectaron nombres de clientes en pedidos que no están registrados en la base de datos oficial.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {orphanedNames.map(name => (
                                <div key={name} className="flex items-center justify-between p-3 bg-white rounded-xl border border-amber-200 shadow-sm transition-all hover:border-amber-400 group">
                                    <span className="font-bold text-slate-700">{name}</span>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold"
                                        onClick={() => rescueClient(name)}
                                        disabled={rescueLoading}
                                    >
                                        <UserPlus size={16} className="mr-2" />
                                        Vincular
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle className="text-lg font-bold">Listado de Clientes</CardTitle>
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <Input
                                placeholder="Buscar por nombre, email o fono..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Nombre</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Contacto</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Fidelidad</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredClients.map((client) => (
                                    <tr key={client.id} className="group hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">
                                                    {client.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{client.full_name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                        Registrado el {new Date(client.created_at).toLocaleDateString('es-CL')}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-600">
                                            <div className="space-y-0.5">
                                                {client.phone && <p>{client.phone}</p>}
                                                {client.email && <p className="text-slate-400 text-xs">{client.email}</p>}
                                                {!client.phone && !client.email && <span className="text-slate-300 italic">Sin datos</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest inline-flex items-center gap-1">
                                                <CheckCircle2 size={12} /> Cliente Pro
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => { setSelectedClient(client); setIsDialogOpen(true); }}
                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600"
                                                >
                                                    <Edit2 size={16} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => { setClientToDelete(client); setIsConfirmOpen(true); }}
                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-rose-500"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredClients.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                                            {loading ? 'Cargando clientes...' : 'No se encontraron clientes.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <ClientDialog
                open={isDialogOpen}
                setOpen={setIsDialogOpen}
                client={selectedClient}
                onSuccess={fetchClients}
            />

            <ConfirmDialog
                open={isConfirmOpen}
                setOpen={setIsConfirmOpen}
                onConfirm={handleDeleteClient}
                title="¿Eliminar cliente?"
                description={`Esta acción no se puede deshacer. Se eliminará a ${clientToDelete?.full_name} de la base de datos.`}
            />
        </div>
    )
}
