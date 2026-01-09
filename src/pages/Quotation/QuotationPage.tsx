import { useState, useEffect } from 'react';
import { Calculator, Zap, Clock, Save, Package2, ShoppingBag, TrendingUp, Settings2 } from 'lucide-react';
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

interface FilamentProfile {
    id: string;
    material_type: string;
    brand: string;
    color: string;
    price_per_kg: number;
    stock_grams: number;
}

interface CostConfig {
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
    // Configuration
    const [config, setConfig] = useState<CostConfig>(() => {
        const saved = localStorage.getItem('quotation_config_v4');
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                electricityCost: parsed.electricityCost || 50,
                operationalMultiplier: parsed.operationalMultiplier || 1.5,
                salesMultiplier: parsed.salesMultiplier || 3
            };
        }
        return {
            electricityCost: 50,
            operationalMultiplier: 1.5,
            salesMultiplier: 3
        };
    });

    const [inventory, setInventory] = useState<FilamentProfile[]>([]);
    const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
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

    const [showMgmt, setShowMgmt] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [orderData, setOrderData] = useState({
        clientId: '',
        description: '',
        finalPrice: 0,
        customClientName: '',
        useCustomClient: true
    });

    const fetchInventory = async () => {
        const { data } = await supabase
            .from('inventory')
            .select('*')
            .eq('type', 'Filamento')
            .order('brand');
        if (data) {
            setInventory(data);
            if (data.length > 0 && !selectedMaterialId) {
                setSelectedMaterialId(data[0].id);
            }
        }
    };

    const fetchClients = async () => {
        const { data } = await supabase.from('clients').select('*').order('full_name');
        if (data) setClients(data);
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    useEffect(() => {
        if (isConverting) {
            fetchClients();
            setOrderData(prev => ({ ...prev, finalPrice: Math.round(results.finalPrice) }));
        }
    }, [isConverting, results.finalPrice]);

    const getMaterialPower = (type: string) => {
        switch (type?.toUpperCase()) {
            case 'PETG': return 140;
            case 'ABS':
            case 'ASA': return 200;
            case 'PLA':
            default: return 100;
        }
    };

    useEffect(() => {
        const selectedMaterial = inventory.find(f => f.id === selectedMaterialId);
        if (!selectedMaterial) return;

        const params: QuotationParams = {
            grams: project.filamentGrams,
            hours: project.printTimeHours,
            minutes: project.printTimeMinutes,
            materialPricePerKg: selectedMaterial.price_per_kg || 15000,
            electricityCostPerKwh: config.electricityCost,
            printerPowerWatts: getMaterialPower(selectedMaterial.material_type),
            opMultiplier: config.operationalMultiplier,
            salesMultiplier: config.salesMultiplier
        };

        const calc = calculateQuotation(params);
        setResults(calc);
    }, [config, project, selectedMaterialId, inventory]);

    const handleGenerateOrder = async () => {
        if ((!orderData.clientId && !orderData.useCustomClient) || (!orderData.customClientName && orderData.useCustomClient) || !orderData.description) {
            toast.error('Completa los datos del pedido');
            return;
        }

        const selectedMaterial = inventory.find(f => f.id === selectedMaterialId);

        try {
            const { error } = await supabase.from('orders').insert([{
                client_id: orderData.useCustomClient ? null : orderData.clientId,
                custom_client_name: orderData.useCustomClient ? orderData.customClientName : null,
                inventory_id: selectedMaterialId,
                description: orderData.description,
                price: Number(orderData.finalPrice),
                suggested_price: results.finalPrice,
                cost: results.totalOperationalCost,
                status: 'pendiente',
                quantity: 1,
                quoted_grams: project.filamentGrams,
                quoted_hours: project.printTimeHours,
                quoted_mins: project.printTimeMinutes,
                quoted_power_watts: getMaterialPower(selectedMaterial?.material_type || 'PLA'),
                quoted_op_multiplier: config.operationalMultiplier,
                quoted_sales_multiplier: config.salesMultiplier,
                quoted_material_price: selectedMaterial?.price_per_kg || 15000
            }]);

            if (error) throw error;

            toast.success('¡Pedido creado con éxito!');
            setIsConverting(false);
            setOrderData({ clientId: '', description: '', finalPrice: 0, customClientName: '', useCustomClient: true });
        } catch (err: any) {
            toast.error('Error al crear pedido', { description: err.message });
        }
    };

    const handleSaveConfig = () => {
        localStorage.setItem('quotation_config_v4', JSON.stringify(config));
        toast.success('Configuración de costos guardada localmente.');
    };

    const selectedMaterial = inventory.find(f => f.id === selectedMaterialId);

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Calculator className="text-indigo-600" />
                        Cotizador Austral Prints
                    </h1>
                    <p className="text-slate-500">Usa materiales reales de tu inventario.</p>
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
                        Guardar Config
                    </button>
                </div>
            </header>

            {showMgmt && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Zap size={20} className="text-indigo-500" />
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
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <label className="block text-[10px] font-black text-emerald-600 uppercase mb-2">Mult. Venta Final</label>
                                    <input
                                        type="number" step="0.1"
                                        value={config.salesMultiplier}
                                        onChange={e => setConfig({ ...config, salesMultiplier: Number(e.target.value) })}
                                        className="w-full p-2 bg-white border border-emerald-200 rounded-xl font-black text-emerald-700 text-center text-xl"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-8 relative overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-600 uppercase tracking-widest pl-1">
                                    <Package2 size={16} /> Material (de Inventario)
                                </label>
                                <Select value={selectedMaterialId} onValueChange={(val) => setSelectedMaterialId(val)}>
                                    <SelectTrigger className="mt-1 h-12 bg-slate-50 border-slate-100 rounded-2xl font-bold">
                                        <SelectValue placeholder="Selecciona material" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {inventory.map((mat) => (
                                            <SelectItem key={mat.id} value={mat.id}>
                                                {mat.brand} {mat.color} ({mat.material_type}) - ${mat.price_per_kg}/kg
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {selectedMaterial && (
                                    <div className="flex items-center justify-between p-2 bg-indigo-50/50 rounded-lg">
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase">Potencia Sugerida</span>
                                        <span className="text-xs font-black text-indigo-700">
                                            {getMaterialPower(selectedMaterial.material_type)} Watts
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-600 uppercase tracking-widest pl-1">
                                    <TrendingUp size={16} /> Peso de la Pieza (g)
                                </label>
                                <Input
                                    type="number"
                                    value={project.filamentGrams || ''}
                                    onChange={e => setProject({ ...project, filamentGrams: Number(e.target.value) })}
                                    className="h-12 border-2 border-slate-100 rounded-2xl text-xl font-black"
                                    placeholder="0"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-600 uppercase tracking-widest pl-1">
                                    <Clock size={16} /> Horas de Impresión
                                </label>
                                <Input
                                    type="number"
                                    value={project.printTimeHours || ''}
                                    onChange={e => setProject({ ...project, printTimeHours: Number(e.target.value) })}
                                    className="h-12 border-2 border-slate-100 rounded-2xl text-xl font-black"
                                    placeholder="0"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-600 uppercase tracking-widest pl-1">
                                    <Clock size={16} /> Minutos Restantes
                                </label>
                                <Input
                                    type="number"
                                    value={project.printTimeMinutes || ''}
                                    onChange={e => setProject({ ...project, printTimeMinutes: Number(e.target.value) })}
                                    className="h-12 border-2 border-slate-100 rounded-2xl text-xl font-black"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl space-y-8 relative overflow-hidden flex flex-col min-h-[500px]">
                        <div className="relative">
                            <p className="text-slate-400 font-bold tracking-widest uppercase text-[10px]">Precio Sugerido</p>
                            <h3 className="text-6xl font-black mt-3 text-emerald-400 tabular-nums">
                                ${results.finalPrice.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                            </h3>
                        </div>

                        <div className="space-y-5 pt-8 border-t border-slate-800 flex-1">
                            <div className="flex justify-between items-center group">
                                <span className="text-slate-500 text-sm italic">Costo Directo</span>
                                <span className="font-bold text-xl tabular-nums">${results.directCost.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="flex justify-between items-center group">
                                <span className="text-slate-500 text-sm italic">Costo Total (x1.5)</span>
                                <span className="font-bold text-xl text-indigo-400 tabular-nums">${results.totalOperationalCost.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="pt-4">
                                <button
                                    onClick={() => setIsConverting(true)}
                                    className="w-full bg-indigo-600 text-white p-4 rounded-3xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl"
                                >
                                    <ShoppingBag size={20} />
                                    Generar Pedido
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={isConverting} onOpenChange={setIsConverting}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Convertir en Pedido</DialogTitle>
                        <DialogDescription>Asocia este cálculo a un cliente.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label>Cliente</Label>
                                <button onClick={() => setOrderData({ ...orderData, useCustomClient: !orderData.useCustomClient })} className="text-[10px] font-bold text-indigo-600 uppercase hover:underline">
                                    {orderData.useCustomClient ? 'Elegir registrado' : 'Ingresar manual'}
                                </button>
                            </div>
                            {orderData.useCustomClient ? (
                                <Input placeholder="Nombre del cliente..." value={orderData.customClientName} onChange={e => setOrderData({ ...orderData, customClientName: e.target.value })} />
                            ) : (
                                <Select onValueChange={(val) => setOrderData({ ...orderData, clientId: val })}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar cliente..." /></SelectTrigger>
                                    <SelectContent>
                                        {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label>Descripción</Label>
                            <Input placeholder="Ej: Llavero 3D" value={orderData.description} onChange={e => setOrderData({ ...orderData, description: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Precio Final ($)</Label>
                            <Input type="number" value={orderData.finalPrice} onChange={e => setOrderData({ ...orderData, finalPrice: Number(e.target.value) })} className="text-xl font-black text-indigo-600" />
                        </div>
                    </div>
                    <DialogFooter>
                        <button onClick={handleGenerateOrder} className="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold hover:bg-indigo-700">Crear Pedido</button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default QuotationPage;
