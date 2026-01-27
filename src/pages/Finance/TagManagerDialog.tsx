import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings2, Tag, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface TagManagerDialogProps {
    onSuccess?: () => void
}

export default function TagManagerDialog({ onSuccess }: TagManagerDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [availableTags, setAvailableTags] = useState<string[]>([])
    const [selectedTag, setSelectedTag] = useState('')
    const [newTagName, setNewTagName] = useState('')

    useEffect(() => {
        if (open) {
            fetchUniqueTags()
        }
    }, [open])

    const fetchUniqueTags = async () => {
        try {
            // 1. Fetch tags from existing records
            const { data: orders } = await supabase.from('orders').select('tags')
            const { data: expenses } = await supabase.from('expenses').select('tags')

            // 2. Fetch pre-defined tags from master table
            const { data: masterTags } = await supabase.from('tags').select('name')

            const allTags = new Set<string>()
            orders?.forEach(o => o.tags?.forEach((t: string) => allTags.add(t)))
            expenses?.forEach(e => e.tags?.forEach((t: string) => allTags.add(t)))
            masterTags?.forEach(t => allTags.add(t.name))

            setAvailableTags(Array.from(allTags).sort())
        } catch (error) {
            console.error('Error fetching tags:', error)
        }
    }

    const handleRename = async () => {
        if (!selectedTag || !newTagName.trim()) {
            toast.error('Selecciona una etiqueta y escribe el nuevo nombre')
            return
        }

        setLoading(true)
        try {
            // 1. Update orders and expenses via RPC
            const { error: rpcError } = await supabase.rpc('rename_tag', {
                old_tag: selectedTag,
                new_tag: newTagName.trim()
            })
            if (rpcError) throw rpcError

            // 2. Also update the master tags table if the tag exists there
            const { error: masterError } = await supabase
                .from('tags')
                .update({ name: newTagName.trim() })
                .eq('name', selectedTag)

            if (masterError) {
                console.warn('Tag not found in master table or error updating it:', masterError)
                // We don't throw here because the main rename succeeded
            }

            toast.success(`Etiqueta "${selectedTag}" renombrada a "${newTagName}"`)
            setSelectedTag('')
            setNewTagName('')
            fetchUniqueTags()
            if (onSuccess) onSuccess()
        } catch (error: any) {
            toast.error('Error al renombrar etiqueta', { description: error.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                    <Settings2 size={18} />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Tag size={20} />
                        </div>
                        <DialogTitle className="text-xl font-black">Gestionar Etiquetas</DialogTitle>
                    </div>
                    <DialogDescription className="font-medium">
                        Renombra o fusiona etiquetas en todos tus registros. Útil para corregir errores ortográficos.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Etiqueta actual (Origen)</Label>
                        <Select value={selectedTag} onValueChange={setSelectedTag}>
                            <SelectTrigger className="h-11 bg-slate-50 border-none">
                                <SelectValue placeholder="Selecciona la etiqueta..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableTags.map(tag => (
                                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-center -my-2">
                        <ArrowRight size={20} className="text-slate-300 rotate-90" />
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nuevo nombre (Destino)</Label>
                        <Input
                            placeholder="Ej: Quelén"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            className="h-11 border-none bg-slate-50 font-bold"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        onClick={handleRename}
                        disabled={loading || !selectedTag || !newTagName.trim()}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold h-11"
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                        {loading ? 'Aplicando cambios...' : 'Renombrar en todos los registros'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
