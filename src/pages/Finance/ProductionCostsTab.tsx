import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
}

export function ProductionCostsTab({ stats, dailyData }: ProductionCostsTabProps) {
    const pieData = [
        { name: 'Filamento', value: stats.material_cost, color: '#ec4899' },
        { name: 'Energía', value: stats.energy_cost, color: '#f59e0b' }
    ]

    const avgCostPerGram = stats.total_grams > 0 ? stats.material_cost / stats.total_grams : 0
    const avgCostPerHour = stats.total_hours > 0 ? stats.energy_cost / stats.total_hours : 0

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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Distribution Chart */}
                <Card className="shadow-sm border-slate-200 lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-base font-bold">Distribución de Costos</CardTitle>
                        <CardDescription>Participación relativa</CardDescription>
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
