import { useState, useEffect } from 'react';
import { Calculator, Zap, Clock, TrendingUp, AlertCircle, Save, ArrowRight } from 'lucide-react';

interface CostConfig {
    filamentPrice: number;
    filamentWeight: number;
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
        const saved = localStorage.getItem('quotation_config_simple');
        return saved ? JSON.parse(saved) : {
            filamentPrice: 15000,
            filamentWeight: 1000,
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

    useEffect(() => {
        calculateCosts();
    }, [config, project]);

    const calculateCosts = () => {
        const totalHours = project.printTimeHours + (project.printTimeMinutes / 60);

        // 1. Costo Material
        const costPerGram = config.filamentPrice / config.filamentWeight;
        const materialCost = project.filamentGrams * costPerGram;

        // 2. Costo Energía
        const energyCost = (config.printerPower / 1000) * totalHours * config.electricityCost;

        // 3. Costo Directo (Suma de los dos anteriores)
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
        localStorage.setItem('quotation_config_simple', JSON.stringify(config));
        alert('Configuración guardada correctamente');
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Calculator className="text-indigo-600" />
                        Cotizador Austral Prints
                    </h1>
                    <p className="text-slate-500">Lógica: (Costo Real × {config.operationalMultiplier}) × {config.salesMultiplier}</p>
                </div>
                <button
                    onClick={handleSaveConfig}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                >
                    <Save size={18} />
                    Guardar Parámetros
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Project Data */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4 font-sans">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Clock size={20} className="text-blue-500" />
                            Datos de la Impresión
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Horas</label>
                                <input
                                    type="number"
                                    value={project.printTimeHours}
                                    onChange={(e) => setProject({ ...project, printTimeHours: Number(e.target.value) })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-semibold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Minutos</label>
                                <input
                                    type="number"
                                    value={project.printTimeMinutes}
                                    onChange={(e) => setProject({ ...project, printTimeMinutes: Number(e.target.value) })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-semibold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Gramos</label>
                                <input
                                    type="number"
                                    value={project.filamentGrams}
                                    onChange={(e) => setProject({ ...project, filamentGrams: Number(e.target.value) })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-semibold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Cost Configuration */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <TrendingUp size={20} className="text-green-500" />
                            Configuración de Precios y Factores
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Insumos</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Precio Filamento ($/kg)</label>
                                        <input
                                            type="number"
                                            value={config.filamentPrice}
                                            onChange={(e) => setConfig({ ...config, filamentPrice: Number(e.target.value) })}
                                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Costo kWh ($)</label>
                                        <input
                                            type="number"
                                            value={config.electricityCost}
                                            onChange={(e) => setConfig({ ...config, electricityCost: Number(e.target.value) })}
                                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Watts Impresora</label>
                                        <input
                                            type="number"
                                            value={config.printerPower}
                                            onChange={(e) => setConfig({ ...config, printerPower: Number(e.target.value) })}
                                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Multiplicadores</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                        <label className="block text-xs font-bold text-indigo-600 mb-1 uppercase">Costo Operativo (x1.5)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={config.operationalMultiplier}
                                            onChange={(e) => setConfig({ ...config, operationalMultiplier: Number(e.target.value) })}
                                            className="w-full p-2 bg-white border border-indigo-200 rounded-lg font-bold"
                                        />
                                        <p className="text-[10px] text-indigo-400 mt-1">Cubre mantenimiento y riesgos.</p>
                                    </div>
                                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                        <label className="block text-xs font-bold text-emerald-600 mb-1 uppercase">Venta Final (x3)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={config.salesMultiplier}
                                            onChange={(e) => setConfig({ ...config, salesMultiplier: Number(e.target.value) })}
                                            className="w-full p-2 bg-white border border-emerald-200 rounded-lg font-bold"
                                        />
                                        <p className="text-[10px] text-emerald-400 mt-1">Margen de ganancia de venta.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="space-y-6">
                    <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl space-y-8 relative overflow-hidden">
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                        <div>
                            <p className="text-slate-400 font-medium tracking-wide uppercase text-xs">Precio de Venta Sugerido</p>
                            <h3 className="text-6xl font-black mt-2 text-emerald-400 drop-shadow-sm">
                                ${results.finalPrice.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                            </h3>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-slate-800">
                            <div className="flex justify-between items-center group">
                                <span className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors">Costo Directo (Filam + Luz)</span>
                                <span className="font-bold text-lg">${results.directCost.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                            </div>

                            <div className="flex items-center gap-2 text-slate-500 py-1">
                                <ArrowRight size={14} className="text-indigo-500" />
                                <span className="text-xs italic">Multiplicado por {config.operationalMultiplier}</span>
                            </div>

                            <div className="flex justify-between items-center group">
                                <span className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors">Costo Operativo Total</span>
                                <span className="font-bold text-lg text-indigo-300">${results.totalOperationalCost.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                            </div>

                            <div className="flex items-center gap-2 text-slate-500 py-1">
                                <ArrowRight size={14} className="text-emerald-500" />
                                <span className="text-xs italic">Multiplicado por {config.salesMultiplier}</span>
                            </div>

                            <div className="pt-4 border-t border-slate-800">
                                <div className="flex justify-between items-end">
                                    <span className="text-slate-400 text-sm font-medium">Ganancia Estimada</span>
                                    <span className="text-emerald-400 font-black text-2xl">
                                        +${(results.finalPrice - results.totalOperationalCost).toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-indigo-500/10 p-4 rounded-2xl flex items-start gap-3 border border-indigo-500/20">
                            <AlertCircle size={18} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-relaxed text-slate-300">
                                Este precio está optimizado según tu regla personalizada: multiplica el costo operativo (1.5x) por 3 para obtener la venta.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-200">
                        <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <Zap size={16} className="text-yellow-500" />
                            Resumen de Insumos
                        </h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Energía (kWh)</span>
                                <span className="font-semibold text-slate-700">
                                    {((config.printerPower / 1000) * (project.printTimeHours + project.printTimeMinutes / 60)).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Material (Gramos)</span>
                                <span className="font-semibold text-slate-700">{project.filamentGrams}g</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuotationPage;
