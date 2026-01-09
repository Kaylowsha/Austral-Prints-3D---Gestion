import { useState, useEffect } from 'react';
import { Calculator, Zap, Clock, AlertCircle, Save, ArrowRight, Plus, Trash2, Settings2, Package2 } from 'lucide-react';

interface Filament {
    id: string;
    name: string;
    price: number;
    weight: number;
}

interface CostConfig {
    filaments: Filament[];
    selectedFilamentId: string;
    electricityCost: number;
    printerPower: number;
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
        const saved = localStorage.getItem('quotation_config_advanced');
        if (saved) return JSON.parse(saved);

        const defaultFilaments = [
            { id: '1', name: 'PLA Estándar', price: 15000, weight: 1000 },
            { id: '2', name: 'PETG', price: 18000, weight: 1000 },
            { id: '3', name: 'ABS', price: 17000, weight: 1000 }
        ];

        return {
            filaments: defaultFilaments,
            selectedFilamentId: '1',
            electricityCost: 50,
            printerPower: 200,
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

    const [newFilament, setNewFilament] = useState({ name: '', price: 0 });
    const [showMgmt, setShowMgmt] = useState(false);

    useEffect(() => {
        calculateCosts();
    }, [config, project]);

    const calculateCosts = () => {
        const totalHours = project.printTimeHours + (project.printTimeMinutes / 60);
        const selectedFilament = config.filaments.find(f => f.id === config.selectedFilamentId) || config.filaments[0];

        // 1. Costo Material
        const costPerGram = selectedFilament ? selectedFilament.price / selectedFilament.weight : 0;
        const materialCost = project.filamentGrams * costPerGram;

        // 2. Costo Energía
        const energyCost = (config.printerPower / 1000) * totalHours * config.electricityCost;

        // 3. Costo Directo
        const directCost = materialCost + energyCost;

        // 4. Costo Total Operativo (* 1.5)
        const totalOperationalCost = directCost * config.operationalMultiplier;

        // 5. Precio de Venta (* 3)
        const finalPrice = totalOperationalCost * config.salesMultiplier;

        setResults({
            materialCost,
            energyCost,
            directCost,
            totalOperationalCost,
            finalPrice
        });
    };

    const handleSaveConfig = () => {
        localStorage.setItem('quotation_config_advanced', JSON.stringify(config));
        alert('Toda la configuración y filamentos han sido guardados.');
    };

    const addFilament = () => {
        if (!newFilament.name || newFilament.price <= 0) return;
        const filament: Filament = {
            id: Date.now().toString(),
            name: newFilament.name,
            price: newFilament.price,
            weight: 1000
        };
        setConfig({
            ...config,
            filaments: [...config.filaments, filament]
        });
        setNewFilament({ name: '', price: 0 });
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

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Calculator className="text-indigo-600" />
                        Cotizador Austral Prints
                    </h1>
                    <p className="text-slate-500">Gestión de filamentos y costos operativos.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowMgmt(!showMgmt)}
                        className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        <Settings2 size={18} />
                        {showMgmt ? 'Cerrar Ajustes' : 'Ajustes Base'}
                    </button>
                    <button
                        onClick={handleSaveConfig}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
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
                            Mis Filamentos (Precio x kg)
                        </h2>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {config.filaments.map(f => (
                                <div key={f.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <div>
                                        <p className="font-bold text-slate-700">{f.name}</p>
                                        <p className="text-xs text-slate-500">${f.price.toLocaleString()} / kg</p>
                                    </div>
                                    <button onClick={() => deleteFilament(f.id)} className="text-red-400 hover:text-red-600 p-2">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 pt-2 border-t">
                            <input
                                placeholder="Nombre (ej: ABS Rojo)"
                                value={newFilament.name}
                                onChange={e => setNewFilament({ ...newFilament, name: e.target.value })}
                                className="flex-1 p-2 text-sm bg-white border border-slate-200 rounded-lg"
                            />
                            <input
                                type="number"
                                placeholder="Precio"
                                value={newFilament.price || ''}
                                onChange={e => setNewFilament({ ...newFilament, price: Number(e.target.value) })}
                                className="w-24 p-2 text-sm bg-white border border-slate-200 rounded-lg"
                            />
                            <button onClick={addFilament} className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700">
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Global Settings */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Zap size={20} className="text-yellow-500" />
                            Configuración de Energía y Márgenes
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Costo kWh ($)</label>
                                <input
                                    type="number"
                                    value={config.electricityCost}
                                    onChange={e => setConfig({ ...config, electricityCost: Number(e.target.value) })}
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Watts Impresora</label>
                                <input
                                    type="number"
                                    value={config.printerPower}
                                    onChange={e => setConfig({ ...config, printerPower: Number(e.target.value) })}
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                                />
                            </div>
                            <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                                <label className="block text-[10px] font-black text-indigo-600 uppercase">Costo Op. (x1.5)</label>
                                <input
                                    type="number" step="0.1"
                                    value={config.operationalMultiplier}
                                    onChange={e => setConfig({ ...config, operationalMultiplier: Number(e.target.value) })}
                                    className="w-full p-1 bg-white border border-indigo-200 rounded"
                                />
                            </div>
                            <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                                <label className="block text-[10px] font-black text-emerald-600 uppercase">Venta (x3)</label>
                                <input
                                    type="number" step="0.1"
                                    value={config.salesMultiplier}
                                    onChange={e => setConfig({ ...config, salesMultiplier: Number(e.target.value) })}
                                    className="w-full p-1 bg-white border border-emerald-200 rounded"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Project Entry */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Clock size={24} className="text-blue-500" />
                            Nueva Cotización
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest">Seleccionar Filamento</label>
                                <select
                                    value={config.selectedFilamentId}
                                    onChange={e => setConfig({ ...config, selectedFilamentId: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-700 appearance-none"
                                >
                                    {config.filaments.map(f => (
                                        <option key={f.id} value={f.id}>{f.name} (${f.price.toLocaleString()}/kg)</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest">Peso del Filamento (g)</label>
                                <input
                                    type="number"
                                    value={project.filamentGrams}
                                    onChange={e => setProject({ ...project, filamentGrams: Number(e.target.value) })}
                                    className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none text-xl font-bold"
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest">Horas de Impresión</label>
                                <input
                                    type="number"
                                    value={project.printTimeHours}
                                    onChange={e => setProject({ ...project, printTimeHours: Number(e.target.value) })}
                                    className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none text-xl font-bold"
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest">Minutos de Impresión</label>
                                <input
                                    type="number"
                                    value={project.printTimeMinutes}
                                    onChange={e => setProject({ ...project, printTimeMinutes: Number(e.target.value) })}
                                    className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none text-xl font-bold"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Final Results Sidebar */}
                <div className="space-y-6">
                    <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl space-y-8 relative overflow-hidden flex flex-col min-h-[450px]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                        <div>
                            <p className="text-slate-400 font-medium tracking-wide uppercase text-xs">Precio de Venta Sugerido</p>
                            <h3 className="text-6xl font-black mt-2 text-emerald-400 drop-shadow-sm transition-all duration-300">
                                ${results.finalPrice.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                            </h3>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-slate-800 flex-1">
                            <div className="flex justify-between items-center group">
                                <span className="text-slate-400 text-sm">Costo Directo</span>
                                <span className="font-bold text-lg">${results.directCost.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                            </div>

                            <div className="flex items-center gap-2 text-slate-500 py-1">
                                <ArrowRight size={14} className="text-indigo-500" />
                                <span className="text-xs italic tracking-tight">Operativo (x{config.operationalMultiplier})</span>
                            </div>

                            <div className="flex justify-between items-center group">
                                <span className="text-slate-400 text-sm">Costo Total</span>
                                <span className="font-bold text-lg text-indigo-300">${results.totalOperationalCost.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                            </div>

                            <div className="flex items-center gap-2 text-slate-500 py-1">
                                <ArrowRight size={14} className="text-emerald-500" />
                                <span className="text-xs italic tracking-tight">Ganancia (x{config.salesMultiplier})</span>
                            </div>

                            <div className="pt-6 border-t border-slate-800">
                                <div className="flex justify-between items-end bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                                    <span className="text-slate-300 text-xs font-bold uppercase tracking-widest">Ganancia Neta</span>
                                    <span className="text-emerald-400 font-black text-3xl">
                                        +${(results.finalPrice - results.totalOperationalCost).toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800/80 p-4 rounded-2xl flex items-start gap-3">
                            <AlertCircle size={18} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-relaxed text-slate-400">
                                Basado en el costo del filamento <strong>{config.filaments.find(f => f.id === config.selectedFilamentId)?.name}</strong> y consumo eléctrico actual.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuotationPage;
