import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Zap,
    Package,
    Clock,
    PieChart as PieChartIcon,
    Gauge
} from 'lucide-react'
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid,
    AreaChart,
    Area
} from 'recharts'
import { cn } from '@/lib/utils'

interface ProductionCostsTabProps {
    stats: {
        production_cost: number
        material_cost: number
        energy_cost: number
        total_grams: number
        total_hours: number
    }
    dailyData: any[]
    products?: any[]
    inventory?: any[]
}

export function ProductionCostsTab({ stats, dailyData, products = [], inventory = [] }: ProductionCostsTabProps) {
    const pieData = [
        { name: 'Filamento', value: stats.material_cost, color: '#ec4899' },
        { name: 'Energía', value: stats.energy_cost, color: '#f59e0b' }
    ]

    const avgCostPerGram = stats.total_grams > 0 ? stats.material_cost / stats.total_grams : 0
    const avgCostPerHour = stats.total_hours > 0 ? stats.energy_cost / stats.total_hours : 0

    // Product Analysis State
    const [selectedProductId, setSelectedProductId] = useState<string>('none')

    // Derived Product Calculations
    const selectedProduct = products.find(p => p.id === selectedProductId)
    const productMetrics = selectedProduct ? (() => {
        // 1. Material Cost (Weight * Avg Cost per Gram)
        const materialCost = (selectedProduct.weight_grams || 0) * avgCostPerGram

        // 2. Energy Cost (Time * Avg Cost per Hour)
        const energyCost = ((selectedProduct.print_time_mins || 0) / 60) * avgCostPerHour

        // 3. Inventory Items Cost (Screws, Magnets, etc.)
        const inventoryItemsCost = (selectedProduct.inventory_items || []).reduce((acc: number, item: any) => {
            // Find inventory item to get current price
            const invItem = inventory.find(i => i.id === item.inventory_id)
            if (!invItem) return acc
            return acc + (item.quantity * (invItem.price_per_unit || 0))
        }, 0)

        // 4. Additional Costs (Manual fixed costs)
        const additionalCost = (selectedProduct.additional_costs || []).reduce((acc: number, cost: any) => acc + (cost.amount || 0), 0)

        const totalCost = materialCost + energyCost + inventoryItemsCost + additionalCost
        const suggestedPrice = selectedProduct.base_price || 0
        const margin = suggestedPrice > 0 ? ((suggestedPrice - totalCost) / suggestedPrice) * 100 : 0
        const profit = suggestedPrice - totalCost

        return {
            materialCost,
            energyCost,
            inventoryItemsCost,
            additionalCost,
            totalCost,
            suggestedPrice,
            margin,
            profit
        }
    })() : null

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MiniMetric
                    title="Costo Material"
                    value={`$${stats.material_cost.toLocaleString('es-CL')}`}
                    icon={<Package size={16} />}
                    color="text-pink-500"
                    bgColor="bg-pink-50"
                    subValue={`${stats.total_grams.toLocaleString()} gramos usados`}
                />
                <MiniMetric
                    title="Costo Energía"
                    value={`$${stats.energy_cost.toLocaleString('es-CL')}`}
                    icon={<Zap size={16} />}
                    color="text-amber-500"
                    bgColor="bg-amber-50"
                    subValue={`${stats.total_hours.toFixed(1)} horas de impresión`}
                />
                <MiniMetric
                    title="Promedio por Gramo"
                    value={`$${avgCostPerGram.toFixed(1)}`}
                    icon={<Gauge size={16} />}
                    color="text-indigo-500"
                    bgColor="bg-indigo-50"
                    subValue="Base: Material + IA"
                />
                <MiniMetric
                    title="Promedio por Hora"
                    value={`$${avgCostPerHour.toFixed(1)}`}
                    icon={<Clock size={16} />}
                    color="text-emerald-500"
                    bgColor="bg-emerald-50"
                    subValue="Eficiencia de consumo"
                />
            </div>

            {/* Product Analysis Section */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Package size={120} />
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">NUEVO</span>
                            <h3 className="text-lg font-black text-slate-900">Análisis de Costo Unitario</h3>
                        </div>
                        <p className="text-slate-500 text-xs font-medium max-w-lg">
                            Selecciona un producto de tu catálogo para simular su costo real de producción basado en el promedio histórico de eficiencia (Costo/Gramo y Costo/Hora actual).
                        </p>
                    </div>
                    <div className="w-full md:w-[300px]">
                        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                            <SelectTrigger className="bg-slate-50 border-slate-200 font-bold text-slate-700">
                                <SelectValue placeholder="Seleccionar producto..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Seleccionar producto...</SelectItem>
                                {products.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {selectedProduct && productMetrics ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 animate-in slide-in-from-bottom-4 duration-500">
                        {/* Cost Breakdown */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <CostItem
                                    label="Material (Filamento)"
                                    value={productMetrics.materialCost}
                                    subValue={`${selectedProduct.weight_grams}g x $${avgCostPerGram.toFixed(1)}/g`}
                                    color="bg-pink-50 text-pink-600"
                                />
                                <CostItem
                                    label="Energía & Máquina"
                                    value={productMetrics.energyCost}
                                    subValue={`${selectedProduct.print_time_mins}min x $${avgCostPerHour.toFixed(1)}/h`}
                                    color="bg-amber-50 text-amber-600"
                                />
                                <CostItem
                                    label="Insumos (Inventario)"
                                    value={productMetrics.inventoryItemsCost}
                                    subValue={`${(selectedProduct.inventory_items || []).length} ítems`}
                                    color="bg-emerald-50 text-emerald-600"
                                />
                                <CostItem
                                    label="Costos Adicionales"
                                    value={productMetrics.additionalCost}
                                    subValue="Mano de obra, pintura, etc."
                                    color="bg-indigo-50 text-indigo-600"
                                />
                            </div>
                        </div>

                        {/* Summary Card */}
                        <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col justify-between">
                            <div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Rentabilidad Estimada</p>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end border-b border-slate-700 pb-2">
                                        <span className="text-slate-400 text-sm">Costo Total</span>
                                        <span className="text-xl font-bold text-rose-400">${Math.round(productMetrics.totalCost).toLocaleString('es-CL')}</span>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-slate-700 pb-2">
                                        <span className="text-slate-400 text-sm">Precio Venta</span>
                                        <span className="text-xl font-bold text-emerald-400">${productMetrics.suggestedPrice.toLocaleString('es-CL')}</span>
                                    </div>
                                    <div className="flex justify-between items-end pt-2">
                                        <span className="text-slate-400 text-sm">Utilidad</span>
                                        <span className={cn("text-2xl font-black", productMetrics.profit > 0 ? "text-white" : "text-rose-500")}>
                                            ${Math.round(productMetrics.profit).toLocaleString('es-CL')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-800">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500 font-bold uppercase">Margen</span>
                                    <span className={cn("text-lg font-bold px-3 py-1 rounded-lg", productMetrics.margin >= 30 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400")}>
                                        {productMetrics.margin.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center">
                        <p className="text-slate-400 text-sm font-medium">Selecciona un producto arriba para ver el desglose detallado de sus costos de producción.</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Distribution Chart */}
                <Card className="shadow-sm border-slate-200 lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-base font-bold">Distribución de Costos Global</CardTitle>
                        <CardDescription>Participación relativa mensual</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex flex-col items-center">
                        <ResponsiveContainer width="100%" height="70%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: any) => [`$${value.toLocaleString('es-CL')}`, 'Costo']}
                                    contentStyle={{ borderRadius: '12px', border: 'none' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="w-full space-y-3 mt-4">
                            {pieData.map((item) => (
                                <div key={item.name} className="flex items-center justify-between text-xs font-medium">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-slate-600">{item.name}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-slate-900 font-bold">${item.value.toLocaleString('es-CL')}</span>
                                        <span className="text-[10px] text-slate-400">
                                            {stats.production_cost > 0 ? ((item.value / stats.production_cost) * 100).toFixed(1) : 0}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Filament Trend Chart */}
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-bold">Acumulado Filamento</CardTitle>
                                <CardDescription>Costo total acumulado en el periodo</CardDescription>
                            </div>
                            <div className="p-2 bg-pink-50 text-pink-500 rounded-lg">
                                <Package size={20} />
                            </div>
                        </CardHeader>
                        <CardContent className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyData}>
                                    <defs>
                                        <linearGradient id="colorMaterial" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="displayDate"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                                        tickFormatter={(val) => `$${val.toLocaleString('es-CL', { notation: 'compact' })}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any) => [`$${value.toLocaleString('es-CL')}`, 'Acumulado Material']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="acc_material"
                                        name="Material"
                                        stroke="#ec4899"
                                        fillOpacity={1}
                                        fill="url(#colorMaterial)"
                                        strokeWidth={3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Energy Trend Chart */}
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-bold">Acumulado Energía</CardTitle>
                                <CardDescription>Costo total acumulado en el periodo</CardDescription>
                            </div>
                            <div className="p-2 bg-amber-50 text-amber-500 rounded-lg">
                                <Zap size={20} />
                            </div>
                        </CardHeader>
                        <CardContent className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyData}>
                                    <defs>
                                        <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="displayDate"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                                        tickFormatter={(val) => `$${val.toLocaleString('es-CL', { notation: 'compact' })}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any) => [`$${value.toLocaleString('es-CL')}`, 'Acumulado Energía']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="acc_energy"
                                        name="Energía"
                                        stroke="#f59e0b"
                                        fillOpacity={1}
                                        fill="url(#colorEnergy)"
                                        strokeWidth={3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Analysis Note */}
            <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem] flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm grow-0 shrink-0">
                    <PieChartIcon size={24} />
                </div>
                <div>
                    <h4 className="text-sm font-black text-indigo-900 uppercase tracking-tight mb-1">Nota de Análisis de Eficiencia</h4>
                    <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                        El desglose de costos directo se basa en los parámetros técnicos guardados en cada pedido (gramos, horas, potencia). Para pedidos sin estos datos, se aplica una estimación basada en el costo total registrado. Mantener actualizados los perfiles de filamento en 'Inventario' mejora la precisión de este gráfico al recalcular pedidos.
                    </p>
                </div>
            </div>
        </div>
    )
}

function CostItem({ label, value, subValue, color }: any) {
    return (
        <div className={cn("p-4 rounded-xl border border-dashed border-slate-200 flex flex-col gap-1", color.split(' ')[0])}>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
            <span className={cn("text-lg font-black", color.split(' ')[1])}>${Math.round(value).toLocaleString('es-CL')}</span>
            <span className="text-[10px] text-slate-400 font-medium">{subValue}</span>
        </div>
    )
}

function MiniMetric({ title, value, icon, color, bgColor, subValue }: any) {
    return (
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", bgColor, color)}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
                <p className="text-lg font-black text-slate-900">{value}</p>
                <p className="text-[10px] text-slate-500 font-medium">{subValue}</p>
            </div>
        </div>
    )
}
