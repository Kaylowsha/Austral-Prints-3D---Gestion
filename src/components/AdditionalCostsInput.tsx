import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X } from 'lucide-react'

export interface AdditionalCost {
    description: string
    amount: number
}

interface AdditionalCostsInputProps {
    costs: AdditionalCost[]
    onChange: (costs: AdditionalCost[]) => void
}

export default function AdditionalCostsInput({ costs, onChange }: AdditionalCostsInputProps) {
    const [newDescription, setNewDescription] = useState('')
    const [newAmount, setNewAmount] = useState('')

    const handleAdd = () => {
        if (!newDescription.trim() || !newAmount || Number(newAmount) <= 0) {
            return
        }

        onChange([...costs, { description: newDescription.trim(), amount: Number(newAmount) }])
        setNewDescription('')
        setNewAmount('')
    }

    const handleRemove = (index: number) => {
        onChange(costs.filter((_, i) => i !== index))
    }

    const totalAdditionalCosts = costs.reduce((sum, cost) => sum + cost.amount, 0)

    return (
        <div className="space-y-3">
            <Label className="text-sm font-bold text-slate-600">Costos Adicionales</Label>

            {/* List of existing costs */}
            {costs.length > 0 && (
                <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {costs.map((cost, index) => (
                        <div key={index} className="flex items-center justify-between gap-2 bg-white p-2 rounded border border-slate-100">
                            <div className="flex-1">
                                <span className="text-sm font-medium text-slate-700">{cost.description}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-indigo-600">
                                    ${cost.amount.toLocaleString('es-CL')}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleRemove(index)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <span className="text-xs font-bold text-slate-500 uppercase">Subtotal Adicionales</span>
                        <span className="text-sm font-black text-indigo-600">
                            ${totalAdditionalCosts.toLocaleString('es-CL')}
                        </span>
                    </div>
                </div>
            )}

            {/* Add new cost */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-end">
                <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Descripción</Label>
                    <Input
                        placeholder="Ej: Envío, Packaging..."
                        value={newDescription}
                        onChange={e => setNewDescription(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Monto ($)</Label>
                    <Input
                        type="number"
                        placeholder="0"
                        value={newAmount}
                        onChange={e => setNewAmount(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
                        className="w-28"
                    />
                </div>
                <Button
                    type="button"
                    onClick={handleAdd}
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    disabled={!newDescription.trim() || !newAmount || Number(newAmount) <= 0}
                >
                    <Plus size={16} />
                    Agregar
                </Button>
            </div>
        </div>
    )
}
