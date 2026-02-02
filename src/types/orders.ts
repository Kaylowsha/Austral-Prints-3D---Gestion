export interface Order {
    id: string;
    created_at: string;
    date: string | null;
    status: string;
    price: number;
    cost: number;
    quantity: number;
    description: string | null;
    custom_client_name: string | null;
    tags: string[] | null;
    product_id?: string;
    inventory_id?: string | null;
    quoted_grams?: number;
    deadline?: string | null;
    clients?: { full_name: string } | null;
    products?: { name: string; weight_grams: number } | null;
}

export interface Transaction {
    id: string;
    type: 'income' | 'expense' | 'injection' | 'withdrawal' | 'inversion' | 'sale';
    date: string;
    amount: number;
    description: string;
    category?: string;
    author?: string;
    tags?: string[] | null;
}

export interface Client {
    id: string;
    full_name: string;
}

export interface FinanceStats {
    income: number;
    expenses: number;
    profit: number;
    margin: number;
    balance: number;
    injections: number;
    withdrawals: number;
    inversions: number;
    floating: number;
    suggested_income: number;
    production_cost: number;
    material_cost: number;
    energy_cost: number;
    total_grams: number;
    total_hours: number;
}
