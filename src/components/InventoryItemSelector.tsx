
import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Plus, Trash2, Box } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface InventoryItemSelection {
    inventory_id: string
    quantity: number
    calculated_cost: number
    name?: string
    measurement_unit?: 'grams' | 'units'
    price_per_unit?: number
}

interface InventoryItemSelectorProps {
    value: InventoryItemSelection[]
    onChange: (items: InventoryItemSelection[]) => void
}

export function InventoryItemSelector({ value, onChange }: InventoryItemSelectorProps) {
    const [open, setOpen] = useState(false)
    const [items, setItems] = useState<any[]>([])

    useEffect(() => {
        fetchInventory()
    }, [])

    const fetchInventory = async () => {
        const { data } = await supabase
            .from('inventory')
            .select('*')
            .eq('measurement_unit', 'units') // Only show unit-based items, as filament is handled by weight logic
            .order('name')

        if (data) setItems(data)
    }

    const handleAddItem = (item: any) => {
        const exists = value.find(i => i.inventory_id === item.id)
        if (exists) {
            toast.error('Este ítem ya está agregado')
            return
        }

        const newItem: InventoryItemSelection = {
            inventory_id: item.id,
            name: item.name,
            quantity: 1,
            measurement_unit: 'units',
            price_per_unit: item.price_per_unit || 0,
            calculated_cost: (item.price_per_unit || 0) * 1
        }

        onChange([...value, newItem])
        setOpen(false)
    }

    const handleUpdateQuantity = (index: number, quantity: number) => {
        const newItems = [...value]
        const item = newItems[index]
        item.quantity = quantity
        item.calculated_cost = (item.price_per_unit || 0) * quantity
        onChange(newItems)
    }

    const handleRemoveItem = (index: number) => {
        const newItems = [...value]
        newItems.splice(index, 1)
        onChange(newItems)
    }

    const totalCost = value.reduce((sum, item) => sum + item.calculated_cost, 0)

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-2">
                {value.map((item, index) => (
                    <div key={item.inventory_id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <div className="flex-1">
                            <span className="text-xs font-bold text-slate-700 block">{item.name}</span>
                            <span className="text-[10px] text-slate-400">
                                ${item.price_per_unit?.toLocaleString()}/un
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                min="1"
                                className="h-7 w-16 text-xs text-right pr-1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateQuantity(index, parseFloat(e.target.value) || 0)}
                            />
                            <span className="text-xs text-slate-500 w-16 text-right font-mono">
                                ${item.calculated_cost.toLocaleString()}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-slate-400 hover:text-rose-500"
                                onClick={() => handleRemoveItem(index)}
                            >
                                <Trash2 size={12} />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center pt-1">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="justify-between text-xs h-8 bg-white border-dashed text-slate-500 hover:text-indigo-600 hover:border-indigo-200"
                        >
                            <span className="flex items-center gap-2">
                                <Plus size={14} />
                                Agregar Insumo / Repuesto
                            </span>
                            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                        <Command>
                            <CommandInput placeholder="Buscar insumo..." className="h-9" />
                            <CommandEmpty>No encontrado.</CommandEmpty>
                            <CommandGroup>
                                <CommandList>
                                    {items.map((item) => (
                                        <CommandItem
                                            key={item.id}
                                            value={item.name}
                                            onSelect={() => handleAddItem(item)}
                                            className="text-xs"
                                        >
                                            <Box className="mr-2 h-3 w-3 text-slate-400" />
                                            <div className="flex flex-col flex-1">
                                                <span>{item.name}</span>
                                                <span className="text-[9px] text-slate-400">{item.brand} • ${item.price_per_unit}/un</span>
                                            </div>
                                            <Check
                                                className={cn(
                                                    "ml-auto h-3 w-3",
                                                    value.find(i => i.inventory_id === item.id) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                        </CommandItem>
                                    ))}
                                </CommandList>
                            </CommandGroup>
                        </Command>
                    </PopoverContent>
                </Popover>

                {totalCost > 0 && (
                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200">
                        Total Insumos: ${totalCost.toLocaleString()}
                    </Badge>
                )}
            </div>
        </div>
    )
}
