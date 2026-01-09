import { useState, useEffect } from 'react';
import { Calculator, Zap, Clock, TrendingUp, AlertCircle, Save } from 'lucide-react';

interface CostConfig {
    filamentPrice: number;
    filamentWeight: number;
    electricityCost: number;
    printerPower: number;
    hourlyRate: number;
    amortizationPerHour: number;
    profitMargin: number;
    failureMargin: number;
}

interface ProjectData {
    printTimeHours: number;
    printTimeMinutes: number;
    filamentGrams: number;
    preparationMinutes: number;
}

const QuotationPage = () => {
    // Default or stored configuration
    const [config, setConfig] = useState<CostConfig>(() => {
        const saved = localStorage.getItem('quotation_config');
        return saved ? JSON.parse(saved) : {
            filamentPrice: 15000,
            filamentWeight: 1000,
            electricityCost: 50,
            printerPower: 200,
            hourlyRate: 2500,
            amortizationPerHour: 200,
            profitMargin: 50,
            failureMargin: 15
        };
    });

    const [project, setProject] = useState<ProjectData>({
        printTimeHours: 0,
        printTimeMinutes: 0,
        filamentGrams: 0,
        preparationMinutes: 15
    });

    const [results, setResults] = useState({
        materialCost: 0,
        energyCost: 0,
        laborCost: 0,
        amortizationCost: 0,
        totalBaseCost: 0,
        suggestedPrice: 0
    });

    useEffect(() => {
        calculateCosts();
    }, [config, project]);

    const calculateCosts = () => {
        const totalHours = project.printTimeHours + (project.printTimeMinutes / 60);

        // Material Cost
        const costPerGram = config.filamentPrice / config.filamentWeight;
        const materialCost = project.filamentGrams * costPerGram;

        // Energy Cost
        const energyCost = (config.printerPower / 1000) * totalHours * config.electricityCost;

        // Amortization
        const amortizationCost = totalHours * config.amortizationPerHour;

        // Labor Cost
        const laborCost = (project.preparationMinutes / 60) * config.hourlyRate;

        // Base Cost with Failure Margin
        const totalBaseCost = (materialCost + energyCost + amortizationCost + laborCost) * (1 + config.failureMargin / 100);

        // Suggested Price with Profit Margin
        const suggestedPrice = totalBaseCost * (1 + config.profitMargin / 100);

        setResults({
            materialCost,
            energyCost,
            laborCost,
            amortizationCost,
            totalBaseCost,
            suggestedPrice
        });
    };

    const handleSaveConfig = () => {
        localStorage.setItem('quotation_config', JSON.stringify(config));
        alert('Configuración guardada correctamente');
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
            <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Calculator className="text-indigo-600" />
                        Calculadora de Cotización
                    </h1>
                    <p className="text-slate-500">Define precios rentables basados en datos reales.</p>
                </div>
                <button
                    onClick={handleSaveConfig}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                >
                    <Save size={18} />
                    Guardar Configuración Base
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Inputs Section */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Project Data */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Clock size={20} className="text-blue-500" />
                            Datos del Proyecto (Impresora)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Horas de impresión</label>
                                <input
                                    type="number"
                                    value={project.printTimeHours}
                                    onChange={(e) => setProject({ ...project, printTimeHours: Number(e.target.value) })}
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Minutos de impresión</label>
                                <input
                                    type="number"
                                    value={project.printTimeMinutes}
                                    onChange={(e) => setProject({ ...project, printTimeMinutes: Number(e.target.value) })}
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Gramos de filamento</label>
                                <input
                                    type="number"
                                    value={project.filamentGrams}
                                    onChange={(e) => setProject({ ...project, filamentGrams: Number(e.target.value) })}
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Cost Configuration */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <TrendingUp size={20} className="text-green-500" />
                            Configuración de Costos Base
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                <label className="block text-sm font-medium text-slate-600 mb-1">Tarifa Mano de Obra ($/hr)</label>
                                <input
                                    type="number"
                                    value={config.hourlyRate}
                                    onChange={(e) => setConfig({ ...config, hourlyRate: Number(e.target.value) })}
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Margen Ganancia (%)</label>
                                <input
                                    type="number"
                                    value={config.profitMargin}
                                    onChange={(e) => setConfig({ ...config, profitMargin: Number(e.target.value) })}
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="space-y-6">
                    <div className="bg-indigo-900 text-white p-6 rounded-3xl shadow-xl space-y-6 flex flex-col justify-between">
                        <div>
                            <p className="text-indigo-200 font-medium">Precio Sugerido</p>
                            <h3 className="text-4xl font-bold mt-1">
                                ${results.suggestedPrice.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                            </h3>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-indigo-800">
                            <div className="flex justify-between text-sm">
                                <span className="text-indigo-300">Costo Base (Material + Luz)</span>
                                <span className="font-semibold">${(results.materialCost + results.energyCost).toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-indigo-300">Amortización / Desgaste</span>
                                <span className="font-semibold">${results.amortizationCost.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-indigo-300">Mano de Obra</span>
                                <span className="font-semibold">${results.laborCost.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold pt-2 border-t border-indigo-700">
                                <span className="text-indigo-100">Costo Total Producción</span>
                                <span>${results.totalBaseCost.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                            </div>
                        </div>

                        <div className="bg-indigo-800/50 p-4 rounded-xl flex items-start gap-3 mt-4">
                            <AlertCircle size={18} className="text-indigo-300 flex-shrink-0" />
                            <p className="text-xs text-indigo-200">
                                Incluye un {config.failureMargin}% de factor de riesgo para cubrir fallos de impresión.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-200">
                        <h4 className="text-sm font-semibold text-slate-800 mb-2">Resumen Energético</h4>
                        <div className="flex items-center gap-2 text-slate-500">
                            <Zap size={16} className="text-yellow-500" />
                            <span className="text-xs">
                                Consumo estimado: {((config.printerPower / 1000) * (project.printTimeHours + project.printTimeMinutes / 60)).toFixed(2)} kWh
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuotationPage;
