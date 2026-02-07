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
    return baseTotal + additionalCostsTotal
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
