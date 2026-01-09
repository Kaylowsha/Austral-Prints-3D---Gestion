import { useState, useEffect } from 'react';
import { Calculator, Zap, Clock, Save, Plus, Trash2, Settings2, Package2, ShoppingBag, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { calculateQuotation, type QuotationParams } from '@/lib/quotation';
import { toast } from 'sonner';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Filament {
    id: string;
    name: string;
    price: number;
    weight: number;
    power: number; // Watts específicos para este material
}

interface CostConfig {
    filaments: Filament[];
    selectedFilamentId: string;
    electricityCost: number;
    operationalMultiplier: number;
    salesMultiplier: number;
}

interface ProjectData {
    printTimeHours: number;
    printTimeMinutes: number;
    filamentGrams: number;
}

const QuotationPage = () => {
    // Default or stored configuration
    const [config, setConfig] = useState<CostConfig>(() => {
        const saved = localStorage.getItem('quotation_config_v4');
        if (saved) return JSON.parse(saved);

        const defaultFilaments = [
            { id: '1', name: 'PLA (Bambu Lab)', price: 15000, weight: 1000, power: 100 },
            { id: '2', name: 'PETG (Bambu Lab)', price: 18000, weight: 1000, power: 140 },
            { id: '3', name: 'ABS (Bambu Lab)', price: 17000, weight: 1000, power: 200 }
        ];

        return {
            filaments: defaultFilaments,
            selectedFilamentId: '1',
            electricityCost: 50,
            operationalMultiplier: 1.5,
            salesMultiplier: 3
        };
    });

    const [project, setProject] = useState<ProjectData>({
        printTimeHours: 0,
        printTimeMinutes: 0,
        filamentGrams: 0,
    });

    const [results, setResults] = useState({
        materialCost: 0,
        energyCost: 0,
        directCost: 0,
        totalOperationalCost: 0,
        finalPrice: 0
    });

    const [newFilament, setNewFilament] = useState({ name: '', price: 0, power: 100 });
    const [showMgmt, setShowMgmt] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [orderData, setOrderData] = useState({
        clientId: '',
        description: '',
        finalPrice: 0
    });

    useEffect(() => {
        if (isConverting) {
            fetchClients();
            setOrderData(prev => ({ ...prev, finalPrice: Math.round(results.finalPrice) }));
        }
    }, [isConverting, results.finalPrice]);

    const fetchClients = async () => {
        const { data } = await supabase.from('clients').select('*').order('full_name');
        if (data) setClients(data);
    };

    useEffect(() => {
        calculateCosts();
    }, [config, project]);

    const calculateCosts = () => {
        const selectedFilament = config.filaments.find(f => f.id === config.selectedFilamentId) || config.filaments[0];

        const params: QuotationParams = {
            grams: project.filamentGrams,
            hours: project.printTimeHours,
            minutes: project.printTimeMinutes,
            materialPricePerKg: selectedFilament?.price || 0,
            electricityCostPerKwh: config.electricityCost,
            printerPowerWatts: selectedFilament?.power || 100,
            opMultiplier: config.operationalMultiplier,
            salesMultiplier: config.salesMultiplier
        };

        const calc = calculateQuotation(params);
        setResults(calc);
    };

    const handleGenerateOrder = async () => {
        if (!orderData.clientId || !orderData.description) {
            toast.error('Completa los datos del pedido');
            return;
        }

        const selectedFilament = config.filaments.find(f => f.id === config.selectedFilamentId);

        try {
            const { error } = await supabase.from('orders').insert([{
                client_id: orderData.clientId,
                description: orderData.description,
                price: Number(orderData.finalPrice), // El que el usuario decide cobrar
                suggested_price: results.finalPrice, // El técnico calculado por la app
                cost: results.totalOperationalCost,
                status: 'pendiente',
                quantity: 1,
                // New technical fields
                quoted_grams: project.filamentGrams,
                quoted_hours: project.printTimeHours,
                quoted_mins: project.printTimeMinutes,
                quoted_power_watts: selectedFilament?.power || 100,
                quoted_op_multiplier: config.operationalMultiplier,
                quoted_sales_multiplier: config.salesMultiplier,
                quoted_material_price: selectedFilament?.price || 0,
                // Linking to material if possible
                inventory_id: null // Ideally select a specific roll here too, or leave null for now
            }]);

            if (error) throw error;

            toast.success('¡Pedido creado con éxito!');
            setIsConverting(false);
            setOrderData({ clientId: '', description: '', finalPrice: 0 });
        } catch (err: any) {
            toast.error('Error al crear pedido', { description: err.message });
        }
    };

    const handleSaveConfig = () => {
        localStorage.setItem('quotation_config_v4', JSON.stringify(config));
        alert('Configuración y perfiles de materiales guardados.');
    };

    const addFilament = () => {
        if (!newFilament.name || newFilament.price <= 0) return;
        const filament: Filament = {
            id: Date.now().toString(),
            name: newFilament.name,
            price: newFilament.price,
            weight: 1000,
            power: newFilament.power
        };
        setConfig({
            ...config,
            filaments: [...config.filaments, filament]
        });
        setNewFilament({ name: '', price: 0, power: 100 });
    };

    const deleteFilament = (id: string) => {
        if (config.filaments.length <= 1) return;
        const newFilaments = config.filaments.filter(f => f.id !== id);
        setConfig({
            ...config,
            filaments: newFilaments,
            selectedFilamentId: config.selectedFilamentId === id ? newFilaments[0].id : config.selectedFilamentId
        });
    };

    const selectedFilament = config.filaments.find(f => f.id === config.selectedFilamentId) || config.filaments[0];

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Calculator className="text-indigo-600" />
                        Cotizador Austral Prints
                    </h1>
                    <p className="text-slate-500">Materiales y consumo energético optimizado.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={() => setShowMgmt(!showMgmt)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                    >
                        <Settings2 size={18} />
                        {showMgmt ? 'Cerrar Ajustes' : 'Configurar Costos'}
                    </button>
                    <button
                        onClick={handleSaveConfig}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 font-medium"
                    >
                        <Save size={18} />
                        Guardar Todo
                    </button>
                </div>
            </header>

            {showMgmt && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    {/* Filament Management */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Package2 size={20} className="text-orange-500" />
                            Mis Materiales (Filamentos)
                        </h2>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {config.filaments.map(f => (
                                <div key={f.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors">
                                    <div>
                                        <p className="font-bold text-slate-700">{f.name}</p>
                                        <p className="text-xs text-slate-500 flex gap-3">
                                            <span>Price: ${f.price.toLocaleString()} / kg</span>
                                            <span className="text-yellow-600 font-medium whitespace-nowrap"><Zap size={10} className="inline mr-1" />{f.power}W</span>
                                        </p>
                                    </div>
                                    <button onClick={() => deleteFilament(f.id)} className="text-slate-400 hover:text-red-500 p-2 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 gap-2 pt-4 border-t">
                            <input
                                placeholder="Nombre (ej: PETG Galaxia)"
                                value={newFilament.name}
                                onChange={e => setNewFilament({ ...newFilament, name: e.target.value })}
                                className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Precio/kg</label>
                                    <input
                                        type="number"
                                        value={newFilament.price || ''}
                                        onChange={e => setNewFilament({ ...newFilament, price: Number(e.target.value) })}
                                        className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Consumo (Watts)</label>
                                    <input
                                        type="number"
                                        value={newFilament.power || ''}
                                        onChange={e => setNewFilament({ ...newFilament, power: Number(e.target.value) })}
                                        className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg"
                                    />
                                </div>
                                <button onClick={addFilament} className="mt-4 bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 self-end transition-shadow shadow-md">
                                    <Plus size={24} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Global Settings */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Settings2 size={20} className="text-indigo-500" />
                            Precios de Energía y Márgenes
                        </h2>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Costo Energía ($ por kWh)</label>
                                <div className="flex items-center gap-3">
                                    <Zap size={20} className="text-yellow-500" />
                                    <input
                                        type="number"
                                        value={config.electricityCost}
                                        onChange={e => setConfig({ ...config, electricityCost: Number(e.target.value) })}
                                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-lg font-bold text-slate-700"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                    <label className="block text-[10px] font-black text-indigo-600 uppercase mb-2">Mult. Operativo</label>
                                    <input
                                        type="number" step="0.1"
                                        value={config.operationalMultiplier}
                                        onChange={e => setConfig({ ...config, operationalMultiplier: Number(e.target.value) })}
                                        className="w-full p-2 bg-white border border-indigo-200 rounded-xl font-black text-indigo-700 text-center text-xl"
                                    />
                                    <p className="text-[10px] text-indigo-400 mt-2 text-center uppercase font-bold tracking-tighter">Costo Real × {config.operationalMultiplier}</p>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <label className="block text-[10px] font-black text-emerald-600 uppercase mb-2">Mult. Venta Final</label>
                                    <input
                                        type="number" step="0.1"
                                        value={config.salesMultiplier}
                                        onChange={e => setConfig({ ...config, salesMultiplier: Number(e.target.value) })}
                                        className="w-full p-2 bg-white border border-emerald-200 rounded-xl font-black text-emerald-700 text-center text-xl"
                                    />
                                    <p className="text-[10px] text-emerald-400 mt-2 text-center uppercase font-bold tracking-tighter">Precio Final × {config.salesMultiplier}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Calculator Entry */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-8 relative overflow-hidden">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <Calculator size={28} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Nueva Cotización</h2>
                                <p className="text-sm text-slate-500">Ingresa los datos del laminador</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-600 uppercase tracking-widest pl-1">
                                    <Package2 size={16} /> Material a Usar
                                </label>
                                <div className="relative">
                                    <select
                                        value={config.selectedFilamentId}
                                        onChange={e => setConfig({ ...config, selectedFilamentId: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700 appearance-none shadow-sm transition-all text-lg cursor-pointer"
                                    >
                                        {config.filaments.map(f => (
                                            <option key={f.id} value={f.id}>{f.name} ({f.power}W)</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <Settings2 size={20} />
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-400 ml-2 italic leading-tight">
                                    Ajuste automático de consumo: <strong>{selectedFilament?.power} Watts</strong> para este material.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-600 uppercase tracking-widest pl-1">
                                    <TrendingUp size={16} /> Peso de la Pieza (g)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={project.filamentGrams || ''}
                                        onChange={e => setProject({ ...project, filamentGrams: Number(e.target.value) })}
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none text-2xl font-black text-slate-800 shadow-sm transition-all"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">gramos</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-600 uppercase tracking-widest pl-1">
                                    <Clock size={16} /> Horas de Impresión
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={project.printTimeHours || ''}
                                        onChange={e => setProject({ ...project, printTimeHours: Number(e.target.value) })}
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none text-2xl font-black text-slate-800 shadow-sm transition-all"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">hrs</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-600 uppercase tracking-widest pl-1">
                                    <Clock size={16} /> Minutos Restantes
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={project.printTimeMinutes || ''}
                                        onChange={e => setProject({ ...project, printTimeMinutes: Number(e.target.value) })}
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none text-2xl font-black text-slate-800 shadow-sm transition-all"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">min</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vertical Results Sidebar */}
                <div className="space-y-6">
                    <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl space-y-8 relative overflow-hidden flex flex-col min-h-[500px]">
                        {/* Glowing effect */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>

                        <div className="relative">
                            <p className="text-slate-400 font-bold tracking-widest uppercase text-[10px]">Precio de Venta Sugerido</p>
                            <h3 className="text-6xl font-black mt-3 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)] tabular-nums">
                                ${results.finalPrice.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                            </h3>
                        </div>

                        <div className="space-y-5 pt-8 border-t border-slate-800 flex-1 relative">
                            <div className="flex justify-between items-center group">
                                <span className="text-slate-500 text-sm group-hover:text-slate-400 transition-colors uppercase font-bold tracking-tighter">Costo Directo</span>
                                <span className="font-bold text-xl tabular-nums">${results.directCost.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                            </div>

                            <div className="flex items-center gap-3 text-slate-600">
                                <div className="h-px bg-slate-800 flex-1"></div>
                                <span className="text-[10px] font-black italic tracking-tighter opacity-50 uppercase">Factor Operativo (1.5x)</span>
                                <div className="h-px bg-slate-800 flex-1"></div>
                            </div>

                            <div className="flex justify-between items-center group">
                                <span className="text-slate-500 text-sm group-hover:text-slate-400 transition-colors uppercase font-bold tracking-tighter">Costo Total</span>
                                <span className="font-bold text-xl text-indigo-400 tabular-nums">${results.totalOperationalCost.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                            </div>

                            <div className="flex items-center gap-3 text-slate-600">
                                <div className="h-px bg-slate-800 flex-1"></div>
                                <span className="text-[10px] font-black italic tracking-tighter opacity-50 uppercase">Factor Ganancia (3.0x)</span>
                                <div className="h-px bg-slate-800 flex-1"></div>
                            </div>

                            <div className="pt-2">
                                <div className="bg-emerald-500/5 p-5 rounded-3xl border border-emerald-500/20 shadow-inner">
                                    <div className="flex justify-between items-center">
                                        <span className="text-emerald-500/80 text-[10px] font-black uppercase tracking-widest">Ganancia Neta</span>
                                        <span className="text-emerald-400 font-black text-3xl tabular-nums">
                                            +${(results.finalPrice - results.totalOperationalCost).toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={() => setIsConverting(true)}
                                    className="w-full bg-indigo-600 text-white p-4 rounded-3xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
                                >
                                    <ShoppingBag size={20} />
                                    Generar Pedido Real
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-800/40 p-5 rounded-3xl flex items-start gap-4 border border-slate-700/50 backdrop-blur-sm relative">
                            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                                <Zap size={20} />
                            </div>
                            <p className="text-[11px] leading-relaxed text-slate-400 font-medium">
                                Análisis energético para <strong>{selectedFilament?.name}</strong>: {results.energyCost > 0 ? `Costo luz $${results.energyCost.toLocaleString('es-CL', { maximumFractionDigits: 0 })}` : 'Faltan datos de tiempo.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Convert to Order Dialog */}
            <Dialog open={isConverting} onOpenChange={setIsConverting}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Convertir Cotización en Pedido</DialogTitle>
                        <DialogDescription>
                            Se creará un nuevo pedido con el precio de <strong>${results.finalPrice.toLocaleString('es-CL')}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Cliente</Label>
                            <Select onValueChange={(val) => setOrderData({ ...orderData, clientId: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar cliente..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Descripción del Pedido</Label>
                            <Input
                                placeholder="Ej: Llavero 3D Personalizado"
                                value={orderData.description}
                                onChange={e => setOrderData({ ...orderData, description: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Precio Final a Cobrar ($)</Label>
                            <Input
                                type="number"
                                placeholder="4500"
                                value={orderData.finalPrice}
                                onChange={e => setOrderData({ ...orderData, finalPrice: Number(e.target.value) })}
                                className="text-xl font-black text-indigo-600"
                            />
                            <p className="text-[10px] text-slate-400 italic">Sugerencia técnica: ${results.finalPrice.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                            <p className="text-xs font-bold text-slate-400 uppercase">Resumen Técnico para el Pedido</p>
                            <div className="grid grid-cols-2 text-xs text-slate-600">
                                <span>Material: {selectedFilament?.name}</span>
                                <span>Peso: {project.filamentGrams}g</span>
                                <span>Tiempo: {project.printTimeHours}h {project.printTimeMinutes}m</span>
                                <span>Costo Operativo: ${results.totalOperationalCost.toLocaleString('es-CL')}</span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <button
                            onClick={handleGenerateOrder}
                            className="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold hover:bg-indigo-700 transition-all"
                        >
                            Crear e Ingresar Pedido
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default QuotationPage;
