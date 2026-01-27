import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Check, Tag, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagSelectorProps {
    selectedTags: string[]
    onChange: (tags: string[]) => void
    className?: string
}

export default function TagSelector({ selectedTags, onChange, className }: TagSelectorProps) {
    const [availableTags, setAvailableTags] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchTags()
    }, [])

    const fetchTags = async () => {
        setLoading(true)
        try {
            const { data } = await supabase.from('tags').select('*').order('name')
            if (data) setAvailableTags(data)
        } catch (error) {
            console.error('Error fetching tags:', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleTag = (tagName: string) => {
        if (selectedTags.includes(tagName)) {
            onChange(selectedTags.filter(t => t !== tagName))
        } else {
            onChange([...selectedTags, tagName])
        }
    }

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                {selectedTags.length > 0 ? (
                    selectedTags.map(tagName => {
                        return (
                            <Badge
                                key={tagName}
                                className="bg-indigo-600 text-white border-none gap-1 pr-1 font-bold animate-in zoom-in-95 duration-200"
                            >
                                {tagName}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        toggleTag(tagName)
                                    }}
                                    className="hover:bg-indigo-500 rounded-full p-0.5 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </Badge>
                        )
                    })
                ) : (
                    <span className="text-[10px] text-slate-400 font-bold uppercase italic ml-1 flex items-center gap-1.5">
                        <Tag size={12} /> Selecciona etiquetas predefinidas...
                    </span>
                )}
            </div>

            <div className="flex flex-wrap gap-1.5">
                {availableTags.map(tag => {
                    const isSelected = selectedTags.includes(tag.name)
                    return (
                        <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag.name)}
                            className={cn(
                                "text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5",
                                isSelected
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                                    : "bg-white border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600"
                            )}
                        >
                            {isSelected && <Check size={10} />}
                            {tag.name}
                        </button>
                    )
                })}
                {availableTags.length === 0 && !loading && (
                    <p className="text-[10px] text-slate-300 font-medium italic">Sin etiquetas guardadas en Inventario.</p>
                )}
            </div>
        </div>
    )
}
