import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Tag, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import ConfirmDialog from '@/components/ConfirmDialog'

export default function TagSettingsTab() {
    const [tags, setTags] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [newTagName, setNewTagName] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [tagToDelete, setTagToDelete] = useState<any>(null)

    useEffect(() => {
        fetchTags()
    }, [])

    const fetchTags = async () => {
        setLoading(true)
        const { data } = await supabase.from('tags').select('*').order('name')
        if (data) setTags(data)
        setLoading(false)
    }

    const handleAddTag = async () => {
        if (!newTagName.trim()) return

        try {
            const { error } = await supabase.from('tags').insert([{ name: newTagName.trim() }])
            if (error) throw error

            toast.success('Etiqueta agregada')
            setNewTagName('')
            fetchTags()
        } catch (error: any) {
            toast.error('Error al agregar etiqueta', { description: error.message })
        }
    }

    const startEditing = (tag: any) => {
        setEditingId(tag.id)
        setEditName(tag.name)
    }

    const handleUpdateTag = async (tag: any) => {
        if (!editName.trim() || editName === tag.name) {
            setEditingId(null)
            return
        }

        try {
            // 1. Update orders and expenses strings first (atomically if possible, but here sequential)
            const { error: renameError } = await supabase.rpc('rename_tag', {
                old_tag: tag.name,
                new_tag: editName.trim()
            })
            if (renameError) throw renameError

            // 2. Update the tags table
            const { error } = await supabase.from('tags').update({ name: editName.trim() }).eq('id', tag.id)
            if (error) throw error

            toast.success('Etiqueta actualizada en todos los registros')
            setEditingId(null)
            fetchTags()
        } catch (error: any) {
            toast.error('Error al actualizar etiqueta', { description: error.message })
        }
    }

    const handleDeleteTag = async () => {
        if (!tagToDelete) return

        try {
            // Note: We don't necessarily remove the tag from orders/expenses strings 
            // unless the user wants to "Delete everywhere". 
            // For now, let's just delete the pre-defined tag.

            const { error } = await supabase.from('tags').delete().eq('id', tagToDelete.id)
            if (error) throw error

            toast.success('Etiqueta eliminada de la configuración')
            setTagToDelete(null)
            fetchTags()
        } catch (error: any) {
            toast.error('Error al eliminar', { description: error.message })
        }
    }

    return (
        <div className="space-y-6">
            <Card className="border-slate-200">
                <CardHeader>
                    <CardTitle className="text-xl font-black">Gestión de Etiquetas</CardTitle>
                    <CardDescription>
                        Crea etiquetas predefinidas para organizar tus pedidos y gastos por eventos o criterios.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <Input
                                placeholder="Nueva etiqueta (ej: San Valentín)"
                                className="pl-10 h-11"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                            />
                        </div>
                        <Button onClick={handleAddTag} className="bg-indigo-600 h-11 px-6 font-bold gap-2">
                            <Plus size={20} /> Agregar
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {loading ? (
                            <div className="col-span-full py-12 flex justify-center">
                                <Loader2 className="animate-spin text-indigo-600" />
                            </div>
                        ) : tags.length > 0 ? (
                            tags.map((tag) => (
                                <div
                                    key={tag.id}
                                    className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl group hover:shadow-sm transition-all"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tag.color || '#6366f1' }} />
                                        {editingId === tag.id ? (
                                            <Input
                                                autoFocus
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="h-8 py-0 px-2 font-bold min-w-[120px]"
                                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateTag(tag)}
                                            />
                                        ) : (
                                            <span className="font-bold text-slate-700 truncate">{tag.name}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {editingId === tag.id ? (
                                            <>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-50" onClick={() => handleUpdateTag(tag)}>
                                                    <Check size={16} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-slate-100" onClick={() => setEditingId(null)}>
                                                    <X size={16} />
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => startEditing(tag)}>
                                                    <Pencil size={14} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setTagToDelete(tag)}>
                                                    <Trash2 size={14} />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                                <p className="text-slate-400 font-medium italic">No hay etiquetas guardadas.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <ConfirmDialog
                open={!!tagToDelete}
                onOpenChange={(open) => !open && setTagToDelete(null)}
                onConfirm={handleDeleteTag}
                title="¿Eliminar Etiqueta?"
                description={`Esta acción eliminará "${tagToDelete?.name}" de la lista predefinida. No se borrará de los registros existentes.`}
            />
        </div>
    )
}
