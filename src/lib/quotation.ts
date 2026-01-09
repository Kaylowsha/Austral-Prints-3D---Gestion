export interface QuotationParams {
    grams: number;
    hours: number;
    minutes: number;
    materialPricePerKg: number;
    electricityCostPerKwh: number;
    printerPowerWatts: number;
    opMultiplier: number;
    salesMultiplier: number;
}

export const calculateQuotation = (params: QuotationParams) => {
    const totalHours = params.hours + (params.minutes / 60);

    // 1. Costo Material
    const costPerGram = params.materialPricePerKg / 1000;
    const materialCost = params.grams * costPerGram;

    // 2. Costo Energía
    const energyCost = (params.printerPowerWatts / 1000) * totalHours * params.electricityCostPerKwh;

    // 3. Costo Directo
    const directCost = materialCost + energyCost;

    // 4. Costo Total Operativo (Costo Real para el negocio)
    const totalOperationalCost = directCost * params.opMultiplier;

    // 5. Precio de Venta Sugerido
    const finalPrice = totalOperationalCost * params.salesMultiplier;

    return {
        materialCost,
        energyCost,
        directCost,
        totalOperationalCost,
        finalPrice
    };
};
