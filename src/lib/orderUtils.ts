/**
 * Order utility functions
 */

export interface AdditionalCost {
    description: string
    amount: number
}

/**
 * Calculate the total amount for an order including additional costs
 * @param order - Order object with price, quantity, and optional additional_costs
 * @returns Total amount including base price and additional costs
 */
export function calculateOrderTotal(order: any): number {
    const baseTotal = (order.price || 0) * (order.quantity || 1)
    const additionalCostsTotal = (order.additional_costs || [])
        .reduce((sum: number, cost: AdditionalCost) => sum + (cost.amount || 0), 0)
    const inventoryItemsCost = (order.inventory_items || [])
        .reduce((sum: number, item: any) => sum + (item.calculated_cost || 0), 0)
    return baseTotal + additionalCostsTotal + inventoryItemsCost
}

/**
 * Get the sum of additional costs for an order
 * @param order - Order object with optional additional_costs
 * @returns Sum of all additional costs
 */
export function getAdditionalCostsTotal(order: any): number {
    const additionalCosts = (order.additional_costs || [])
        .reduce((sum: number, cost: AdditionalCost) => sum + (cost.amount || 0), 0)

    // Also include inventory items (units) as additional costs
    const inventoryItemsCost = (order.inventory_items || [])
        .reduce((sum: number, item: any) => sum + (item.calculated_cost || 0), 0)

    return additionalCosts + inventoryItemsCost
}

/**
 * Estimate production cost based on material weight and price per kg.
 * Centralizes cost calculation to avoid hardcoded values across the app.
 * @param weightGrams - Weight of the print in grams
 * @param materialPricePerKg - Price per kilogram of the material
 * @param quantity - Number of units (default 1)
 * @returns Estimated material cost
 */
export function estimateProductionCost(weightGrams: number, materialPricePerKg: number, quantity: number = 1): number {
    const costPerGram = materialPricePerKg / 1000
    return weightGrams * costPerGram * quantity
}

/**
 * Calculate basic financial stats from orders and expenses arrays.
 * Used by both Dashboard and FinancePage to ensure consistent numbers.
 */
export function calculateFinanceStats(orders: any[], expenses: any[]) {
    const realizedOrders = orders.filter(o => o.status === 'entregado')
    const pendingOrders = orders.filter(o => ['pendiente', 'en_proceso', 'terminado'].includes(o.status))

    // Operational income: sales (not capital injections)
    const income = realizedOrders
        .filter(o => o.product_id || o.description !== 'Inyección de Capital')
        .reduce((acc, curr) => acc + calculateOrderTotal(curr), 0)

    // Floating: pending orders
    const floating = pendingOrders
        .reduce((acc, curr) => acc + calculateOrderTotal(curr), 0)

    // Production cost: only from delivered orders
    const production_cost = realizedOrders
        .reduce((acc, curr) => acc + (curr.cost || 0) + getAdditionalCostsTotal(curr), 0)

    // Operational expenses (exclude retiro/inversion)
    const opExpenses = expenses
        .filter(e => !['retiro', 'inversion'].includes(e.category))
        .reduce((acc, curr) => acc + (curr.amount || 0), 0)

    // Capital movements
    const injections = realizedOrders
        .filter(o => !o.product_id && o.description === 'Inyección de Capital')
        .reduce((acc, curr) => acc + calculateOrderTotal(curr), 0)

    const inversions = expenses
        .filter(e => e.category === 'inversion')
        .reduce((acc, curr) => acc + (curr.amount || 0), 0)

    const withdrawals = expenses
        .filter(e => e.category === 'retiro')
        .reduce((acc, curr) => acc + (curr.amount || 0), 0)

    const profit = income - opExpenses - production_cost
    const balance = profit + injections - inversions - withdrawals

    return {
        income,
        expenses: opExpenses,
        production_cost,
        balance,
        floating,
        profit,
        injections,
        inversions,
        withdrawals
    }
}
